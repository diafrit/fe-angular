import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { HlmAlertImports } from '@spartan-ng/helm/alert';
import { HlmButton } from '@spartan-ng/helm/button';

/**
 * Destructive alert for a failed async request. The alert title is projected so
 * callers keep ownership of the heading level (h2/h3) and its exact wording.
 */
@Component({
  selector: 'app-async-error',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HlmAlertImports, HlmButton],
  // display: contents keeps the alert box as a direct child of the caller's layout.
  host: { style: 'display: contents' },
  template: `
    <div hlmAlert variant="destructive">
      <ng-content />
      <p hlmAlertDescription>{{ message() }}</p>
      @if (showRetry()) {
        <button hlmBtn type="button" variant="outline" size="sm" (click)="retry.emit()">
          Try again
        </button>
      }
    </div>
  `,
})
export class AsyncError {
  readonly message = input('');
  readonly showRetry = input(true);
  readonly retry = output<void>();
}
