import type { FinalProjectSubmissionRecord } from '@/types/finalProjectSubmission';
import {
  getLatestJudgingEntriesByJudge,
  getJudgingTotal,
  type JudgingEntryRecord,
} from '@/types/judging';
import type { ProjectSubmissionRecord } from '@/types/projectSubmission';

export type ResultMedal = 'Gold' | 'Silver' | 'Bronze';

export interface HackathonResult {
  submissionId: string;
  teamName: string;
  projectTitle: string;
  teamMembers: string[];
  averageScore: number;
  medal: ResultMedal | null;
}

export interface HackathonStats {
  registeredTeams: number;
  registeredParticipants: number;
  finalSubmissions: number;
  judgedProjects: number;
}

const medals: ResultMedal[] = ['Gold', 'Silver', 'Bronze'];

export function parseHonorableMentionIds(value: string): string[] {
  return [...new Set(value.split(',').map((id) => id.trim()).filter(Boolean))];
}

export function serializeHonorableMentionIds(ids: string[]): string {
  return [...new Set(ids.map((id) => id.trim()).filter(Boolean))].join(',');
}

export function splitTeamMembers(value: string): string[] {
  return value
    .split(/[\r\n,;]+/)
    .map((name) => name.trim())
    .filter(Boolean);
}

function hasCompleteScores(entry: JudgingEntryRecord, criterionIds: string[]): boolean {
  return (
    criterionIds.length > 0 &&
    criterionIds.every((criterionId) => Number.isInteger(entry.scores[criterionId]))
  );
}

export function buildHackathonResults(
  registrations: ProjectSubmissionRecord[],
  submissions: FinalProjectSubmissionRecord[],
  entries: JudgingEntryRecord[],
  criterionIds: string[]
): { ranked: HackathonResult[]; stats: HackathonStats } {
  const registrationsByOwner = new Map(
    registrations.map((registration) => [registration.ownerUserId, registration])
  );

  const ranked = submissions
    .map((submission): HackathonResult | null => {
      const completedEntries = getLatestJudgingEntriesByJudge(
        entries.filter((entry) => entry.submissionId === submission.id)
      ).filter((entry) => hasCompleteScores(entry, criterionIds));

      if (completedEntries.length === 0) {
        return null;
      }

      const registration = registrationsByOwner.get(submission.ownerUserId);
      const averageScore =
        completedEntries.reduce(
          (total, entry) => total + getJudgingTotal(entry.scores, criterionIds),
          0
        ) / completedEntries.length;

      return {
        submissionId: submission.id,
        teamName: submission.teamName,
        projectTitle: registration?.projectTitle || submission.teamName,
        teamMembers: splitTeamMembers(
          submission.teamMembers || registration?.teamMembers || submission.submitterName
        ),
        averageScore,
        medal: null,
      };
    })
    .filter((result): result is HackathonResult => result !== null)
    .sort(
      (left, right) =>
        right.averageScore - left.averageScore || left.teamName.localeCompare(right.teamName)
    );

  const topScores = [...new Set(ranked.map((result) => result.averageScore))].slice(0, 3);
  for (const result of ranked) {
    const place = topScores.indexOf(result.averageScore);
    result.medal = place >= 0 ? medals[place] : null;
  }

  return {
    ranked,
    stats: {
      registeredTeams: registrations.length,
      registeredParticipants: registrations.reduce(
        (total, registration) => total + splitTeamMembers(registration.teamMembers).length,
        0
      ),
      finalSubmissions: submissions.length,
      judgedProjects: ranked.length,
    },
  };
}
