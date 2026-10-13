import { HttpErrorResponse } from '@angular/common/http';
import { maskYearInput, matchingYears, pageWindow, readApiError } from './text';

describe('maskYearInput', () => {
  const maxYear = 2026;

  it('keeps digits and drops everything else', () => {
    expect(maskYearInput(' 19a8.6 ', maxYear)).toBe('1986');
    expect(maskYearInput('year-2015', maxYear)).toBe('2015');
  });

  it('stops at four digits', () => {
    expect(maskYearInput('19865', maxYear)).toBe('1986');
    expect(maskYearInput('20150', maxYear)).toBe('2015');
  });

  it('refuses a value above the current year', () => {
    expect(maskYearInput('2027', maxYear)).toBe('202');
    expect(maskYearInput('9999', maxYear)).toBe('999');
    expect(maskYearInput('2026', maxYear)).toBe('2026');
    expect(maskYearInput(`${maxYear}1`, maxYear)).toBe(String(maxYear));
  });

  it('uses the clock year when none is passed', () => {
    const year = new Date().getFullYear();
    expect(maskYearInput(String(year))).toBe(String(year));
    expect(maskYearInput(String(year + 1))).not.toBe(String(year + 1));
    expect(Number(maskYearInput(String(year + 1)))).toBeLessThanOrEqual(year);
  });
});

describe('matchingYears', () => {
  const maxYear = 2026;

  it('returns distinct catalog years that match the prefix, newest first', () => {
    expect(matchingYears([1980, 2015, 1980, 2014, 1986], '201', maxYear)).toEqual([2015, 2014]);
    expect(matchingYears([1980, 2015, 1986], '', maxYear)).toEqual([2015, 1986, 1980]);
  });

  it('does not invent years or offer a year past the current one', () => {
    expect(matchingYears([1980, 9999, 2015], '19', maxYear)).toEqual([1980]);
    expect(matchingYears([1980, 2015], '190', maxYear)).toEqual([]);
    expect(matchingYears([1980, maxYear + 1], String(maxYear + 1), maxYear)).toEqual([]);
  });
});

describe('pageWindow', () => {
  it('starts at the first pages', () => {
    expect(pageWindow(1, 14)).toEqual([1, 2, 3, 4, 5]);
  });

  it('centers the window on the current page', () => {
    expect(pageWindow(6, 14)).toEqual([4, 5, 6, 7, 8]);
  });

  it('sticks to the last pages', () => {
    expect(pageWindow(14, 14)).toEqual([10, 11, 12, 13, 14]);
  });

  it('returns an empty list when there are no pages', () => {
    expect(pageWindow(1, 0)).toEqual([]);
  });
});

describe('readApiError', () => {
  it('prefers the API detail, then message, then title', () => {
    expect(
      readApiError(new HttpErrorResponse({ status: 400, error: { detail: 'Bad year' } })),
    ).toBe('Bad year');
    expect(
      readApiError(new HttpErrorResponse({ status: 404, error: { message: 'Missing' } })),
    ).toBe('Missing');
    expect(readApiError(new HttpErrorResponse({ status: 500, error: { title: 'Down' } }))).toBe(
      'Down',
    );
  });

  it('explains a network failure and unknown errors', () => {
    expect(readApiError(new HttpErrorResponse({ status: 0, error: null }))).toBe(
      'Could not reach the Golden Raspberry Awards API.',
    );
    expect(
      readApiError(
        new HttpErrorResponse({ status: 0, statusText: 'Unknown Error', error: 'Failed to fetch' }),
      ),
    ).toBe('Could not reach the Golden Raspberry Awards API.');
    expect(readApiError(new Error('nope'))).toBe('Unexpected error.');
  });
});
