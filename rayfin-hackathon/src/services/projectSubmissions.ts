import { PROJECT_SUBMISSION_LIMITS } from '@/constants/projectSubmissionLimits';
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

function validateMaxLength(label: string, value: string, max: number) {
  if (value.length > max) {
    throw new Error(`${label} must be ${max} characters or fewer.`);
  }
}

function validateProjectSubmission(submission: ProjectSubmissionRecord) {
  validateMaxLength('User ID', submission.ownerUserId, PROJECT_SUBMISSION_LIMITS.ownerUserId);
  validateMaxLength('Owner email', submission.ownerEmail, PROJECT_SUBMISSION_LIMITS.ownerEmail);
  validateMaxLength(
    'Project lead email',
    submission.submitterName,
    PROJECT_SUBMISSION_LIMITS.submitterName
  );
  validateMaxLength('Project title', submission.projectTitle, PROJECT_SUBMISSION_LIMITS.projectTitle);
  validateMaxLength('Team members', submission.teamMembers, PROJECT_SUBMISSION_LIMITS.teamMembers);
  validateMaxLength('Team emails', submission.teamEmails, PROJECT_SUBMISSION_LIMITS.teamEmails);
  validateMaxLength('App theme', submission.appTheme, PROJECT_SUBMISSION_LIMITS.appTheme);
  validateMaxLength('Team roles', submission.teamRoles, PROJECT_SUBMISSION_LIMITS.teamRoles);
  validateMaxLength('Created timestamp', submission.createdAt, PROJECT_SUBMISSION_LIMITS.createdAt);
  validateMaxLength('Updated timestamp', submission.updatedAt, PROJECT_SUBMISSION_LIMITS.updatedAt);
}

function isOutdatedProjectSubmissionSchemaError(error: unknown): error is Error {
  return (
    error instanceof Error &&
    error.message.includes('ProjectSubmission') &&
    error.message.includes('does not exist')
  );
}

function toProjectSubmissionError(error: unknown): Error {
  if (isOutdatedProjectSubmissionSchemaError(error)) {
    return new Error(
      'The current Rayfin registration schema is older than this app. Run `rayfin up` to apply the latest schema, then try again.'
    );
  }

  return error instanceof Error ? error : new Error('Unable to complete the registration request.');
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
  try {
    const rows = await client.data.ProjectSubmission.select(projectSubmissionFields)
      .orderBy({ updatedAt: 'desc' })
      .execute();

    return rows.map((row) => normalizeProjectSubmissionRow(row));
  } catch (error) {
    throw toProjectSubmissionError(error);
  }
}

export async function fetchMyProjectSubmission(
  ownerUserId: string
): Promise<ProjectSubmissionRecord | null> {
  const client = getRayfinClient();
  try {
    const rows = await client.data.ProjectSubmission.select(projectSubmissionFields)
      .where({ ownerUserId: { eq: ownerUserId } })
      .orderBy({ updatedAt: 'desc' })
      .execute();

    return rows[0] ? normalizeProjectSubmissionRow(rows[0]) : null;
  } catch (error) {
    throw toProjectSubmissionError(error);
  }
}

export async function createProjectSubmission(submission: ProjectSubmissionRecord) {
  const client = getRayfinClient();
  validateProjectSubmission(submission);

  try {
    await client.data.ProjectSubmission.create(submission);
  } catch (error) {
    throw toProjectSubmissionError(error);
  }
}

export async function updateProjectSubmission(submission: ProjectSubmissionRecord) {
  const client = getRayfinClient();
  validateProjectSubmission(submission);

  try {
    await client.data.ProjectSubmission.update({ id: submission.id }, submission);
  } catch (error) {
    throw toProjectSubmissionError(error);
  }
}

export async function deleteProjectSubmission(id: string) {
  const client = getRayfinClient();
  try {
    await client.data.ProjectSubmission.delete({ id });
  } catch (error) {
    throw toProjectSubmissionError(error);
  }
}
