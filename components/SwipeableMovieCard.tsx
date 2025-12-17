import React from 'react';
import { useSpring, animated } from '@react-spring/web';
import { useDrag } from '@use-gesture/react';
import { MovieRecommendation, InteractionType } from '../types';

interface Props {
  movie: MovieRecommendation;
  onInteract: (id: string, type: InteractionType) => void;
  onMostLiked?: (id: string) => void;
  style?: any;
}

const SwipeableMovieCard: React.FC<Props> = ({ movie, onInteract, onMostLiked, style }) => {
  const [{ x, y, rotate, scale }, api] = useSpring(() => ({
    x: 0,
    y: 0,
    rotate: 0,
    scale: 1,
  }));

  const bind = useDrag(
    ({ active, movement: [mx, my], direction: [xDir], velocity: [vx] }) => {
      const trigger = vx > 0.2;
      
      if (!active && trigger) {
        // Determine swipe direction
        if (Math.abs(mx) > Math.abs(my)) {
          // Horizontal swipe
          if (mx > 100) {
            // Swipe right - Like/Add to list
            onInteract(movie.id, InteractionType.LIKED);
            api.start({ x: 1000, rotate: 45, scale: 0.8 });
          } else if (mx < -100) {
            // Swipe left - Not interested
            onInteract(movie.id, InteractionType.DISLIKED);
            api.start({ x: -1000, rotate: -45, scale: 0.8 });
          } else {
            api.start({ x: 0, y: 0, rotate: 0, scale: 1 });
          }
        } else {
          // Vertical swipe
          if (my < -100) {
            // Swipe up - Most Liked
            onMostLiked?.(movie.id);
            api.start({ y: -1000, rotate: 0, scale: 0.8 });
          } else if (my > 100) {
            // Swipe down - Already watched disliked
            onInteract(movie.id, InteractionType.WATCHED_DISLIKED);
            api.start({ y: 1000, rotate: 0, scale: 0.8 });
          } else {
            api.start({ x: 0, y: 0, rotate: 0, scale: 1 });
          }
        }
      } else {
        api.start({
          x: active ? mx : 0,
          y: active ? my : 0,
          rotate: active ? mx / 10 : 0,
          scale: active ? 1.05 : 1,
        });
      }
    },
    { axis: undefined }
  );

  const posterUrl = movie.poster_path 
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` 
    : null;

  return (
    <animated.div
      {...bind()}
      style={{
        ...style,
        x,
        y,
        rotate,
        scale,
        touchAction: 'none',
        userSelect: 'none',
      }}
      className="absolute w-full h-full cursor-grab active:cursor-grabbing"
    >
      <div className="relative w-full h-full bg-gray-900 rounded-3xl overflow-hidden shadow-2xl">
        {/* Background Poster */}
        {posterUrl ? (
          <div className="absolute inset-0 z-0">
            <img 
              src={posterUrl} 
              alt={movie.title} 
              className="w-full h-full object-cover"
              draggable={false}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent"></div>
          </div>
        ) : (
          <div className="absolute inset-0 z-0 bg-gradient-to-br from-purple-900 via-gray-900 to-black"></div>
        )}

        {/* Swipe Indicators */}
        <animated.div
          style={{
            opacity: x.to((val) => (val > 50 ? (val - 50) / 100 : 0)),
          }}
          className="absolute top-10 right-10 z-20 bg-green-500/90 text-white px-8 py-3 rounded-full font-bold text-2xl rotate-12 border-4 border-white"
        >
          LIKE
        </animated.div>
        
        <animated.div
          style={{
            opacity: x.to((val) => (val < -50 ? (-val - 50) / 100 : 0)),
          }}
          className="absolute top-10 left-10 z-20 bg-red-500/90 text-white px-8 py-3 rounded-full font-bold text-2xl -rotate-12 border-4 border-white"
        >
          NOPE
        </animated.div>

        <animated.div
          style={{
            opacity: y.to((val) => (val < -50 ? (-val - 50) / 100 : 0)),
          }}
          className="absolute top-1/3 left-1/2 transform -translate-x-1/2 z-20 bg-purple-500/90 text-white px-8 py-3 rounded-full font-bold text-2xl border-4 border-white"
        >
          ⭐ FAVORITE
        </animated.div>

        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 z-10 p-6 pb-8">
          <div className="mb-4 flex justify-between items-start">
            <div>
              <h2 className="text-4xl font-bold text-white mb-2 drop-shadow-lg">
                {movie.title}
              </h2>
              <div className="flex gap-3 items-center text-white/90">
                <span className="text-lg font-semibold">{movie.year}</span>
                <span className="text-lg">•</span>
                <span className="text-lg">{movie.type}</span>
                {movie.vote_average && (
                  <>
                    <span className="text-lg">•</span>
                    <span className="text-yellow-400 font-bold text-lg">★ {movie.vote_average.toFixed(1)}</span>
                  </>
                )}
              </div>
            </div>
            <div className="bg-green-500 text-white px-4 py-2 rounded-full font-bold text-xl">
              {movie.matchScore}%
            </div>
          </div>

          <p className="text-white/90 text-base mb-4 line-clamp-3 drop-shadow">
            {movie.overview || movie.plot}
          </p>

          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20">
            <p className="text-xs text-white/70 uppercase tracking-wider font-bold mb-1">
              Why Watch?
            </p>
            <p className="text-sm text-white italic">"{movie.reason}"</p>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 grid grid-cols-4 gap-3">
            <button
              onClick={() => onInteract(movie.id, InteractionType.DISLIKED)}
              className="w-14 h-14 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white shadow-lg active:scale-95 transition"
            >
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
            
            <button
              onClick={() => onMostLiked?.(movie.id)}
              className="w-14 h-14 bg-purple-500 hover:bg-purple-600 rounded-full flex items-center justify-center text-white shadow-lg active:scale-95 transition"
            >
              <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </button>

            <button
              onClick={() => onInteract(movie.id, InteractionType.WATCHED_LIKED)}
              className="w-14 h-14 bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg active:scale-95 transition"
            >
              <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
              </svg>
            </button>

            <button
              onClick={() => onInteract(movie.id, InteractionType.LIKED)}
              className="w-14 h-14 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center text-white shadow-lg active:scale-95 transition"
            >
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
              </svg>
            </button>
          </div>

          {/* Swipe Instructions */}
          <div className="mt-4 text-center text-white/60 text-xs">
            <p>Swipe left: Nope • Swipe right: Like • Swipe up: Favorite</p>
          </div>
        </div>
      </div>
    </animated.div>
  );
};

export default SwipeableMovieCard;
