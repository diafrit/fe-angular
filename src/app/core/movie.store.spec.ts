import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import { MoviePage } from './models';
import { MovieService } from './movie.service';
import { MovieStore } from './movie.store';

describe('MovieStore', () => {
  let years: ReturnType<typeof vi.fn>;
  let studios: ReturnType<typeof vi.fn>;
  let intervals: ReturnType<typeof vi.fn>;
  let winners: ReturnType<typeof vi.fn>;
  let getMovies: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    years = vi.fn(() => of([]));
    studios = vi.fn(() => of([]));
    intervals = vi.fn(() => of({ min: [], max: [] }));
    winners = vi.fn(() => of([]));
    getMovies = vi.fn(() => of(emptyPage()));
    TestBed.configureTestingModule({
      providers: [
        {
          provide: MovieService,
          useValue: {
            getYearsWithMultipleWinners: years,
            getTopStudios: studios,
            getProducerIntervals: intervals,
            getWinnersByYear: winners,
            getCatalogYears: () => of([1980, 2015]),
            getMovies,
          },
        },
      ],
    });
  });

  function store(): MovieStore {
    return TestBed.inject(MovieStore);
  }

  it('loads each dashboard panel once and again only on retry', () => {
    years.mockReturnValue(of([{ year: 1986, winnerCount: 2 }]));
    const movieStore = store();

    movieStore.ensureDashboard();
    movieStore.ensureDashboard();

    expect(years).toHaveBeenCalledTimes(1);
    expect(studios).toHaveBeenCalledTimes(1);
    expect(intervals).toHaveBeenCalledTimes(1);
    expect(movieStore.years()).toEqual({
      status: 'ready',
      data: [{ year: 1986, winnerCount: 2 }],
    });

    movieStore.reloadYears();
    expect(years).toHaveBeenCalledTimes(2);
  });

  it('keeps an in-flight panel request when asked to load again', () => {
    const pending = new Subject<{ year: number; winnerCount: number }[]>();
    years.mockReturnValue(pending);
    const movieStore = store();

    movieStore.ensureDashboard();
    movieStore.ensureDashboard();
    expect(years).toHaveBeenCalledTimes(1);
    expect(movieStore.years().status).toBe('loading');

    pending.next([{ year: 1990, winnerCount: 2 }]);
    pending.complete();
    expect(movieStore.years()).toEqual({
      status: 'ready',
      data: [{ year: 1990, winnerCount: 2 }],
    });
  });

  it('remembers a winner search and skips the same year', () => {
    winners.mockReturnValue(
      of([
        {
          id: 36,
          year: 1986,
          title: 'Howard the Duck',
          studios: ['Universal Studios'],
          producers: ['Gloria Katz'],
          winner: true,
        },
      ]),
    );
    const movieStore = store();

    movieStore.searchWinners('198');
    movieStore.searchWinners(String(new Date().getFullYear() + 1));
    expect(winners).not.toHaveBeenCalled();

    movieStore.searchWinners('1986');
    movieStore.searchWinners('1986');
    expect(winners).toHaveBeenCalledTimes(1);
    expect(movieStore.winners().status).toBe('ready');

    const pending = new Subject<unknown[]>();
    winners.mockReturnValue(pending);
    movieStore.searchWinners('2015');
    movieStore.clearWinners();
    pending.next([]);
    expect(movieStore.winners().status).toBe('idle');
  });

  it('keeps a list query and refetches when the filter changes', () => {
    getMovies.mockImplementation((query: { page: number; year?: number; winner?: boolean }) =>
      of(emptyPage(query.page)),
    );
    const movieStore = store();

    movieStore.ensureList();
    movieStore.ensureList();
    expect(getMovies).toHaveBeenCalledTimes(1);

    movieStore.applyListYear(1980);
    movieStore.goToListPage(1);
    movieStore.applyListWinner(true);
    expect(movieStore.listPage()).toBe(0);
    expect(movieStore.listYear()).toBe(1980);
    expect(movieStore.listWinner()).toBe(true);
    expect(getMovies).toHaveBeenCalledTimes(4);

    movieStore.ensureList();
    expect(getMovies).toHaveBeenCalledTimes(4);
    expect(movieStore.list().status).toBe('ready');
  });

  it('records a failed panel until retry', () => {
    years
      .mockReturnValueOnce(throwError(() => new HttpErrorResponse({ status: 503, error: null })))
      .mockReturnValueOnce(of([{ year: 1991, winnerCount: 2 }]));
    const movieStore = store();

    movieStore.ensureDashboard();
    expect(movieStore.years().status).toBe('error');
    movieStore.ensureDashboard();
    expect(years).toHaveBeenCalledTimes(1);

    movieStore.reloadYears();
    expect(movieStore.years()).toEqual({
      status: 'ready',
      data: [{ year: 1991, winnerCount: 2 }],
    });
  });
});

function emptyPage(number = 0): MoviePage {
  return {
    content: [],
    totalPages: 2,
    totalElements: 0,
    number,
    size: 15,
    first: number === 0,
    last: false,
    empty: true,
    numberOfElements: 0,
  };
}
