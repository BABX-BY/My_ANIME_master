import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { FavoritesService } from '../../core/favorites.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
  imports: [RouterLink, RouterLinkActive]
})
export class Navbar {
  protected readonly favService = inject(FavoritesService);
  protected readonly mobileOpen = signal(false);

  protected toggleMobile(): void {
    this.mobileOpen.update(v => !v);
  }

  protected closeMobile(): void {
    this.mobileOpen.set(false);
  }
}
