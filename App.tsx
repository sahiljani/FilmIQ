import React, { useState, useEffect, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { AppState, Preferences, Interaction, InteractionType, MovieRecommendation, Campaign, MostLikedMovie } from './types';
import { generateRecommendations } from './services/geminiService';
import { dbService } from './services/dbService';
import PreferenceForm from './components/PreferenceForm';
import MovieCard from './components/MovieCard';
import SwipeableMovieCard from './components/SwipeableMovieCard';
import AuthForm from './components/AuthForm';
import Header from './components/Header';
import Settings from './components/Settings';

const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [state, setState] = useState<AppState>({
    preferences: null,
    recommendations: [],
    history: [],
    mostLiked: [],
    campaigns: [],
    currentCampaignId: null,
    isLoading: true,
    step: 'setup', 
  });

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isResetting, setIsResetting] = useState(false);
  const [viewMode, setViewMode] = useState<'swipe' | 'grid'>(
    (localStorage.getItem('cinewise_view') as 'swipe' | 'grid') || 'swipe'
  );

  const initialize = useCallback(async () => {
    const token = localStorage.getItem('cinewise_token');
    if (!token) {
      setState(prev => ({ ...prev, isLoading: false }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true }));
    try {
      const { history } = await dbService.initSession();
      
      let campaigns: Campaign[] = [];
      let mostLiked: MostLikedMovie[] = [];
      try {
         const cRes = await fetch('/api/campaigns', { headers: { 'Authorization': `Bearer ${token}` } });
         if (cRes.ok) campaigns = await cRes.json();

         const mRes = await fetch('/api/most-liked', { headers: { 'Authorization': `Bearer ${token}` } });
         if (mRes.ok) {
            const data = await mRes.json();
            mostLiked = data.mostLiked || [];
         }
      } catch(e) { console.error(e); }

      setUser({ email: 'User' }); 
      
      setState(prev => ({ 
        ...prev, 
        history: history || [], 
        mostLiked,
        campaigns,
        isLoading: false,
        step: campaigns.length > 0 ? 'campaigns' : 'setup'
      }));
    } catch (e) {
      localStorage.removeItem('cinewise_token');
      setUser(null);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('token')) {
      setIsResetting(true);
    } else {
      initialize();
    }
    
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [initialize]);

  useEffect(() => {
    try { localStorage.setItem('cinewise_view', viewMode); } catch {}
  }, [viewMode]);

  const handleLogout = () => {
    localStorage.removeItem('cinewise_token');
    setUser(null);
    setState({
      preferences: null,
      recommendations: [],
      history: [],
      mostLiked: [],
      campaigns: [],
      currentCampaignId: null,
      isLoading: false,
      step: 'setup',
    });
  };

  const handleCreateCampaign = async (prefs: Preferences) => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    const name = `${prefs.genre} ${prefs.contentType} (${prefs.yearStart}-${prefs.yearEnd})`;
    
    try {
        const res = await fetch('/api/campaigns', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('cinewise_token')}`
            },
            body: JSON.stringify({ name, preferences: prefs })
        });
        
        if (res.ok) {
            const campaign = await res.json();
            const campaignId = campaign.id;
            const prefsWithId = { ...prefs, campaignId };
            const suggestions = await generateRecommendations(prefsWithId, state.history);
            
            setState(prev => ({
                ...prev,
                isLoading: false,
                preferences: prefsWithId,
                currentCampaignId: campaignId,
                campaigns: [campaign, ...prev.campaigns],
                recommendations: suggestions,
                step: 'results'
            }));
        }
    } catch (e) {
        console.error("Error creating campaign", e);
        setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleSelectCampaign = async (campaign: Campaign) => {
      setState(prev => ({ ...prev, isLoading: true }));
      
      try {
          const res = await fetch(`/api/campaigns/${campaign.id}`, {
              headers: { 'Authorization': `Bearer ${localStorage.getItem('cinewise_token')}` }
          });
          
          if (res.ok) {
              const fullCampaign = await res.json();
              const prefs = fullCampaign.Preference;
              const recRes = await fetch(`/api/recommendations?campaignId=${campaign.id}`, {
                  headers: { 'Authorization': `Bearer ${localStorage.getItem('cinewise_token')}` }
              });
              
              let recs = [];
              if (recRes.ok) {
                  const data = await recRes.json();
                  recs = data.recommendations || [];
              }
              const prefsWithId = prefs ? { ...prefs, campaignId: fullCampaign.id } : null;

              setState(prev => ({
                  ...prev,
                  isLoading: false,
                  currentCampaignId: fullCampaign.id,
                  preferences: prefsWithId,
                  recommendations: recs,
                  step: 'results'
              }));
          }
      } catch (e) {
          console.error(e);
          setState(prev => ({ ...prev, isLoading: false }));
      }
  };

  const fetchMore = async () => {
    if (!state.preferences || !state.currentCampaignId) return;
    setState(prev => ({ ...prev, isLoading: true }));
    
    const allSeenMovies = [
      ...state.history,
      ...state.recommendations.map(r => ({ movieTitle: r.title, interaction: 'seen' as any, timestamp: 0 }))
    ];
    
    const moreSuggestions = await generateRecommendations(
      state.preferences, 
      allSeenMovies
    );
    
    setState(prev => ({ ...prev, isLoading: false, recommendations: [...prev.recommendations, ...moreSuggestions] }));
  };

  const handleInteraction = async (movieId: string, type: InteractionType) => {
    const movie = state.recommendations.find(m => m.id === movieId);
    if (!movie) return;
    const newInteraction: Interaction = { movieTitle: movie.title, interaction: type, timestamp: Date.now() };
    await dbService.saveHistory(newInteraction);
    const remaining = state.recommendations.filter(m => m.id !== movieId);
    const newHistory = [...state.history, newInteraction];
    
    setState(prev => ({ ...prev, history: newHistory, recommendations: remaining }));

    if (remaining.length === 4 && !state.isLoading) {
        fetchMore();
    }
  };

  const handleMostLiked = async (movieId: string) => {
    const movie = state.recommendations.find(m => m.id === movieId);
    if (!movie) return;
    handleInteraction(movieId, InteractionType.LIKED);
    
    try {
      const response = await fetch('/api/most-liked', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('cinewise_token')}`
        },
        body: JSON.stringify({
          movieTitle: movie.title,
          tmdbId: movie.tmdb_id
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setState(prev => {
            const existingIndex = prev.mostLiked.findIndex(m => m.movieTitle === movie.title);
            let updatedMostLiked;
            if (existingIndex >= 0) {
              updatedMostLiked = [...prev.mostLiked];
              updatedMostLiked[existingIndex].likeCount += 1;
            } else {
              updatedMostLiked = [...prev.mostLiked, { movieTitle: movie.title, tmdbId: movie.tmdb_id, likeCount: 1 }];
            }
            return { ...prev, mostLiked: updatedMostLiked };
        });
      }
    } catch (err) {
      console.error('Error saving most liked:', err);
    }
  };

  if (isResetting) {
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-background p-6">
        <ResetPasswordForm onComplete={() => {
            window.history.replaceState({}, document.title, "/");
            setIsResetting(false);
        }} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-background relative overflow-hidden p-6">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background z-0"></div>
        <div className="relative z-10 w-full max-w-md">
            <AuthForm onSuccess={(dataUser) => {
            setUser(dataUser);
            initialize();
            }} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[100dvh] bg-background text-gray-100 font-sans selection:bg-primary/30 overflow-hidden">
      
      <Header 
        currentStep={state.step} 
        onNavigate={(step) => setState(prev => ({ ...prev, step }))}
        onLogout={handleLogout}
      />

      <main className="flex-1 overflow-y-auto overflow-x-hidden relative scroll-smooth">
          <div className="min-h-full pb-20"> {/* Padding bottom for safety */}
            
            {state.step === 'campaigns' && (
               <div className="max-w-7xl mx-auto p-4 md:p-8">
                <h2 className="text-3xl md:text-4xl font-heading font-black mb-8 flex items-center gap-3 text-white">
                  Your Campaigns
                  {state.isLoading && <span className="text-sm font-normal text-gray-500 animate-pulse">Loading...</span>}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  <button 
                    onClick={() => setState(prev => ({...prev, step: 'setup', currentCampaignId: null, preferences: null}))}
                    className="group relative p-8 rounded-3xl border-2 border-dashed border-primary/30 hover:border-primary hover:bg-primary/5 transition-all duration-300 flex flex-col items-center justify-center h-64"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mb-6 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-primary/30 transition duration-300">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                    </div>
                    <span className="font-heading font-bold text-xl text-primary">New Search</span>
                    <p className="text-gray-500 text-sm mt-2">Start a new discovery journey</p>
                  </button>
                  {state.campaigns.map(c => (
                    <button
                      key={c.id}
                      onClick={() => handleSelectCampaign(c)}
                      className="group relative p-8 bg-surface border border-white/5 rounded-3xl hover:border-white/20 hover:shadow-2xl transition-all duration-300 text-left h-64 flex flex-col justify-between overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition duration-500 transform group-hover:scale-110">
                         <svg className="w-32 h-32 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"></path></svg>
                      </div>
                      <div>
                        <h3 className="font-heading font-bold text-2xl mb-2 text-white group-hover:text-primary transition-colors line-clamp-2 pr-4">{c.name}</h3>
                        <p className="text-gray-500 text-sm font-medium">{new Date(c.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                      </div>
                      <div className="relative z-10 flex items-center gap-2 text-sm font-bold text-gray-400 group-hover:text-white transition-colors">
                            <span>Resume Session</span>
                            <svg className="w-4 h-4 transform group-hover:translate-x-1 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {state.step === 'setup' && (
                <div className="min-h-full flex flex-col justify-center items-center py-10 px-4">
                    <PreferenceForm onSubmit={handleCreateCampaign} isLoading={state.isLoading} />
                </div>
            )}

            {state.step === 'settings' && (
                <Settings />
            )}

            {state.step === 'bucket' && (
                <div className="max-w-7xl mx-auto p-4 md:p-8">
                    <h2 className="text-3xl md:text-4xl font-heading font-black mb-8 flex items-center gap-3 text-secondary">
                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path></svg>
                        My Bucket List
                    </h2>
                    {state.mostLiked.length === 0 ? (
                        <div className="text-center py-32 bg-surface rounded-3xl border border-white/5 mx-auto max-w-2xl">
                            <div className="w-20 h-20 bg-secondary/20 text-secondary rounded-full flex items-center justify-center mx-auto mb-6">
                                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                            </div>
                            <p className="text-gray-400 text-xl font-medium mb-8">Your bucket is empty.</p>
                            <button onClick={() => setState(prev => ({ ...prev, step: 'campaigns' }))} className="px-8 py-3 bg-secondary text-white rounded-xl hover:bg-secondary/80 transition font-bold shadow-lg shadow-secondary/20">Discover Movies</button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {state.mostLiked.map((item, idx) => (
                                <div key={idx} className="bg-surface border border-white/5 rounded-2xl overflow-hidden hover:border-secondary/50 transition duration-300 p-5 flex gap-5 group">
                                    <div className="flex-1">
                                        <h3 className="font-heading font-bold text-xl text-white mb-2 group-hover:text-secondary transition-colors">{item.movieTitle}</h3>
                                        <div className="flex items-center gap-2 text-xs text-gray-500 font-mono mb-4">
                                            <span>ID: {item.tmdbId}</span>
                                        </div>
                                        <a 
                                            href={`https://www.themoviedb.org/movie/${item.tmdbId}`} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="text-xs bg-white/5 hover:bg-white/10 px-4 py-2 rounded-lg text-white transition inline-flex items-center gap-2"
                                        >
                                            View Details
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                                        </a>
                                    </div>
                                    <div className="flex flex-col items-center justify-center bg-secondary/10 rounded-xl px-4 py-2 border border-secondary/20">
                                        <span className="text-2xl font-black text-secondary">{item.likeCount}</span>
                                        <span className="text-[10px] uppercase text-secondary/60 font-bold tracking-wider">Likes</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {state.step === 'results' && (
              <div className="max-w-7xl mx-auto h-full flex flex-col p-4">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 relative z-10">
                  <h2 className="text-2xl md:text-3xl font-heading font-black text-white flex items-center gap-3">
                    Curated Picks
                    {state.isLoading && <span className="text-sm font-normal text-gray-500 animate-pulse bg-white/5 px-2 py-1 rounded-lg">Brewing...</span>}
                  </h2>
                        <div className="flex items-center gap-4 self-end md:self-auto">
                          <div className="bg-surface border border-white/10 rounded-xl p-1 flex">
                            <button
                              onClick={() => setViewMode('swipe')}
                              className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${viewMode==='swipe' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-gray-400 hover:text-white'}`}
                            >Swipe</button>
                            <button
                              onClick={() => setViewMode('grid')}
                              className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${viewMode==='grid' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-gray-400 hover:text-white'}`}
                            >Grid</button>
                          </div>
                          <button onClick={() => fetchMore()} disabled={state.isLoading} className="w-11 h-11 flex items-center justify-center bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl transition active:scale-95" title="Load More">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                          </button>
                        </div>
                </div>
                    {viewMode === 'swipe' ? (
                      <div className="relative flex-1 min-h-[600px] w-full flex flex-col justify-center items-center">
                          {state.recommendations.length === 0 && !state.isLoading ? (
                              <div className="py-20 text-center bg-surface border border-white/5 rounded-3xl p-10 max-w-lg">
                                  <p className="text-gray-400 text-xl font-medium mb-4">That's all for now!</p>
                                  <button onClick={() => fetchMore()} className="px-6 py-2 bg-primary text-white rounded-lg font-bold">Load More</button>
                              </div>
                          ) : (
                              <>
                                <div className="relative w-full h-full flex justify-center items-center perspective-1000">
                                    <AnimatePresence>
                                        {state.recommendations.slice(0, 3).reverse().map((movie, index) => (
                                            <SwipeableMovieCard
                                                key={movie.id}
                                                movie={movie}
                                                onInteract={handleInteraction}
                                                onMostLiked={handleMostLiked}
                                                style={{ zIndex: 30 - index * 10 }}
                                            />
                                        ))}
                                    </AnimatePresence>
                                </div>
                                <div className="mt-8 flex flex-wrap justify-center gap-8 text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] opacity-50">
                                    <span className="flex items-center gap-2"><span className="text-primary text-base">←</span> Swipe Left to Dislike</span>
                                    <span className="flex items-center gap-2"><span className="text-green-500 text-base">→</span> Swipe Right to Like</span>
                                </div>
                              </>
                          )}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pb-20">
                        {state.recommendations.map(movie => (
                          <MovieCard key={movie.id} movie={movie} onInteract={handleInteraction} onMostLiked={handleMostLiked} />
                        ))}
                        {state.recommendations.length === 0 && !state.isLoading && (
                           <div className="col-span-full py-20 text-center">
                             <button onClick={() => fetchMore()} className="px-8 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-bold transition">Load More Suggestions</button>
                           </div>
                        )}
                      </div>
                    )}
              </div>
            )}
            
            <footer className="w-full py-8 text-center text-gray-600 text-sm border-t border-white/5 mt-auto">
              <p>&copy; {new Date().getFullYear()} Sahil Jani. All rights reserved.</p>
            </footer>
          </div>
      </main>
    </div>
  );
};

const ResetPasswordForm = ({ onComplete }: { onComplete: () => void }) => {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const token = new URLSearchParams(window.location.search).get('token');
    try {
      await dbService.resetPassword({ token, newPassword: password });
      setStatus({ type: 'success', text: 'Password reset successfully! Redirecting...' });
      setTimeout(onComplete, 2500);
    } catch (err: any) {
      setStatus({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-10 bg-surface border border-white/10 rounded-3xl shadow-2xl">
      <h2 className="text-3xl font-heading font-black text-white mb-2">New Password</h2>
      <p className="text-gray-400 text-sm mb-8">Secure your account with a strong password.</p>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-xs text-gray-500 mb-2 font-bold uppercase tracking-widest">New Password</label>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition" 
            required 
            minLength={6}
          />
        </div>
        {status && (
          <div className={`p-4 rounded-xl text-sm font-bold ${status.type === 'error' ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>
            {status.text}
          </div>
        )}
        <button 
          type="submit" 
          disabled={loading} 
          className="w-full py-4 bg-primary hover:bg-rose-700 text-white rounded-xl font-bold text-lg transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-primary/25"
        >
          {loading ? 'Updating...' : 'Set New Password'}
        </button>
      </form>
    </div>
  );
};

export default App;
