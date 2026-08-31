import { getRayfinClient } from '@/services/rayfinClient';

export interface ResultProjectDescriptionRecord {
  id: string;
  submissionId: string;
  projectTitle: string;
  description: string;
  projectLinks: string;
  updatedAt: string;
}

const fields = [
  'id',
  'submissionId',
  'projectTitle',
  'description',
  'projectLinks',
  'updatedAt',
] as const;

function isMissingEntityError(error: unknown): error is Error {
  return (
    error instanceof Error &&
    error.message.includes('ResultProjectDescription') &&
    error.message.includes('does not exist')
  );
}

function createSchemaError(): Error {
  return new Error(
    'The current Rayfin schema does not include public result descriptions yet. Run `rayfin up` to apply the latest schema, then try again.'
  );
}

export async function fetchResultProjectDescriptions(): Promise<
  ResultProjectDescriptionRecord[]
> {
  const client = getRayfinClient();

  try {
    const rows = await client.data.ResultProjectDescription.select(fields).execute();
    return rows.map((row) => ({
      ...row,
      projectTitle: row.projectTitle ?? '',
      projectLinks: row.projectLinks ?? '',
    }));
  } catch (error) {
    if (isMissingEntityError(error)) return [];
    throw error;
  }
}

export async function createResultProjectDescription(
  record: ResultProjectDescriptionRecord
): Promise<void> {
  const client = getRayfinClient();

  try {
    await client.data.ResultProjectDescription.create(record);
  } catch (error) {
    if (isMissingEntityError(error)) throw createSchemaError();
    throw error;
  }
}

export async function updateResultProjectDescription(
  record: ResultProjectDescriptionRecord
): Promise<void> {
  const client = getRayfinClient();

  try {
    await client.data.ResultProjectDescription.update({ id: record.id }, record);
  } catch (error) {
    if (isMissingEntityError(error)) throw createSchemaError();
    throw error;
  }
}
