import { applyTheme, currentTheme, themeStorageKey } from './theme';

describe('currentTheme', () => {
  afterEach(() => {
    localStorage.removeItem(themeStorageKey);
    document.documentElement.classList.remove('dark');
    mockMatchMedia(false);
  });

  it('follows the system preference until a choice is stored', () => {
    localStorage.removeItem(themeStorageKey);
    mockMatchMedia(true);
    expect(currentTheme()).toBe('dark');
    mockMatchMedia(false);
    expect(currentTheme()).toBe('light');
    localStorage.setItem(themeStorageKey, 'dark');
    expect(currentTheme()).toBe('dark');
  });

  it('applies the class and persists only when asked', () => {
    applyTheme('dark', false);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(localStorage.getItem(themeStorageKey)).toBeNull();
    applyTheme('light', true);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(localStorage.getItem(themeStorageKey)).toBe('light');
  });
});

function mockMatchMedia(matches: boolean): void {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: (query: string) => ({
      matches,
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    }),
  });
}
