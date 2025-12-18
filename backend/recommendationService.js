
const axios = require('axios');
const { generateRecommendations } = require('./gemini');
const { Op } = require('sequelize');

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_TOKEN = process.env.TMDB_ACCESS_TOKEN;

const tmdbClient = axios.create({
  baseURL: TMDB_BASE_URL,
  headers: {
    Authorization: `Bearer ${TMDB_TOKEN}`,
    accept: 'application/json'
  }
});

async function searchMovie(query, year) {
  try {
    const params = { query };
    if (year) params.year = year;
    const res = await tmdbClient.get('/search/movie', { params });
    return res.data.results && res.data.results[0];
  } catch (error) {
    console.error('TMDB Search Error:', error.message);
    return null;
  }
}

async function getMovieDetails(tmdbId, MovieCache) {
  if (!tmdbId) return null;
  
  // Check Cache
  if (MovieCache) {
    try {
      const cache = await MovieCache.findOne({ 
        where: { tmdbId, expiresAt: { [Op.gt]: new Date() } } 
      });
      if (cache) return cache.data;
    } catch (e) {
      console.error('Cache read error:', e.message);
    }
  }

  try {
    const res = await tmdbClient.get(`/movie/${tmdbId}`);
    const data = res.data;

    // Fetch Providers
    try {
      const providerRes = await tmdbClient.get(`/movie/${tmdbId}/watch/providers`);
      if (providerRes.data && providerRes.data.results && providerRes.data.results.US) {
        data.providers = providerRes.data.results.US.flatrate || [];
      } else {
        data.providers = [];
      }
    } catch (e) {
      console.warn('Failed to fetch providers for', tmdbId);
      data.providers = [];
    }
    
    // Save to Cache
    if (MovieCache) {
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      try {
        const [cache, created] = await MovieCache.findOrCreate({
            where: { tmdbId },
            defaults: { tmdbId, title: data.title, data, expiresAt }
        });
        if (!created) await cache.update({ data, expiresAt });
      } catch (e) {
        console.error('Cache write error:', e.message);
      }
    }
    
    return data;
  } catch (error) {
    console.error('TMDB Details Error:', error.message);
    return null;
  }
}

async function getPendingRecommendations(userId, campaignId, SuggestedMovie, MovieCache) {
    try {
        const whereClause = { userId, status: 'pending' };
        if (campaignId) {
            whereClause.campaignId = campaignId;
        }

        const pending = await SuggestedMovie.findAll({
            where: whereClause,
            limit: 10,
            order: [['suggestedAt', 'ASC']]
        });

        if (!pending || pending.length === 0) return [];

        const enriched = await Promise.all(pending.map(async (p) => {
            let details = null;
            if (p.tmdbId) {
                details = await getMovieDetails(p.tmdbId, MovieCache);
            }
            
            const geminiData = p.data || {};
            
            return {
                id: p.id, // Use DB ID as key
                title: p.movieTitle,
                tmdb_id: p.tmdbId,
                poster_path: details?.poster_path,
                vote_average: details?.vote_average,
                overview: details?.overview || geminiData.plot || "No overview available.",
                reason: geminiData.reason,
                matchScore: geminiData.matchScore,
                year: geminiData.year,
                type: geminiData.type,
                providers: details?.providers
            };
        }));
        
        return enriched;
    } catch (err) {
        console.error("Error fetching pending recommendations:", err);
        return [];
    }
}

async function generateAndSave(userId, campaignId, prefs, history, SuggestedMovie, MostLiked, MovieCache, apiKey, modelName) {
    console.log('[RecommendationService] generateAndSave called with prefs:', prefs);
    // Get context
    const whereClause = { userId };
    if (campaignId) {
        whereClause.campaignId = campaignId;
    }

    // We might want to avoid repeating movies from ANY campaign, or just this one?
    // "1 campaign mean 1 type of things... today comedy... other day horror"
    // If I saw a comedy in "Comedy Campaign", should I see it in "Horror Campaign"? Maybe if it fits.
    // But usually "Never Repeat" is global.
    // Let's keep exclusion global for now (userId).
    
    const allSuggested = await SuggestedMovie.findAll({
        where: { userId },
        attributes: ['movieTitle']
    });
    const alreadySuggested = allSuggested.map(s => s.movieTitle);
    console.log('[RecommendationService] Already suggested movies:', alreadySuggested.length);
    
    const mostLikedData = await MostLiked.findAll({
        where: { userId },
        attributes: ['movieTitle']
    });

    // Generate
    console.log('[RecommendationService] Calling generateRecommendations...');
    const rawRecommendations = await generateRecommendations(prefs, history, alreadySuggested, mostLikedData, apiKey, modelName);
    console.log('[RecommendationService] Raw recommendations received:', rawRecommendations?.length || 0);
    
    if (!rawRecommendations || rawRecommendations.length === 0) {
        console.log('[RecommendationService] No recommendations generated, returning empty array');
        return [];
    }

    // Enrich and Save
    const saved = [];
    
    for (const item of rawRecommendations) {
        // TMDB Lookup
        let tmdbId = null;
        let details = null;
        
        const year = parseInt(item.year.toString().substring(0, 4));
        const searchResult = await searchMovie(item.title, isNaN(year) ? undefined : year);
        
        if (searchResult) {
            tmdbId = searchResult.id;
            details = await getMovieDetails(tmdbId, MovieCache);
        }
        
      // Save to DB (avoid duplicates per user globally)
        try {
        const existing = await SuggestedMovie.findOne({ where: { userId, movieTitle: item.title } });
        if (existing) {
          // Skip duplicates
          continue;
        }
        const suggestion = await SuggestedMovie.create({
          userId,
          campaignId, // Save campaignId
          movieTitle: item.title,
          tmdbId,
          status: 'pending',
          data: item, // Store full Gemini object
          suggestedAt: new Date()
        });
            
            saved.push({
                id: suggestion.id,
                title: item.title,
                tmdb_id: tmdbId,
                poster_path: details?.poster_path,
                vote_average: details?.vote_average,
                overview: details?.overview || item.plot,
                reason: item.reason,
                matchScore: item.matchScore,
                year: item.year,
                type: item.type,
                providers: details?.providers
            });
        } catch (e) {
            console.error("Error saving suggestion:", e.message);
        }
    }
    
    return saved;
}

module.exports = { getPendingRecommendations, generateAndSave, getMovieDetails };
