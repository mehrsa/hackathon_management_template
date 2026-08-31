import { describe, expect, it } from 'vitest';
import { strFromU8, unzipSync } from 'fflate';

import {
  buildSubmittedParticipantWorkbook,
  buildSubmittedParticipantCsvRows,
} from '@/services/participantCsv';
import type { FinalProjectSubmissionRecord } from '@/types/finalProjectSubmission';
import type { JudgingEntryRecord } from '@/types/judging';
import type { ProjectSubmissionRecord } from '@/types/projectSubmission';

const registrations: ProjectSubmissionRecord[] = [
  {
    id: 'registration-1',
    ownerUserId: 'owner-1',
    ownerEmail: 'alex@example.com',
    submitterName: 'alex@example.com',
    projectTitle: 'Project One',
    teamMembers: 'Old Lead Name, Sam Builder',
    teamEmails: 'alex@example.com, sam@example.com',
    appTheme: '',
    teamRoles: '',
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 'registration-2',
    ownerUserId: 'owner-2',
    ownerEmail: 'taylor@example.com',
    submitterName: 'taylor@example.com',
    projectTitle: 'Project Two',
    teamMembers: 'Taylor Maker',
    teamEmails: 'taylor@example.com',
    appTheme: '',
    teamRoles: '',
    createdAt: '',
    updatedAt: '',
  },
];

const submissions: FinalProjectSubmissionRecord[] = [
  {
    id: 'submission-1',
    ownerUserId: 'owner-1',
    ownerEmail: 'alex@example.com',
    submitterName: 'Alex Winner',
    teamName: 'Team One',
    teamMembers: 'Alex Winner\nSam Builder',
    projectSummary: '',
    assetLinks: '',
    feedbackNotes: '',
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 'submission-2',
    ownerUserId: 'owner-2',
    ownerEmail: 'taylor@example.com',
    submitterName: 'Taylor Maker',
    teamName: 'Team Two',
    teamMembers: 'Taylor Maker',
    projectSummary: '',
    assetLinks: '',
    feedbackNotes: '',
    createdAt: '',
    updatedAt: '',
  },
];

const entries: JudgingEntryRecord[] = [
  {
    id: 'entry-1',
    submissionId: 'submission-1',
    judgeUserId: 'judge-1',
    judgeEmail: 'judge@example.com',
    scores: { value: 5 },
    notes: '',
    starred: false,
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 'entry-2',
    submissionId: 'submission-2',
    judgeUserId: 'judge-1',
    judgeEmail: 'judge@example.com',
    scores: { value: 4 },
    notes: '',
    starred: false,
    createdAt: '',
    updatedAt: '',
  },
];

describe('participant CSV export', () => {
  it('includes every member of submitted teams with medals and honorable mentions', () => {
    const rows = buildSubmittedParticipantCsvRows(
      registrations,
      submissions,
      entries,
      ['value'],
      'submission-2'
    );

    expect(rows).toEqual([
      {
        firstName: 'Alex',
        lastName: 'Winner',
        email: 'alex@example.com',
        recognition: 'Gold',
      },
      {
        firstName: 'Sam',
        lastName: 'Builder',
        email: 'sam@example.com',
        recognition: 'Gold',
      },
      {
        firstName: 'Taylor',
        lastName: 'Maker',
        email: 'taylor@example.com',
        recognition: 'Silver',
      },
    ]);
  });

  it('uses honorable mention when a submitted project has no medal', () => {
    const rows = buildSubmittedParticipantCsvRows(
      registrations,
      submissions,
      entries.slice(0, 1),
      ['value'],
      'submission-2'
    );

    expect(rows[2].recognition).toBe('Honorable mention');
  });

  it('creates participant and winner sheets with split names and safe values', () => {
    const workbook = unzipSync(
      buildSubmittedParticipantWorkbook([
        {
          firstName: '=HYPERLINK("https://example.com")',
          lastName: 'Winner',
          email: 'member@example.com',
          recognition: 'Gold',
        },
        {
          firstName: 'Honorable',
          lastName: 'Mention',
          email: 'mention@example.com',
          recognition: 'Honorable mention',
        },
      ])
    );
    const participants = strFromU8(workbook['xl/worksheets/sheet1.xml']);
    const winners = strFromU8(workbook['xl/worksheets/sheet2.xml']);

    expect(strFromU8(workbook['xl/workbook.xml'])).toContain('name="Participants"');
    expect(strFromU8(workbook['xl/workbook.xml'])).toContain('name="Winners"');
    expect(participants).toContain('First Name');
    expect(participants).toContain('Last Name');
    expect(participants).toContain('&apos;=HYPERLINK(&quot;https://example.com&quot;)');
    expect(winners).toContain('member@example.com');
    expect(winners).not.toContain('mention@example.com');
  });
});
