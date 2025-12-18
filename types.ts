
export enum ContentType {
  MOVIE = 'Movie',
  SERIES = 'Series',
  BOTH = 'Movie or Series'
}

export interface Preferences {
  language: string;
  genre: string;
  yearStart: number;
  yearEnd: number;
  contentType: ContentType;
  keywords: string;
  campaignId?: number;
}

export interface Campaign {
  id: number;
  name: string;
  createdAt: string;
  Preference?: Preferences;
}

export interface MovieRecommendation {
  id: string; // generated UUID or distinct combination
  title: string;
  year: string;
  language: string;
  type: string;
  plot: string;
  reason: string; // Why this was recommended
  matchScore: number; // 0-100
  // TMDB Data
  poster_path?: string;
  vote_average?: number;
  tmdb_id?: number;
  overview?: string;
}

export enum InteractionType {
  LIKED = 'LIKED', // "Add to Watchlist" / "Love it"
  DISLIKED = 'DISLIKED', // "Not for me"
  WATCHED_LIKED = 'WATCHED_LIKED', // "Already saw it and liked it"
  WATCHED_DISLIKED = 'WATCHED_DISLIKED' // "Already saw it and didn't like it"
}

export interface Interaction {
  movieTitle: string;
  interaction: InteractionType;
  timestamp: number;
}

export interface MostLikedMovie {
  movieTitle: string;
  tmdbId?: number;
  likeCount: number;
  likedAt?: string;
}

export interface AppState {
  preferences: Preferences | null;
  recommendations: MovieRecommendation[];
  history: Interaction[];
  mostLiked: MostLikedMovie[];
  campaigns: Campaign[];
  currentCampaignId: number | null;
  isLoading: boolean;
  step: 'setup' | 'results' | 'campaigns' | 'bucket';
}
