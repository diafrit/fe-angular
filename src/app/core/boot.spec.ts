import { dismissBootScreen, showBootFailure } from './boot';

describe('boot screen', () => {
  afterEach(() => {
    document.getElementById('app-boot')?.remove();
  });

  it('removes the intro once the app is ready', () => {
    document.body.insertAdjacentHTML(
      'beforeend',
      '<div id="app-boot"><p data-boot-status>Loading</p></div>',
    );
    dismissBootScreen();
    expect(document.getElementById('app-boot')).toBeNull();
  });

  it('explains a failed start and offers a reload', () => {
    document.body.insertAdjacentHTML(
      'beforeend',
      '<div id="app-boot"><div data-boot-skeleton></div><p data-boot-status>Loading</p><button type="button" data-boot-retry hidden>Reload</button></div>',
    );
    showBootFailure();
    const boot = document.getElementById('app-boot');
    expect(boot?.dataset['failed']).toBe('true');
    expect(boot?.querySelector('[data-boot-status]')?.textContent).toBe(
      'The page could not be loaded.',
    );
    expect(boot?.querySelector('[data-boot-retry]')?.hasAttribute('hidden')).toBe(false);
  });
});
