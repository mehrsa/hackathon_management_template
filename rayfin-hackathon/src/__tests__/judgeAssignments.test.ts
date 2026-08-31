import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  assignJudgeToProject,
  assignJudgeToProjectAsAdmin,
  isAssignmentForJudge,
  unassignJudgeFromProject,
  unassignJudgeFromProjectAsAdmin,
} from '@/services/judgeAssignments';

const assignmentSelectMock = vi.fn();
const assignmentCreateMock = vi.fn();
const assignmentDeleteMock = vi.fn();

vi.mock('@/services/rayfinClient', () => ({
  getRayfinClient: () => ({
    data: {
      JudgeAssignment: {
        select: (...args: unknown[]) => assignmentSelectMock(...args),
        create: (...args: unknown[]) => assignmentCreateMock(...args),
        delete: (...args: unknown[]) => assignmentDeleteMock(...args),
      },
    },
  }),
}));

describe('judgeAssignments service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects a third judge before creating another assignment', async () => {
    assignmentSelectMock.mockReturnValue({
      execute: vi.fn().mockResolvedValue([
        {
          id: '11111111-1111-4111-8111-111111111111',
          submissionId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
          slot: 1,
          judgeUserId: 'judge-2',
          createdAt: '2026-08-10T10:00:00.000Z',
        },
        {
          id: '22222222-2222-4222-8222-222222222222',
          submissionId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
          slot: 2,
          judgeUserId: 'judge-3',
          createdAt: '2026-08-10T10:01:00.000Z',
        },
      ]),
    });

    await expect(
      assignJudgeToProject('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', {
        id: 'judge-1',
        email: 'judge@example.com',
        name: 'Judge Example',
      })
    ).rejects.toThrow('This project already has two judges assigned.');

    expect(assignmentCreateMock).not.toHaveBeenCalled();
    expect(assignmentDeleteMock).not.toHaveBeenCalled();
  });

  it('lets a judge delete their own assignment', async () => {
    const assignment = {
      id: '11111111-1111-4111-8111-111111111111',
      submissionId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      slot: 1,
      judgeUserId: 'judge-1',
      createdAt: '2026-08-10T10:00:00.000Z',
    };

    await unassignJudgeFromProject(assignment, 'judge-1');

    expect(assignmentDeleteMock).toHaveBeenCalledWith({ id: assignment.id });
  });

  it('refuses to delete another judge assignment', async () => {
    await expect(
      unassignJudgeFromProject(
        {
          id: '11111111-1111-4111-8111-111111111111',
          submissionId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
          slot: 1,
          judgeUserId: 'judge-2',
          createdAt: '2026-08-10T10:00:00.000Z',
        },
        'judge-1'
      )
    ).rejects.toThrow('You can only unassign yourself from a project.');

    expect(assignmentDeleteMock).not.toHaveBeenCalled();
  });

  it('lets an admin delete another judge assignment', async () => {
    await unassignJudgeFromProjectAsAdmin('11111111-1111-4111-8111-111111111111');

    expect(assignmentDeleteMock).toHaveBeenCalledWith({
      id: '11111111-1111-4111-8111-111111111111',
    });
  });

  it('creates an email-backed assignment for an admin-selected judge', async () => {
    assignmentSelectMock
      .mockReturnValueOnce({
        execute: vi.fn().mockResolvedValue([]),
      })
      .mockReturnValueOnce({
        execute: vi.fn().mockImplementation(async () => [assignmentCreateMock.mock.calls[0][0]]),
      });
    assignmentCreateMock.mockResolvedValueOnce(undefined);

    const assignment = await assignJudgeToProjectAsAdmin(
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      ' Replacement@Example.com '
    );

    expect(assignment.judgeUserId).toBe('email:replacement@example.com');
    expect(assignment.judgeEmail).toBe('replacement@example.com');
    expect(assignmentCreateMock).toHaveBeenCalledWith(assignment);
  });

  it('matches an admin-created assignment when that judge signs in', () => {
    expect(
      isAssignmentForJudge(
        {
          id: '11111111-1111-4111-8111-111111111111',
          submissionId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
          slot: 1,
          judgeUserId: 'email:judge@example.com',
          judgeEmail: 'judge@example.com',
          createdAt: '2026-08-20T10:00:00.000Z',
        },
        {
          id: 'entra-user-id',
          email: 'Judge@Example.com',
        }
      )
    ).toBe(true);
  });
});
