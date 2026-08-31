import type { AuthUser } from '@/services/IAuthService';
import { getRayfinClient } from '@/services/rayfinClient';
import {
  createJudgeAssignment,
  MAX_JUDGES_PER_PROJECT,
  type JudgeAssignmentRecord,
} from '@/types/judgeAssignment';

const judgeAssignmentFields = [
  'id',
  'submissionId',
  'slot',
  'judgeUserId',
  'judgeName',
  'judgeEmail',
  'createdAt',
] as const;

function normalizeAssignment(
  row: Partial<JudgeAssignmentRecord>
): JudgeAssignmentRecord {
  return {
    id: typeof row.id === 'string' ? row.id : '',
    submissionId: typeof row.submissionId === 'string' ? row.submissionId : '',
    slot: typeof row.slot === 'number' ? row.slot : 0,
    judgeUserId: typeof row.judgeUserId === 'string' ? row.judgeUserId : '',
    judgeName: typeof row.judgeName === 'string' ? row.judgeName : '',
    judgeEmail: typeof row.judgeEmail === 'string' ? row.judgeEmail : '',
    createdAt: typeof row.createdAt === 'string' ? row.createdAt : '',
  };
}

function normalizeEmail(value?: string | null): string {
  return value?.trim().toLocaleLowerCase() ?? '';
}

export function isAssignmentForJudge(
  assignment: JudgeAssignmentRecord,
  judge: { id: string; email?: string | null }
): boolean {
  return (
    assignment.judgeUserId === judge.id ||
    (Boolean(judge.email) &&
      normalizeEmail(assignment.judgeEmail) === normalizeEmail(judge.email))
  );
}

export async function fetchJudgeAssignments(): Promise<JudgeAssignmentRecord[]> {
  const client = getRayfinClient();
  const rows = await client.data.JudgeAssignment.select(judgeAssignmentFields).execute();
  return rows.map((row) => normalizeAssignment(row));
}

export async function assignJudgeToProject(
  submissionId: string,
  judge: AuthUser
): Promise<JudgeAssignmentRecord> {
  return createAssignmentWithCapacity(submissionId, judge);
}

export async function assignJudgeToProjectAsAdmin(
  submissionId: string,
  judgeEmail: string
): Promise<JudgeAssignmentRecord> {
  const normalizedEmail = normalizeEmail(judgeEmail);

  if (!normalizedEmail) {
    throw new Error('Select a judge before assigning this project.');
  }

  return createAssignmentWithCapacity(submissionId, {
    id: `email:${normalizedEmail}`,
    email: normalizedEmail,
    name: '',
  });
}

async function createAssignmentWithCapacity(
  submissionId: string,
  judge: AuthUser
): Promise<JudgeAssignmentRecord> {
  const client = getRayfinClient();
  const currentAssignments = (await fetchJudgeAssignments()).filter(
    (assignment) => assignment.submissionId === submissionId
  );
  const existingAssignment = currentAssignments.find(
    (assignment) => isAssignmentForJudge(assignment, judge)
  );

  if (existingAssignment) {
    return existingAssignment;
  }

  if (currentAssignments.length >= MAX_JUDGES_PER_PROJECT) {
    throw new Error('This project already has two judges assigned.');
  }

  const occupiedSlots = new Set(currentAssignments.map((assignment) => assignment.slot));
  const slot = Array.from(
    { length: MAX_JUDGES_PER_PROJECT },
    (_, index) => index + 1
  ).find((candidate) => !occupiedSlots.has(candidate));

  if (!slot) {
    throw new Error('This project already has two judges assigned.');
  }

  const assignment = createJudgeAssignment(submissionId, slot, judge);
  await client.data.JudgeAssignment.create(assignment);

  const verifiedAssignments = (await fetchJudgeAssignments())
    .filter((candidate) => candidate.submissionId === submissionId)
    .sort(
      (left, right) =>
        left.createdAt.localeCompare(right.createdAt) || left.id.localeCompare(right.id)
    );
  const acceptedAssignments = verifiedAssignments.slice(0, MAX_JUDGES_PER_PROJECT);

  if (!acceptedAssignments.some((candidate) => candidate.id === assignment.id)) {
    await client.data.JudgeAssignment.delete({ id: assignment.id });
    throw new Error('This project already has two judges assigned.');
  }

  return assignment;
}

export async function unassignJudgeFromProject(
  assignment: JudgeAssignmentRecord,
  judgeUserId: string,
  judgeEmail?: string
): Promise<void> {
  if (!isAssignmentForJudge(assignment, { id: judgeUserId, email: judgeEmail })) {
    throw new Error('You can only unassign yourself from a project.');
  }

  const client = getRayfinClient();
  await client.data.JudgeAssignment.delete({ id: assignment.id });
}

export async function unassignJudgeFromProjectAsAdmin(assignmentId: string): Promise<void> {
  const client = getRayfinClient();
  await client.data.JudgeAssignment.delete({ id: assignmentId });
}
