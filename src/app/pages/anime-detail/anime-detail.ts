import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { finalize } from 'rxjs';
import { AnimeApiService } from '../../core/anime-api.service';
import { CharacterCard } from '../../components/character-card/character-card';
import { SkeletonCard } from '../../components/skeleton-card/skeleton-card';
import type { JikanAnime, JikanAnimeCharacter } from '../../models/anime.types';

@Component({
  selector: 'app-anime-detail',
  templateUrl: './anime-detail.html',
  styleUrl: './anime-detail.css',
  imports: [CharacterCard, SkeletonCard, DecimalPipe]
})
export class AnimeDetail implements OnInit {
  private readonly api = inject(AnimeApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly anime = signal<JikanAnime | null>(null);
  protected readonly characters = signal<JikanAnimeCharacter[]>([]);
  protected readonly loading = signal(true);
  protected readonly charsLoading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly showFullSynopsis = signal(false);

  protected readonly fallbackImage = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMzAwIiB2aWV3Qm94PSIwIDAgMjAwIDMwMCI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIzMDAiIGZpbGw9IiMyNzI3MmEiLz48dGV4dCB4PSIxMDAiIHk9IjE1MCIgZmlsbD0iIzcxNzE3YSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1zaXplPSIxNCIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==';

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const id = Number(params['id']);
      if (id) this.loadAnime(id);
    });
  }

  private loadAnime(id: number): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.getAnimeById(id)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: data => {
          this.anime.set(data);
          this.loadCharacters(id);
        },
        error: () => this.error.set('ไม่สามารถโหลดข้อมูลอนิเมะได้')
      });
  }

  private loadCharacters(id: number): void {
    this.charsLoading.set(true);
    this.api.getAnimeCharacters(id)
      .pipe(finalize(() => this.charsLoading.set(false)))
      .subscribe({
        next: data => this.characters.set(data ?? []),
        error: () => this.characters.set([])
      });
  }

  protected goBack(): void {
    this.router.navigate(['/anime']);
  }

  protected goCharacter(id: number): void {
    this.router.navigate(['/characters', id]);
  }

  protected onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img.src !== this.fallbackImage) img.src = this.fallbackImage;
  }

  protected getScore(anime: JikanAnime): string {
    return anime.score ? anime.score.toFixed(1) : 'N/A';
  }

  protected retry(): void {
    const id = Number(this.route.snapshot.params['id']);
    if (id) this.loadAnime(id);
  }
}
