import { Injectable, signal, computed, effect } from '@angular/core';

export interface FavoriteCharacter {
  mal_id: number;
  name: string;
  name_kanji: string | null;
  image_url: string;
  favorites: number;
  anime_title: string | null;
  anime_id: number | null;
}

const STORAGE_KEY = 'anime_favorites';

@Injectable({ providedIn: 'root' })
export class FavoritesService {
  private readonly _favorites = signal<FavoriteCharacter[]>(this.loadFromStorage());

  readonly favorites = this._favorites.asReadonly();
  readonly count = computed(() => this._favorites().length);

  constructor() {
    // Auto-save to localStorage whenever favorites change
    effect(() => {
      const data = this._favorites();
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch {
        // Storage full or unavailable — ignore
      }
    });
  }

  isFavorite(malId: number): boolean {
    return this._favorites().some(f => f.mal_id === malId);
  }

  toggle(character: FavoriteCharacter): void {
    if (this.isFavorite(character.mal_id)) {
      this.remove(character.mal_id);
    } else {
      this.add(character);
    }
  }

  add(character: FavoriteCharacter): void {
    if (this.isFavorite(character.mal_id)) return;
    this._favorites.update(arr => [...arr, character]);
  }

  remove(malId: number): void {
    this._favorites.update(arr => arr.filter(f => f.mal_id !== malId));
  }

  clearAll(): void {
    this._favorites.set([]);
  }

  private loadFromStorage(): FavoriteCharacter[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
}
