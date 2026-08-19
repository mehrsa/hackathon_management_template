export const MIN_CRITERION_SCORE = 1;
export const MAX_CRITERION_SCORE = 5;

export interface JudgingEntryRecord {
  id: string;
  submissionId: string;
  judgeUserId: string;
  judgeName?: string;
  judgeEmail: string;
  scores: Record<string, number>;
  notes: string;
  starred: boolean;
  createdAt: string;
  updatedAt: string;
}

export function getLatestJudgingEntriesByJudge(
  entries: JudgingEntryRecord[]
): JudgingEntryRecord[] {
  const latestByJudge = new Map<string, JudgingEntryRecord>();

  for (const entry of entries) {
    const key = entry.judgeUserId || entry.judgeEmail || entry.id;
    const current = latestByJudge.get(key);

    if (!current || current.updatedAt.localeCompare(entry.updatedAt) < 0) {
      latestByJudge.set(key, entry);
    }
  }

  return [...latestByJudge.values()];
}

export function createEmptyJudgingEntry(
  submissionId: string,
  judge: { id: string; email: string; name: string }
): JudgingEntryRecord {
  const now = new Date().toISOString();

  return {
    id: crypto.randomUUID(),
    submissionId,
    judgeUserId: judge.id,
    judgeName: judge.name,
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
