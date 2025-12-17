import React, { useState } from 'react';
import { Interaction, InteractionType, Preferences } from '../types';
import { dbService } from '../services/dbService';

interface Props {
  history: Interaction[];
  prefs: Preferences | null;
}

const DatabasePanel: React.FC<Props> = ({ history, prefs }) => {
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  const handleDownload = () => {
    const data = {
      timestamp: new Date().toISOString(),
      preferences: prefs,
      history: history
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cinewise_data_${new Date().getTime()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSync = async () => {
    setSyncing(true);
    setSyncStatus(null);
    try {
      const result = await dbService.syncToRemote(history, prefs);
      setSyncStatus(result.success ? 'success' : 'error');
      setTimeout(() => setSyncStatus(null), 3000);
    } catch (e) {
      setSyncStatus('error');
    } finally {
      setSyncing(false);
    }
  };

  const getIcon = (type: InteractionType) => {
      switch(type) {
          case InteractionType.LIKED: return '💚';
          case InteractionType.DISLIKED: return '❌';
          case InteractionType.WATCHED_LIKED: return '⭐';
          case InteractionType.WATCHED_DISLIKED: return '👎';
      }
  };

  return (
    <div className="h-full flex flex-col bg-black/40 backdrop-blur-md border-l border-white/5 w-80">
      <div className="p-4 border-b border-white/10">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"></path></svg>
            Session DB
        </h3>
        <p className="text-xs text-gray-500 mt-1">
          {history.length} records saved locally
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {history.length === 0 ? (
          <div className="text-center mt-10 text-gray-600 text-sm">
            No interactions yet.<br/>Rate suggestions to build your database.
          </div>
        ) : (
          history.slice().reverse().map((item, idx) => (
            <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-gray-800/50 border border-white/5">
              <span className="text-xl" role="img" aria-label={item.interaction}>{getIcon(item.interaction)}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-200 truncate">{item.movieTitle}</p>
                <p className="text-xs text-gray-500">{new Date(item.timestamp).toLocaleTimeString()}</p>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-4 border-t border-white/10 space-y-2">
        <button 
          onClick={handleSync}
          disabled={history.length === 0 || syncing}
          className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg transition border font-mono text-sm ${
            syncStatus === 'success' 
              ? 'bg-green-900/20 border-green-500 text-green-400' 
              : syncStatus === 'error'
              ? 'bg-red-900/20 border-red-500 text-red-400'
              : 'bg-red-600/10 hover:bg-red-600/20 border-red-900/50 text-red-500 hover:text-red-400'
          }`}
        >
          {syncing ? (
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
          )}
          {syncStatus === 'success' ? 'Synced to Cloud' : syncStatus === 'error' ? 'Sync Failed' : syncing ? 'Syncing...' : 'Sync to Remote DB'}
        </button>

        <button 
          onClick={handleDownload}
          disabled={history.length === 0}
          className="w-full flex items-center justify-center gap-2 py-3 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition border border-gray-600 font-mono text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
          Download JSON
        </button>
      </div>
    </div>
  );
};

export default DatabasePanel;