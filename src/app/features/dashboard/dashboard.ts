import { ChangeDetectionStrategy, Component, computed, inject, viewChild } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideSearch } from '@ng-icons/lucide';
import { HlmAlertImports } from '@spartan-ng/helm/alert';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmEmptyImports } from '@spartan-ng/helm/empty';
import { HlmSpinner } from '@spartan-ng/helm/spinner';
import { HlmTableImports } from '@spartan-ng/helm/table';
import { MovieStore } from '../../core/movie.store';
import { AsyncError } from '../../shared/async-error/async-error';
import { SkeletonRows } from '../../shared/skeleton-rows/skeleton-rows';
import { YearField } from '../../shared/year-field/year-field';

@Component({
  selector: 'app-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgIcon,
    HlmButton,
    SkeletonRows,
    AsyncError,
    YearField,
    HlmSpinner,
    ...HlmAlertImports,
    ...HlmCardImports,
    ...HlmEmptyImports,
    ...HlmTableImports,
  ],
  providers: [provideIcons({ lucideSearch })],
  templateUrl: './dashboard.html',
})
export class Dashboard {
  private readonly store = inject(MovieStore);
  private readonly yearField = viewChild(YearField);

  readonly yearsState = this.store.years;
  readonly studiosState = this.store.studios;
  readonly intervalsState = this.store.intervals;
  readonly winnersState = this.store.winners;
  readonly yearOptions = this.store.catalogYears;
  readonly winnerYear = computed(() => {
    const state = this.store.winners();
    if (state.status === 'idle' || (state.status === 'error' && state.year === undefined)) {
      return '';
    }
    return String(state.year);
  });

  constructor() {
    this.store.ensureDashboard();
  }

  loadYears(): void {
    this.store.reloadYears();
  }

  loadStudios(): void {
    this.store.reloadStudios();
  }

  loadIntervals(): void {
    this.store.reloadIntervals();
  }

  search(rawYear: string): void {
    this.store.searchWinners(rawYear);
  }

  onSearch(event: Event): void {
    event.preventDefault();
    this.search(this.yearField()?.readValue() ?? '');
  }

  onYearCommit(value: string): void {
    if (value === '') {
      this.store.clearWinners();
      return;
    }
    this.search(value);
  }

  retryWinners(): void {
    this.store.retryWinners();
  }
}
