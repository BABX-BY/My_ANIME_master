export interface JikanPagination {
  last_visible_page: number;
  has_next_page: boolean;
  current_page: number;
  items: {
    count: number;
    total: number;
    per_page: number;
  };
}

export interface JikanResponse<T> {
  data: T;
  pagination?: JikanPagination;
}

export interface JikanImage {
  image_url: string;
  small_image_url?: string;
  large_image_url?: string;
}

export interface JikanImages {
  jpg: JikanImage;
  webp?: JikanImage;
}

export interface JikanCharacter {
  mal_id: number;
  url: string;
  images: JikanImages;
  name: string;
  name_kanji: string | null;
  nicknames: string[];
  favorites: number;
  about: string | null;
}

export interface JikanVoiceActor {
  person: {
    mal_id: number;
    url: string;
    images: { jpg: { image_url: string } };
    name: string;
  };
  language: string;
}

export interface JikanAnimeEntry {
  role: string;
  anime: {
    mal_id: number;
    url: string;
    images: JikanImages;
    title: string;
  };
}

export interface JikanCharacterFull extends JikanCharacter {
  anime: JikanAnimeEntry[];
  manga: { role: string; manga: { mal_id: number; title: string; images: JikanImages } }[];
  voices: JikanVoiceActor[];
}

export interface JikanAnime {
  mal_id: number;
  url: string;
  images: JikanImages;
  trailer?: { youtube_id: string; url: string; embed_url: string };
  title: string;
  title_english: string | null;
  title_japanese: string | null;
  title_synonyms: string[];
  type: string | null;
  source: string | null;
  episodes: number | null;
  status: string | null;
  airing: boolean;
  duration: string | null;
  rating: string | null;
  score: number | null;
  scored_by: number | null;
  rank: number | null;
  popularity: number | null;
  members: number | null;
  favorites: number | null;
  synopsis: string | null;
  year: number | null;
  genres: JikanGenre[];
  themes: JikanGenre[];
  demographics: JikanGenre[];
}

export interface JikanGenre {
  mal_id: number;
  type: string;
  name: string;
  url: string;
  count?: number;
}

export interface JikanAnimeCharacter {
  character: JikanCharacter;
  role: string;
  favorites: number;
  voice_actors: JikanVoiceActor[];
}

export interface AnimeCharacterDisplay {
  mal_id: number;
  name: string;
  name_kanji: string | null;
  image_url: string;
  favorites: number;
  about: string | null;
  anime_title: string | null;
  anime_id: number | null;
  nicknames: string[];
}
