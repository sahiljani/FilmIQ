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
    }
  };

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
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
        x: exitX ?? (Math.random() > 0.5 ? 1000 : -1000), 
        y: exitY ?? 0,
        opacity: 0,
        transition: { duration: 0.3 } 
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="absolute w-[90%] md:w-[400px] h-[60vh] md:h-[550px] shadow-2xl rounded-3xl left-0 right-0 mx-auto top-0 bottom-0 my-auto bg-gray-900 overflow-visible"
    >
      <div className="relative w-full h-full rounded-3xl overflow-hidden bg-black">
        {/* Background Poster */}
        {movie.poster_path ? (
          <div className="absolute inset-0 z-0">
            <img 
              src={`https://image.tmdb.org/t/p/w780${movie.poster_path}`} 
              alt={movie.title} 
              className="w-full h-full object-cover"
              draggable={false}
            />
             {/* Stronger gradient overlay for readability */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/20 to-black/95"></div>
          </div>
        ) : (
          <div className="absolute inset-0 z-0 bg-gradient-to-br from-purple-900 via-gray-900 to-black"></div>
        )}

        {/* Swipe Indicators */}
        <motion.div
          style={{ opacity: likeOpacity }}
          className="absolute top-10 right-10 z-20 bg-green-500/90 text-white px-6 py-2 rounded-full font-bold text-xl rotate-12 border-4 border-white shadow-lg pointer-events-none"
        >
          LIKE
        </motion.div>
        
        <motion.div
          style={{ opacity: nopeOpacity }}
          className="absolute top-10 left-10 z-20 bg-red-500/90 text-white px-6 py-2 rounded-full font-bold text-xl -rotate-12 border-4 border-white shadow-lg pointer-events-none"
        >
          NOPE
        </motion.div>

        <motion.div
          style={{ opacity: favOpacity }}
          className="absolute top-1/4 left-1/2 transform -translate-x-1/2 z-20 bg-purple-500/90 text-white px-6 py-2 rounded-full font-bold text-xl border-4 border-white shadow-lg pointer-events-none whitespace-nowrap"
        >
          ADDED TO BUCKET
        </motion.div>

        <div className="absolute inset-0 z-10 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
            <div className="min-h-full flex flex-col justify-between">
                {/* Top Content: Title & Meta */}
                <div className="p-6 pt-8 bg-gradient-to-b from-black/80 to-transparent shrink-0">
                    <div className="flex justify-between items-start">
                        <div className="flex-1 pr-4">
                            <h2 className="text-3xl font-bold text-white mb-2 drop-shadow-md leading-tight">
                                {movie.title}
                            </h2>
                            <div className="flex flex-wrap gap-2 items-center text-white/90 text-sm font-medium">
                                <span className="bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded text-xs uppercase tracking-wide">{movie.year}</span>
                                <span className="bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded text-xs uppercase tracking-wide">{movie.type}</span>
                                {movie.vote_average && (
                                <span className="text-yellow-400 font-bold flex items-center gap-1 bg-black/30 backdrop-blur-sm px-2 py-0.5 rounded">
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                                    {movie.vote_average.toFixed(1)}
                                </span>
                                )}
                            </div>
                        </div>
                        <div className="bg-green-600/90 backdrop-blur-md text-white px-3 py-1 rounded-full font-bold text-sm shadow-lg border border-white/10">
                            {movie.matchScore}% Match
                        </div>
                    </div>
                </div>

                {/* Bottom Content: Overview & Actions */}
                <div className="p-6 pb-8 bg-gradient-to-t from-black via-black to-transparent pt-24 shrink-0">
                  <div className="mb-6">
                     <div className="flex items-start gap-2 mb-2 text-white/80">
                        <svg className="w-4 h-4 mt-0.5 text-purple-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <p className="text-xs italic leading-relaxed text-purple-100">"{movie.reason}"</p>
                     </div>
                     <p className="text-white/70 text-xs leading-relaxed">
                       {movie.overview || movie.plot}
                     </p>
                  </div>

                  {/* Compact Modern Action Buttons */}
                  <div className="flex justify-center items-center gap-6">
                    <button
                      onClick={() => { setExitX(-1000); onInteract(movie.id, InteractionType.DISLIKED); }}
                      className="w-14 h-14 rounded-full flex items-center justify-center bg-black/40 backdrop-blur-xl border border-red-500/30 text-red-500 hover:bg-red-600 hover:text-white hover:border-red-600 hover:scale-110 active:scale-95 transition-all duration-300 shadow-lg group"
                      title="Dislike"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path>
                      </svg>
                    </button>
                    
                    <div className="flex gap-4">
                        <button
                        onClick={() => { setExitY(-1000); onMostLiked?.(movie.id); }}
                        className="w-10 h-10 rounded-full flex items-center justify-center bg-black/40 backdrop-blur-xl border border-purple-500/30 text-purple-400 hover:bg-purple-600 hover:text-white hover:border-purple-600 hover:scale-110 active:scale-95 transition-all duration-300 shadow-lg"
                        title="Add to Bucket"
                        >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path>
                        </svg>
                        </button>

                        <button
                        onClick={() => { setExitY(1000); onInteract(movie.id, InteractionType.WATCHED_LIKED); }}
                        className="w-10 h-10 rounded-full flex items-center justify-center bg-black/40 backdrop-blur-xl border border-blue-500/30 text-blue-400 hover:bg-blue-600 hover:text-white hover:border-blue-600 hover:scale-110 active:scale-95 transition-all duration-300 shadow-lg"
                        title="Already Watched"
                        >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                        </svg>
                        </button>
                    </div>

                    <button
                      onClick={() => { setExitX(1000); onInteract(movie.id, InteractionType.LIKED); }}
                      className="w-14 h-14 rounded-full flex items-center justify-center bg-black/40 backdrop-blur-xl border border-green-500/30 text-green-500 hover:bg-green-600 hover:text-white hover:border-green-600 hover:scale-110 active:scale-95 transition-all duration-300 shadow-lg group"
                      title="Like"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                      </svg>
                    </button>
                  </div>
                </div>
            </div>
        </div>
      </div>
    </motion.div>
  );
};

export default SwipeableMovieCard;
