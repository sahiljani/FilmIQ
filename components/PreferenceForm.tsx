import React, { useState } from 'react';
import { Preferences, ContentType } from '../types';

interface Props {
  onSubmit: (prefs: Preferences) => void;
  isLoading: boolean;
}

const PreferenceForm: React.FC<Props> = ({ onSubmit, isLoading }) => {
  const [formData, setFormData] = useState<Preferences>({
    genre: 'Comedy',
    language: 'Hindi',
    yearStart: 2020,
    yearEnd: new Date().getFullYear(),
    contentType: ContentType.BOTH,
    keywords: 'Must watch, hidden gems'
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'yearStart' || name === 'yearEnd' ? parseInt(value) : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-surface border border-white/10 p-8 rounded-3xl shadow-2xl relative overflow-hidden">
      {/* Decorative gradient blob */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/20 rounded-full blur-3xl pointer-events-none"></div>
      
      <h2 className="text-3xl font-heading font-black text-white mb-2 relative z-10">
        Start Your Discovery
      </h2>
      <p className="text-gray-400 text-sm mb-8 relative z-10">Tell us what you're in the mood for.</p>

      <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-widest text-gray-500">Language</label>
            <input
              type="text"
              name="language"
              value={formData.language}
              onChange={handleChange}
              placeholder="e.g. Hindi, Korean, English"
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition placeholder-gray-600"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-widest text-gray-500">Genre</label>
            <input
              type="text"
              name="genre"
              list="genre-options"
              value={formData.genre}
              onChange={handleChange}
              placeholder="e.g. Comedy, Thriller, Sci-Fi"
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition placeholder-gray-600"
              required
            />
            <datalist id="genre-options">
              <option value="Action" />
              <option value="Adventure" />
              <option value="Animation" />
              <option value="Comedy" />
              <option value="Crime" />
              <option value="Documentary" />
              <option value="Drama" />
              <option value="Family" />
              <option value="Fantasy" />
              <option value="History" />
              <option value="Horror" />
              <option value="Music" />
              <option value="Mystery" />
              <option value="Romance" />
              <option value="Sci-Fi" />
              <option value="Thriller" />
              <option value="War" />
              <option value="Western" />
            </datalist>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-widest text-gray-500">Start Year</label>
            <input
              type="number"
              name="yearStart"
              value={formData.yearStart}
              onChange={handleChange}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:ring-2 focus:ring-primary outline-none transition"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-widest text-gray-500">End Year</label>
            <input
              type="number"
              name="yearEnd"
              value={formData.yearEnd}
              onChange={handleChange}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:ring-2 focus:ring-primary outline-none transition"
            />
          </div>
          <div className="space-y-2">
             <label className="block text-xs font-bold uppercase tracking-widest text-gray-500">Type</label>
             <div className="relative">
                 <select
                    name="contentType"
                    value={formData.contentType}
                    onChange={handleChange}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:ring-2 focus:ring-primary outline-none transition appearance-none"
                 >
                   <option value={ContentType.MOVIE}>Movies Only</option>
                   <option value={ContentType.SERIES}>Series Only</option>
                   <option value={ContentType.BOTH}>Both</option>
                 </select>
                 <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                 </div>
             </div>
          </div>
        </div>

        <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-widest text-gray-500">Vibes / Keywords</label>
            <input
              type="text"
              name="keywords"
              value={formData.keywords}
              onChange={handleChange}
              placeholder="e.g. Time travel, dark humor, plot twists"
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition placeholder-gray-600"
            />
        </div>

        <div className="pt-6">
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transform transition-all active:scale-[0.98] ${
              isLoading 
                ? 'bg-gray-800 cursor-not-allowed text-gray-500' 
                : 'bg-primary hover:bg-rose-600 text-white shadow-primary/25 hover:shadow-primary/40'
            }`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Curating...
              </span>
            ) : (
              'Start Chain'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PreferenceForm;
