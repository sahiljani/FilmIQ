import axios from 'axios';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TOKEN = process.env.TMDB_ACCESS_TOKEN;

const tmdbClient = axios.create({
  baseURL: TMDB_BASE_URL,
  headers: {
    Authorization: `Bearer ${TOKEN}`,
    accept: 'application/json'
  }
});

export const searchMovie = async (query: string, year?: number) => {
  try {
    const params: any = { query };
    if (year) params.year = year;
    const res = await tmdbClient.get('/search/movie', { params });
    return res.data.results[0];
  } catch (error) {
    console.error('TMDB Search Error:', error);
    return null;
  }
};

export const getMovieDetails = async (tmdbId: number) => {
  try {
    // Check Cache
    const cacheRes = await axios.get(`/api/tmdb/cache/${tmdbId}`);
    return cacheRes.data;
  } catch (e) {
    // Cache miss or error, fetch from TMDB
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
      } catch (pErr) {
        console.warn('Failed to fetch providers', pErr);
        data.providers = [];
      }
      
      // Save to Cache (fire and forget)
      axios.post('/api/tmdb/cache', {
        tmdbId,
        title: data.title,
        data: data
      });
      
      return data;
    } catch (tmdbError) {
        console.error('TMDB Details Error:', tmdbError);
        return null;
    }
  }
};
