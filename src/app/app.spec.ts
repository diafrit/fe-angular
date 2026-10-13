import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { MovieService } from './core/movie.service';
import { App } from './app';
import { routes } from './app.routes';

describe('App', () => {
  let fixture: ComponentFixture<App>;

  afterEach(() => {
    localStorage.removeItem('theme');
    document.documentElement.classList.remove('dark');
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter(routes),
        {
          provide: MovieService,
          useValue: {
            getYearsWithMultipleWinners: () => of([{ year: 1986, winnerCount: 2 }]),
            getTopStudios: () => of([{ name: 'Columbia Pictures', winCount: 7 }]),
            getProducerIntervals: () =>
              of({
                min: [
                  { producer: 'Joel Silver', interval: 1, previousWin: 1990, followingWin: 1991 },
                ],
                max: [
                  {
                    producer: 'Matthew Vaughn',
                    interval: 13,
                    previousWin: 2002,
                    followingWin: 2015,
                  },
                ],
              }),
            getWinnersByYear: () => of([]),
            getCatalogYears: () => of([1980, 1986, 2015]),
            getMovies: () =>
              of({
                content: [
                  {
                    id: 1,
                    year: 1980,
                    title: "Can't Stop the Music",
                    studios: ['Associated Film Distribution'],
                    producers: ['Allan Carr'],
                    winner: true,
                  },
                ],
                totalPages: 1,
                totalElements: 1,
                number: 0,
                size: 15,
                first: true,
                last: true,
                empty: false,
                numberOfElements: 1,
              }),
          },
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(App);
    await TestBed.inject(Router).navigateByUrl('/');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('shows the shell and the dashboard', () => {
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Frontend Angular Test');
    expect(text).toContain('Dashboard');
    expect(text).toContain('List');
    expect(text).toContain('List years with multiple winners');
    expect(text).toContain('1986');
  });

  it('opens the list from the side navigation', async () => {
    const link = fixture.nativeElement.querySelector('a[href="/list"]') as HTMLAnchorElement;
    link.click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('List movies');
    expect(fixture.nativeElement.textContent).toContain("Can't Stop the Music");
  });

  it('toggles dark mode and remembers the choice', () => {
    document.documentElement.classList.remove('dark');
    localStorage.removeItem('theme');
    fixture.componentInstance.theme.set('light');
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('[data-theme-toggle]') as HTMLButtonElement;
    const title = fixture.nativeElement.querySelector('header span') as HTMLSpanElement;
    expect(button.getAttribute('aria-label')).toBe('Dark mode');
    expect(button.getAttribute('title')).toBe('Dark mode');
    expect(button.classList.contains('cursor-pointer')).toBe(true);
    expect(title.classList.contains('cursor-default')).toBe(true);
    button.click();
    fixture.detectChanges();

    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(localStorage.getItem('theme')).toBe('dark');
    expect(button.getAttribute('aria-label')).toBe('Light mode');
    expect(button.getAttribute('title')).toBe('Light mode');

    button.click();
    fixture.detectChanges();
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(localStorage.getItem('theme')).toBe('light');
  });

  it('toggles the mobile navigation', () => {
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    button.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#side-nav')?.classList.contains('flex')).toBe(true);
  });
});
