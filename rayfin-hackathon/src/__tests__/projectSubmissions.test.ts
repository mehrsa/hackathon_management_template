import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createProjectSubmission,
  fetchMyProjectSubmission,
} from '@/services/projectSubmissions';
import type { ProjectSubmissionRecord } from '@/types/projectSubmission';

const projectSubmissionSelectMock = vi.fn();
const projectSubmissionCreateMock = vi.fn();

vi.mock('@/services/rayfinClient', () => ({
  getRayfinClient: () => ({
    data: {
      ProjectSubmission: {
        select: (...args: unknown[]) => projectSubmissionSelectMock(...args),
        create: (...args: unknown[]) => projectSubmissionCreateMock(...args),
      },
    },
  }),
}));

function buildSubmission(
  overrides: Partial<ProjectSubmissionRecord> = {}
): ProjectSubmissionRecord {
  return {
    id: 'submission-1',
    ownerUserId: 'user-1',
    ownerEmail: 'member@example.com',
    submitterName: 'member@example.com',
    projectTitle: 'Team Atlas',
    teamMembers: 'Member Example, Jane Doe',
    teamEmails: 'member@example.com, jane@example.com',
    appTheme: 'AI onboarding assistant',
    teamRoles: 'Member Example - Engineer, Jane Doe - Designer',
    createdAt: '2026-07-09T12:00:00.000Z',
    updatedAt: '2026-07-09T12:00:00.000Z',
    ...overrides,
  };
}

describe('projectSubmissions service', () => {
  beforeEach(() => {
    projectSubmissionSelectMock.mockReset();
    projectSubmissionCreateMock.mockReset();
  });

  it('surfaces an actionable schema error when ProjectSubmission is missing in the backend', async () => {
    const executeMock = vi.fn().mockRejectedValue(
      new Error('GraphQL errors: The field `ownerEmail` does not exist on the type `ProjectSubmission`.')
    );

    projectSubmissionSelectMock.mockReturnValue({
      where: () => ({
        orderBy: () => ({
          execute: executeMock,
        }),
      }),
    });

    await expect(fetchMyProjectSubmission('user-1')).rejects.toThrow(
      'The current Rayfin registration schema is older than this app. Run `rayfin up` to apply the latest schema, then try again.'
    );
  });

  it('validates submission lengths before sending the mutation', async () => {
    await expect(
      createProjectSubmission(
        buildSubmission({
          projectTitle: 'A'.repeat(161),
        })
      )
    ).rejects.toThrow('Project title must be 160 characters or fewer.');

    expect(projectSubmissionCreateMock).not.toHaveBeenCalled();
  });

  it('allows longer theme descriptions up to the raised limit', async () => {
    projectSubmissionCreateMock.mockResolvedValueOnce(undefined);

    await expect(
      createProjectSubmission(
        buildSubmission({
          appTheme: 'A'.repeat(2000),
        })
      )
    ).resolves.toBeUndefined();

    expect(projectSubmissionCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        appTheme: 'A'.repeat(2000),
      })
    );
  });
});
