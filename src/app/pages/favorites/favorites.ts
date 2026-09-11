import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FavoritesService } from '../../core/favorites.service';
import { CharacterCard } from '../../components/character-card/character-card';

@Component({
  selector: 'app-favorites',
  templateUrl: './favorites.html',
  styleUrl: './favorites.css',
  imports: [CharacterCard]
})
export class Favorites {
  protected readonly favService = inject(FavoritesService);
  private readonly router = inject(Router);

  protected clearAll(): void {
    if (confirm('ต้องการลบรายการโปรดทั้งหมดหรือไม่?')) {
      this.favService.clearAll();
    }
  }

  protected goCharacters(): void {
    this.router.navigate(['/characters']);
  }
}
