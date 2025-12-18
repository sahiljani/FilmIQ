
const { GoogleGenAI, Type } = require("@google/genai");

// Schema for the response
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

const generateRecommendations = async (prefs, history, alreadySuggested, mostLiked, apiKey, modelName) => {
  console.log('[Gemini] generateRecommendations called with prefs:', prefs);
  const finalApiKey = apiKey || process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!finalApiKey) {
    console.error("GEMINI_API_KEY is missing");
    return [];
  }

  const ai = new GoogleGenAI({ apiKey: finalApiKey });
  
  // Use passed model or default
  const finalModelName = modelName || "gemini-2.5-flash"; 
  console.log('[Gemini] Using model:', finalModelName);

  const likedMovies = history
    .filter(h => h.interaction === 'liked' || h.interaction === 'watched_liked')
    .map(h => h.movieTitle)
    .join(", ");

  const dislikedMovies = history
    .filter(h => h.interaction === 'disliked' || h.interaction === 'watched_disliked')
    .map(h => h.movieTitle)
    .join(", ");

  const previousSuggestions = [...new Set([...history.map(h => h.movieTitle), ...alreadySuggested])].join(", ");
  const mostLikedStr = mostLiked.map(m => m.movieTitle).join(", ");

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
    console.log('[Gemini] Calling generateContent...');
    const response = await ai.models.generateContent({
      model: finalModelName,
      contents: promptContext,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.8,
      },
    });

    console.log('[Gemini] Got response from Gemini API');
    
    const text = response.text;
    console.log('[Gemini] Response text length:', text?.length || 0);
    
    if (!text) {
      console.log('[Gemini] No text in response');
      return [];
    }

    const data = JSON.parse(text);
    console.log('[Gemini] Parsed data, count:', data?.length || 0);
    return data;

  } catch (error) {
    console.error("Gemini API Error:", error);
    // Propagate error so the queue can retry on 429s
    throw error;
  }
};

module.exports = { generateRecommendations };
