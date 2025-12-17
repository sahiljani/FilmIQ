
import React, { useState, useEffect, useCallback } from 'react';
import { AppState, Preferences, Interaction, InteractionType, MovieRecommendation } from './types';
import { generateRecommendations } from './services/geminiService';
import { dbService } from './services/dbService';
import PreferenceForm from './components/PreferenceForm';
import MovieCard from './components/MovieCard';
import AuthForm from './components/AuthForm';

const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [state, setState] = useState<AppState>({
    preferences: null,
    recommendations: [],
    history: [],
    mostLiked: [],
    isLoading: true,
    step: 'setup',
  });

  const [showDb, setShowDb] = useState(false);

  const initialize = useCallback(async () => {
    const token = localStorage.getItem('cinewise_token');
    if (!token) {
      setState(prev => ({ ...prev, isLoading: false }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true }));
    try {
      const { history, preferences } = await dbService.initSession();
      setUser({ email: 'User' }); // Token is valid if this call succeeds
      setState(prev => ({ 
        ...prev, 
        history: history || [], 
        preferences: preferences || prev.preferences,
        isLoading: false,
        step: preferences ? 'results' : 'setup'
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
  }, [initialize]);

  const handleLogout = () => {
    localStorage.removeItem('cinewise_token');
    setUser(null);
    setState({
      preferences: null,
      recommendations: [],
      history: [],
      mostLiked: [],
      isLoading: false,
      step: 'setup',
    });
  };

  const handleStartChain = async (prefs: Preferences) => {
    setState(prev => ({ ...prev, isLoading: true, preferences: prefs }));
    await dbService.savePreferences(prefs);
    const suggestions = await generateRecommendations(prefs, state.history);
    setState(prev => ({
      ...prev,
      isLoading: false,
      recommendations: suggestions,
      step: 'results'
    }));
  };

  const fetchMore = async (currentHistory?: Interaction[]) => {
    if (!state.preferences) return;
    setState(prev => ({ ...prev, isLoading: true }));
    
    // Include both history and current recommendations to avoid duplicates
    const allSeenMovies = [
      ...state.history,
      ...state.recommendations.map(r => ({ movieTitle: r.title, interaction: 'seen' as any, timestamp: 0 }))
    ];
    
    const moreSuggestions = await generateRecommendations(
      state.preferences, 
      currentHistory || allSeenMovies
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

    // Auto-generate more recommendations when only 4 remain (after removing the current one)
    // This means user is about to interact with the last suggestion
    if (remaining.length === 4 && !state.isLoading) {
        fetchMore(newHistory);
    }
  };

  const handleMostLiked = async (movieId: string) => {
    const movie = state.recommendations.find(m => m.id === movieId);
    if (!movie) return;
    
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
        // Update local state
        const existingIndex = state.mostLiked.findIndex(m => m.movieTitle === movie.title);
        let updatedMostLiked;
        if (existingIndex >= 0) {
          updatedMostLiked = [...state.mostLiked];
          updatedMostLiked[existingIndex].likeCount += 1;
        } else {
          updatedMostLiked = [...state.mostLiked, { movieTitle: movie.title, tmdbId: movie.tmdb_id, likeCount: 1 }];
        }
        setState(prev => ({ ...prev, mostLiked: updatedMostLiked }));
      }
    } catch (err) {
      console.error('Error saving most liked:', err);
    }
  };

  // --- Reset Password Screen ---
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

  // --- Login/Signup Screen ---
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
        <header className="p-6 flex justify-between items-center z-20 bg-black/40 border-b border-white/5 backdrop-blur-md">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center shadow-lg shadow-red-600/20">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"></path></svg>
                </div>
                <h1 className="text-2xl font-bold tracking-tight">CineWise<span className="text-red-500">.AI</span></h1>
            </div>
            
            <div className="flex gap-4">
                <button 
                    onClick={handleLogout}
                    className="px-4 py-2 text-sm font-semibold text-gray-400 hover:text-red-400 transition"
                >
                    Logout
                </button>
            </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 relative">
            {state.step === 'setup' ? (
                <div className="h-full flex flex-col justify-center items-center pb-20">
                    <PreferenceForm onSubmit={handleStartChain} isLoading={state.isLoading} />
                </div>
            ) : (
                <div className="max-w-7xl mx-auto h-full flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                            Curated for you
                            {state.isLoading && <span className="text-sm font-normal text-gray-500 animate-pulse ml-2">Brewing magic...</span>}
                        </h2>
                        <button onClick={() => fetchMore()} disabled={state.isLoading} className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-full font-semibold transition active:scale-95 shadow-lg shadow-red-600/20">
                            More Recommendations
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pb-20">
                        {state.recommendations.map(movie => <MovieCard key={movie.id} movie={movie} onInteract={handleInteraction} onMostLiked={handleMostLiked} />)}
                        {state.recommendations.length === 0 && !state.isLoading && (
                            <div className="col-span-full py-20 text-center">
                                <p className="text-gray-500 text-lg">No more suggestions. Try updating your preferences!</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
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
