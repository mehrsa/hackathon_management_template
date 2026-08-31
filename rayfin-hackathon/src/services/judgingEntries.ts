import { getRayfinClient } from '@/services/rayfinClient';
import {
  MAX_CRITERION_SCORE,
  MIN_CRITERION_SCORE,
  type JudgingEntryRecord,
} from '@/types/judging';

const judgingEntryFields = [
  'id',
  'submissionId',
  'judgeUserId',
  'judgeName',
  'judgeEmail',
  'scoresJson',
  'notes',
  'starred',
  'createdAt',
  'updatedAt',
] as const;

interface JudgingEntryRow {
  id?: string | null;
  submissionId?: string | null;
  judgeUserId?: string | null;
  judgeName?: string | null;
  judgeEmail?: string | null;
  scoresJson?: string | null;
  notes?: string | null;
  starred?: boolean | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

function normalizeText(value: string | null | undefined): string {
  return typeof value === 'string' ? value : '';
}

function parseScores(value: string | null | undefined): Record<string, number> {
  if (!value) {
    return {};
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(value);
  } catch {
    throw new Error('A saved judging score is invalid. Ask an admin to review the judging data.');
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('A saved judging score has an unsupported format.');
  }

  return Object.fromEntries(
    Object.entries(parsed).filter(
      (entry): entry is [string, number] =>
        typeof entry[1] === 'number' &&
        Number.isInteger(entry[1]) &&
        entry[1] >= MIN_CRITERION_SCORE &&
        entry[1] <= MAX_CRITERION_SCORE
    )
  );
}

function normalizeJudgingEntry(row: JudgingEntryRow): JudgingEntryRecord {
  return {
    id: normalizeText(row.id),
    submissionId: normalizeText(row.submissionId),
    judgeUserId: normalizeText(row.judgeUserId),
    judgeName: normalizeText(row.judgeName),
    judgeEmail: normalizeText(row.judgeEmail),
    scores: parseScores(row.scoresJson),
    notes: normalizeText(row.notes),
    starred: row.starred ?? false,
    createdAt: normalizeText(row.createdAt),
    updatedAt: normalizeText(row.updatedAt),
  };
}

function toPayload(entry: JudgingEntryRecord) {
  return {
    id: entry.id,
    submissionId: entry.submissionId,
    judgeUserId: entry.judgeUserId,
    judgeName: entry.judgeName || undefined,
    judgeEmail: entry.judgeEmail,
    scoresJson: JSON.stringify(entry.scores),
    notes: entry.notes || undefined,
    starred: entry.starred,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
  };
}

export async function fetchMyJudgingEntries(judgeUserId: string): Promise<JudgingEntryRecord[]> {
  const client = getRayfinClient();
  const rows = await client.data.JudgingEntry.select(judgingEntryFields)
    .where({ judgeUserId: { eq: judgeUserId } })
    .orderBy({ updatedAt: 'desc' })
    .execute();

  return rows.map((row) => normalizeJudgingEntry(row));
}

export async function fetchAllJudgingEntries(): Promise<JudgingEntryRecord[]> {
  const client = getRayfinClient();
  const rows = await client.data.JudgingEntry.select(judgingEntryFields)
    .orderBy({ updatedAt: 'desc' })
    .execute();

  return rows.map((row) => normalizeJudgingEntry(row));
}

export async function createJudgingEntry(entry: JudgingEntryRecord) {
  const client = getRayfinClient();
  await client.data.JudgingEntry.create(toPayload(entry));
}

export async function updateJudgingEntry(entry: JudgingEntryRecord) {
  const client = getRayfinClient();
  await client.data.JudgingEntry.update({ id: entry.id }, toPayload(entry));
}

export async function deleteJudgingEntry(id: string) {
  const client = getRayfinClient();
  await client.data.JudgingEntry.delete({ id });
}
