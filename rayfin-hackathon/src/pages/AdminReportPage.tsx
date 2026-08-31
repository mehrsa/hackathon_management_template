import { Fragment, useEffect, useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';

import { getBlocksForPage } from '@/content/defaultContent';
import { useSitePageContext } from '@/hooks/useSitePageContext';
import { fetchFinalProjectSubmissions } from '@/services/finalProjectSubmissions';
import { fetchJudgeAssignments } from '@/services/judgeAssignments';
import {
  parseHonorableMentionIds,
  serializeHonorableMentionIds,
} from '@/services/hackathonResults';
import {
  fetchAllJudgingEntries,
  updateJudgingEntry,
} from '@/services/judgingEntries';
import {
  buildSubmittedParticipantCsvRows,
  downloadSubmittedParticipantWorkbook,
} from '@/services/participantCsv';
import { fetchProjectSubmissions } from '@/services/projectSubmissions';
import type { FinalProjectSubmissionRecord } from '@/types/finalProjectSubmission';
import {
  getJudgeAssignmentLabel,
  MAX_JUDGES_PER_PROJECT,
  type JudgeAssignmentRecord,
} from '@/types/judgeAssignment';
import {
  getLatestJudgingEntriesByJudge,
  getJudgingTotal,
  MAX_CRITERION_SCORE,
  MIN_CRITERION_SCORE,
  type JudgingEntryRecord,
} from '@/types/judging';
import type { ProjectSubmissionRecord } from '@/types/projectSubmission';

type ReportFilter = 'all' | 'needs-judges' | 'in-progress' | 'complete';
type ProjectStatus = Exclude<ReportFilter, 'all'>;

interface ProjectReportRow {
  submission: FinalProjectSubmissionRecord;
  assignments: JudgeAssignmentRecord[];
  scorecards: JudgingEntryRecord[];
  starredEntries: JudgingEntryRecord[];
  completedEntries: JudgingEntryRecord[];
  assignedJudgeCount: number;
  completedJudgeCount: number;
  averageScore: number | null;
  status: ProjectStatus;
}

function isCompletedEntry(entry: JudgingEntryRecord, criterionIds: string[]): boolean {
  return (
    criterionIds.length > 0 &&
    criterionIds.every((criterionId) => Number.isInteger(entry.scores[criterionId]))
  );
}

function createReportRows(
  submissions: FinalProjectSubmissionRecord[],
  assignments: JudgeAssignmentRecord[],
  entries: JudgingEntryRecord[],
  criterionIds: string[]
): ProjectReportRow[] {
  return submissions.map((submission) => {
    const projectAssignments = assignments.filter(
      (assignment) => assignment.submissionId === submission.id
    );
    const assignedJudgeCount = new Set(
      projectAssignments.map((assignment) => assignment.judgeUserId)
    ).size;
    const scorecards = getLatestJudgingEntriesByJudge(
      entries.filter((entry) => entry.submissionId === submission.id)
    );
    const starredEntries = scorecards.filter((entry) => entry.starred);
    const completedEntries = scorecards.filter((entry) => isCompletedEntry(entry, criterionIds));
    const completedJudgeCount = completedEntries.length;
    const averageScore =
      completedJudgeCount > 0
        ? completedEntries.reduce(
            (total, entry) => total + getJudgingTotal(entry.scores, criterionIds),
            0
          ) / completedJudgeCount
        : null;
    const status: ProjectStatus =
      completedJudgeCount >= MAX_JUDGES_PER_PROJECT
        ? 'complete'
        : assignedJudgeCount < MAX_JUDGES_PER_PROJECT
          ? 'needs-judges'
          : 'in-progress';

    return {
      submission,
      assignments: projectAssignments,
      scorecards,
      starredEntries,
      completedEntries,
      assignedJudgeCount,
      completedJudgeCount,
      averageScore,
      status,
    };
  });
}

function getStatusPresentation(row: ProjectReportRow) {
  if (row.status === 'complete') {
    return {
      label: 'Judging complete',
      className: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    };
  }

  if (row.status === 'in-progress') {
    return {
      label: `${MAX_JUDGES_PER_PROJECT - row.completedJudgeCount} scorecard${
        MAX_JUDGES_PER_PROJECT - row.completedJudgeCount === 1 ? '' : 's'
      } pending`,
      className: 'border-amber-200 bg-amber-50 text-amber-800',
    };
  }

  const judgesNeeded = MAX_JUDGES_PER_PROJECT - row.assignedJudgeCount;
  return {
    label: `Needs ${judgesNeeded} judge${judgesNeeded === 1 ? '' : 's'}`,
    className: 'border-rose-200 bg-rose-50 text-rose-800',
  };
}

function formatScore(score: number | null): string {
  return score === null ? 'Not scored' : score.toFixed(1);
}

function getJudgeLabel(
  assignment: JudgeAssignmentRecord,
  scorecards: JudgingEntryRecord[]
): string {
  const scorecard = scorecards.find((entry) => entry.judgeUserId === assignment.judgeUserId);
  return (
    assignment.judgeName ||
    scorecard?.judgeName ||
    assignment.judgeEmail ||
    scorecard?.judgeEmail ||
    getJudgeAssignmentLabel(assignment)
  );
}

function getScorecardJudgeLabel(entry: JudgingEntryRecord): string {
  return entry.judgeName || entry.judgeEmail || 'Unknown judge';
}

export function AdminReportPage() {
  const { isAdmin, siteData, saveSettings, saving } = useSitePageContext();
  const [registrations, setRegistrations] = useState<ProjectSubmissionRecord[]>([]);
  const [submissions, setSubmissions] = useState<FinalProjectSubmissionRecord[]>([]);
  const [assignments, setAssignments] = useState<JudgeAssignmentRecord[]>([]);
  const [entries, setEntries] = useState<JudgingEntryRecord[]>([]);
  const [filter, setFilter] = useState<ReportFilter>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [draftScores, setDraftScores] = useState<Record<string, number>>({});
  const [savingEntryId, setSavingEntryId] = useState<string | null>(null);
  const criteria = useMemo(
    () =>
      getBlocksForPage(siteData.blocks, 'judging').filter(
        (block) => block.blockKind === 'criterion'
      ),
    [siteData.blocks]
  );
  const criterionIds = useMemo(() => criteria.map((criterion) => criterion.id), [criteria]);
  const maximumScore = criterionIds.length * MAX_CRITERION_SCORE;

  useEffect(() => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([
      fetchProjectSubmissions(),
      fetchFinalProjectSubmissions(),
      fetchJudgeAssignments(),
      fetchAllJudgingEntries(),
    ])
      .then(([registrationRows, submissionRows, assignmentRows, entryRows]) => {
        if (cancelled) return;
        setRegistrations(registrationRows);
        setSubmissions(submissionRows);
        setAssignments(assignmentRows);
        setEntries(entryRows);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unable to load the judging report.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isAdmin]);

  const reportRows = useMemo(
    () => createReportRows(submissions, assignments, entries, criterionIds),
    [assignments, criterionIds, entries, submissions]
  );
  const completedProjects = reportRows.filter((row) => row.status === 'complete').length;
  const projectsNeedingJudges = reportRows.filter((row) => row.status === 'needs-judges').length;
  const projectsInProgress = reportRows.filter((row) => row.status === 'in-progress').length;
  const completedScorecards = reportRows.reduce(
    (total, row) => total + row.completedJudgeCount,
    0
  );
  const expectedScorecards = reportRows.length * MAX_JUDGES_PER_PROJECT;
  const completionPercent =
    expectedScorecards > 0 ? Math.round((completedScorecards / expectedScorecards) * 100) : 0;
  const rankedProjects = [...reportRows]
    .filter((row) => row.averageScore !== null)
    .sort(
      (left, right) =>
        (right.averageScore ?? 0) - (left.averageScore ?? 0) ||
        right.completedJudgeCount - left.completedJudgeCount ||
        left.submission.teamName.localeCompare(right.submission.teamName)
    );
  const topProjects = rankedProjects.slice(0, 5);
  const winningScores = new Set(
    [...new Set(rankedProjects.map((row) => row.averageScore))].slice(0, 3)
  );
  const winnerIds = new Set(
    rankedProjects
      .filter((row) => winningScores.has(row.averageScore))
      .map((row) => row.submission.id)
  );
  const honorableMentionIds = parseHonorableMentionIds(
    siteData.settings.honorableMentionSubmissionIds
  );
  const criterionTrends = criteria.map((criterion) => {
    const scores = reportRows.flatMap((row) =>
      row.completedEntries
        .map((entry) => entry.scores[criterion.id])
        .filter((score): score is number => typeof score === 'number')
    );
    return {
      criterion,
      average:
        scores.length > 0 ? scores.reduce((total, score) => total + score, 0) / scores.length : null,
    };
  });
  const normalizedSearch = search.trim().toLocaleLowerCase();
  const visibleRows = [...reportRows]
    .filter((row) => filter === 'all' || row.status === filter)
    .filter((row) =>
      [row.submission.teamName, row.submission.submitterName, row.submission.ownerEmail].some(
        (value) => value.toLocaleLowerCase().includes(normalizedSearch)
      )
    )
    .sort((left, right) => {
      const statusOrder: Record<ProjectStatus, number> = {
        'needs-judges': 0,
        'in-progress': 1,
        complete: 2,
      };
      return (
        statusOrder[left.status] - statusOrder[right.status] ||
        (right.averageScore ?? -1) - (left.averageScore ?? -1) ||
        left.submission.teamName.localeCompare(right.submission.teamName)
      );
    });

  function beginEditing(entry: JudgingEntryRecord) {
    setEditingEntryId(entry.id);
    setDraftScores({ ...entry.scores });
    setError(null);
    setMessage(null);
  }

  function cancelEditing() {
    setEditingEntryId(null);
    setDraftScores({});
  }

  async function saveScores(entry: JudgingEntryRecord) {
    const updatedEntry = {
      ...entry,
      scores: draftScores,
      updatedAt: new Date().toISOString(),
    };

    setSavingEntryId(entry.id);
    setError(null);
    setMessage(null);

    try {
      await updateJudgingEntry(updatedEntry);
      setEntries((current) =>
        current.map((item) => (item.id === updatedEntry.id ? updatedEntry : item))
      );
      cancelEditing();
      setMessage(`Scores updated for ${getScorecardJudgeLabel(entry)}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update this scorecard.');
    } finally {
      setSavingEntryId(null);
    }
  }

  async function toggleHonorableMention(submissionId: string) {
    const selected = honorableMentionIds.includes(submissionId);
    const nextIds = selected
      ? honorableMentionIds.filter((id) => id !== submissionId)
      : honorableMentionIds.concat(submissionId);

    setError(null);
    setMessage(null);

    try {
      await saveSettings({
        ...siteData.settings,
        honorableMentionSubmissionIds: serializeHonorableMentionIds(nextIds),
      });
      setMessage(selected ? 'Honorable mention removed.' : 'Honorable mention added.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update honorable mentions.');
    }
  }

  function downloadParticipantWorkbook() {
    const rows = buildSubmittedParticipantCsvRows(
      registrations,
      submissions,
      entries,
      criterionIds,
      siteData.settings.honorableMentionSubmissionIds
    );

    downloadSubmittedParticipantWorkbook(rows);
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] bg-gradient-to-br from-slate-950 via-blue-950 to-emerald-900 px-6 py-8 text-white shadow-xl sm:px-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-200">
              Admin only
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
              Judging progress and project rankings
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-8 text-slate-200">
              Track judge coverage, completed scorecards, leading projects, and scoring trends
              across every submitted project.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={downloadParticipantWorkbook}
              disabled={loading || submissions.length === 0}
              className="shrink-0 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Download participant workbook
            </button>
            <Link
              to="/admin"
              className="shrink-0 rounded-full border border-white/30 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
            >
              Back to admin portal
            </Link>
          </div>
        </div>
      </section>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
        </div>
      ) : null}
      {message ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {message}
        </div>
      ) : null}

      {loading ? (
        <div className="glass-panel rounded-3xl px-6 py-8 text-sm text-slate-600">
          Loading judging report...
        </div>
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {[
              ['Submitted projects', reportRows.length, 'All final handoffs'],
              ['Judging complete', completedProjects, 'Two completed scorecards'],
              ['Need judges', projectsNeedingJudges, 'Open assignment slots'],
              ['In progress', projectsInProgress, 'Assigned, awaiting scores'],
              ['Scorecards complete', `${completionPercent}%`, `${completedScorecards} of ${expectedScorecards}`],
            ].map(([label, value, detail]) => (
              <article
                key={label}
                className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <p className="text-sm font-medium text-slate-500">{label}</p>
                <p className="mt-2 text-3xl font-semibold text-slate-950">{value}</p>
                <p className="mt-2 text-xs leading-5 text-slate-500">{detail}</p>
              </article>
            ))}
          </section>

          <section className="grid gap-6 xl:grid-cols-2">
            <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">
                  Leaderboard
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950">Top projects</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Ranked by average completed scorecard. One-scorecard results are provisional.
                </p>
              </div>

              <div className="mt-6 space-y-5">
                {topProjects.length === 0 ? (
                  <p className="text-sm text-slate-500">No completed scorecards yet.</p>
                ) : (
                  topProjects.map((row, index) => {
                    const width =
                      maximumScore > 0 && row.averageScore !== null
                        ? Math.max(4, (row.averageScore / maximumScore) * 100)
                        : 0;
                    return (
                      <div key={row.submission.id}>
                        <div className="flex items-center justify-between gap-4 text-sm">
                          <div className="min-w-0">
                            <span className="mr-2 font-semibold text-slate-400">#{index + 1}</span>
                            <span className="font-semibold text-slate-900">
                              {row.submission.teamName}
                            </span>
                            {row.completedJudgeCount < MAX_JUDGES_PER_PROJECT ? (
                              <span className="ml-2 text-xs text-amber-700">Provisional</span>
                            ) : null}
                          </div>
                          <span className="shrink-0 font-semibold text-slate-900">
                            {formatScore(row.averageScore)} / {maximumScore}
                          </span>
                        </div>
                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-blue-600 to-emerald-500"
                            style={{ width: `${width}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </article>

            <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">
                Score trends
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">Average by criterion</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Based only on fully completed scorecards.
              </p>

              <div className="mt-6 space-y-5">
                {criterionTrends.map(({ criterion, average }) => (
                  <div key={criterion.id}>
                    <div className="flex items-center justify-between gap-4 text-sm">
                      <span className="font-semibold text-slate-800">{criterion.title}</span>
                      <span className="shrink-0 text-slate-600">
                        {average === null ? 'No scores' : `${average.toFixed(1)} / ${MAX_CRITERION_SCORE}`}
                      </span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"
                        style={{
                          width: `${average === null ? 0 : (average / MAX_CRITERION_SCORE) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </article>
          </section>

          <section className="rounded-3xl border border-violet-200 bg-gradient-to-br from-violet-50 via-white to-fuchsia-50 p-6 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-violet-700">
                  Special recognition
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                  Choose honorable mentions
                </h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                  Select standout projects outside the Gold, Silver, and Bronze score groups.
                  Winner teams are excluded automatically from the public honorable mention list.
                </p>
              </div>
              <Link
                to="/results"
                className="shrink-0 rounded-full border border-violet-300 bg-white px-4 py-2 text-sm font-semibold text-violet-800 transition hover:bg-violet-100"
              >
                Preview results page
              </Link>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {reportRows
                .filter((row) => !winnerIds.has(row.submission.id))
                .sort((left, right) =>
                  left.submission.teamName.localeCompare(right.submission.teamName)
                )
                .map((row) => {
                  const selected = honorableMentionIds.includes(row.submission.id);
                  return (
                    <div
                      key={row.submission.id}
                      className="flex items-center justify-between gap-4 rounded-2xl border border-violet-200 bg-white p-4"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-950">
                          {row.submission.teamName}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {row.completedJudgeCount > 0 ? 'Judged' : 'Awaiting completed scores'}
                        </p>
                      </div>
                      <button
                        type="button"
                        aria-pressed={selected}
                        disabled={saving}
                        onClick={() => void toggleHonorableMention(row.submission.id)}
                        className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                          selected
                            ? 'bg-violet-700 text-white hover:bg-violet-800'
                            : 'border border-violet-300 text-violet-800 hover:bg-violet-100'
                        }`}
                      >
                        {selected ? 'Selected' : 'Add mention'}
                      </button>
                    </div>
                  );
                })}
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Project pipeline
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                  Find projects that need attention
                </h2>
              </div>
              <label className="block w-full max-w-md">
                <span className="mb-2 block text-sm font-medium text-slate-700">
                  Search projects
                </span>
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search team, submitter, or owner email"
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </label>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {(
                [
                  ['all', `All (${reportRows.length})`],
                  ['needs-judges', `Need judges (${projectsNeedingJudges})`],
                  ['in-progress', `In progress (${projectsInProgress})`],
                  ['complete', `Complete (${completedProjects})`],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={filter === value}
                  onClick={() => setFilter(value)}
                  className={[
                    'rounded-full px-4 py-2 text-sm font-semibold transition',
                    filter === value
                      ? 'bg-slate-950 text-white'
                      : 'border border-slate-300 text-slate-700 hover:bg-slate-100',
                  ].join(' ')}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="mt-6 overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-0 text-left text-sm">
                <thead>
                  <tr className="text-xs uppercase tracking-[0.14em] text-slate-500">
                    <th className="border-b border-slate-200 px-4 py-3 font-semibold">Project</th>
                    <th className="border-b border-slate-200 px-4 py-3 font-semibold">Status</th>
                    <th className="border-b border-slate-200 px-4 py-3 font-semibold">Judges</th>
                    <th className="border-b border-slate-200 px-4 py-3 font-semibold">Scorecards</th>
                    <th className="border-b border-slate-200 px-4 py-3 font-semibold">Stars</th>
                    <th className="border-b border-slate-200 px-4 py-3 font-semibold">Average score</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleRows.map((row) => {
                    const status = getStatusPresentation(row);
                    return (
                      <Fragment key={row.submission.id}>
                      <tr className="align-top">
                        <td className="border-b border-slate-100 px-4 py-4">
                          <p className="font-semibold text-slate-950">{row.submission.teamName}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            {row.submission.submitterName} · {row.submission.ownerEmail}
                          </p>
                        </td>
                        <td className="border-b border-slate-100 px-4 py-4">
                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${status.className}`}
                          >
                            {status.label}
                          </span>
                        </td>
                        <td className="border-b border-slate-100 px-4 py-4 text-slate-700">
                          <p>{row.assignedJudgeCount} / {MAX_JUDGES_PER_PROJECT}</p>
                          {row.assignments.length > 0 ? (
                            <ul className="mt-2 space-y-1 text-xs text-slate-500">
                              {[...row.assignments]
                                .sort((left, right) => left.slot - right.slot)
                                .map((assignment) => (
                                  <li key={assignment.id}>
                                    {getJudgeLabel(assignment, row.scorecards)}
                                  </li>
                                ))}
                            </ul>
                          ) : null}
                        </td>
                        <td className="border-b border-slate-100 px-4 py-4 text-slate-700">
                          {row.completedJudgeCount} / {MAX_JUDGES_PER_PROJECT}
                        </td>
                        <td className="border-b border-slate-100 px-4 py-4">
                          {row.starredEntries.length > 0 ? (
                            <span
                              className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800"
                              title={row.starredEntries.map(getScorecardJudgeLabel).join(', ')}
                            >
                              <span aria-hidden="true">★</span>&nbsp;
                              {row.starredEntries.length} star
                              {row.starredEntries.length === 1 ? '' : 's'}
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="border-b border-slate-100 px-4 py-4 font-semibold text-slate-900">
                          {row.averageScore === null
                            ? '—'
                            : `${formatScore(row.averageScore)} / ${maximumScore}`}
                        </td>
                      </tr>
                      <tr>
                        <td colSpan={6} className="border-b border-slate-100 px-4 pb-4">
                          <details className="rounded-2xl border border-slate-200 bg-slate-50">
                            <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-blue-800">
                              View scorecard details ({row.scorecards.length})
                            </summary>
                            <div className="grid gap-4 border-t border-slate-200 p-4 lg:grid-cols-2">
                              {row.scorecards.length === 0 ? (
                                <p className="text-sm text-slate-500">
                                  No scorecards have been saved for this project.
                                </p>
                              ) : (
                                row.scorecards.map((entry) => {
                                  const complete = isCompletedEntry(entry, criterionIds);
                                  const total = getJudgingTotal(entry.scores, criterionIds);
                                  const isEditing = editingEntryId === entry.id;
                                  const isSaving = savingEntryId === entry.id;
                                  const displayedScores = isEditing ? draftScores : entry.scores;
                                  const displayedTotal = getJudgingTotal(
                                    displayedScores,
                                    criterionIds
                                  );
                                  return (
                                    <article
                                      key={entry.id}
                                      className="rounded-2xl border border-slate-200 bg-white p-4"
                                    >
                                      <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div>
                                          <h3 className="font-semibold text-slate-950">
                                            {getScorecardJudgeLabel(entry)}
                                          </h3>
                                          {entry.judgeName && entry.judgeEmail ? (
                                            <p className="mt-1 text-xs text-slate-500">
                                              {entry.judgeEmail}
                                            </p>
                                          ) : null}
                                        </div>
                                        <span
                                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                            complete
                                              ? 'bg-emerald-100 text-emerald-800'
                                              : 'bg-amber-100 text-amber-800'
                                          }`}
                                        >
                                          {complete ? 'Complete' : 'In progress'}
                                        </span>
                                      </div>
                                      <dl className="mt-4 space-y-2">
                                        {criteria.map((criterion) => {
                                          const judgeLabel = getScorecardJudgeLabel(entry);
                                          return (
                                            <div
                                              key={criterion.id}
                                              className="flex items-center justify-between gap-4 text-sm"
                                            >
                                              <dt className="text-slate-600">{criterion.title}</dt>
                                              <dd className="shrink-0 font-semibold text-slate-900">
                                                {isEditing ? (
                                                  <select
                                                    aria-label={`${criterion.title} score for ${judgeLabel}`}
                                                    value={draftScores[criterion.id] ?? ''}
                                                    disabled={isSaving}
                                                    onChange={(event) => {
                                                      const value = event.target.value;
                                                      setDraftScores((current) => {
                                                        const next = { ...current };
                                                        if (value) {
                                                          next[criterion.id] = Number(value);
                                                        } else {
                                                          delete next[criterion.id];
                                                        }
                                                        return next;
                                                      });
                                                    }}
                                                    className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 disabled:opacity-60"
                                                  >
                                                    <option value="">Not scored</option>
                                                    {Array.from(
                                                      {
                                                        length:
                                                          MAX_CRITERION_SCORE -
                                                          MIN_CRITERION_SCORE +
                                                          1,
                                                      },
                                                      (_, index) =>
                                                        index + MIN_CRITERION_SCORE
                                                    ).map((score) => (
                                                      <option key={score} value={score}>
                                                        {score}
                                                      </option>
                                                    ))}
                                                  </select>
                                                ) : (
                                                  <>
                                                    {entry.scores[criterion.id] ?? '—'} /{' '}
                                                    {MAX_CRITERION_SCORE}
                                                  </>
                                                )}
                                              </dd>
                                            </div>
                                          );
                                        })}
                                        <div className="flex items-center justify-between gap-4 border-t border-slate-200 pt-2 text-sm">
                                          <dt className="font-semibold text-slate-800">Total</dt>
                                          <dd className="font-semibold text-slate-950">
                                            {isEditing ? displayedTotal : total} / {maximumScore}
                                          </dd>
                                        </div>
                                      </dl>
                                      <div className="mt-4 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700">
                                        <span className="font-semibold">Notes:</span>{' '}
                                        {entry.notes || 'No notes provided.'}
                                      </div>
                                      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                                        {entry.starred ? (
                                          <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 font-semibold text-amber-800">
                                            <span aria-hidden="true">★</span>&nbsp;Starred project
                                          </span>
                                        ) : (
                                          <span>Not starred</span>
                                        )}
                                        {entry.updatedAt ? (
                                          <span>
                                            Updated {new Date(entry.updatedAt).toLocaleString()}
                                          </span>
                                        ) : null}
                                      </div>
                                      <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-200 pt-4">
                                        {isEditing ? (
                                          <>
                                            <button
                                              type="button"
                                              onClick={() => void saveScores(entry)}
                                              disabled={isSaving}
                                              className="rounded-full bg-blue-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                                            >
                                              {isSaving ? 'Saving...' : 'Save score changes'}
                                            </button>
                                            <button
                                              type="button"
                                              onClick={cancelEditing}
                                              disabled={isSaving}
                                              className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-60"
                                            >
                                              Cancel
                                            </button>
                                          </>
                                        ) : (
                                          <button
                                            type="button"
                                            aria-label={`Edit scores for ${getScorecardJudgeLabel(entry)}`}
                                            onClick={() => beginEditing(entry)}
                                            disabled={savingEntryId !== null}
                                            className="rounded-full border border-blue-300 bg-white px-4 py-2 text-sm font-semibold text-blue-800 disabled:opacity-60"
                                          >
                                            Edit scores
                                          </button>
                                        )}
                                      </div>
                                    </article>
                                  );
                                })
                              )}
                            </div>
                          </details>
                        </td>
                      </tr>
                    </Fragment>
                    );
                  })}
                </tbody>
              </table>
              {visibleRows.length === 0 ? (
                <p className="px-4 py-8 text-sm text-slate-500">
                  No projects match the current filter.
                </p>
              ) : null}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
