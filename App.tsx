
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
      
      // Fetch Campaigns
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
    
    // Create Campaign
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
            
            // Trigger generation
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
              
              // Fetch Recommendations (Pending)
              const recRes = await fetch(`/api/recommendations?campaignId=${campaign.id}`, {
                  headers: { 'Authorization': `Bearer ${localStorage.getItem('cinewise_token')}` }
              });
              
              let recs = [];
              if (recRes.ok) {
                  const data = await recRes.json();
                  recs = data.recommendations || [];
              }
              
              // Ensure prefs has campaignId
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

    // Proceed to next card immediately
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
      <div className="flex h-screen items-center justify-center bg-gray-950 p-6">
        <ResetPasswordForm onComplete={() => {
            window.history.replaceState({}, document.title, "/");
            setIsResetting(false);
        }} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-black p-6">
        <AuthForm onSuccess={(dataUser) => {
          setUser(dataUser);
          initialize();
        }} />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white font-sans selection:bg-red-500/30">
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        <Header 
          currentStep={state.step} 
          onNavigate={(step) => setState(prev => ({ ...prev, step }))}
          onLogout={handleLogout}
        />

        <div className="flex-1 overflow-y-auto p-6 relative">
            {state.step === 'campaigns' && (
               <div className="max-w-5xl mx-auto p-6">
                <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
                  Your Search Campaigns
                  {state.isLoading && <span className="text-sm font-normal text-gray-500 animate-pulse">Loading...</span>}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <button 
                    onClick={() => setState(prev => ({...prev, step: 'setup', currentCampaignId: null, preferences: null}))}
                    className="p-6 bg-red-600/10 border-2 border-dashed border-red-600/30 rounded-2xl hover:bg-red-600/20 transition flex flex-col items-center justify-center h-48 group"
                  >
                    <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center mb-4 group-hover:scale-110 transition">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                    </div>
                    <span className="font-bold text-lg text-red-500">Start New Search</span>
                  </button>
                  {state.campaigns.map(c => (
                    <button
                      key={c.id}
                      onClick={() => handleSelectCampaign(c)}
                      className="p-6 bg-gray-900 border border-gray-800 rounded-2xl hover:border-gray-600 hover:shadow-xl transition text-left h-48 flex flex-col justify-between group relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition">
                         <svg className="w-20 h-20 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"></path></svg>
                      </div>
                      <div>
                        <h3 className="font-bold text-xl mb-1 text-white group-hover:text-red-400 transition truncate pr-2">{c.name}</h3>
                        <p className="text-gray-500 text-xs">{new Date(c.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="relative z-10">
                         <div className="inline-block px-3 py-1 rounded-full bg-gray-800 text-xs text-gray-400">
                            Resume Session →
                         </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {state.step === 'setup' && (
                <div className="h-full flex flex-col justify-center items-center pb-20">
                    <PreferenceForm onSubmit={handleCreateCampaign} isLoading={state.isLoading} />
                </div>
            )}

            {state.step === 'bucket' && (
                <div className="max-w-5xl mx-auto p-6">
                    <h2 className="text-3xl font-bold mb-6 flex items-center gap-3 text-purple-400">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path></svg>
                        My Bucket List
                    </h2>
                    {state.mostLiked.length === 0 ? (
                        <div className="text-center py-20 bg-gray-900 rounded-2xl border border-gray-800">
                            <p className="text-gray-500 text-lg">Your bucket is empty. Go add some movies!</p>
                            <button onClick={() => setState(prev => ({ ...prev, step: 'campaigns' }))} className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition">Discover Movies</button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {state.mostLiked.map((item, idx) => (
                                <div key={idx} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden hover:shadow-purple-900/20 hover:shadow-xl transition p-4 flex gap-4">
                                   {/* Since mostLiked only stores basic info, we might not have the poster unless cached. For now, show title. */}
                                    <div className="flex-1">
                                        <h3 className="font-bold text-lg text-white mb-1">{item.movieTitle}</h3>
                                        <div className="flex items-center gap-2 text-sm text-gray-400">
                                            <span>TMDB ID: {item.tmdbId}</span>
                                        </div>
                                        <div className="mt-4 flex gap-2">
                                            <a 
                                              href={`https://www.themoviedb.org/movie/${item.tmdbId}`} 
                                              target="_blank" 
                                              rel="noopener noreferrer"
                                              className="text-xs bg-gray-800 hover:bg-gray-700 px-3 py-1 rounded-full text-white transition border border-gray-700"
                                            >
                                                View on TMDB
                                            </a>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-center justify-center bg-gray-800/50 rounded-lg px-3 py-2">
                                        <span className="text-2xl font-bold text-purple-500">{item.likeCount}</span>
                                        <span className="text-[10px] uppercase text-gray-500 font-bold">Likes</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {state.step === 'results' && (
              <div className="max-w-7xl mx-auto h-full flex flex-col">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 z-10 relative">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    Curated for you
                    {state.isLoading && <span className="text-sm font-normal text-gray-500 animate-pulse ml-2">Brewing magic...</span>}
                  </h2>
                        <div className="flex items-center gap-3 self-end md:self-auto">
                          <div className="bg-gray-800 rounded-full p-1 flex">
                            <button
                              onClick={() => setViewMode('swipe')}
                              className={`px-3 py-1.5 text-sm rounded-full ${viewMode==='swipe' ? 'bg-red-600 text-white' : 'text-gray-300'}`}
                            >Swipe</button>
                            <button
                              onClick={() => setViewMode('grid')}
                              className={`px-3 py-1.5 text-sm rounded-full ${viewMode==='grid' ? 'bg-red-600 text-white' : 'text-gray-300'}`}
                            >Grid</button>
                          </div>
                          <button onClick={() => fetchMore()} disabled={state.isLoading} className="w-10 h-10 flex items-center justify-center bg-red-600 hover:bg-red-500 text-white rounded-full transition active:scale-95 shadow-lg shadow-red-600/20" title="More Recommendations">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                          </button>
                        </div>
                </div>
                    {viewMode === 'swipe' ? (
                      <div className="relative h-[70vh] md:h-[600px] w-full flex flex-col justify-center items-center pb-20">
                          {state.recommendations.length === 0 && !state.isLoading ? (
                              <div className="py-20 text-center">
                                  <p className="text-gray-500 text-lg">No more suggestions. Try updating your preferences!</p>
                              </div>
                          ) : (
                              <>
                                <div className="relative w-full h-full flex justify-center items-center">
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
                                <div className="mt-8 flex flex-wrap justify-center gap-6 text-xs text-gray-500 font-medium uppercase tracking-widest opacity-60">
                                    <span className="flex items-center gap-2"><span className="text-red-500">←</span> Swipe Left to Dislike</span>
                                    <span className="flex items-center gap-2"><span className="text-green-500">→</span> Swipe Right to Like</span>
                                    <span className="flex items-center gap-2"><svg className="w-4 h-4 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg> Save to Bucket</span>
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
                            <p className="text-gray-500 text-lg">No more suggestions. Try updating your preferences!</p>
                          </div>
                        )}
                      </div>
                    )}
              </div>
            )}
            
            <footer className="w-full py-6 text-center text-gray-500 text-sm border-t border-white/5 mt-auto">
              Copyright Sahil Jani 2025
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
      setStatus({ type: 'success', text: 'Password reset successfully! Redirecting to login...' });
      setTimeout(onComplete, 2500);
    } catch (err: any) {
      setStatus({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 bg-gray-900 border border-white/10 rounded-2xl shadow-2xl">
      <h2 className="text-3xl font-bold text-white mb-2">New Password</h2>
      <p className="text-gray-400 text-sm mb-8">Enter your new secure password below.</p>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-xs text-gray-400 mb-2 font-bold uppercase tracking-widest">New Password</label>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            className="w-full bg-black/40 border border-gray-800 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-red-600 outline-none transition" 
            required 
            minLength={6}
          />
        </div>
        {status && (
          <div className={`p-4 rounded-lg text-sm font-medium ${status.type === 'error' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-green-500/10 text-green-500 border border-green-500/20'}`}>
            {status.text}
          </div>
        )}
        <button 
          type="submit" 
          disabled={loading} 
          className="w-full py-4 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold text-lg transition-all active:scale-95 disabled:opacity-50"
        >
          {loading ? 'Updating...' : 'Set New Password'}
        </button>
      </form>
    </div>
  );
};

export default App;
