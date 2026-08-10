import type { AuthUser } from '@/services/IAuthService';

export interface FinalProjectSubmissionRecord {
  id: string;
  ownerUserId: string;
  ownerEmail: string;
  submitterName: string;
  teamName: string;
  teamMembers: string;
  projectSummary: string;
  assetLinks: string;
  feedbackNotes: string;
  createdAt: string;
  updatedAt: string;
}

export function createEmptyFinalProjectSubmission(
  user: AuthUser,
  overrides: Partial<Pick<FinalProjectSubmissionRecord, 'teamName' | 'teamMembers'>> = {}
): FinalProjectSubmissionRecord {
  const now = new Date().toISOString();

  return {
    id: crypto.randomUUID(),
    ownerUserId: user.id,
    ownerEmail: user.email,
    submitterName: user.name,
    teamName: overrides.teamName ?? '',
    teamMembers: overrides.teamMembers ?? '',
    projectSummary: '',
    assetLinks: '',
    feedbackNotes: '',
    createdAt: now,
    updatedAt: now,
  };
}

export function splitMultilineValues(value?: string | null): string[] {
  if (typeof value !== 'string' || !value.trim()) {
    return [];
  }

  return value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}
