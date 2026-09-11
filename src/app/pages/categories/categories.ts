import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AnimeApiService } from '../../core/anime-api.service';
import { SkeletonCard } from '../../components/skeleton-card/skeleton-card';
import type { JikanGenre, JikanAnime } from '../../models/anime.types';

@Component({
  selector: 'app-categories',
  templateUrl: './categories.html',
  styleUrl: './categories.css',
  imports: [SkeletonCard]
})
export class Categories implements OnInit {
  private readonly api = inject(AnimeApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly genres = signal<JikanGenre[]>([]);
  protected readonly genresLoading = signal(true);
  protected readonly selectedGenre = signal<JikanGenre | null>(null);
  protected readonly filteredAnime = signal<JikanAnime[]>([]);
  protected readonly animeLoading = signal(false);
  protected readonly page = signal(1);
  protected readonly totalPages = signal(1);

  protected readonly categoryIcons: Record<string, string> = {
    'Action': '⚔️', 'Adventure': '🌟', 'Comedy': '😂', 'Drama': '🎭',
    'Fantasy': '🐉', 'Horror': '👻', 'Mystery': '🔮', 'Romance': '💗',
    'Sci-Fi': '🚀', 'Sports': '🏅', 'Supernatural': '👹',
    'Slice of Life': '☕', 'Suspense': '🔪', 'Ecchi': '💋',
    'Award Winning': '🏆', 'Gourmet': '🍜', 'Boys Love': '💙', 'Girls Love': '💜',
    'Avant Garde': '🎨'
  };

  ngOnInit(): void {
    this.loadGenres();
    this.route.params.subscribe(params => {
      const genreId = Number(params['genreId']);
      if (genreId) {
        this.loadAnimeByGenre(genreId);
      }
    });
  }

  private loadGenres(): void {
    this.genresLoading.set(true);
    this.api.getAnimeGenres()
      .pipe(finalize(() => this.genresLoading.set(false)))
      .subscribe({
        next: data => this.genres.set(data.filter(g => (g.count ?? 0) > 100)),
        error: () => this.genres.set([])
      });
  }

  protected selectGenre(genre: JikanGenre): void {
    this.selectedGenre.set(genre);
    this.page.set(1);
    this.router.navigate(['/categories', genre.mal_id], { replaceUrl: true });
    this.loadAnimeByGenre(genre.mal_id);
  }

  private loadAnimeByGenre(genreId: number): void {
    this.animeLoading.set(true);
    // Also set selected genre from genres list if available
    const found = this.genres().find(g => g.mal_id === genreId);
    if (found) this.selectedGenre.set(found);

    this.api.searchAnime('', this.page(), 24, genreId)
      .pipe(finalize(() => this.animeLoading.set(false)))
      .subscribe({
        next: res => {
          this.filteredAnime.set(res.data ?? []);
          this.totalPages.set(res.pagination?.last_visible_page ?? 1);
        },
        error: () => this.filteredAnime.set([])
      });
  }

  protected clearSelection(): void {
    this.selectedGenre.set(null);
    this.filteredAnime.set([]);
    this.router.navigate(['/categories'], { replaceUrl: true });
  }

  protected goAnime(id: number): void {
    this.router.navigate(['/anime', id]);
  }

  protected goPage(p: number): void {
    if (p < 1 || p > this.totalPages()) return;
    this.page.set(p);
    const g = this.selectedGenre();
    if (g) this.loadAnimeByGenre(g.mal_id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  protected getIcon(name: string): string {
    return this.categoryIcons[name] ?? '🏷️';
  }

  protected getScore(a: JikanAnime): string {
    return a.score ? a.score.toFixed(1) : 'N/A';
  }

  protected get pageNumbers(): number[] {
    const c = this.page(), t = this.totalPages(), pages: number[] = [];
    for (let i = Math.max(1, c - 2); i <= Math.min(t, c + 2); i++) pages.push(i);
    return pages;
  }
}
