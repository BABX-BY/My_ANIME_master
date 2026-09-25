import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, of, delay, concatMap, shareReplay, map, catchError, Subject, retry, timer, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import type {
  JikanResponse,
  JikanCharacter,
  JikanCharacterFull,
  JikanAnime,
  JikanGenre,
  JikanAnimeCharacter
} from '../models/anime.types';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

interface QueueItem {
  execute: () => Observable<unknown>;
  resolve: (value: unknown) => void;
  reject: (error: unknown) => void;
}

@Injectable({ providedIn: 'root' })
export class AnimeApiService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.jikanBase;

  private readonly cache = new Map<string, CacheEntry<unknown>>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  private readonly requestQueue = new Subject<QueueItem>();
  private readonly RATE_DELAY = 400; // ms between requests

  constructor() {
    this.requestQueue.pipe(
      concatMap(item => {
        return item.execute().pipe(
          map(val => { item.resolve(val); return val; }),
          catchError(err => { item.reject(err); return of(null); }),
          delay(this.RATE_DELAY)
        );
      })
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

  searchCharacters(query: string, page = 1, limit = 25, orderBy: 'favorites' | 'name' = 'favorites', sortDir: 'asc' | 'desc' = 'desc'): Observable<JikanResponse<JikanCharacter[]>> {
    const q = query.trim();
    
    // Prevent 504 Gateway Timeout: Jikan API /characters endpoint fails when sorting globally without a search query.
    // Use /top/characters instead when no query is provided and sorting by popularity.
    if (!q && orderBy === 'favorites' && sortDir === 'desc') {
      return this.getTopCharacters(page, limit);
    }

    const params: Record<string, string> = {
      page: String(page),
      limit: String(limit),
      order_by: orderBy,
      sort: sortDir
    };
    if (q) params['q'] = q;

    const key = `search-char-${q}-${page}-${limit}-${orderBy}-${sortDir}`;
    return this.cachedGet<JikanResponse<JikanCharacter[]>>(
      `${this.base}/characters`,
      params,
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
      retry({
        count: 2,
        delay: (error, retryCount) => {
          if (error.status === 400 || error.status === 404) {
            return throwError(() => error);
          }
          return timer(retryCount * 1000);
        }
      }),
      map(data => {
        this.cache.set(key, { data, timestamp: Date.now() });
        return data;
      }),
      catchError(err => {
        const stale = this.cache.get(key);
        if (stale) return of(stale.data as T);
        return throwError(() => err);
      }),
      shareReplay(1)
    );
  }

  clearCache(): void {
    this.cache.clear();
  }
}
