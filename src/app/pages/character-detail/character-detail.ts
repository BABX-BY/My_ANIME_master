import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AnimeApiService } from '../../core/anime-api.service';
import { FavoritesService, FavoriteCharacter } from '../../core/favorites.service';
import type { JikanCharacterFull } from '../../models/anime.types';

@Component({
  selector: 'app-character-detail',
  templateUrl: './character-detail.html',
  styleUrl: './character-detail.css',
  imports: []
})
export class CharacterDetail implements OnInit {
  private readonly api = inject(AnimeApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  protected readonly favService = inject(FavoritesService);

  protected readonly character = signal<JikanCharacterFull | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly showFullBio = signal(false);

  protected readonly fallbackImage = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMzAwIiB2aWV3Qm94PSIwIDAgMjAwIDMwMCI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIzMDAiIGZpbGw9IiMyNzI3MmEiLz48dGV4dCB4PSIxMDAiIHk9IjE1MCIgZmlsbD0iIzcxNzE3YSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1zaXplPSIxNCIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==';

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const id = Number(params['id']);
      if (id) this.loadCharacter(id);
    });
  }

  private loadCharacter(id: number): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.getCharacterById(id)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: data => this.character.set(data),
        error: () => this.error.set('ไม่สามารถโหลดข้อมูลตัวละครได้')
      });
  }

  protected get isFav(): boolean {
    const c = this.character();
    return c ? this.favService.isFavorite(c.mal_id) : false;
  }

  protected toggleFav(): void {
    const c = this.character();
    if (!c) return;
    const fav: FavoriteCharacter = {
      mal_id: c.mal_id,
      name: c.name,
      name_kanji: c.name_kanji,
      image_url: c.images?.jpg?.image_url ?? '',
      favorites: c.favorites,
      anime_title: c.anime?.[0]?.anime?.title ?? null,
      anime_id: c.anime?.[0]?.anime?.mal_id ?? null
    };
    this.favService.toggle(fav);
  }

  protected goBack(): void {
    this.router.navigate(['/characters']);
  }

  protected goAnime(id: number): void {
    this.router.navigate(['/anime', id]);
  }

  protected onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img.src !== this.fallbackImage) {
      img.src = this.fallbackImage;
    }
  }

  protected get japaneseVAs(): { name: string; image: string }[] {
    const c = this.character();
    if (!c?.voices) return [];
    return c.voices
      .filter(v => v.language === 'Japanese')
      .map(v => ({ name: v.person.name, image: v.person.images?.jpg?.image_url ?? '' }));
  }

  protected get englishVAs(): { name: string; image: string }[] {
    const c = this.character();
    if (!c?.voices) return [];
    return c.voices
      .filter(v => v.language === 'English')
      .map(v => ({ name: v.person.name, image: v.person.images?.jpg?.image_url ?? '' }));
  }

  protected formatFavorites(count: number): string {
    if (count >= 1000000) return (count / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (count >= 1000) return (count / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    return String(count);
  }

  protected retry(): void {
    const id = Number(this.route.snapshot.params['id']);
    if (id) this.loadCharacter(id);
  }
}
