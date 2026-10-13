import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import { Movie, ProducerIntervals, StudioWinCount, YearWinnerCount } from '../../core/models';
import { MovieService } from '../../core/movie.service';
import { Dashboard } from './dashboard';

describe('Dashboard', () => {
  let fixture: ComponentFixture<Dashboard>;
  let years: ReturnType<typeof vi.fn>;
  let studios: ReturnType<typeof vi.fn>;
  let intervals: ReturnType<typeof vi.fn>;
  let winners: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    years = vi.fn();
    studios = vi.fn();
    intervals = vi.fn();
    winners = vi.fn(() => of([]));
    TestBed.configureTestingModule({
      providers: [
        {
          provide: MovieService,
          useValue: {
            getYearsWithMultipleWinners: years,
            getTopStudios: studios,
            getProducerIntervals: intervals,
            getWinnersByYear: winners,
            getCatalogYears: () => of([1980, 1986, 2015]),
          },
        },
      ],
    });
  });

  function create(): void {
    fixture = TestBed.createComponent(Dashboard);
    fixture.detectChanges();
  }

  it('renders years, the top studios, and producer intervals from the movie service', () => {
    years.mockReturnValue(of([{ year: 1986, winnerCount: 2 }] satisfies YearWinnerCount[]));
    studios.mockReturnValue(
      of([
        { name: 'Columbia Pictures', winCount: 7 },
        { name: 'Paramount Pictures', winCount: 6 },
        { name: 'Warner Bros.', winCount: 5 },
      ] satisfies StudioWinCount[]),
    );
    intervals.mockReturnValue(
      of({
        max: [{ producer: 'Matthew Vaughn', interval: 13, previousWin: 2002, followingWin: 2015 }],
        min: [{ producer: 'Joel Silver', interval: 1, previousWin: 1990, followingWin: 1991 }],
      } satisfies ProducerIntervals),
    );

    create();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('List years with multiple winners');
    expect(text).toContain('1986');
    expect(text).toContain('Columbia Pictures');
    expect(text).toContain('Warner Bros.');
    expect(text).toContain('Matthew Vaughn');
    expect(text).toContain('Joel Silver');
    expect(text).toContain('Search a year to list its winners.');
    expect(studios).toHaveBeenCalledWith();
  });

  it('shows a loading skeleton until each panel responds', () => {
    years.mockReturnValue(new Subject<YearWinnerCount[]>());
    studios.mockReturnValue(new Subject<StudioWinCount[]>());
    intervals.mockReturnValue(new Subject<ProducerIntervals>());

    create();

    expect(fixture.nativeElement.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(
      0,
    );
    expect(fixture.nativeElement.textContent).not.toContain('1986');
  });

  it('shows an error and loads years again', () => {
    years
      .mockReturnValueOnce(
        throwError(() => new HttpErrorResponse({ status: 500, error: { message: 'years down' } })),
      )
      .mockReturnValueOnce(of([{ year: 1990, winnerCount: 2 }]));
    studios.mockReturnValue(of([]));
    intervals.mockReturnValue(of({ min: [], max: [] }));

    create();

    const panel = fixture.nativeElement.querySelector('#years-heading')?.closest('section');
    expect(panel?.textContent).toContain('years down');
    panel?.querySelector('button')?.click();
    fixture.detectChanges();
    expect(panel?.textContent).toContain('1990');
  });

  it('lists winners for the year typed into the search form', () => {
    years.mockReturnValue(of([]));
    studios.mockReturnValue(of([]));
    intervals.mockReturnValue(of({ min: [], max: [] }));
    const pending = new Subject<Movie[]>();
    winners.mockReturnValue(pending);

    create();

    const input = fixture.nativeElement.querySelector('#winner-year') as HTMLInputElement;
    input.value = '1986';
    fixture.nativeElement.querySelector('form')?.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    expect(winners).toHaveBeenCalledWith(1986);
    expect(
      fixture.nativeElement.querySelector('[aria-label="Search"]')?.getAttribute('title'),
    ).toBe('Search');
    expect(fixture.nativeElement.querySelector('[aria-label="Loading winners"]')).toBeTruthy();

    pending.next([
      {
        id: 36,
        year: 1986,
        title: 'Howard the Duck',
        studios: ['Universal Studios'],
        producers: ['Gloria Katz'],
        winner: true,
      },
    ]);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Howard the Duck');
  });

  it('keeps a partial year and a future year out of the search', () => {
    years.mockReturnValue(of([]));
    studios.mockReturnValue(of([]));
    intervals.mockReturnValue(of({ min: [], max: [] }));

    create();
    fixture.componentInstance.search('201');
    fixture.componentInstance.search(String(new Date().getFullYear() + 1));
    fixture.detectChanges();

    expect(winners).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).not.toContain('Enter a year to search.');
  });

  it('asks for a year and does not call the service when the search is blank', () => {
    years.mockReturnValue(of([]));
    studios.mockReturnValue(of([]));
    intervals.mockReturnValue(of({ min: [], max: [] }));

    create();
    fixture.componentInstance.search('   ');
    fixture.detectChanges();

    expect(winners).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Enter a year to search.');
  });

  it('shows an empty result when a year has no winners', () => {
    years.mockReturnValue(of([]));
    studios.mockReturnValue(of([]));
    intervals.mockReturnValue(of({ min: [], max: [] }));
    winners.mockReturnValue(of([]));

    create();
    fixture.componentInstance.search('1900');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('No winners found for 1900.');
  });

  it('clears the winner search from the year field', () => {
    years.mockReturnValue(of([]));
    studios.mockReturnValue(of([]));
    intervals.mockReturnValue(of({ min: [], max: [] }));
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

    create();
    const input = fixture.nativeElement.querySelector('#winner-year') as HTMLInputElement;
    input.value = '1986';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Howard the Duck');

    (fixture.nativeElement.querySelector('[aria-label="Clear year"]') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Search a year to list its winners.');
    expect(fixture.nativeElement.textContent).not.toContain('Howard the Duck');
    expect((fixture.nativeElement.querySelector('#winner-year') as HTMLInputElement).value).toBe(
      '',
    );
  });

  it('keeps the panels and the winner search when the dashboard is opened again', () => {
    years.mockReturnValue(of([{ year: 1986, winnerCount: 2 }]));
    studios.mockReturnValue(of([{ name: 'Columbia Pictures', winCount: 7 }]));
    intervals.mockReturnValue(
      of({
        max: [{ producer: 'Matthew Vaughn', interval: 13, previousWin: 2002, followingWin: 2015 }],
        min: [],
      }),
    );
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

    create();
    fixture.componentInstance.search('1986');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Howard the Duck');

    fixture.destroy();
    create();

    expect(years).toHaveBeenCalledTimes(1);
    expect(studios).toHaveBeenCalledTimes(1);
    expect(intervals).toHaveBeenCalledTimes(1);
    expect(winners).toHaveBeenCalledTimes(1);
    expect(fixture.nativeElement.textContent).toContain('1986');
    expect(fixture.nativeElement.textContent).toContain('Columbia Pictures');
    expect(fixture.nativeElement.textContent).toContain('Matthew Vaughn');
    expect(fixture.nativeElement.textContent).toContain('Howard the Duck');
    expect((fixture.nativeElement.querySelector('#winner-year') as HTMLInputElement).value).toBe(
      '1986',
    );
  });
});
