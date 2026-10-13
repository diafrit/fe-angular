import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideX } from '@ng-icons/lucide';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmLabel } from '@spartan-ng/helm/label';
import { maskYearInput, matchingYears } from '../../core/text';

@Component({
  selector: 'app-year-field',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgIcon, HlmInput, HlmLabel],
  providers: [provideIcons({ lucideX })],
  host: { class: 'relative block min-w-0' },
  templateUrl: './year-field.html',
})
export class YearField {
  private readonly destroyRef = inject(DestroyRef);
  private readonly box = viewChild<ElementRef<HTMLInputElement>>('box');

  readonly inputId = input.required<string>();
  readonly label = input.required<string>();
  readonly placeholder = input('');
  readonly years = input<number[]>([]);
  readonly disabled = input(false);
  readonly value = input('');
  readonly commit = output<string>();

  readonly text = signal('');
  readonly open = signal(false);
  readonly active = signal(-1);
  readonly panel = signal({ top: '0px', left: '0px', width: '8rem' });

  readonly matches = computed(() => matchingYears(this.years(), this.text()));
  readonly listId = computed(() => `${this.inputId()}-listbox`);
  readonly expanded = computed(() => this.open() && this.matches().length > 0);
  readonly activeId = computed(() => {
    const year = this.matches()[this.active()];
    if (!this.expanded() || year === undefined) {
      return null;
    }
    return this.optionId(year);
  });

  constructor() {
    // Mirror the external value into the field (including the initial value)
    // without clobbering an in-progress edit: text is read untracked so this
    // effect only reacts to value() changes, never to the user's own typing.
    effect(() => {
      const masked = maskYearInput(this.value());
      if (masked !== untracked(this.text)) {
        this.text.set(masked);
      }
    });

    const onMove = () => {
      if (this.open()) {
        this.place();
      }
    };
    window.addEventListener('scroll', onMove, true);
    window.addEventListener('resize', onMove);
    this.destroyRef.onDestroy(() => {
      window.removeEventListener('scroll', onMove, true);
      window.removeEventListener('resize', onMove);
    });
  }

  optionId(year: number): string {
    return `${this.inputId()}-option-${year}`;
  }

  readValue(): string {
    return maskYearInput(this.box()?.nativeElement.value ?? this.text());
  }

  onFocus(): void {
    if (this.disabled()) {
      return;
    }
    this.open.set(true);
    this.place();
  }

  onBlur(): void {
    this.open.set(false);
  }

  onBeforeInput(event: Event): void {
    if (!(event instanceof InputEvent) || !event.cancelable) {
      return;
    }
    if (
      event.inputType.startsWith('delete') ||
      event.inputType === 'historyUndo' ||
      event.inputType === 'historyRedo'
    ) {
      return;
    }
    const input = event.target;
    if (!(input instanceof HTMLInputElement)) {
      return;
    }
    const data = event.data ?? '';
    const start = input.selectionStart ?? input.value.length;
    const end = input.selectionEnd ?? start;
    const proposed = input.value.slice(0, start) + data + input.value.slice(end);
    const masked = maskYearInput(proposed);
    if (masked === proposed) {
      return;
    }
    event.preventDefault();
    this.write(input, masked);
  }

  onInput(event: Event): void {
    const input = event.target;
    if (!(input instanceof HTMLInputElement)) {
      return;
    }
    this.write(input, maskYearInput(input.value));
  }

  onKeydown(event: KeyboardEvent): void {
    const options = this.matches();
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.open.set(true);
      this.place();
      if (options.length === 0) {
        return;
      }
      this.active.update((index) => (index + 1) % options.length);
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.open.set(true);
      this.place();
      if (options.length === 0) {
        return;
      }
      this.active.update((index) => (index <= 0 ? options.length - 1 : index - 1));
      return;
    }
    if (event.key === 'Escape') {
      this.open.set(false);
      return;
    }
    if (event.key === 'Enter' && this.expanded() && this.active() >= 0) {
      const year = options[this.active()];
      if (year !== undefined) {
        event.preventDefault();
        this.pick(year);
      }
    }
  }

  clear(): void {
    const input = this.box()?.nativeElement;
    if (input && input.value !== '') {
      input.value = '';
    }
    this.active.set(-1);
    this.open.set(false);
    if (this.text() === '') {
      return;
    }
    this.text.set('');
    this.emitSettled('');
  }

  pick(year: number): void {
    const input = this.box()?.nativeElement;
    const masked = maskYearInput(String(year));
    if (input) {
      this.write(input, masked);
    } else {
      this.text.set(masked);
      this.emitSettled(masked);
    }
    this.open.set(false);
  }

  private write(input: HTMLInputElement, masked: string): void {
    if (input.value !== masked) {
      input.value = masked;
      input.setSelectionRange(masked.length, masked.length);
    }
    const changed = masked !== this.text();
    this.text.set(masked);
    this.active.set(-1);
    this.open.set(true);
    this.place();
    if (changed) {
      this.emitSettled(masked);
    }
  }

  private emitSettled(masked: string): void {
    if (masked === '' || masked.length === 4) {
      this.commit.emit(masked);
    }
  }

  private place(): void {
    const input = this.box()?.nativeElement;
    if (!input) {
      return;
    }
    const rect = input.getBoundingClientRect();
    this.panel.set({
      top: `${rect.bottom + 4}px`,
      left: `${rect.left}px`,
      width: `${Math.max(rect.width, 128)}px`,
    });
  }
}
