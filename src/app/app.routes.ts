import { Routes } from '@angular/router';
import { Home } from './pages/home/home';

export const routes: Routes = [
  { path: '', component: Home },
  {
    path: 'characters',
    loadComponent: () => import('./pages/characters/characters').then(m => m.Characters)
  },
  {
    path: 'characters/:id',
    loadComponent: () => import('./pages/character-detail/character-detail').then(m => m.CharacterDetail)
  },
  {
    path: 'anime',
    loadComponent: () => import('./pages/anime-list/anime-list').then(m => m.AnimeList)
  },
  {
    path: 'anime/:id',
    loadComponent: () => import('./pages/anime-detail/anime-detail').then(m => m.AnimeDetail)
  },
  {
    path: 'categories',
    loadComponent: () => import('./pages/categories/categories').then(m => m.Categories)
  },
  {
    path: 'categories/:genreId',
    loadComponent: () => import('./pages/categories/categories').then(m => m.Categories)
  },
  {
    path: 'favorites',
    loadComponent: () => import('./pages/favorites/favorites').then(m => m.Favorites)
  },
  { path: '**', redirectTo: '' }
];
