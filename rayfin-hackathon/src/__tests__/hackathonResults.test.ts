import { describe, expect, it } from 'vitest';

import { buildHackathonResults } from '@/services/hackathonResults';
import type { FinalProjectSubmissionRecord } from '@/types/finalProjectSubmission';
import type { JudgingEntryRecord } from '@/types/judging';
import type { ProjectSubmissionRecord } from '@/types/projectSubmission';

const criterionIds = ['value', 'quality'];

function registration(id: string, title: string, members: string): ProjectSubmissionRecord {
  return {
    id: `registration-${id}`,
    ownerUserId: `owner-${id}`,
    ownerEmail: `${id}@example.com`,
    submitterName: `${id}@example.com`,
    projectTitle: title,
    teamMembers: members,
    teamEmails: '',
    appTheme: '',
    teamRoles: '',
    createdAt: '',
    updatedAt: '',
  };
}

function submission(id: string): FinalProjectSubmissionRecord {
  return {
    id,
    ownerUserId: `owner-${id}`,
    ownerEmail: `${id}@example.com`,
    submitterName: `${id} Lead`,
    teamName: `Team ${id.toUpperCase()}`,
    teamMembers: `${id} Lead, ${id} Builder`,
    projectSummary: '',
    assetLinks: '',
    feedbackNotes: '',
    createdAt: '',
    updatedAt: '',
  };
}

function score(id: string, value: number): JudgingEntryRecord {
  return {
    id: `entry-${id}`,
    submissionId: id,
    judgeUserId: `judge-${id}`,
    judgeEmail: `judge-${id}@example.com`,
    scores: { value, quality: value },
    notes: '',
    starred: false,
    createdAt: '',
    updatedAt: '2026-08-01T00:00:00.000Z',
  };
}

describe('buildHackathonResults', () => {
  it('assigns the same medal to tied teams and advances by distinct score', () => {
    const ids = ['a', 'b', 'c', 'd', 'e'];
    const { ranked, stats } = buildHackathonResults(
      ids.map((id) => registration(id, `Project ${id.toUpperCase()}`, `${id} Lead, ${id} Builder`)),
      ids.map(submission),
      [score('a', 5), score('b', 5), score('c', 4), score('d', 3), score('e', 2)],
      criterionIds
    );

    expect(ranked.map(({ submissionId, medal }) => [submissionId, medal])).toEqual([
      ['a', 'Gold'],
      ['b', 'Gold'],
      ['c', 'Silver'],
      ['d', 'Bronze'],
      ['e', null],
    ]);
    expect(ranked[0]).toMatchObject({
      projectTitle: 'Project A',
      teamMembers: ['a Lead', 'a Builder'],
    });
    expect(stats).toEqual({
      registeredTeams: 5,
      registeredParticipants: 10,
      finalSubmissions: 5,
      judgedProjects: 5,
    });
  });
});
