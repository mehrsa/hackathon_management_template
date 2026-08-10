function pad(value: number): string {
  return String(value).padStart(2, '0');
}

export function parseConfiguredDeadline(value: unknown): Date | null {
  if (typeof value !== 'string' || !value.trim()) {
    return null;
  }

  const deadline = new Date(value);
  return Number.isNaN(deadline.getTime()) ? null : deadline;
}

export function formatDeadlineForDisplay(value: unknown): string | null {
  const deadline = parseConfiguredDeadline(value);
  return deadline ? deadline.toLocaleString() : null;
}

export function formatDeadlineForInput(value: unknown): string {
  const deadline = parseConfiguredDeadline(value);

  if (!deadline) {
    return '';
  }

  return [
    deadline.getFullYear(),
    pad(deadline.getMonth() + 1),
    pad(deadline.getDate()),
  ].join('-') + `T${pad(deadline.getHours())}:${pad(deadline.getMinutes())}`;
}

export function parseDeadlineInput(value: string): string | null {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const deadline = new Date(trimmed);

  if (Number.isNaN(deadline.getTime())) {
    throw new Error('Enter a valid submission deadline.');
  }

  return deadline.toISOString();
}

export function isSubmissionClosed(value: unknown, now: Date = new Date()): boolean {
  const deadline = parseConfiguredDeadline(value);
  return deadline ? now.getTime() >= deadline.getTime() : false;
}
