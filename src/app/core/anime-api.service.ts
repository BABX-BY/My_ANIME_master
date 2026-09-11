import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, of, delay, concatMap, shareReplay, map, catchError, Subject, from, mergeMap } from 'rxjs';
import { environment } from '../../environments/environment';
import type {
  JikanResponse,
  JikanCharacter,
  JikanCharacterFull,
  JikanAnime,
  JikanGenre,
  JikanAnimeCharacter,
  JikanPagination
} from '../models/anime.types';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

@Injectable({ providedIn: 'root' })
export class AnimeApiService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.jikanBase;

  private readonly cache = new Map<string, CacheEntry<unknown>>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  private readonly requestQueue = new Subject<() => Observable<unknown>>();
  private readonly RATE_DELAY = 350; // ms between requests

  constructor() {
    this.requestQueue.pipe(
      concatMap(fn => fn().pipe(delay(this.RATE_DELAY)))
    ).subscribe();
  }

  // ─── Characters ──────────────────────────────────────────

  getTopCharacters(page = 1, limit = 25): Observable<JikanResponse<JikanCharacter[]>> {
    const key = `top-characters-${page}-${limit}`;
    return this.cachedGet<JikanResponse<JikanCharacter[]>>(
      `${this.base}/top/characters`,
      { page: String(page), limit: String(limit) },
      key
    );
  }

  searchCharacters(query: string, page = 1, limit = 25): Observable<JikanResponse<JikanCharacter[]>> {
    const q = query.trim();
    if (!q) return this.getTopCharacters(page, limit);
    const key = `search-char-${q}-${page}-${limit}`;
    return this.cachedGet<JikanResponse<JikanCharacter[]>>(
      `${this.base}/characters`,
      { q, page: String(page), limit: String(limit), order_by: 'favorites', sort: 'desc' },
      key
    );
  }

  getCharacterById(id: number): Observable<JikanCharacterFull> {
    const key = `character-full-${id}`;
    return this.cachedGet<JikanResponse<JikanCharacterFull>>(
      `${this.base}/characters/${id}/full`,
      {},
      key
    ).pipe(map(res => res.data));
  }

  // ─── Anime ───────────────────────────────────────────────

  getTopAnime(page = 1, limit = 25): Observable<JikanResponse<JikanAnime[]>> {
    const key = `top-anime-${page}-${limit}`;
    return this.cachedGet<JikanResponse<JikanAnime[]>>(
      `${this.base}/top/anime`,
      { page: String(page), limit: String(limit) },
      key
    );
  }

  searchAnime(query: string, page = 1, limit = 25, genreId?: number): Observable<JikanResponse<JikanAnime[]>> {
    const params: Record<string, string> = {
      page: String(page),
      limit: String(limit),
      order_by: 'score',
      sort: 'desc'
    };
    const q = query.trim();
    if (q) params['q'] = q;
    if (genreId) params['genres'] = String(genreId);
    const key = `search-anime-${q}-${page}-${limit}-${genreId ?? ''}`;
    return this.cachedGet<JikanResponse<JikanAnime[]>>(
      `${this.base}/anime`,
      params,
      key
    );
  }

  getAnimeById(id: number): Observable<JikanAnime> {
    const key = `anime-${id}`;
    return this.cachedGet<JikanResponse<JikanAnime>>(
      `${this.base}/anime/${id}`,
      {},
      key
    ).pipe(map(res => res.data));
  }

  getAnimeCharacters(animeId: number): Observable<JikanAnimeCharacter[]> {
    const key = `anime-chars-${animeId}`;
    return this.cachedGet<JikanResponse<JikanAnimeCharacter[]>>(
      `${this.base}/anime/${animeId}/characters`,
      {},
      key
    ).pipe(map(res => res.data));
  }

  // ─── Genres ──────────────────────────────────────────────

  getAnimeGenres(): Observable<JikanGenre[]> {
    const key = 'anime-genres';
    return this.cachedGet<JikanResponse<JikanGenre[]>>(
      `${this.base}/genres/anime`,
      {},
      key
    ).pipe(map(res => res.data));
  }

  // ─── Caching Layer ──────────────────────────────────────

  private cachedGet<T>(url: string, params: Record<string, string>, key: string): Observable<T> {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return of(cached.data as T);
    }

    let httpParams = new HttpParams();
    for (const [k, v] of Object.entries(params)) {
      httpParams = httpParams.set(k, v);
    }

    return this.http.get<T>(url, { params: httpParams }).pipe(
      map(data => {
        this.cache.set(key, { data, timestamp: Date.now() });
        return data;
      }),
      catchError(err => {
        // If we have stale cache, return it on error
        const stale = this.cache.get(key);
        if (stale) return of(stale.data as T);
        throw err;
      }),
      shareReplay(1)
    );
  }

  clearCache(): void {
    this.cache.clear();
  }
}
