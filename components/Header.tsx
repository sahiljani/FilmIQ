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
    <header className="p-6 flex justify-between items-center z-50 bg-black/40 border-b border-white/5 backdrop-blur-md sticky top-0">
      <div 
        className="flex items-center gap-3 cursor-pointer" 
        onClick={() => onNavigate('campaigns')}
      >
        <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center shadow-lg shadow-red-600/20">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"></path>
          </svg>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          CineWise<span className="text-red-500">.AI</span>
        </h1>
      </div>

      {/* Desktop Navigation */}
      <nav className="hidden md:flex items-center gap-8">
        {navItems.map((item) => (
          <button
            key={item.value}
            onClick={() => onNavigate(item.value)}
            className={`text-sm font-medium transition-colors hover:text-red-500 ${
              currentStep === item.value ? 'text-red-500' : 'text-gray-300'
            }`}
          >
            {item.label}
          </button>
        ))}
        <button
          onClick={onLogout}
          className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20"
        >
          Logout
        </button>
      </nav>

      {/* Mobile Menu Button */}
      <button
        className="md:hidden p-2 text-gray-300 hover:text-white"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
      >
        {isMenuOpen ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </button>

      {/* Mobile Navigation Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-full left-0 right-0 bg-gray-900/95 backdrop-blur-xl border-b border-white/10 p-4 md:hidden flex flex-col gap-4 shadow-2xl"
          >
            {navItems.map((item) => (
              <button
                key={item.value}
                onClick={() => handleNavClick(item.value)}
                className={`w-full text-left px-4 py-3 rounded-xl transition-colors ${
                  currentStep === item.value
                    ? 'bg-red-600/10 text-red-500 font-bold'
                    : 'text-gray-300 hover:bg-white/5'
                }`}
              >
                {item.label}
              </button>
            ))}
            <div className="h-px bg-white/10 my-2" />
            <button
              onClick={handleLogoutClick}
              className="w-full text-left px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors font-medium flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
