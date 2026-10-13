export function dismissBootScreen(): void {
  document.getElementById('app-boot')?.remove();
}

export function showBootFailure(): void {
  const boot = document.getElementById('app-boot');
  if (!boot) {
    return;
  }
  boot.dataset['failed'] = 'true';
  const status = boot.querySelector('[data-boot-status]');
  if (status) {
    status.textContent = 'The page could not be loaded.';
  }
  const retry = boot.querySelector('[data-boot-retry]');
  if (retry instanceof HTMLElement) {
    retry.hidden = false;
  }
}
