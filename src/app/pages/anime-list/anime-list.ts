import { Component, OnInit, inject, signal, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription, finalize, Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { AnimeApiService } from '../../core/anime-api.service';
import { SkeletonCard } from '../../components/skeleton-card/skeleton-card';
import type { JikanAnime } from '../../models/anime.types';

@Component({
  selector: 'app-anime-list',
  templateUrl: './anime-list.html',
  styleUrl: './anime-list.css',
  imports: [SkeletonCard]
})
export class AnimeList implements OnInit, OnDestroy {
  private readonly api = inject(AnimeApiService);
  private readonly router = inject(Router);

  protected readonly animeList = signal<JikanAnime[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly page = signal(1);
  protected readonly totalPages = signal(1);
  protected readonly searchQuery = signal('');

  private readonly searchSubject = new Subject<string>();
  private sub?: Subscription;
  private searchSub?: Subscription;

  ngOnInit(): void {
    this.searchSub = this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe(query => {
      this.searchQuery.set(query);
      this.page.set(1);
      this.loadAnime();
    });

    this.loadAnime();
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.searchSub?.unsubscribe();
  }

  protected onSearchInput(event: Event): void {
    this.searchSubject.next((event.target as HTMLInputElement).value);
  }

  protected loadAnime(): void {
    this.sub?.unsubscribe();
    this.loading.set(true);
    this.error.set(null);

    const query = this.searchQuery().trim();
    const obs = query
      ? this.api.searchAnime(query, this.page(), 24)
      : this.api.getTopAnime(this.page(), 24);

    this.sub = obs.pipe(finalize(() => this.loading.set(false))).subscribe({
      next: res => {
        this.animeList.set(res.data ?? []);
        this.totalPages.set(res.pagination?.last_visible_page ?? 1);
      },
      error: () => {
        this.error.set('ไม่สามารถโหลดข้อมูลได้');
        this.animeList.set([]);
      }
    });
  }

  protected goPage(p: number): void {
    if (p < 1 || p > this.totalPages()) return;
    this.page.set(p);
    this.loadAnime();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  protected goAnime(id: number): void {
    this.router.navigate(['/anime', id]);
  }

  protected getScore(anime: JikanAnime): string {
    return anime.score ? anime.score.toFixed(1) : 'N/A';
  }

  protected get pageNumbers(): number[] {
    const c = this.page(), t = this.totalPages(), pages: number[] = [];
    for (let i = Math.max(1, c - 2); i <= Math.min(t, c + 2); i++) pages.push(i);
    return pages;
  }
}
