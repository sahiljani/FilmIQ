import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AppState } from '../types';

interface HeaderProps {
  currentStep: AppState['step'];
  onNavigate: (step: AppState['step']) => void;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ currentStep, onNavigate, onLogout }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { label: 'Home', value: 'campaigns' as const },
    { label: 'My Bucket', value: 'bucket' as const },
  ];

  const handleNavClick = (step: AppState['step']) => {
    onNavigate(step);
    setIsMenuOpen(false);
  };

  const handleLogoutClick = () => {
    onLogout();
    setIsMenuOpen(false);
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300">
         {/* Safe area spacer for mobile notches */}
        <div className="h-[env(safe-area-inset-top)] w-full bg-black/80 backdrop-blur-xl"></div>
        
        <div className="bg-black/80 backdrop-blur-xl border-b border-white/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16 md:h-20">
              
              {/* Logo */}
              <div 
                className="flex items-center gap-3 cursor-pointer group" 
                onClick={() => onNavigate('campaigns')}
              >
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-rose-700 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-105 transition duration-300">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"></path>
                  </svg>
                </div>
                <h1 className="text-2xl font-heading font-black tracking-tight text-white group-hover:text-gray-100 transition">
                  CineWise<span className="text-primary">.AI</span>
                </h1>
              </div>

              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center gap-8">
                {navItems.map((item) => (
                  <button
                    key={item.value}
                    onClick={() => onNavigate(item.value)}
                    className={`text-sm font-medium transition-all duration-300 hover:text-primary ${
                      currentStep === item.value ? 'text-primary font-bold' : 'text-gray-400'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
                <button
                  onClick={onLogout}
                  className="px-5 py-2.5 text-sm font-bold text-white bg-primary rounded-xl hover:bg-rose-700 transition-all shadow-lg shadow-primary/25 hover:shadow-primary/40 active:scale-95"
                >
                  Logout
                </button>
              </nav>

              {/* Mobile Menu Button */}
              <button
                className="md:hidden p-2 text-gray-300 hover:text-white transition"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-label="Toggle menu"
              >
                <div className="w-6 h-6 flex flex-col justify-center items-end gap-1.5">
                    <span className={`h-0.5 bg-current transition-all duration-300 ${isMenuOpen ? 'w-6 rotate-45 translate-y-2' : 'w-6'}`} />
                    <span className={`h-0.5 bg-current transition-all duration-300 ${isMenuOpen ? 'opacity-0' : 'w-4'}`} />
                    <span className={`h-0.5 bg-current transition-all duration-300 ${isMenuOpen ? 'w-6 -rotate-45 -translate-y-2' : 'w-5'}`} />
                </div>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMenuOpen(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed top-0 right-0 bottom-0 w-3/4 max-w-xs bg-surface border-l border-white/10 z-50 md:hidden flex flex-col shadow-2xl pt-[env(safe-area-inset-top)]"
            >
              <div className="p-6 flex flex-col h-full">
                  <div className="flex justify-between items-center mb-8">
                     <span className="font-heading font-bold text-xl text-white">Menu</span>
                     <button onClick={() => setIsMenuOpen(false)} className="p-2 text-gray-400 hover:text-white">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
                     </button>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    {navItems.map((item) => (
                        <button
                        key={item.value}
                        onClick={() => handleNavClick(item.value)}
                        className={`w-full text-left px-4 py-4 rounded-xl transition-colors font-medium text-lg ${
                            currentStep === item.value
                            ? 'bg-primary/10 text-primary'
                            : 'text-gray-300 hover:bg-white/5'
                        }`}
                        >
                        {item.label}
                        </button>
                    ))}
                  </div>

                  <div className="mt-auto">
                    <button
                        onClick={handleLogoutClick}
                        className="w-full text-left px-4 py-4 text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors font-medium flex items-center gap-3"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Sign Out
                    </button>
                  </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      
      {/* Spacer to push content down since header is fixed */}
      <div className="h-16 md:h-20 pt-[env(safe-area-inset-top)]" /> 
    </>
  );
};

export default Header;
