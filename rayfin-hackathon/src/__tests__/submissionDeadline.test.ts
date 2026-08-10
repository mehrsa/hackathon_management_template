import { describe, expect, it } from 'vitest';

import {
  formatDeadlineForDisplay,
  formatDeadlineForInput,
  isSubmissionClosed,
  parseConfiguredDeadline,
} from '@/utils/submissionDeadline';

describe('submissionDeadline helpers', () => {
  it('treats non-string values as unset deadlines', () => {
    expect(parseConfiguredDeadline({})).toBeNull();
    expect(formatDeadlineForDisplay({})).toBeNull();
    expect(formatDeadlineForInput({})).toBe('');
    expect(isSubmissionClosed({})).toBe(false);
  });
});
