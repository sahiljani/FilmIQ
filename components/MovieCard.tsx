import React from 'react';
import { MovieRecommendation, InteractionType } from '../types';

interface Props {
  movie: MovieRecommendation;
  onInteract: (id: string, type: InteractionType) => void;
  onMostLiked?: (id: string) => void;
}

const MovieCard: React.FC<Props> = ({ movie, onInteract, onMostLiked }) => {
  const posterUrl = movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null;

  return (
    <div className="group relative bg-surface border border-white/5 rounded-3xl overflow-hidden hover:shadow-2xl hover:shadow-primary/20 hover:border-primary/50 transition-all duration-500 flex flex-col h-full transform hover:-translate-y-1">
      {/* Background Poster */}
      {posterUrl ? (
        <div className="absolute inset-0 z-0 h-64">
           <img src={posterUrl} alt={movie.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
           <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/80 to-transparent"></div>
        </div>
      ) : (
        <div className="absolute inset-0 z-0 h-64 bg-gradient-to-br from-primary/20 to-surface"></div>
      )}

      {/* Top Banner / Match Score */}
      <div className="relative z-10 p-5 flex justify-between items-start">
        <div className="bg-black/60 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-bold text-white border border-white/10 uppercase tracking-wider">
          {movie.type}
        </div>
        <div className="bg-green-500/20 backdrop-blur-md px-3 py-1 rounded-lg border border-green-500/30 flex items-center gap-1 shadow-lg">
          <span className="text-sm font-black text-green-400">{movie.matchScore}%</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 pt-32 flex-1 flex flex-col relative z-10">
          <div className="mb-4">
            <h3 className={`${movie.title.length > 40 ? 'text-lg' : movie.title.length > 20 ? 'text-xl' : 'text-2xl'} font-heading font-black text-white leading-tight mb-1 group-hover:text-primary transition-colors`}>{movie.title}</h3>
            <div className="flex items-center gap-3 text-xs font-medium text-gray-400">
                <span>{movie.year}</span>
                <span>•</span>
                <span>{movie.language?.toUpperCase()}</span>
                {movie.vote_average && (
                    <>
                        <span>•</span>
                        <span className="text-yellow-500 font-bold flex items-center gap-1">
                            ★ {movie.vote_average.toFixed(1)}
                        </span>
                    </>
                )}
            </div>

            {/* Availability */}
            {movie.providers && movie.providers.length > 0 && (
                <div className="mt-3">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-1">Available on</p>
                    <div className="flex flex-wrap gap-2">
                        {movie.providers.slice(0, 5).map((provider, idx) => (
                            <img 
                                key={idx}
                                src={`https://image.tmdb.org/t/p/w92${provider.logo_path}`} 
                                alt={provider.provider_name}
                                title={provider.provider_name}
                                className="w-6 h-6 rounded-md shadow-sm border border-white/10"
                            />
                        ))}
                        {movie.providers.length > 5 && (
                             <div className="w-6 h-6 rounded-md bg-white/10 flex items-center justify-center text-[9px] text-white font-bold border border-white/10">
                                +{movie.providers.length - 5}
                             </div>
                        )}
                    </div>
                </div>
            )}
          </div>

          <div className="flex-1 mb-6">
             <div className="bg-white/5 p-4 rounded-xl border border-white/5 mb-4 group-hover:bg-white/10 transition-colors">
                 <div className="flex gap-2 mb-2">
                    <svg className="w-4 h-4 text-secondary mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    <p className="text-xs text-purple-200/90 italic leading-relaxed line-clamp-3">"{movie.reason}"</p>
                 </div>
                 <p className="text-gray-400 text-xs leading-relaxed line-clamp-3 pl-6 border-l-2 border-white/10">
                   {movie.overview || movie.plot}
                 </p>
             </div>
          </div>

        {/* Actions */}
        <div className="mt-auto">
            <div className="grid grid-cols-2 gap-3 mb-4">
                <button
                    onClick={() => onInteract(movie.id, InteractionType.LIKED)}
                    className="flex items-center justify-center gap-2 py-2.5 px-4 bg-white/5 hover:bg-green-500 hover:text-white text-gray-300 border border-white/10 hover:border-transparent rounded-xl transition text-sm font-bold"
                >
                    Like
                </button>
                <button
                    onClick={() => onInteract(movie.id, InteractionType.DISLIKED)}
                    className="flex items-center justify-center gap-2 py-2.5 px-4 bg-white/5 hover:bg-primary hover:text-white text-gray-300 border border-white/10 hover:border-transparent rounded-xl transition text-sm font-bold"
                >
                    Nope
                </button>
            </div>
            
            <div className="flex justify-between items-center gap-2 pt-4 border-t border-white/5">
                <div className="flex gap-2 w-full">
                    <button
                        onClick={() => onMostLiked?.(movie.id)}
                        title="Add to Bucket"
                        className="flex-1 py-2 rounded-lg bg-secondary/10 hover:bg-secondary text-secondary hover:text-white border border-secondary/20 hover:border-transparent transition text-xs font-bold flex items-center justify-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path></svg>
                        Bucket
                    </button>
                    <button
                        onClick={() => onInteract(movie.id, InteractionType.WATCHED_LIKED)}
                        title="Watched & Liked"
                        className="p-2 rounded-lg bg-blue-500/10 hover:bg-blue-500 text-blue-400 hover:text-white border border-blue-500/20 hover:border-transparent transition"
                    >
                         <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" /></svg>
                    </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default MovieCard;
