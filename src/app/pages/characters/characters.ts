import { Component, OnInit, inject, signal, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription, finalize, Subject, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { AnimeApiService } from '../../core/anime-api.service';
import { CharacterCard } from '../../components/character-card/character-card';
import { SkeletonCard } from '../../components/skeleton-card/skeleton-card';
import type { JikanCharacter, JikanPagination } from '../../models/anime.types';

@Component({
  selector: 'app-characters',
  templateUrl: './characters.html',
  styleUrl: './characters.css',
  imports: [CharacterCard, SkeletonCard]
})
export class Characters implements OnInit, OnDestroy {
  private readonly api = inject(AnimeApiService);
  private readonly route = inject(ActivatedRoute);

  protected readonly characters = signal<JikanCharacter[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly page = signal(1);
  protected readonly totalPages = signal(1);
  protected readonly searchQuery = signal('');
  protected readonly sortBy = signal<'favorites' | 'name'>('favorites');
  protected readonly sortDir = signal<'asc' | 'desc'>('desc');

  private readonly searchSubject = new Subject<string>();
  private sub?: Subscription;
  private searchSub?: Subscription;

  ngOnInit(): void {
    // Listen for debounced search
    this.searchSub = this.searchSubject.pipe(
      debounceTime(350),
      distinctUntilChanged()
    ).subscribe(query => {
      this.searchQuery.set(query);
      this.page.set(1);
      this.loadCharacters();
    });

    // Check if there's a query param
    this.route.queryParams.subscribe(params => {
      if (params['q']) {
        this.searchQuery.set(params['q']);
        this.searchSubject.next(params['q']);
      } else {
        this.loadCharacters();
      }
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.searchSub?.unsubscribe();
  }

  protected onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchSubject.next(value);
  }

  protected setSortBy(value: 'favorites' | 'name'): void {
    if (this.sortBy() === value) {
      // Toggle direction
      this.sortDir.update(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortBy.set(value);
      this.sortDir.set(value === 'favorites' ? 'desc' : 'asc');
    }
    this.page.set(1);
    this.loadCharacters();
  }

  protected goPage(p: number): void {
    if (p < 1 || p > this.totalPages()) return;
    this.page.set(p);
    this.loadCharacters();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  protected resetFilters(): void {
    this.searchQuery.set('');
    this.sortBy.set('favorites');
    this.sortDir.set('desc');
    this.page.set(1);
    this.loadCharacters();
  }

  protected loadCharacters(): void {
    this.sub?.unsubscribe();
    this.loading.set(true);
    this.error.set(null);

    const query = this.searchQuery().trim();
    const handleErr = (err: any) => {
      let msg = 'ไม่สามารถโหลดข้อมูลตัวละครได้ กรุณาลองใหม่อีกครั้ง';
      if (err?.status === 504) {
        msg = 'เซิร์ฟเวอร์ข้อมูลอนิเมะใช้เวลาตอบกลับนานเกินไป (Timeout) ระบบอาจมีผู้ใช้งานเยอะ กรุณาลองใหม่อีกครั้ง';
      } else if (err?.status === 429) {
        msg = 'มีการเรียกใช้งานข้อมูลมากเกินไป กรุณารอสักครู่แล้วลองใหม่';
      } else if (err?.status >= 500) {
        msg = 'เซิร์ฟเวอร์ข้อมูลอนิเมะขัดข้องชั่วคราว กรุณาลองใหม่อีกครั้งในภายหลัง';
      }
      this.error.set(msg);
      this.characters.set([]);
    };

    if (query) {
      this.sub = this.api.searchCharacters(query, this.page(), 24, this.sortBy(), this.sortDir())
        .pipe(finalize(() => this.loading.set(false)))
        .subscribe({
          next: res => {
            console.log('[Characters API] Search Result:', res);
            console.log('[Characters API] Data length:', res?.data?.length);
            this.characters.set(res?.data ?? []);
            this.totalPages.set(res?.pagination?.last_visible_page ?? 1);
          },
          error: (err) => {
            console.error('[Characters API] Search Error:', err);
            handleErr(err);
          }
        });
    } else {
      // For empty search, we can use searchCharacters to support sorting
      this.sub = this.api.searchCharacters('', this.page(), 24, this.sortBy(), this.sortDir())
        .pipe(finalize(() => this.loading.set(false)))
        .subscribe({
          next: res => {
            console.log('[Characters API] Top/Default Result:', res);
            console.log('[Characters API] Data length:', res?.data?.length);
            this.characters.set(res?.data ?? []);
            this.totalPages.set(res?.pagination?.last_visible_page ?? 1);
          },
          error: (err) => {
            console.error('[Characters API] Top/Default Error:', err);
            handleErr(err);
          }
        });
    }
  }

  protected get pageNumbers(): number[] {
    const current = this.page();
    const total = this.totalPages();
    const pages: number[] = [];
    const range = 2;
    for (let i = Math.max(1, current - range); i <= Math.min(total, current + range); i++) {
      pages.push(i);
    }
    return pages;
  }
}
