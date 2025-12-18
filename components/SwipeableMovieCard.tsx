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
    const threshold = 50; 
    const { offset, velocity } = info;

    if (Math.abs(offset.x) > Math.abs(offset.y)) {
      // Horizontal
      if (offset.x > threshold || velocity.x > 400) {
        setExitX(1000);
        onInteract(movie.id, InteractionType.LIKED);
      } else if (offset.x < -threshold || velocity.x < -400) {
        setExitX(-1000);
        onInteract(movie.id, InteractionType.DISLIKED);
      }
    }
  };

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.9} 
      onDragEnd={handleDragEnd}
      style={{
        x,
        y,
        rotate,
        scale,
        ...style,
        position: 'absolute',
        cursor: 'grab',
        touchAction: 'none', // Critical for mobile swipe
      }}
      whileTap={{ cursor: 'grabbing' }}
      initial={{ scale: 0.9, opacity: 0, y: 50 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ 
        x: exitX ?? (Math.random() > 0.5 ? 1000 : -1000), 
        y: exitY ?? 0,
        opacity: 0,
        transition: { duration: 0.3 } 
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="absolute w-[90%] md:w-[400px] h-[65dvh] md:h-[600px] shadow-2xl rounded-3xl bg-surface overflow-hidden border border-white/5"
    >
      <div className="relative w-full h-full bg-black">
        {/* Background Poster */}
        {movie.poster_path ? (
          <div className="absolute inset-0 z-0">
            <img 
              src={`https://image.tmdb.org/t/p/w780${movie.poster_path}`} 
              alt={movie.title} 
              className="w-full h-full object-cover"
              draggable={false}
            />
             {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent h-2/3 mt-auto"></div>
          </div>
        ) : (
          <div className="absolute inset-0 z-0 bg-gradient-to-br from-surface via-gray-900 to-black"></div>
        )}

        {/* Swipe Indicators */}
        <motion.div
          style={{ opacity: likeOpacity }}
          className="absolute top-8 right-8 z-20 bg-green-500 text-white px-4 py-2 rounded-xl font-heading font-black text-xl rotate-12 border-2 border-white/20 shadow-xl pointer-events-none uppercase tracking-widest"
        >
          Like
        </motion.div>
        
        <motion.div
          style={{ opacity: nopeOpacity }}
          className="absolute top-8 left-8 z-20 bg-primary text-white px-4 py-2 rounded-xl font-heading font-black text-xl -rotate-12 border-2 border-white/20 shadow-xl pointer-events-none uppercase tracking-widest"
        >
          Nope
        </motion.div>

        <motion.div
          style={{ opacity: favOpacity }}
          className="absolute top-1/4 left-1/2 transform -translate-x-1/2 z-20 bg-secondary text-white px-6 py-2 rounded-xl font-heading font-bold text-lg border-2 border-white/20 shadow-xl pointer-events-none whitespace-nowrap"
        >
          Added to Bucket
        </motion.div>

        {/* Content Area */}
        <div className="absolute inset-0 z-10 flex flex-col justify-end pb-24 px-6 pointer-events-none">
             <div className="mb-2">
                 <div className="flex justify-between items-end mb-2">
                    <h2 className="text-3xl font-heading font-black text-white leading-tight drop-shadow-lg line-clamp-2">
                        {movie.title}
                    </h2>
                    <div className="bg-green-500/20 backdrop-blur-md text-green-400 border border-green-500/30 px-2 py-1 rounded-lg font-bold text-xs shadow-lg whitespace-nowrap ml-2 mb-1">
                        {movie.matchScore}% Match
                    </div>
                 </div>
                 
                 <div className="flex flex-wrap gap-2 items-center text-gray-300 text-xs font-medium mb-3">
                    <span className="bg-white/10 backdrop-blur-sm px-2 py-1 rounded-md uppercase tracking-wide">{movie.year}</span>
                    <span className="bg-white/10 backdrop-blur-sm px-2 py-1 rounded-md uppercase tracking-wide">{movie.type}</span>
                    {movie.vote_average && (
                    <span className="text-yellow-400 font-bold flex items-center gap-1 bg-black/40 backdrop-blur-sm px-2 py-1 rounded-md">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                        {movie.vote_average.toFixed(1)}
                    </span>
                    )}
                </div>
                
                <div className="flex items-start gap-2 mb-2">
                    <svg className="w-4 h-4 mt-0.5 text-secondary shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    <p className="text-xs italic leading-relaxed text-purple-200/90 line-clamp-2">"{movie.reason}"</p>
                </div>
                
                <p className="text-gray-300 text-xs leading-relaxed line-clamp-3">
                    {movie.overview || movie.plot}
                </p>
             </div>
        </div>

        {/* Action Buttons - pointer-events-auto to allow clicking */}
        <div className="absolute bottom-0 left-0 right-0 z-20 p-6 flex justify-center items-center gap-6 pointer-events-auto bg-gradient-to-t from-black to-transparent pt-10">
            <button
              onClick={(e) => { e.stopPropagation(); setExitX(-1000); onInteract(movie.id, InteractionType.DISLIKED); }}
              className="w-14 h-14 rounded-full flex items-center justify-center bg-surface/80 backdrop-blur-xl border border-white/10 text-primary hover:bg-primary hover:text-white hover:border-primary hover:scale-110 active:scale-95 transition-all duration-300 shadow-lg"
              title="Dislike"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
            
            <div className="flex gap-4">
                <button
                onClick={(e) => { e.stopPropagation(); setExitY(-1000); onMostLiked?.(movie.id); }}
                className="w-10 h-10 rounded-full flex items-center justify-center bg-surface/80 backdrop-blur-xl border border-white/10 text-secondary hover:bg-secondary hover:text-white hover:border-secondary hover:scale-110 active:scale-95 transition-all duration-300 shadow-lg"
                title="Add to Bucket"
                >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path>
                </svg>
                </button>

                <button
                onClick={(e) => { e.stopPropagation(); setExitY(1000); onInteract(movie.id, InteractionType.WATCHED_LIKED); }}
                className="w-10 h-10 rounded-full flex items-center justify-center bg-surface/80 backdrop-blur-xl border border-white/10 text-blue-400 hover:bg-blue-600 hover:text-white hover:border-blue-600 hover:scale-110 active:scale-95 transition-all duration-300 shadow-lg"
                title="Already Watched"
                >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                </svg>
                </button>
            </div>

            <button
              onClick={(e) => { e.stopPropagation(); setExitX(1000); onInteract(movie.id, InteractionType.LIKED); }}
              className="w-14 h-14 rounded-full flex items-center justify-center bg-surface/80 backdrop-blur-xl border border-white/10 text-green-500 hover:bg-green-600 hover:text-white hover:border-green-600 hover:scale-110 active:scale-95 transition-all duration-300 shadow-lg"
              title="Like"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
              </svg>
            </button>
        </div>
      </div>
    </motion.div>
  );
};

export default SwipeableMovieCard;
