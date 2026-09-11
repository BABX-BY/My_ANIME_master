import { Component } from '@angular/core';

@Component({
  selector: 'app-skeleton-card',
  template: `
    <div class="skel-card">
      <div class="skel-image skeleton"></div>
      <div class="skel-body">
        <div class="skel-line skeleton" style="width: 80%; height: 14px;"></div>
        <div class="skel-line skeleton" style="width: 50%; height: 10px;"></div>
        <div class="skel-line skeleton" style="width: 65%; height: 10px;"></div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .skel-card {
      border-radius: 16px;
      overflow: hidden;
      background: var(--color-bg-card);
      border: 1px solid var(--color-border);
      height: 100%;
    }
    .skel-image {
      aspect-ratio: 3/4;
      width: 100%;
    }
    .skel-body {
      padding: 0.85rem 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .skel-line {
      border-radius: 6px;
    }
  `],
  imports: []
})
export class SkeletonCard {}
