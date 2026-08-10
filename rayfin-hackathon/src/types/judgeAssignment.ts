import type { AuthUser } from '@/services/IAuthService';

export const MAX_JUDGES_PER_PROJECT = 2;

export interface JudgeAssignmentRecord {
  id: string;
  submissionId: string;
  slot: number;
  judgeUserId: string;
  createdAt: string;
}

export function createJudgeAssignment(
  submissionId: string,
  slot: number,
  judge: AuthUser
): JudgeAssignmentRecord {
  return {
    id: crypto.randomUUID(),
    submissionId,
    slot,
    judgeUserId: judge.id,
    createdAt: new Date().toISOString(),
  };
}
