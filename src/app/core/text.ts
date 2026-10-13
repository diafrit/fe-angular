import { HttpErrorResponse } from '@angular/common/http';

export function maskYearInput(raw: string, maxYear = new Date().getFullYear()): string {
  let accepted = '';
  for (const char of raw) {
    if (char < '0' || char > '9') {
      continue;
    }
    if (accepted.length >= 4) {
      break;
    }
    const next = accepted + char;
    if (Number(next) > maxYear) {
      break;
    }
    accepted = next;
  }
  return accepted;
}

export function matchingYears(
  years: readonly number[],
  prefix: string,
  maxYear = new Date().getFullYear(),
): number[] {
  const seen = new Set<number>();
  const matches: number[] = [];
  for (const year of years) {
    if (!Number.isInteger(year) || year < 1000 || year > maxYear) {
      continue;
    }
    const label = String(year);
    if (label.length !== 4 || !label.startsWith(prefix)) {
      continue;
    }
    if (seen.has(year)) {
      continue;
    }
    seen.add(year);
    matches.push(year);
  }
  matches.sort((left, right) => right - left);
  return matches;
}

export function pageWindow(current: number, total: number, size = 5): number[] {
  if (total <= 0 || current < 1) {
    return [];
  }
  const length = Math.min(size, total);
  let start = Math.max(1, current - Math.floor(size / 2));
  let end = start + length - 1;
  if (end > total) {
    end = total;
    start = Math.max(1, end - length + 1);
  }
  const pages: number[] = [];
  for (let page = start; page <= end; page += 1) {
    pages.push(page);
  }
  return pages;
}

const networkMessage = 'Could not reach the Golden Raspberry Awards API.';

function apiMessage(body: unknown): string | undefined {
  if (typeof body === 'string' && body.trim()) {
    return body;
  }
  if (body && typeof body === 'object') {
    const record = body as { detail?: unknown; message?: unknown; title?: unknown };
    for (const value of [record.detail, record.message, record.title]) {
      if (typeof value === 'string' && value.trim()) {
        return value;
      }
    }
  }
  return undefined;
}

function isNetworkFailure(error: HttpErrorResponse, detail: string | undefined): boolean {
  const message = `${error.message} ${detail ?? ''}`;
  return error.status === 0 || /failed to fetch|networkerror|load failed/i.test(message);
}

export function readApiError(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    const detail = apiMessage(error.error);
    if (isNetworkFailure(error, detail)) {
      return networkMessage;
    }
    if (detail) {
      return detail;
    }
    return `Request failed (${error.status}).`;
  }
  return 'Unexpected error.';
}
