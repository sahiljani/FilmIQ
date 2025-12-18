import React from 'react';
import { MovieRecommendation, InteractionType } from '../types';

interface Props {
  movie: MovieRecommendation;
  onInteract: (id: string, type: InteractionType) => void;
  onMostLiked?: (id: string) => void;
}

const MovieCard: React.FC<Props> = ({ movie, onInteract, onMostLiked }) => {
  // Generate a consistent pseudo-random gradient based on title length
  const colors = [
    'from-blue-900 to-slate-900',
    'from-red-900 to-slate-900',
    'from-purple-900 to-slate-900',
    'from-emerald-900 to-slate-900',
  ];
  const colorClass = colors[movie.title.length % colors.length];
  const posterUrl = movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null;

  return (
    <div className="group relative bg-gray-900 border border-gray-800 rounded-xl overflow-hidden hover:shadow-2xl hover:shadow-red-900/20 transition-all duration-300 flex flex-col h-full">
      {/* Background Poster */}
      {posterUrl && (
        <div className="absolute inset-0 z-0 opacity-10 group-hover:opacity-30 transition-opacity">
           <img src={posterUrl} alt={movie.title} className="w-full h-full object-cover" />
           <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/80 to-transparent"></div>
        </div>
      )}

      {/* Top Banner / Match Score */}
      <div className={`relative z-10 h-24 ${!posterUrl ? `bg-gradient-to-br ${colorClass}` : ''} p-4 flex justify-between items-start`}>
        <div className="bg-black/40 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold text-white border border-white/10">
          {movie.type} • {movie.language}
        </div>
        <div className="flex flex-col items-end">
          <span className="text-2xl font-bold text-green-400">{movie.matchScore}%</span>
          <span className="text-xs text-gray-400">Match</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col relative z-10 -mt-8">
        <div className="bg-gray-800/90 backdrop-blur-sm rounded-lg p-4 border border-gray-700 shadow-lg flex-1">
          <div className="flex justify-between items-baseline mb-2">
            <h3 className="text-xl font-bold text-white leading-tight">{movie.title}</h3>
            <span className="text-sm font-mono text-gray-400 ml-2 whitespace-nowrap">{movie.year}</span>
          </div>
          
          {movie.vote_average && (
            <div className="mb-2 text-yellow-500 font-bold text-xs flex items-center gap-1">
                <span>★</span> {movie.vote_average.toFixed(1)} / 10
            </div>
          )}

          <div className="max-h-40 overflow-y-auto pr-2 mb-4 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
            <p className="text-gray-300 text-sm leading-relaxed">
              {movie.overview || movie.plot}
            </p>
          </div>
          
          <div className="bg-gray-900/50 p-3 rounded-md border-l-2 border-red-500 mb-4">
             <p className="text-xs text-gray-400 uppercase tracking-wider font-bold mb-1">Why Watch?</p>
             <p className="text-sm text-gray-200 italic">"{movie.reason}"</p>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-4 space-y-3">
            <div className="grid grid-cols-2 gap-2">
                <button
                    onClick={() => onInteract(movie.id, InteractionType.LIKED)}
                    className="flex items-center justify-center gap-2 py-2 px-4 bg-gray-800 hover:bg-green-900/30 text-gray-300 hover:text-green-400 border border-gray-700 hover:border-green-800 rounded-lg transition text-sm font-medium"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
                    Like
                </button>
                <button
                    onClick={() => onInteract(movie.id, InteractionType.DISLIKED)}
                    className="flex items-center justify-center gap-2 py-2 px-4 bg-gray-800 hover:bg-red-900/30 text-gray-300 hover:text-red-400 border border-gray-700 hover:border-red-800 rounded-lg transition text-sm font-medium"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    Not Interested
                </button>
            </div>
            
            <div className="flex justify-between items-center gap-2 pt-2 border-t border-gray-800">
                <span className="text-xs text-gray-500">Already watched?</span>
                <div className="flex gap-2">
                    <button
                        onClick={() => onMostLiked?.(movie.id)}
                        title="Add to Bucket"
                        className="p-2 rounded-full bg-gray-800 hover:bg-purple-900/40 text-gray-400 hover:text-purple-400 transition"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path></svg>
                    </button>
                    <button
                        onClick={() => onInteract(movie.id, InteractionType.WATCHED_LIKED)}
                        title="Watched & Liked"
                        className="p-2 rounded-full bg-gray-800 hover:bg-blue-900/40 text-gray-400 hover:text-blue-400 transition"
                    >
                         <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" /></svg>
                    </button>
                    <button
                        onClick={() => onInteract(movie.id, InteractionType.WATCHED_DISLIKED)}
                        title="Watched & Disliked"
                        className="p-2 rounded-full bg-gray-800 hover:bg-orange-900/40 text-gray-400 hover:text-orange-400 transition"
                    >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M18 9.5a1.5 1.5 0 11-3 0v-6a1.5 1.5 0 013 0v6zM14 9.667v-5.43a2 2 0 00-1.105-1.79l-.05-.025A4 4 0 0011.055 2H5.64a2 2 0 00-1.962 1.608l-1.2 6A2 2 0 004.44 12H8v4a2 2 0 002 2 1 1 0 001-1v-.667a4 4 0 01.8-2.4l1.4-1.866a4 4 0 00.8-2.4z" /></svg>
                    </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default MovieCard;
