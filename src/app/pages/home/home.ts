import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AnimeApiService } from '../../core/anime-api.service';
import { CharacterCard } from '../../components/character-card/character-card';
import { SkeletonCard } from '../../components/skeleton-card/skeleton-card';
import type { JikanCharacter, JikanAnime, JikanGenre } from '../../models/anime.types';

@Component({
  selector: 'app-home',
  templateUrl: './home.html',
  styleUrl: './home.css',
  imports: [CharacterCard, SkeletonCard]
})
export class Home implements OnInit {
  private readonly api = inject(AnimeApiService);
  private readonly router = inject(Router);

  protected readonly searchQuery = signal('');
  protected readonly popularChars = signal<JikanCharacter[]>([]);
  protected readonly popularCharsLoading = signal(true);
  protected readonly featuredAnime = signal<JikanAnime[]>([]);
  protected readonly featuredAnimeLoading = signal(true);
  protected readonly genres = signal<JikanGenre[]>([]);

  protected readonly categories = [
    { icon: '⚔️', name: 'Action', genreId: 1 },
    { icon: '🌟', name: 'Adventure', genreId: 2 },
    { icon: '💗', name: 'Romance', genreId: 22 },
    { icon: '😂', name: 'Comedy', genreId: 4 },
    { icon: '🐉', name: 'Fantasy', genreId: 10 },
    { icon: '👻', name: 'Horror', genreId: 14 },
    { icon: '🔮', name: 'Mystery', genreId: 7 },
    { icon: '🚀', name: 'Sci-Fi', genreId: 24 },
    { icon: '🏫', name: 'School', genreId: 23 },
    { icon: '🤖', name: 'Mecha', genreId: 18 },
    { icon: '👹', name: 'Supernatural', genreId: 37 },
    { icon: '⚡', name: 'Shounen', genreId: 27 },
    { icon: '🎭', name: 'Drama', genreId: 8 },
    { icon: '🏅', name: 'Sports', genreId: 30 }
  ];

  ngOnInit(): void {
    this.loadPopularCharacters();
    // Stagger requests to respect rate limit
    setTimeout(() => this.loadFeaturedAnime(), 400);
  }

  protected onSearchInput(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  protected doSearch(): void {
    const q = this.searchQuery().trim();
    if (q) {
      this.router.navigate(['/characters'], { queryParams: { q } });
    } else {
      this.router.navigate(['/characters']);
    }
  }

  protected onSearchKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.doSearch();
    }
  }

  protected goCharacters(): void {
    this.router.navigate(['/characters']);
  }

  protected goCharacter(id: number): void {
    this.router.navigate(['/characters', id]);
  }

  protected goAnime(id: number): void {
    this.router.navigate(['/anime', id]);
  }

  protected goCategory(genreId: number): void {
    this.router.navigate(['/categories', genreId]);
  }

  private loadPopularCharacters(): void {
    this.popularCharsLoading.set(true);
    this.api.getTopCharacters(1, 12)
      .pipe(finalize(() => this.popularCharsLoading.set(false)))
      .subscribe({
        next: res => this.popularChars.set(res.data ?? []),
        error: () => this.popularChars.set([])
      });
  }

  private loadFeaturedAnime(): void {
    this.featuredAnimeLoading.set(true);
    this.api.getTopAnime(1, 8)
      .pipe(finalize(() => this.featuredAnimeLoading.set(false)))
      .subscribe({
        next: res => this.featuredAnime.set(res.data ?? []),
        error: () => this.featuredAnime.set([])
      });
  }

  protected getFirstAnimeTitle(char: JikanCharacter): string | null {
    return null; // Top characters endpoint doesn't include anime info
  }

  protected getAnimeScore(anime: JikanAnime): string {
    return anime.score ? anime.score.toFixed(1) : 'N/A';
  }
}
