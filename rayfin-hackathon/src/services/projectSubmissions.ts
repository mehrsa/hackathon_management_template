import { getRayfinClient } from '@/services/rayfinClient';
import type { ProjectSubmissionRecord } from '@/types/projectSubmission';

const projectSubmissionFields = [
  'id',
  'ownerUserId',
  'ownerEmail',
  'submitterName',
  'projectTitle',
  'teamMembers',
  'teamEmails',
  'appTheme',
  'teamRoles',
  'createdAt',
  'updatedAt',
] as const;

function normalizeText(value: string | null | undefined): string {
  return typeof value === 'string' ? value : '';
}

function normalizeProjectSubmissionRow(
  row: Partial<ProjectSubmissionRecord>
): ProjectSubmissionRecord {
  return {
    id: normalizeText(row.id),
    ownerUserId: normalizeText(row.ownerUserId),
    ownerEmail: normalizeText(row.ownerEmail),
    submitterName: normalizeText(row.submitterName),
    projectTitle: normalizeText(row.projectTitle),
    teamMembers: normalizeText(row.teamMembers),
    teamEmails: normalizeText(row.teamEmails),
    appTheme: normalizeText(row.appTheme),
    teamRoles: normalizeText(row.teamRoles),
    createdAt: normalizeText(row.createdAt),
    updatedAt: normalizeText(row.updatedAt),
  };
}

export async function fetchProjectSubmissions(): Promise<ProjectSubmissionRecord[]> {
  const client = getRayfinClient();

  const rows = await client.data.ProjectSubmission.select(projectSubmissionFields)
    .orderBy({ updatedAt: 'desc' })
    .execute();

  return rows.map((row) => normalizeProjectSubmissionRow(row));
}

export async function fetchMyProjectSubmission(
  ownerUserId: string
): Promise<ProjectSubmissionRecord | null> {
  const client = getRayfinClient();
  const rows = await client.data.ProjectSubmission.select(projectSubmissionFields)
    .where({ ownerUserId: { eq: ownerUserId } })
    .orderBy({ updatedAt: 'desc' })
    .execute();

  return rows[0] ? normalizeProjectSubmissionRow(rows[0]) : null;
}

export async function createProjectSubmission(submission: ProjectSubmissionRecord) {
  const client = getRayfinClient();
  await client.data.ProjectSubmission.create(submission);
}

export async function updateProjectSubmission(submission: ProjectSubmissionRecord) {
  const client = getRayfinClient();
  await client.data.ProjectSubmission.update({ id: submission.id }, submission);
}

export async function deleteProjectSubmission(id: string) {
  const client = getRayfinClient();
  await client.data.ProjectSubmission.delete({ id });
}
