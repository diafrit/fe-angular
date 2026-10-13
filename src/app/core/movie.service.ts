import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, forkJoin, map, Observable, of, shareReplay, switchMap } from 'rxjs';
import { matchingYears } from './text';
import { MOVIES_API_URL } from './api-url';
import {
  Movie,
  MoviePage,
  MovieQuery,
  ProducerIntervals,
  StudioWinCount,
  YearWinnerCount,
} from './models';

interface YearsResponse {
  years?: YearWinnerCount[];
}

interface StudiosResponse {
  studios?: StudioWinCount[];
}

// Page size used only to crawl the full catalog for the year autocomplete.
const CATALOG_PAGE_SIZE = 500;

@Injectable({ providedIn: 'root' })
export class MovieService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(MOVIES_API_URL);

  getMovies(query: MovieQuery): Observable<MoviePage> {
    let params = new HttpParams().set('page', query.page).set('size', query.size);
    if (query.winner !== undefined) {
      params = params.set('winner', String(query.winner));
    }
    if (query.year !== undefined) {
      params = params.set('year', query.year);
    }
    return this.http.get<MoviePage>(this.apiUrl, { params });
  }

  getYearsWithMultipleWinners(): Observable<YearWinnerCount[]> {
    return this.http
      .get<YearsResponse>(`${this.apiUrl}/yearsWithMultipleWinners`)
      .pipe(map((response) => response.years ?? []));
  }

  getTopStudios(limit = 3): Observable<StudioWinCount[]> {
    return this.http
      .get<StudiosResponse>(`${this.apiUrl}/studiosWithWinCount`)
      .pipe(
        map((response) =>
          [...(response.studios ?? [])]
            .sort((a, b) => b.winCount - a.winCount || a.name.localeCompare(b.name))
            .slice(0, limit),
        ),
      );
  }

  getProducerIntervals(): Observable<ProducerIntervals> {
    return this.http
      .get<ProducerIntervals>(`${this.apiUrl}/maxMinWinIntervalForProducers`)
      .pipe(map((response) => ({ min: response.min ?? [], max: response.max ?? [] })));
  }

  getWinnersByYear(year: number): Observable<Movie[]> {
    const params = new HttpParams().set('year', year);
    return this.http.get<Movie[]>(`${this.apiUrl}/winnersByYear`, { params });
  }

  private catalogYears$: Observable<number[]> | null = null;

  getCatalogYears(): Observable<number[]> {
    this.catalogYears$ ??= this.loadCatalogYears().pipe(shareReplay(1));
    return this.catalogYears$;
  }

  private loadCatalogYears(): Observable<number[]> {
    return forkJoin({
      movies: this.getMovies({ page: 0, size: CATALOG_PAGE_SIZE }).pipe(catchError(() => of(null))),
      multiple: this.getYearsWithMultipleWinners().pipe(
        catchError(() => of([] as YearWinnerCount[])),
      ),
    }).pipe(
      switchMap(({ movies, multiple }) => {
        const first = movies?.content ?? [];
        const extraPages = Math.max(0, (movies?.totalPages ?? 1) - 1);
        const yearsOf = (rows: { year: number }[]) => rows.map((row) => row.year);
        if (extraPages === 0) {
          return of(matchingYears([...yearsOf(first), ...yearsOf(multiple)], ''));
        }
        const rest = Array.from({ length: extraPages }, (_, index) =>
          this.getMovies({ page: index + 1, size: CATALOG_PAGE_SIZE }).pipe(
            catchError(() => of(null)),
          ),
        );
        return forkJoin(rest).pipe(
          map((pages) =>
            matchingYears(
              [
                ...yearsOf(first),
                ...pages.flatMap((page) => yearsOf(page?.content ?? [])),
                ...yearsOf(multiple),
              ],
              '',
            ),
          ),
        );
      }),
    );
  }
}
