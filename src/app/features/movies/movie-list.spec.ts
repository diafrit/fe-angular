import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { Movie, MoviePage, MovieQuery } from '../../core/models';
import { MovieService } from '../../core/movie.service';
import { MovieList } from './movie-list';

describe('MovieList', () => {
  let fixture: ComponentFixture<MovieList>;
  let getMovies: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    getMovies = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: MovieService,
          useValue: { getMovies, getCatalogYears: () => of([1980, 1981, 2015]) },
        },
      ],
    });
  });

  function create(): void {
    fixture = TestBed.createComponent(MovieList);
    fixture.detectChanges();
  }

  it('renders a page of movies with Yes and No in the winner column', () => {
    getMovies.mockReturnValue(
      of(page([movie(1, "Can't Stop the Music", 1980, true), movie(2, 'Cruising', 1980, false)])),
    );

    create();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('List movies');
    expect(text).toContain("Can't Stop the Music");
    expect(text).toContain('Yes');
    expect(text).toContain('Cruising');
    expect(text).toContain('No');
    expect(getMovies).toHaveBeenCalledWith({
      page: 0,
      size: 15,
      winner: undefined,
      year: undefined,
    });
    expect(
      fixture.nativeElement.querySelector('[aria-label="First page"]')?.getAttribute('title'),
    ).toBe('First page');
    expect(
      fixture.nativeElement.querySelector('[aria-label="Previous page"]')?.getAttribute('title'),
    ).toBe('Previous page');
    expect(
      fixture.nativeElement.querySelector('[aria-label="Next page"]')?.getAttribute('title'),
    ).toBe('Next page');
    expect(
      fixture.nativeElement.querySelector('[aria-label="Last page"]')?.getAttribute('title'),
    ).toBe('Last page');
    const pageTwo = [...fixture.nativeElement.querySelectorAll('nav button')].find(
      (button) => (button.textContent ?? '').trim() === '2',
    ) as HTMLButtonElement;
    expect(pageTwo.getAttribute('title')).toBe('Page 2');
  });

  it('shows skeletons while the first page is loading', () => {
    getMovies.mockReturnValue(new Subject<MoviePage>());
    create();
    expect(fixture.nativeElement.querySelector('[data-slot="skeleton"]')).toBeTruthy();
  });

  it('requests the selected page', () => {
    getMovies.mockImplementation((query: MovieQuery) =>
      of(
        page(query.page === 0 ? [movie(1, 'First page')] : [movie(16, 'Second page')], {
          number: query.page,
          first: query.page === 0,
          last: false,
        }),
      ),
    );

    create();
    clickPage('2');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Second page');
    expect(getMovies).toHaveBeenLastCalledWith({
      page: 1,
      size: 15,
      winner: undefined,
      year: undefined,
    });
  });

  it('filters by winner and returns to the first page', () => {
    getMovies.mockImplementation((query: MovieQuery) =>
      of(page([movie(1, query.winner ? 'Only winners' : 'Everyone')], { number: query.page })),
    );

    create();
    clickPage('2');
    const select = fixture.nativeElement.querySelector('select') as HTMLSelectElement;
    select.value = 'true';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(getMovies).toHaveBeenLastCalledWith({
      page: 0,
      size: 15,
      winner: true,
      year: undefined,
    });
    expect(fixture.nativeElement.textContent).toContain('Only winners');
  });

  it('filters only a masked four-digit year and ignores a partial value', () => {
    getMovies.mockImplementation((query: MovieQuery) =>
      of(page([movie(1, query.year === 1980 ? 'Filtered year' : 'Unfiltered')])),
    );

    create();
    const input = fixture.nativeElement.querySelector(
      '[aria-label="Filter by year"]',
    ) as HTMLInputElement;

    input.value = '19a';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(input.value).toBe('19');
    expect(getMovies).toHaveBeenCalledTimes(1);

    input.value = '1980';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(getMovies).toHaveBeenLastCalledWith({
      page: 0,
      size: 15,
      winner: undefined,
      year: 1980,
    });
    expect(fixture.nativeElement.textContent).toContain('Filtered year');

    const future = new Date().getFullYear() + 1;
    input.value = String(future);
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(input.value).not.toBe(String(future));
    expect(input.value.length).toBeLessThan(4);
    expect(getMovies).toHaveBeenCalledTimes(2);

    input.value = '';
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new Event('focus'));
    fixture.detectChanges();
    const suggestion = [...fixture.nativeElement.querySelectorAll('[role="option"]')].find(
      (node) => (node.textContent ?? '').trim() === '2015',
    ) as HTMLButtonElement;
    suggestion.click();
    fixture.detectChanges();
    expect(getMovies).toHaveBeenLastCalledWith({
      page: 0,
      size: 15,
      winner: undefined,
      year: 2015,
    });

    (fixture.nativeElement.querySelector('[aria-label="Clear year"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(getMovies).toHaveBeenLastCalledWith({
      page: 0,
      size: 15,
      winner: undefined,
      year: undefined,
    });
    expect(
      (fixture.nativeElement.querySelector('[aria-label="Filter by year"]') as HTMLInputElement)
        .value,
    ).toBe('');
  });

  it('shows an empty state when the page has no movies', () => {
    getMovies.mockReturnValue(of(page([])));
    create();
    expect(fixture.nativeElement.textContent).toContain('No movies found.');
  });

  it('shows an error and tries the request again', () => {
    getMovies
      .mockReturnValueOnce(throwError(() => new HttpErrorResponse({ status: 0, error: null })))
      .mockReturnValueOnce(of(page([movie(1, 'Back online')])));

    create();
    expect(fixture.nativeElement.textContent).toContain(
      'Could not reach the Golden Raspberry Awards API.',
    );
    fixture.nativeElement.querySelector('button')?.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Back online');
  });

  it('restores the page, filters, and rows when the list is opened again', () => {
    getMovies.mockImplementation((query: MovieQuery) =>
      of(
        page(
          [
            movie(
              1,
              query.year === 1980 && query.winner === true ? 'Filtered winners' : 'Everyone',
            ),
          ],
          { number: query.page },
        ),
      ),
    );

    create();
    const input = fixture.nativeElement.querySelector(
      '[aria-label="Filter by year"]',
    ) as HTMLInputElement;
    input.value = '1980';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    const select = fixture.nativeElement.querySelector('select') as HTMLSelectElement;
    select.value = 'true';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Filtered winners');
    const calls = getMovies.mock.calls.length;

    fixture.destroy();
    create();

    expect(getMovies).toHaveBeenCalledTimes(calls);
    expect(fixture.nativeElement.textContent).toContain('Filtered winners');
    expect(
      (fixture.nativeElement.querySelector('[aria-label="Filter by year"]') as HTMLInputElement)
        .value,
    ).toBe('1980');
    expect((fixture.nativeElement.querySelector('select') as HTMLSelectElement).value).toBe('true');
  });

  function clickPage(label: string): void {
    const pager = fixture.nativeElement.querySelector('nav');
    const link = [...pager.querySelectorAll('button')].find(
      (anchor) => (anchor.textContent ?? '').trim() === label,
    ) as HTMLButtonElement;
    link.click();
  }
});

function movie(id: number, title: string, year = 1980, winner = false): Movie {
  return {
    id,
    year,
    title,
    studios: ['Studio'],
    producers: ['Producer'],
    winner,
  };
}

function page(content: Movie[], overrides: Partial<MoviePage> = {}): MoviePage {
  return {
    content,
    totalPages: content.length === 0 ? 0 : 14,
    totalElements: content.length === 0 ? 0 : 206,
    number: 0,
    size: 15,
    first: true,
    last: false,
    empty: content.length === 0,
    numberOfElements: content.length,
    ...overrides,
  };
}
