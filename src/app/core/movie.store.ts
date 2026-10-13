import { Injectable, inject, signal, type Signal, type WritableSignal } from '@angular/core';
import { catchError, map, Observable, of, Subject, switchMap } from 'rxjs';
import { Movie, MoviePage, ProducerIntervals, StudioWinCount, YearWinnerCount } from './models';
import { MovieService } from './movie.service';
import { maskYearInput, readApiError } from './text';

const LIST_PAGE_SIZE = 15;

export type AsyncData<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; data: T }
  | { status: 'error'; message: string };

export type WinnerSearch =
  | { status: 'idle' }
  | { status: 'loading'; year: number }
  | { status: 'ready'; year: number; data: Movie[] }
  | { status: 'empty'; year: number }
  | { status: 'error'; message: string; year?: number };

export type ListState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; page: MoviePage }
  | { status: 'error'; message: string };

@Injectable({ providedIn: 'root' })
export class MovieStore {
  private readonly movies = inject(MovieService);
  private readonly yearsReload$ = new Subject<void>();
  private readonly studiosReload$ = new Subject<void>();
  private readonly intervalsReload$ = new Subject<void>();
  private readonly winnerSearch$ = new Subject<number | null>();
  private readonly listReload$ = new Subject<void>();

  readonly years = signal<AsyncData<YearWinnerCount[]>>({ status: 'idle' });
  readonly studios = signal<AsyncData<StudioWinCount[]>>({ status: 'idle' });
  readonly intervals = signal<AsyncData<ProducerIntervals>>({ status: 'idle' });
  readonly winners = signal<WinnerSearch>({ status: 'idle' });
  readonly catalogYears = signal<number[]>([]);

  readonly listPage = signal(0);
  readonly listYear = signal<number | undefined>(undefined);
  readonly listWinner = signal<boolean | undefined>(undefined);
  readonly list = signal<ListState>({ status: 'idle' });
  readonly listRefreshing = signal(false);

  constructor() {
    this.bind(this.yearsReload$, () => this.movies.getYearsWithMultipleWinners(), this.years);
    this.bind(this.studiosReload$, () => this.movies.getTopStudios(), this.studios);
    this.bind(this.intervalsReload$, () => this.movies.getProducerIntervals(), this.intervals);

    this.winnerSearch$
      .pipe(
        switchMap((year) => {
          if (year === null) {
            return of({ status: 'idle' as const });
          }
          this.winners.set({ status: 'loading', year });
          return this.movies.getWinnersByYear(year).pipe(
            map((data) =>
              data.length === 0
                ? { status: 'empty' as const, year }
                : { status: 'ready' as const, year, data },
            ),
            catchError((error: unknown) =>
              of({ status: 'error' as const, message: readApiError(error), year }),
            ),
          );
        }),
      )
      .subscribe((next) => this.winners.set(next));

    this.listReload$
      .pipe(
        switchMap(() => {
          if (this.list().status !== 'ready') {
            this.list.set({ status: 'loading' });
          }
          this.listRefreshing.set(true);
          return this.movies
            .getMovies({
              page: this.listPage(),
              size: LIST_PAGE_SIZE,
              winner: this.listWinner(),
              year: this.listYear(),
            })
            .pipe(
              map((page) => ({ status: 'ready' as const, page })),
              catchError((error: unknown) =>
                of({ status: 'error' as const, message: readApiError(error) }),
              ),
            );
        }),
      )
      .subscribe((next) => {
        this.listRefreshing.set(false);
        this.list.set(next);
      });

    this.movies.getCatalogYears().subscribe((years) => this.catalogYears.set(years));
  }

  ensureDashboard(): void {
    this.startIfIdle(this.years, this.yearsReload$);
    this.startIfIdle(this.studios, this.studiosReload$);
    this.startIfIdle(this.intervals, this.intervalsReload$);
  }

  reloadYears(): void {
    this.yearsReload$.next();
  }

  reloadStudios(): void {
    this.studiosReload$.next();
  }

  reloadIntervals(): void {
    this.intervalsReload$.next();
  }

  searchWinners(rawYear: string): void {
    const masked = maskYearInput(rawYear);
    if (masked === '') {
      this.winners.set({ status: 'error', message: 'Enter a year to search.' });
      return;
    }
    if (masked.length < 4) {
      return;
    }
    const year = Number(masked);
    const current = this.winners();
    if ((current.status === 'ready' || current.status === 'empty') && current.year === year) {
      return;
    }
    this.winnerSearch$.next(year);
  }

  clearWinners(): void {
    this.winnerSearch$.next(null);
  }

  retryWinners(): void {
    const current = this.winners();
    if (current.status === 'error' && current.year !== undefined) {
      this.winnerSearch$.next(current.year);
    }
  }

  ensureList(): void {
    if (this.list().status === 'idle') {
      this.listReload$.next();
    }
  }

  applyListYear(year: number | undefined): void {
    if (year === this.listYear()) {
      return;
    }
    this.listYear.set(year);
    this.listPage.set(0);
    this.listReload$.next();
  }

  applyListWinner(winner: boolean | undefined): void {
    if (winner === this.listWinner()) {
      return;
    }
    this.listWinner.set(winner);
    this.listPage.set(0);
    this.listReload$.next();
  }

  goToListPage(index: number): void {
    if (index === this.listPage()) {
      return;
    }
    this.listPage.set(index);
    this.listReload$.next();
  }

  reloadList(): void {
    this.listReload$.next();
  }

  private startIfIdle<T>(state: Signal<AsyncData<T>>, reload$: Subject<void>): void {
    if (state().status === 'idle') {
      reload$.next();
    }
  }

  private bind<T>(
    reload$: Subject<void>,
    load: () => Observable<T>,
    state: WritableSignal<AsyncData<T>>,
  ): void {
    reload$
      .pipe(
        switchMap(() => {
          state.set({ status: 'loading' });
          return load().pipe(
            map((data) => ({ status: 'ready' as const, data })),
            catchError((error: unknown) =>
              of({ status: 'error' as const, message: readApiError(error) }),
            ),
          );
        }),
      )
      .subscribe((next) => state.set(next));
  }
}
