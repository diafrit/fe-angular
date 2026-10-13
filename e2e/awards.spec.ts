import { expect, test } from '@playwright/test';

test('dashboard lists awards data and winners for a year', async ({ page }) => {
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'List years with multiple winners' }),
  ).toBeVisible();
  await expect(page.getByRole('cell', { name: '1986' }).first()).toBeVisible();
  await expect(page.getByRole('cell', { name: 'Columbia Pictures' })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'Matthew Vaughn' })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'Joel Silver' })).toBeVisible();

  await page.getByLabel('Search by year').fill('1986');
  await page.getByRole('button', { name: 'Search' }).click();
  await expect(page.getByRole('cell', { name: 'Howard the Duck' })).toBeVisible();

  await page.getByLabel('Search by year').fill('1900');
  await page.getByRole('button', { name: 'Search' }).click();
  await expect(page.getByText('No winners found for 1900.')).toBeVisible();

  await page.getByRole('button', { name: 'Clear year' }).click();
  await expect(page.getByLabel('Search by year')).toHaveValue('');
  await expect(page.getByText('Search a year to list its winners.')).toBeVisible();
  await expect(page.getByRole('cell', { name: 'Howard the Duck' })).toHaveCount(0);
});

test('dashboard explains a failed years request', async ({ page }) => {
  await page.route('**/api/movies/yearsWithMultipleWinners', (route) => route.abort());
  await page.goto('/');
  await expect(page.getByText('Could not reach the Golden Raspberry Awards API.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Try again' }).first()).toBeVisible();
});

test('movie list paginates and filters by winner and year', async ({ page }) => {
  await page.goto('/list');
  await expect(page.getByRole('heading', { name: 'List movies' })).toBeVisible();
  await expect(page.getByRole('cell', { name: "Can't Stop the Music" })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'Yes' }).first()).toBeVisible();

  await page
    .getByRole('navigation', { name: 'Pagination' })
    .getByRole('button', { name: '2', exact: true })
    .click();
  await expect(page.getByRole('cell', { name: "Can't Stop the Music" })).toHaveCount(0);

  await page.getByLabel('Filter by winner').selectOption('true');
  await expect(page.getByRole('cell', { name: 'No' })).toHaveCount(0);
  await expect(page.getByRole('cell', { name: 'Yes' }).first()).toBeVisible();

  await page.getByLabel('Filter by year').fill('1900');
  await expect(page.getByText('No movies found.')).toBeVisible();

  await page.getByRole('button', { name: 'Clear year' }).click();
  await expect(page.getByLabel('Filter by year')).toHaveValue('');
  await expect(page.getByRole('cell', { name: "Can't Stop the Music" })).toBeVisible();
});

test('switching sections keeps the loaded data', async ({ page }) => {
  let yearRequests = 0;
  let listRequests = 0;
  page.on('request', (request) => {
    const url = request.url();
    if (url.includes('yearsWithMultipleWinners')) {
      yearRequests += 1;
    }
    if (url.includes('/api/movies?') && url.includes('size=15')) {
      listRequests += 1;
    }
  });

  await page.goto('/');
  await expect(page.getByRole('cell', { name: '1986' }).first()).toBeVisible();
  const yearsAfterLoad = yearRequests;

  await page.getByRole('link', { name: 'List', exact: true }).click();
  await expect(page.getByRole('cell', { name: "Can't Stop the Music" })).toBeVisible();
  await page
    .getByRole('navigation', { name: 'Pagination' })
    .getByRole('button', { name: '2', exact: true })
    .click();
  await expect(page.getByRole('cell', { name: "Can't Stop the Music" })).toHaveCount(0);
  const listsAfterPage = listRequests;

  await page.getByRole('link', { name: 'Dashboard', exact: true }).click();
  await expect(page.getByRole('cell', { name: '1986' }).first()).toBeVisible();
  expect(yearRequests).toBe(yearsAfterLoad);

  await page.getByRole('link', { name: 'List', exact: true }).click();
  await expect(page.getByRole('cell', { name: "Can't Stop the Music" })).toHaveCount(0);
  expect(listRequests).toBe(listsAfterPage);
});

test('switching sections fades the page in place', async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') {
      consoleErrors.push(message.text());
    }
  });

  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'List years with multiple winners' }),
  ).toBeVisible();

  await page.evaluate(() => {
    const start = document.startViewTransition?.bind(document);
    const record = { started: 0, finished: 0, failed: 0 };
    (window as unknown as { __viewTransitions: typeof record }).__viewTransitions = record;
    if (!start) {
      return;
    }
    document.startViewTransition = (callback) => {
      record.started += 1;
      const transition = start(callback);
      transition.finished.then(
        () => {
          record.finished += 1;
        },
        () => {
          record.failed += 1;
        },
      );
      return transition;
    };
  });

  await page.getByRole('link', { name: 'List', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'List movies' })).toBeVisible();
  await page.getByRole('link', { name: 'Dashboard', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'List years with multiple winners' }),
  ).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (
            window as unknown as {
              __viewTransitions: { started: number; finished: number; failed: number };
            }
          ).__viewTransitions,
      ),
    )
    .toEqual({ started: 2, finished: 2, failed: 0 });
  await expect(page.locator('main')).toHaveCSS('view-transition-name', 'app-main');
  await expect(page.locator('header')).toHaveCSS('view-transition-name', 'app-header');
  await expect(page.locator('#side-nav')).toHaveCSS('view-transition-name', 'app-nav');
  expect(consoleErrors.filter((text) => text.toLowerCase().includes('view-transition'))).toEqual(
    [],
  );
});

test('navigation fits a narrow screen', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByRole('link', { name: 'List' }).click();
  await expect(page.getByRole('heading', { name: 'List movies' })).toBeVisible();
});
