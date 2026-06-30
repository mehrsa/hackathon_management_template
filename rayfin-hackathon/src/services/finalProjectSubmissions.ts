import { getRayfinClient } from '@/services/rayfinClient';
import type { FinalProjectSubmissionRecord } from '@/types/finalProjectSubmission';

const finalProjectSubmissionFields = [
  'id',
  'ownerUserId',
  'ownerEmail',
  'submitterName',
  'teamName',
  'teamMembers',
  'projectSummary',
  'assetLinks',
  'feedbackNotes',
  'createdAt',
  'updatedAt',
] as const;

function normalizeText(value: string | null | undefined): string {
  return typeof value === 'string' ? value : '';
}

function normalizeFinalProjectSubmissionRow(
  row: Partial<FinalProjectSubmissionRecord>
): FinalProjectSubmissionRecord {
  return {
    id: normalizeText(row.id),
    ownerUserId: normalizeText(row.ownerUserId),
    ownerEmail: normalizeText(row.ownerEmail),
    submitterName: normalizeText(row.submitterName),
    teamName: normalizeText(row.teamName),
    teamMembers: normalizeText(row.teamMembers),
    projectSummary: normalizeText(row.projectSummary),
    assetLinks: normalizeText(row.assetLinks),
    feedbackNotes: normalizeText(row.feedbackNotes),
    createdAt: normalizeText(row.createdAt),
    updatedAt: normalizeText(row.updatedAt),
  };
}

export async function fetchFinalProjectSubmissions(): Promise<FinalProjectSubmissionRecord[]> {
  const client = getRayfinClient();

  const rows = await client.data.FinalProjectSubmission.select(finalProjectSubmissionFields)
    .orderBy({ updatedAt: 'desc' })
    .execute();

  return rows.map((row) => normalizeFinalProjectSubmissionRow(row));
}

export async function fetchMyFinalProjectSubmission(
  ownerUserId: string
): Promise<FinalProjectSubmissionRecord | null> {
  const client = getRayfinClient();
  const rows = await client.data.FinalProjectSubmission.select(finalProjectSubmissionFields)
    .where({ ownerUserId: { eq: ownerUserId } })
    .orderBy({ updatedAt: 'desc' })
    .execute();

  return rows[0] ? normalizeFinalProjectSubmissionRow(rows[0]) : null;
}

export async function createFinalProjectSubmission(submission: FinalProjectSubmissionRecord) {
  const client = getRayfinClient();
  await client.data.FinalProjectSubmission.create(submission);
}

export async function updateFinalProjectSubmission(submission: FinalProjectSubmissionRecord) {
  const client = getRayfinClient();
  await client.data.FinalProjectSubmission.update({ id: submission.id }, submission);
}

export async function deleteFinalProjectSubmission(id: string) {
  const client = getRayfinClient();
  await client.data.FinalProjectSubmission.delete({ id });
}
