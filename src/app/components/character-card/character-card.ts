import { Component, Input, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FavoritesService, FavoriteCharacter } from '../../core/favorites.service';

@Component({
  selector: 'app-character-card',
  templateUrl: './character-card.html',
  styleUrl: './character-card.css',
  imports: []
})
export class CharacterCard {
  @Input({ required: true }) malId!: number;
  @Input({ required: true }) name!: string;
  @Input() nameKanji: string | null = null;
  @Input() imageUrl = '';
  @Input() favorites = 0;
  @Input() animeTitle: string | null = null;
  @Input() animeId: number | null = null;

  protected readonly favService = inject(FavoritesService);
  private readonly router = inject(Router);

  protected readonly fallbackImage = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMzAwIiB2aWV3Qm94PSIwIDAgMjAwIDMwMCI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIzMDAiIGZpbGw9IiMyNzI3MmEiLz48dGV4dCB4PSIxMDAiIHk9IjE1MCIgZmlsbD0iIzcxNzE3YSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1zaXplPSIxNCIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==';

  protected get isFav(): boolean {
    return this.favService.isFavorite(this.malId);
  }

  protected toggleFav(event: Event): void {
    event.stopPropagation();
    const fav: FavoriteCharacter = {
      mal_id: this.malId,
      name: this.name,
      name_kanji: this.nameKanji,
      image_url: this.imageUrl,
      favorites: this.favorites,
      anime_title: this.animeTitle,
      anime_id: this.animeId
    };
    this.favService.toggle(fav);
  }

  protected goDetail(): void {
    this.router.navigate(['/characters', this.malId]);
  }

  protected onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img.src !== this.fallbackImage) {
      img.src = this.fallbackImage;
    }
  }

  protected formatFavorites(count: number): string {
    if (count >= 1000) {
      return (count / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    }
    return String(count);
  }
}
