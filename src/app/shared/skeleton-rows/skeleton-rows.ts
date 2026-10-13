import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { HlmSkeleton } from '@spartan-ng/helm/skeleton';

@Component({
  selector: 'app-skeleton-rows',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HlmSkeleton],
  host: {
    role: 'status',
    class: 'flex flex-col gap-2',
    '[attr.aria-label]': 'label()',
  },
  template: `
    @for (row of rows(); track row) {
      <div hlmSkeleton class="h-8 w-full"></div>
    }
  `,
})
export class SkeletonRows {
  readonly count = input(3);
  readonly label = input('Loading');

  protected readonly rows = computed(() =>
    Array.from({ length: this.count() }, (_, index) => index),
  );
}
