import type { AuthUser } from '@/services/IAuthService';

export interface ProjectSubmissionRecord {
  id: string;
  ownerUserId: string;
  ownerEmail: string;
  submitterName: string;
  projectTitle: string;
  teamMembers: string;
  teamEmails: string;
  appTheme: string;
  teamRoles: string;
  createdAt: string;
  updatedAt: string;
}

export function createEmptyProjectSubmission(user: AuthUser): ProjectSubmissionRecord {
  const now = new Date().toISOString();

  return {
    id: crypto.randomUUID(),
    ownerUserId: user.id,
    ownerEmail: user.email,
    submitterName: user.name,
    projectTitle: '',
    teamMembers: '',
    teamEmails: '',
    appTheme: '',
    teamRoles: '',
    createdAt: now,
    updatedAt: now,
  };
}

export function splitCommaSeparatedValues(value?: string | null): string[] {
  if (typeof value !== 'string' || !value.trim()) {
    return [];
  }

  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}
