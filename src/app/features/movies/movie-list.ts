import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideChevronsLeft, lucideChevronsRight } from '@ng-icons/lucide';
import { HlmAlertImports } from '@spartan-ng/helm/alert';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmEmptyImports } from '@spartan-ng/helm/empty';
import { HlmLabel } from '@spartan-ng/helm/label';
import { HlmNativeSelectImports } from '@spartan-ng/helm/native-select';
import { HlmPaginationImports } from '@spartan-ng/helm/pagination';
import { HlmSpinner } from '@spartan-ng/helm/spinner';
import { HlmTableImports } from '@spartan-ng/helm/table';
import { MovieStore } from '../../core/movie.store';
import { pageWindow } from '../../core/text';
import { AsyncError } from '../../shared/async-error/async-error';
import { SkeletonRows } from '../../shared/skeleton-rows/skeleton-rows';
import { YearField } from '../../shared/year-field/year-field';

@Component({
  selector: 'app-movie-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgIcon,
    HlmLabel,
    SkeletonRows,
    AsyncError,
    YearField,
    HlmSpinner,
    ...HlmAlertImports,
    ...HlmCardImports,
    ...HlmEmptyImports,
    ...HlmNativeSelectImports,
    ...HlmPaginationImports,
    ...HlmTableImports,
  ],
  providers: [provideIcons({ lucideChevronsLeft, lucideChevronsRight })],
  templateUrl: './movie-list.html',
})
export class MovieList {
  private readonly store = inject(MovieStore);

  readonly state = this.store.list;
  readonly refreshing = this.store.listRefreshing;
  readonly yearOptions = this.store.catalogYears;
  readonly yearText = computed(() => {
    const year = this.store.listYear();
    return year === undefined ? '' : String(year);
  });
  readonly winnerSelect = computed(() => {
    const winner = this.store.listWinner();
    if (winner === true) {
      return 'true';
    }
    if (winner === false) {
      return 'false';
    }
    return '';
  });

  readonly pageNumbers = computed(() => {
    const view = this.state();
    if (view.status !== 'ready' || view.page.totalPages < 1) {
      return [];
    }
    return pageWindow(view.page.number + 1, view.page.totalPages);
  });

  constructor() {
    this.store.ensureList();
  }

  onYearCommit(value: string): void {
    this.store.applyListYear(value === '' ? undefined : Number(value));
  }

  onWinnerChange(value: string | null | undefined): void {
    const winner = value === 'true' ? true : value === 'false' ? false : undefined;
    this.store.applyListWinner(winner);
  }

  goTo(pageNumber: number): void {
    const view = this.state();
    if (view.status !== 'ready') {
      return;
    }
    const index = pageNumber - 1;
    if (index < 0 || index >= view.page.totalPages || index === view.page.number) {
      return;
    }
    this.store.goToListPage(index);
  }

  goFirst(event: Event): void {
    event.preventDefault();
    this.goTo(1);
  }

  goPrevious(event: Event): void {
    event.preventDefault();
    const view = this.state();
    if (view.status === 'ready') {
      this.goTo(view.page.number);
    }
  }

  goNext(event: Event): void {
    event.preventDefault();
    const view = this.state();
    if (view.status === 'ready') {
      this.goTo(view.page.number + 2);
    }
  }

  goLast(event: Event): void {
    event.preventDefault();
    const view = this.state();
    if (view.status === 'ready') {
      this.goTo(view.page.totalPages);
    }
  }

  goToPage(event: Event, pageNumber: number): void {
    event.preventDefault();
    this.goTo(pageNumber);
  }

  retry(): void {
    this.store.reloadList();
  }
}
