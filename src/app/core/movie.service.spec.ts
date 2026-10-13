import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MOVIES_API_URL } from './api-url';
import { MoviePage, StudioWinCount } from './models';
import { MovieService } from './movie.service';

describe('MovieService', () => {
  const api = 'https://example.test/api/movies';
  let service: MovieService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MOVIES_API_URL, useValue: api },
      ],
    });
    service = TestBed.inject(MovieService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('requests a movie page and omits filters that are not set', () => {
    const page = emptyPage();
    let received: MoviePage | undefined;
    service.getMovies({ page: 0, size: 15 }).subscribe((value) => (received = value));

    const req = http.expectOne(`${api}?page=0&size=15`);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.has('winner')).toBe(false);
    expect(req.request.params.has('year')).toBe(false);
    req.flush(page);
    expect(received).toEqual(page);
  });

  it('sends year and winner, including winner=false', () => {
    service.getMovies({ page: 2, size: 15, year: 1986, winner: false }).subscribe();
    const req = http.expectOne(`${api}?page=2&size=15&winner=false&year=1986`);
    expect(req.request.params.get('winner')).toBe('false');
    expect(req.request.params.get('year')).toBe('1986');
    req.flush(emptyPage());
  });

  it('reads years that had more than one winner', () => {
    let received: unknown;
    service.getYearsWithMultipleWinners().subscribe((value) => (received = value));
    http
      .expectOne(`${api}/yearsWithMultipleWinners`)
      .flush({ years: [{ year: 1986, winnerCount: 2 }] });
    expect(received).toEqual([{ year: 1986, winnerCount: 2 }]);
  });

  it('keeps only the three studios with the most wins', () => {
    const studios: StudioWinCount[] = [
      { name: 'MGM', winCount: 3 },
      { name: 'Columbia Pictures', winCount: 7 },
      { name: 'Warner Bros.', winCount: 5 },
      { name: 'Paramount Pictures', winCount: 6 },
    ];
    let received: StudioWinCount[] | undefined;
    service.getTopStudios().subscribe((value) => (received = value));
    http.expectOne(`${api}/studiosWithWinCount`).flush({ studios });
    expect(received?.map((studio) => studio.name)).toEqual([
      'Columbia Pictures',
      'Paramount Pictures',
      'Warner Bros.',
    ]);
  });

  it('reads the longest and shortest producer intervals', () => {
    const body = {
      min: [{ producer: 'Joel Silver', interval: 1, previousWin: 1990, followingWin: 1991 }],
      max: [{ producer: 'Matthew Vaughn', interval: 13, previousWin: 2002, followingWin: 2015 }],
    };
    let received: unknown;
    service.getProducerIntervals().subscribe((value) => (received = value));
    http.expectOne(`${api}/maxMinWinIntervalForProducers`).flush(body);
    expect(received).toEqual(body);
  });

  it('collects distinct years from the movie pages and the multiple-winner list', () => {
    let received: number[] | undefined;
    service.getCatalogYears().subscribe((value) => (received = value));

    http.expectOne(`${api}?page=0&size=500`).flush({
      ...emptyPage(),
      totalPages: 1,
      content: [movie(1, 2015), movie(2, 1980), movie(3, 2015), movie(4, 9999)],
    });
    http.expectOne(`${api}/yearsWithMultipleWinners`).flush({
      years: [
        { year: 1986, winnerCount: 2 },
        { year: 2015, winnerCount: 2 },
      ],
    });

    expect(received).toEqual([2015, 1986, 1980]);

    let cached: number[] | undefined;
    service.getCatalogYears().subscribe((value) => (cached = value));
    http.expectNone(() => true);
    expect(cached).toEqual([2015, 1986, 1980]);
  });

  it('still suggests multiple-winner years when the movie page fails', () => {
    let received: number[] | undefined;
    service.getCatalogYears().subscribe((value) => (received = value));
    http
      .expectOne(`${api}?page=0&size=500`)
      .flush('down', { status: 500, statusText: 'Server Error' });
    http
      .expectOne(`${api}/yearsWithMultipleWinners`)
      .flush({ years: [{ year: 1990, winnerCount: 2 }] });
    expect(received).toEqual([1990]);
  });

  it('requests winners for a year', () => {
    let received: unknown;
    service.getWinnersByYear(1986).subscribe((value) => (received = value));
    const req = http.expectOne(`${api}/winnersByYear?year=1986`);
    const movies = [
      {
        id: 36,
        year: 1986,
        title: 'Howard the Duck',
        studios: ['Universal Studios'],
        producers: ['Gloria Katz'],
        winner: true,
      },
    ];
    req.flush(movies);
    expect(received).toEqual(movies);
  });
});

function movie(id: number, year: number) {
  return {
    id,
    year,
    title: `Movie ${id}`,
    studios: ['Studio'],
    producers: ['Producer'],
    winner: false,
  };
}

function emptyPage(): MoviePage {
  return {
    content: [],
    totalPages: 0,
    totalElements: 0,
    number: 0,
    size: 15,
    first: true,
    last: true,
    empty: true,
    numberOfElements: 0,
  };
}
