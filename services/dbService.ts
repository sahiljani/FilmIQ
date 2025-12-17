
import { Interaction, Preferences } from '../types';

const API_BASE = '/api';

const getHeaders = () => {
  const token = localStorage.getItem('cinewise_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

export const dbService = {
  // --- Auth Methods ---
  login: async (credentials: any) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Login failed');
    }
    return res.json();
  },

  signup: async (userData: any) => {
    const res = await fetch(`${API_BASE}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Signup failed');
    }
    return res.json();
  },

  forgotPassword: async (email: string) => {
    const res = await fetch(`${API_BASE}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    return res.json();
  },

  resetPassword: async (data: any) => {
    const res = await fetch(`${API_BASE}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Reset failed');
    }
    return res.json();
  },

  // --- Data Methods ---
  initSession: async (): Promise<{ history: Interaction[], preferences: Preferences | null }> => {
    try {
      const response = await fetch(`${API_BASE}/data`, { headers: getHeaders() });
      const text = await response.text();
      if (!response.ok) throw new Error('Auth session invalid');
      return JSON.parse(text);
    } catch (error: any) {
      console.error('Session init failed:', error);
      throw error;
    }
  },

  saveHistory: async (interaction: Interaction) => {
    try {
      await fetch(`${API_BASE}/interactions`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(interaction)
      });
    } catch (e) {
      console.error('History save error:', e);
    }
  },

  savePreferences: async (prefs: Preferences) => {
    try {
      await fetch(`${API_BASE}/preferences`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(prefs)
      });
    } catch (e) {
      console.error('Preferences save error:', e);
    }
  },

  // Fix: Added missing syncToRemote method used in DatabasePanel.tsx
  syncToRemote: async (history: Interaction[], prefs: Preferences | null): Promise<{ success: boolean }> => {
    try {
      if (prefs) {
        await dbService.savePreferences(prefs);
      }
      // Note: Interactions are saved individually via saveHistory in App.tsx. 
      // This sync acts as a fallback/manual trigger for preferences.
      return { success: true };
    } catch (e) {
      console.error('Manual sync failed:', e);
      return { success: false };
    }
  }
};
