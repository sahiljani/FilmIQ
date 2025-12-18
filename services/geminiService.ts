
import { Preferences, Interaction, MovieRecommendation } from "../types";

export const generateRecommendations = async (
  prefs: Preferences,
  history: Interaction[] = []
): Promise<MovieRecommendation[]> => {
  const token = localStorage.getItem('cinewise_token');
  
  try {
    // 1. Try to fetch pending recommendations from server
    const query = prefs.campaignId ? `?campaignId=${prefs.campaignId}` : '';
    console.log('[GeminiService] Fetching pending recommendations for campaign:', prefs.campaignId);
    
    const getRes = await fetch(`/api/recommendations${query}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (getRes.ok) {
        const data = await getRes.json();
        console.log('[GeminiService] Pending recommendations:', data.recommendations?.length || 0);
        // If we have pending recommendations, return them
        if (data.recommendations && data.recommendations.length > 0) {
            return data.recommendations;
        }
    } else {
        console.log('[GeminiService] GET recommendations failed:', getRes.status);
    }
    
    // 2. If no pending, force generation on server
    console.log('[GeminiService] Generating new recommendations with preferences:', prefs);
    const postRes = await fetch('/api/recommendations/generate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
            preferences: prefs, 
            history,
            campaignId: prefs.campaignId
        })
    });
    
    if (postRes.ok) {
        const data = await postRes.json();
        console.log('[GeminiService] Generated recommendations:', data.recommendations?.length || 0);
        return data.recommendations || [];
    } else {
        const errorText = await postRes.text();
        console.error('[GeminiService] POST recommendations failed:', postRes.status, errorText);
    }
    
  } catch (e) {
      console.error("Error in generateRecommendations service:", e);
      return [];
  }
  
  return [];
};
