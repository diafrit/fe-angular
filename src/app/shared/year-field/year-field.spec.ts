import { ComponentFixture, TestBed } from '@angular/core/testing';
import { YearField } from './year-field';

describe('YearField', () => {
  let fixture: ComponentFixture<YearField>;
  let input: HTMLInputElement;
  const committed: string[] = [];

  beforeEach(() => {
    committed.length = 0;
    TestBed.configureTestingModule({});
    fixture = TestBed.createComponent(YearField);
    fixture.componentRef.setInput('inputId', 'year');
    fixture.componentRef.setInput('label', 'Search by year');
    fixture.componentRef.setInput('placeholder', 'Search by year');
    fixture.componentRef.setInput('years', [1980, 1986, 2014, 2015, 9999]);
    fixture.detectChanges();
    fixture.componentInstance.commit.subscribe((value) => committed.push(value));
    input = fixture.nativeElement.querySelector('input');
  });

  it('keeps only a masked year and withholds a partial search value', () => {
    typeValue('19a8');
    expect(input.value).toBe('198');
    expect(committed).toEqual([]);

    const year = new Date().getFullYear();
    typeValue(String(year + 1));
    expect(input.value).not.toBe(String(year + 1));
    expect(Number(input.value)).toBeLessThanOrEqual(year);
    expect(input.value.length).toBeLessThan(4);

    typeValue(`${year}9`);
    expect(input.value).toBe(String(year));
    expect(committed.at(-1)).toBe(String(year));
  });

  it('blocks a digit that would pass the current year before it lands', () => {
    const tooBig = String(new Date().getFullYear() + 1);
    const prefix = tooBig.slice(0, -1);
    input.value = prefix;
    input.setSelectionRange(prefix.length, prefix.length);
    fixture.componentInstance.text.set(prefix);
    const event = new InputEvent('beforeinput', {
      bubbles: true,
      cancelable: true,
      data: tooBig.slice(-1),
      inputType: 'insertText',
    });
    input.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    expect(input.value).toBe(prefix);
    expect(input.value).not.toBe(tooBig);
  });

  it('filters catalog years and chooses one with the keyboard', () => {
    typeValue('201');
    fixture.detectChanges();
    const labels = optionLabels();
    expect(labels).toEqual(['2015', '2014']);
    expect(labels).not.toContain('1980');
    expect(labels).not.toContain('9999');

    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    fixture.detectChanges();
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    fixture.detectChanges();

    expect(input.value).toBe('2015');
    expect(committed.at(-1)).toBe('2015');
    expect(fixture.nativeElement.querySelector('[role="listbox"]')).toBeNull();
  });

  it('chooses a suggestion with a click', () => {
    input.dispatchEvent(new Event('focus'));
    fixture.detectChanges();
    const option = [...fixture.nativeElement.querySelectorAll('[role="option"]')].find(
      (node) => (node.textContent ?? '').trim() === '1986',
    ) as HTMLButtonElement;
    option.click();
    fixture.detectChanges();
    expect(input.value).toBe('1986');
    expect(committed.at(-1)).toBe('1986');
  });

  it('shows a restored year without emitting a search', () => {
    const restored = TestBed.createComponent(YearField);
    restored.componentRef.setInput('inputId', 'restored-year');
    restored.componentRef.setInput('label', 'Search by year');
    restored.componentRef.setInput('value', '1986');
    const commits: string[] = [];
    restored.componentInstance.commit.subscribe((value) => commits.push(value));
    restored.detectChanges();

    expect((restored.nativeElement.querySelector('input') as HTMLInputElement).value).toBe('1986');
    expect(commits).toEqual([]);
  });

  it('clears a selected year from the field', () => {
    expect(fixture.nativeElement.querySelector('[aria-label="Clear year"]')).toBeNull();
    typeValue('1986');
    fixture.detectChanges();

    const clear = fixture.nativeElement.querySelector(
      '[aria-label="Clear year"]',
    ) as HTMLButtonElement;
    clear.click();
    fixture.detectChanges();

    expect(clear.getAttribute('title')).toBe('Clear');
    expect(input.value).toBe('');
    expect(committed.at(-1)).toBe('');
    expect(fixture.nativeElement.querySelector('[aria-label="Clear year"]')).toBeNull();
  });

  function typeValue(value: string): void {
    input.value = value;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  function optionLabels(): string[] {
    return [...fixture.nativeElement.querySelectorAll('[role="option"]')].map((node) =>
      (node.textContent ?? '').trim(),
    );
  }
});
