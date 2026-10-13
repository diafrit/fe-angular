import { afterNextRender, Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideLayoutDashboard,
  lucideList,
  lucideMenu,
  lucideMoon,
  lucideSun,
} from '@ng-icons/lucide';
import { HlmButton } from '@spartan-ng/helm/button';
import { dismissBootScreen } from './core/boot';
import { applyTheme, currentTheme, themeStorageKey, type ThemeChoice } from './core/theme';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, HlmButton, NgIcon],
  providers: [
    provideIcons({ lucideLayoutDashboard, lucideList, lucideMenu, lucideMoon, lucideSun }),
  ],
  templateUrl: './app.html',
})
export class App {
  private readonly destroyRef = inject(DestroyRef);

  readonly menuOpen = signal(false);
  readonly theme = signal<ThemeChoice>(currentTheme());
  readonly themeLabel = computed(() => (this.theme() === 'dark' ? 'Light mode' : 'Dark mode'));

  constructor() {
    afterNextRender(() => dismissBootScreen());
    applyTheme(this.theme(), false);
    const media = window.matchMedia?.('(prefers-color-scheme: dark)');
    const onChange = () => {
      if (localStorage.getItem(themeStorageKey)) {
        return;
      }
      const next = currentTheme();
      this.theme.set(next);
      applyTheme(next, false);
    };
    media?.addEventListener?.('change', onChange);
    this.destroyRef.onDestroy(() => media?.removeEventListener?.('change', onChange));
  }

  toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  toggleTheme(): void {
    const next: ThemeChoice = this.theme() === 'dark' ? 'light' : 'dark';
    this.theme.set(next);
    applyTheme(next, true);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }
}
