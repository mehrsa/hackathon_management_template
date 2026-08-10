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
    createdAt: typeof row.createdAt === 'string' ? row.createdAt : '',
  };
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
  const client = getRayfinClient();
  const currentAssignments = (await fetchJudgeAssignments()).filter(
    (assignment) => assignment.submissionId === submissionId
  );
  const existingAssignment = currentAssignments.find(
    (assignment) => assignment.judgeUserId === judge.id
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
  judgeUserId: string
): Promise<void> {
  if (assignment.judgeUserId !== judgeUserId) {
    throw new Error('You can only unassign yourself from a project.');
  }

  const client = getRayfinClient();
  await client.data.JudgeAssignment.delete({ id: assignment.id });
}
