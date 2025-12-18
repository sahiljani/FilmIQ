import React, { useState } from 'react';
import { motion, useMotionValue, useTransform, PanInfo, AnimatePresence } from 'framer-motion';
import { MovieRecommendation, InteractionType } from '../types';

interface Props {
  movie: MovieRecommendation;
  onInteract: (id: string, type: InteractionType) => void;
  onMostLiked?: (id: string) => void;
  style?: any;
}

const SwipeableMovieCard: React.FC<Props> = ({ movie, onInteract, onMostLiked, style }) => {
  const [exitX, setExitX] = useState<number | null>(null);
  const [exitY, setExitY] = useState<number | null>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const scale = useTransform(x, [-200, 0, 200], [0.9, 1, 0.9]);
  
  // Opacity for indicators
  const likeOpacity = useTransform(x, [20, 150], [0, 1]);
  const nopeOpacity = useTransform(x, [-150, -20], [1, 0]);
  const favOpacity = useTransform(y, [-150, -50], [1, 0]);

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 100;
    const { offset, velocity } = info;

    if (Math.abs(offset.x) > Math.abs(offset.y)) {
      // Horizontal
      if (offset.x > threshold || velocity.x > 500) {
        setExitX(1000);
        onInteract(movie.id, InteractionType.LIKED);
      } else if (offset.x < -threshold || velocity.x < -500) {
        setExitX(-1000);
        onInteract(movie.id, InteractionType.DISLIKED);
      }
    } else {
      // Vertical
      if (offset.y < -threshold || velocity.y < -500) {
        setExitY(-1000);
        onMostLiked?.(movie.id);
      } else if (offset.y > threshold || velocity.y > 500) {
        setExitY(1000);
        onInteract(movie.id, InteractionType.WATCHED_DISLIKED);
      }
    }
  };

  return (
    <motion.div
      drag
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }} // Snap back if released
      dragElastic={0.7} // Feel of the drag
      onDragEnd={handleDragEnd}
      style={{
        x,
        y,
        rotate,
        scale,
        ...style,
        position: 'absolute',
        cursor: 'grab',
      }}
      whileTap={{ cursor: 'grabbing' }}
      initial={{ scale: 0.9, opacity: 0, y: 50 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ 
        x: exitX ?? (Math.random() > 0.5 ? 1000 : -1000), // Default exit if simply unmounted
        y: exitY ?? 0,
        opacity: 0,
        transition: { duration: 0.3 } 
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="absolute w-[90%] md:w-[400px] h-[60vh] md:h-[550px] shadow-xl rounded-3xl left-0 right-0 mx-auto top-0 bottom-0 my-auto"
    >
      <div className="relative w-full h-full bg-gray-900 rounded-3xl overflow-hidden shadow-2xl">
        {/* Background Poster */}
        {movie.poster_path ? (
          <div className="absolute inset-0 z-0">
            <img 
              src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`} 
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
        <motion.div
          style={{ opacity: likeOpacity }}
          className="absolute top-10 right-10 z-20 bg-green-500/90 text-white px-8 py-3 rounded-full font-bold text-2xl rotate-12 border-4 border-white"
        >
          LIKE
        </motion.div>
        
        <motion.div
          style={{ opacity: nopeOpacity }}
          className="absolute top-10 left-10 z-20 bg-red-500/90 text-white px-8 py-3 rounded-full font-bold text-2xl -rotate-12 border-4 border-white"
        >
          NOPE
        </motion.div>

        <motion.div
          style={{ opacity: favOpacity }}
          className="absolute top-1/3 left-1/2 transform -translate-x-1/2 z-20 bg-purple-500/90 text-white px-8 py-3 rounded-full font-bold text-2xl border-4 border-white"
        >
          ⭐ FAVORITE
        </motion.div>

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
              onClick={() => { setExitX(-1000); onInteract(movie.id, InteractionType.DISLIKED); }}
              className="w-14 h-14 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white shadow-lg active:scale-95 transition"
            >
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
            
            <button
              onClick={() => { setExitY(-1000); onMostLiked?.(movie.id); }}
              className="w-14 h-14 bg-purple-500 hover:bg-purple-600 rounded-full flex items-center justify-center text-white shadow-lg active:scale-95 transition"
            >
              <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </button>

            <button
              onClick={() => { setExitY(1000); onInteract(movie.id, InteractionType.WATCHED_LIKED); }}
              className="w-14 h-14 bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg active:scale-95 transition"
            >
              <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
              </svg>
            </button>

            <button
              onClick={() => { setExitX(1000); onInteract(movie.id, InteractionType.LIKED); }}
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
    </motion.div>
  );
};

export default SwipeableMovieCard;
