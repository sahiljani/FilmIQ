import React, { useState, useEffect } from 'react';

const Settings: React.FC = () => {
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('gemini-2.5-flash');
  const [status, setStatus] = useState('');

  useEffect(() => {
    // Fetch settings
    const fetchSettings = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      try {
        const res = await fetch('http://localhost:3000/api/settings', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
            const data = await res.json();
            if (data.geminiApiKey) setApiKey(data.geminiApiKey);
            if (data.geminiModel) setModel(data.geminiModel);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch('http://localhost:3000/api/settings', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ geminiApiKey: apiKey, geminiModel: model })
      });
      if (res.ok) {
        setStatus('Settings saved successfully!');
        setTimeout(() => setStatus(''), 3000);
      } else {
        setStatus('Failed to save settings.');
      }
    } catch (e) {
      setStatus('Error saving settings.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 mt-20">
      <h1 className="text-3xl font-heading font-black text-white mb-6">AI Settings</h1>
      <form onSubmit={handleSave} className="bg-surface p-6 rounded-2xl border border-white/10 space-y-6 shadow-2xl">
        <div>
          <label className="block text-gray-400 text-sm font-bold mb-2">Gemini API Key</label>
          <input 
            type="text" 
            value={apiKey} 
            onChange={(e) => setApiKey(e.target.value)} 
            placeholder="Paste your Gemini API Key here"
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary focus:outline-none transition font-mono text-sm"
          />
          <p className="text-xs text-gray-500 mt-2">
            Leave blank to use system default. Key is stored in your secure profile.
          </p>
        </div>
        
        <div>
          <label className="block text-gray-400 text-sm font-bold mb-2">Model</label>
          <select 
            value={model} 
            onChange={(e) => setModel(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary focus:outline-none transition appearance-none"
          >
            <option value="gemini-2.5-flash">Gemini 2.5 Flash (Recommended)</option>
            <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
            <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
            <option value="gemini-pro">Gemini Pro</option>
          </select>
        </div>
        
        <button 
          type="submit" 
          className="w-full py-4 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl transition shadow-lg hover:shadow-primary/25"
        >
          Save Configuration
        </button>
        
        {status && (
          <div className={`text-center font-bold ${status.includes('Failed') || status.includes('Error') ? 'text-red-500' : 'text-green-500'}`}>
            {status}
          </div>
        )}
      </form>
    </div>
  );
};

export default Settings;
