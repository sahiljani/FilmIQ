
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { Preferences, Interaction, MovieRecommendation, InteractionType } from "../types";
import { searchMovie, getMovieDetails } from "./tmdbService";

const responseSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING, description: "Title of the movie or series" },
      year: { type: Type.STRING, description: "Release year or years (e.g. 2020-2022)" },
      language: { type: Type.STRING, description: "Primary language" },
      type: { type: Type.STRING, description: "Movie or Series" },
      plot: { type: Type.STRING, description: "Short engaging plot summary (max 2 sentences)" },
      reason: { type: Type.STRING, description: "Specific reason why this fits the user's request" },
      matchScore: { type: Type.INTEGER, description: "Relevance score from 0 to 100 based on prompt" },
    },
    required: ["title", "year", "language", "type", "plot", "reason", "matchScore"],
  },
};

export const generateRecommendations = async (
  prefs: Preferences,
  history: Interaction[] = []
): Promise<MovieRecommendation[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const modelName = "gemini-3-flash-preview";

  // Fetch already suggested movies from database
  const token = localStorage.getItem('cinewise_token');
  let alreadySuggested: string[] = [];
  let mostLikedMovies: string[] = [];
  
  try {
    const [suggestedRes, mostLikedRes] = await Promise.all([
      fetch('/api/suggested-movies', {
        headers: { 'Authorization': `Bearer ${token}` }
      }),
      fetch('/api/most-liked', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
    ]);
    
    if (suggestedRes.ok) {
      const data = await suggestedRes.json();
      alreadySuggested = data.suggestedMovies || [];
    }
    
    if (mostLikedRes.ok) {
      const data = await mostLikedRes.json();
      mostLikedMovies = data.mostLiked?.map((m: any) => m.movieTitle) || [];
    }
  } catch (e) {
    console.log('Could not fetch suggested/liked movies:', e);
  }

  const likedMovies = history
    .filter(h => h.interaction === InteractionType.LIKED || h.interaction === InteractionType.WATCHED_LIKED)
    .map(h => h.movieTitle)
    .join(", ");

  const dislikedMovies = history
    .filter(h => h.interaction === InteractionType.DISLIKED || h.interaction === InteractionType.WATCHED_DISLIKED)
    .map(h => h.movieTitle)
    .join(", ");

  const previousSuggestions = [...new Set([...history.map(h => h.movieTitle), ...alreadySuggested])].join(", ");
  const mostLikedStr = mostLikedMovies.join(", ");

  let promptContext = `
    ACT AS A WORLD-CLASS FILM CRITIC.
    
    USER REQUEST:
    - Genre: ${prefs.genre}
    - Language: ${prefs.language}
    - Format: ${prefs.contentType}
    - RELEASE PERIOD: MUST BE BETWEEN ${prefs.yearStart} AND ${prefs.yearEnd}. (Strictly ignore anything older than ${prefs.yearStart}).
    - Vibe/Keywords: ${prefs.keywords || "None"}
    
    CRITICAL QUALITY CONTROL:
    - Only recommend "MUST WATCH" content (IMDb 7.0+ or critically acclaimed).
    - Prioritize hidden gems if keywords suggest so.
    - If ${prefs.language} is Hindi and Genre is Comedy, look for modern sharp writing (e.g., Gullak, Panchayat style).
  `;

  if (mostLikedStr) {
    promptContext += `
      MOST LOVED BY USER (Give Heavy Priority):
      [${mostLikedStr}]
      - Find movies with similar themes, directors, actors, or storytelling style
      - Match the emotional tone and genre characteristics
    `;
  }

  if (history.length > 0) {
    promptContext += `
      PERSONALIZATION ENGINE:
      - Liked: [${likedMovies}]
      - Disliked: [${dislikedMovies}]
      - NEVER REPEAT: [${previousSuggestions}]
    `;
  }

  promptContext += `
    Output 9 recommendations in the specified JSON schema.
  `;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: modelName,
      contents: promptContext,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.8,
      },
    });

    const text = response.text;
    if (!text) return [];

    const data = JSON.parse(text);
    
    const enrichedData = await Promise.all(data.map(async (item: any) => {
      let tmdbData = null;
      // Try to find by title and year (parse year if range)
      const year = parseInt(item.year.toString().substring(0, 4));
      const searchResult = await searchMovie(item.title, isNaN(year) ? undefined : year);
      
      if (searchResult) {
        tmdbData = await getMovieDetails(searchResult.id);
      }
      
      return {
        ...item,
        id: crypto.randomUUID(),
        poster_path: tmdbData?.poster_path,
        vote_average: tmdbData?.vote_average,
        tmdb_id: tmdbData?.id,
        overview: tmdbData?.overview || item.plot // Fallback to Gemini plot
      };
    }));

    // Save suggested movies to database
    try {
      await fetch('/api/suggested-movies/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          movies: enrichedData.map(m => ({ movieTitle: m.title, tmdbId: m.tmdb_id }))
        })
      });
    } catch (e) {
      console.log('Could not save suggested movies:', e);
    }

    return enrichedData;

  } catch (error) {
    console.error("Gemini API Error:", error);
    return [];
  }
};
