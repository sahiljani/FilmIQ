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
    <div className="w-full max-w-2xl mx-auto bg-gray-900/80 backdrop-blur-sm p-8 rounded-2xl border border-gray-800 shadow-2xl">
      <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500 mb-6">
        Start Your Discovery
      </h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-400">Language</label>
            <input
              type="text"
              name="language"
              value={formData.language}
              onChange={handleChange}
              placeholder="e.g. Hindi, Korean, English"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-400">Genre</label>
            <input
              type="text"
              name="genre"
              list="genre-options"
              value={formData.genre}
              onChange={handleChange}
              placeholder="e.g. Comedy, Thriller, Sci-Fi"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition"
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
            <label className="block text-sm font-medium text-gray-400">Start Year</label>
            <input
              type="number"
              name="yearStart"
              value={formData.yearStart}
              onChange={handleChange}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-red-500 outline-none transition"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-400">End Year</label>
            <input
              type="number"
              name="yearEnd"
              value={formData.yearEnd}
              onChange={handleChange}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-red-500 outline-none transition"
            />
          </div>
          <div className="space-y-2">
             <label className="block text-sm font-medium text-gray-400">Type</label>
             <select
                name="contentType"
                value={formData.contentType}
                onChange={handleChange}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-red-500 outline-none transition appearance-none"
             >
               <option value={ContentType.MOVIE}>Movies Only</option>
               <option value={ContentType.SERIES}>Series Only</option>
               <option value={ContentType.BOTH}>Both</option>
             </select>
          </div>
        </div>

        <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-400">Specific Vibes / Keywords (Optional)</label>
            <input
              type="text"
              name="keywords"
              value={formData.keywords}
              onChange={handleChange}
              placeholder="e.g. Time travel, dark humor, plot twists"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition"
            />
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transform transition-all hover:scale-[1.02] active:scale-[0.98] ${
              isLoading 
                ? 'bg-gray-700 cursor-not-allowed text-gray-400' 
                : 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-red-900/50'
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
