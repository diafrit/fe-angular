import { InjectionToken } from '@angular/core';

export const MOVIES_API_URL = new InjectionToken<string>('MOVIES_API_URL', {
  providedIn: 'root',
  factory: () => 'https://challenge.outsera.tech/api/movies',
});
