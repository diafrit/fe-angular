import { Routes } from '@angular/router';
import { Dashboard } from './features/dashboard/dashboard';
import { MovieList } from './features/movies/movie-list';

export const routes: Routes = [
  { path: '', component: Dashboard },
  { path: 'list', component: MovieList },
  { path: '**', redirectTo: '' },
];
