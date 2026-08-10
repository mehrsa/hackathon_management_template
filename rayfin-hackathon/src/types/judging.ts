export const MIN_CRITERION_SCORE = 1;
export const MAX_CRITERION_SCORE = 5;

export interface JudgingEntryRecord {
  id: string;
  submissionId: string;
  judgeUserId: string;
  judgeEmail: string;
  scores: Record<string, number>;
  notes: string;
  starred: boolean;
  createdAt: string;
  updatedAt: string;
}

export function createEmptyJudgingEntry(
  submissionId: string,
  judge: { id: string; email: string }
): JudgingEntryRecord {
  const now = new Date().toISOString();

  return {
    id: crypto.randomUUID(),
    submissionId,
    judgeUserId: judge.id,
    judgeEmail: judge.email,
    scores: {},
    notes: '',
    starred: false,
    createdAt: now,
    updatedAt: now,
  };
}

export function getJudgingTotal(scores: Record<string, number>, criterionIds: string[]): number {
  return criterionIds.reduce((total, criterionId) => total + (scores[criterionId] ?? 0), 0);
}
