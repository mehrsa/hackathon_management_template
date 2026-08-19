import { useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';

import { ContentBlockInlineEditor } from '@/components/ContentEditors';
import { RichTextBody } from '@/components/RichTextBody';
import { getBlocksForPage } from '@/content/defaultContent';
import { useNextSortOrder } from '@/hooks/useNextSortOrder';
import { useSitePageContext } from '@/hooks/useSitePageContext';
import { fetchFinalProjectSubmissions } from '@/services/finalProjectSubmissions';
import {
  assignJudgeToProject,
  fetchJudgeAssignments,
  unassignJudgeFromProject,
} from '@/services/judgeAssignments';
import {
  createJudgingEntry,
  deleteJudgingEntry,
  fetchMyJudgingEntries,
  updateJudgingEntry,
} from '@/services/judgingEntries';
import type { FinalProjectSubmissionRecord } from '@/types/finalProjectSubmission';
import {
  MAX_JUDGES_PER_PROJECT,
  type JudgeAssignmentRecord,
} from '@/types/judgeAssignment';
import {
  createEmptyJudgingEntry,
  getJudgingTotal,
  MAX_CRITERION_SCORE,
  MIN_CRITERION_SCORE,
  type JudgingEntryRecord,
} from '@/types/judging';
import type { ContentBlockRecord } from '@/types/site';

function getEntryMap(entries: JudgingEntryRecord[]): Record<string, JudgingEntryRecord> {
  return entries.reduce<Record<string, JudgingEntryRecord>>((result, entry) => {
    result[entry.submissionId] ??= entry;
    return result;
  }, {});
}

function matchesSearch(submission: FinalProjectSubmissionRecord, search: string): boolean {
  if (!search) return true;
  return [
    submission.teamName,
    submission.submitterName,
    submission.ownerEmail,
    submission.teamMembers,
    submission.projectSummary,
    submission.assetLinks,
    submission.feedbackNotes,
  ].some((value) => value.toLocaleLowerCase().includes(search));
}

export function JudgingPage() {
  const {
    auth,
    isAdmin,
    isJudge,
    siteData,
    saving,
    saveSettings,
    saveBlock,
    removeBlock,
  } = useSitePageContext();
  const criteria = getBlocksForPage(siteData.blocks, 'judging').filter(
    (block) => block.blockKind === 'criterion'
  );
  const nextSortOrder = useNextSortOrder(criteria);
  const criterionIds = useMemo(() => criteria.map((criterion) => criterion.id), [criteria]);
  const [submissions, setSubmissions] = useState<FinalProjectSubmissionRecord[]>([]);
  const [assignments, setAssignments] = useState<JudgeAssignmentRecord[]>([]);
  const [entries, setEntries] = useState<Record<string, JudgingEntryRecord>>({});
  const [persistedEntryIds, setPersistedEntryIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [pageMessage, setPageMessage] = useState<string | null>(null);
  const [savingSubmissionId, setSavingSubmissionId] = useState<string | null>(null);
  const [isJudgeView, setIsJudgeView] = useState(false);
  const [openCriterionInfo, setOpenCriterionInfo] = useState<string | null>(null);
  const showAdminControls = isAdmin && !isJudgeView;
  const normalizedSearch = search.trim().toLocaleLowerCase();
  const filteredSubmissions = useMemo(
    () => submissions.filter((submission) => matchesSearch(submission, normalizedSearch)),
    [normalizedSearch, submissions]
  );

  useEffect(() => {
    if (!isJudge || !siteData.settings.judgingFormPublished || !auth.user) {
      setSubmissions([]);
      setAssignments([]);
      setEntries({});
      setPersistedEntryIds(new Set());
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setPageError(null);

    Promise.all([
      fetchFinalProjectSubmissions(),
      fetchJudgeAssignments(),
      fetchMyJudgingEntries(auth.user.id),
    ])
      .then(([submissionRows, assignmentRows, entryRows]) => {
        if (cancelled) return;
        setSubmissions(submissionRows);
        setAssignments(assignmentRows);
        setEntries(getEntryMap(entryRows));
        setPersistedEntryIds(new Set(entryRows.map((entry) => entry.id)));
      })
      .catch((error) => {
        if (!cancelled) {
          setPageError(error instanceof Error ? error.message : 'Unable to load the judging form.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [auth.user, isJudge, siteData.settings.judgingFormPublished]);

  function getEntry(submissionId: string): JudgingEntryRecord {
    if (!auth.user) throw new Error('Sign in before judging a submission.');
    return entries[submissionId] ?? createEmptyJudgingEntry(submissionId, auth.user);
  }

  function updateEntry(
    submissionId: string,
    update: (current: JudgingEntryRecord) => JudgingEntryRecord
  ) {
    setEntries((current) => ({
      ...current,
      [submissionId]: update(current[submissionId] ?? getEntry(submissionId)),
    }));
  }

  async function persistEntry(entry: JudgingEntryRecord, successMessage: string) {
    const nextEntry = { ...entry, updatedAt: new Date().toISOString() };
    setSavingSubmissionId(entry.submissionId);
    setPageError(null);
    setPageMessage(null);

    try {
      if (persistedEntryIds.has(entry.id)) {
        await updateJudgingEntry(nextEntry);
      } else {
        await createJudgingEntry(nextEntry);
        setPersistedEntryIds((current) => new Set(current).add(entry.id));
      }
      setEntries((current) => ({ ...current, [entry.submissionId]: nextEntry }));
      setPageMessage(successMessage);
    } catch (error) {
      setPageError(error instanceof Error ? error.message : 'Unable to save this judging entry.');
      throw error;
    } finally {
      setSavingSubmissionId(null);
    }
  }

  async function assignProject(submission: FinalProjectSubmissionRecord) {
    if (!auth.user) {
      setPageError('Sign in before assigning yourself to a project.');
      return;
    }

    setSavingSubmissionId(submission.id);
    setPageError(null);
    setPageMessage(null);

    try {
      const assignment = await assignJudgeToProject(submission.id, auth.user);
      setAssignments((current) => [
        ...current.filter((item) => item.id !== assignment.id),
        assignment,
      ]);
      setPageMessage(`You are now assigned to ${submission.teamName}.`);
    } catch (error) {
      setPageError(error instanceof Error ? error.message : 'Unable to assign this project.');
    } finally {
      setSavingSubmissionId(null);
    }
  }

  async function unassignProject(
    submission: FinalProjectSubmissionRecord,
    assignment: JudgeAssignmentRecord,
    entry: JudgingEntryRecord
  ) {
    if (!auth.user) {
      setPageError('Sign in before unassigning yourself from a project.');
      return;
    }

    const confirmed = window.confirm(
      `Unassign yourself from ${submission.teamName}? Your saved scores, notes, and star for this project will be permanently reset.`
    );

    if (!confirmed) {
      return;
    }

    setSavingSubmissionId(submission.id);
    setPageError(null);
    setPageMessage(null);

    try {
      if (persistedEntryIds.has(entry.id)) {
        await deleteJudgingEntry(entry.id);
      }
      await unassignJudgeFromProject(assignment, auth.user.id);

      setAssignments((current) => current.filter((item) => item.id !== assignment.id));
      setEntries((current) => {
        const next = { ...current };
        delete next[submission.id];
        return next;
      });
      setPersistedEntryIds((current) => {
        const next = new Set(current);
        next.delete(entry.id);
        return next;
      });
      setPageMessage(`You are no longer assigned to ${submission.teamName}. Your scores were reset.`);
    } catch (error) {
      const operationMessage =
        error instanceof Error ? error.message : 'Unable to unassign this project.';

      try {
        const [assignmentRows, entryRows] = await Promise.all([
          fetchJudgeAssignments(),
          fetchMyJudgingEntries(auth.user.id),
        ]);
        setAssignments(assignmentRows);
        setEntries(getEntryMap(entryRows));
        setPersistedEntryIds(new Set(entryRows.map((item) => item.id)));
        setPageError(operationMessage);
      } catch (reloadError) {
        const reloadMessage =
          reloadError instanceof Error ? reloadError.message : 'Unable to refresh the workspace.';
        setPageError(`${operationMessage} ${reloadMessage} Reload the page before trying again.`);
      }
    } finally {
      setSavingSubmissionId(null);
    }
  }

  async function saveCriterion(block: ContentBlockRecord) {
    if (siteData.settings.judgingFormPublished) {
      await saveSettings({ ...siteData.settings, judgingFormPublished: false });
    }
    await saveBlock(block);
  }

  async function deleteCriterion(id: string) {
    if (siteData.settings.judgingFormPublished) {
      await saveSettings({ ...siteData.settings, judgingFormPublished: false });
    }
    await removeBlock(id);
  }

  async function setPublished(published: boolean) {
    setPageError(null);
    setPageMessage(null);
    if (published && criteria.length === 0) {
      setPageError('Add at least one criterion before publishing the judging form.');
      return;
    }
    try {
      await saveSettings({ ...siteData.settings, judgingFormPublished: published });
      setPageMessage(published ? 'Judging form published for all judges.' : 'Judging form unpublished.');
    } catch (error) {
      setPageError(error instanceof Error ? error.message : 'Unable to update publishing status.');
    }
  }

  if (!isJudge) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] bg-gradient-to-br from-indigo-700 via-blue-700 to-slate-950 px-6 py-8 text-white shadow-xl sm:px-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-100">
              Judge workspace
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
              Score submitted projects
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-8 text-slate-100">
              Search for a project, review its final handoff, and save your private scorecard.
            </p>
          </div>
          {isAdmin ? (
            <button
              type="button"
              aria-pressed={isJudgeView}
              onClick={() => setIsJudgeView((current) => !current)}
              className="shrink-0 rounded-full border border-white/40 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
            >
              {isJudgeView ? 'Exit judge view' : 'View as judge'}
            </button>
          ) : null}
        </div>
        {isAdmin && isJudgeView ? (
          <p className="mt-5 inline-flex rounded-full border border-blue-200/40 bg-blue-100/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-50">
            Judge view
          </p>
        ) : null}
      </section>

      {showAdminControls ? (
        <details className="group rounded-3xl border border-blue-200 bg-blue-50 shadow-sm">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-6 [&::-webkit-details-marker]:hidden">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">
                Admin form configuration
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">Manage scoring fields</h2>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                Expand to add, edit, delete, or publish scoring criteria.
              </p>
            </div>
            <span className="rounded-full border border-blue-300 bg-white px-4 py-2 text-sm font-semibold text-blue-800">
              <span className="group-open:hidden">Expand</span>
              <span className="hidden group-open:inline">Collapse</span>
            </span>
          </summary>
          <div className="space-y-6 border-t border-blue-200 p-6">
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() =>
                  void saveCriterion({
                    id: crypto.randomUUID(),
                    pageKey: 'judging',
                    blockKind: 'criterion',
                    title: 'New judging criterion',
                    body: 'Explain how judges should interpret and score this area.',
                    sortOrder: nextSortOrder,
                  }).catch((error) =>
                    setPageError(error instanceof Error ? error.message : 'Unable to add criterion.')
                  )
                }
                disabled={saving}
                className="rounded-full border border-blue-300 bg-white px-4 py-2 text-sm font-semibold text-blue-800"
              >
                Add scoring field
              </button>
              <button
                type="button"
                onClick={() => void setPublished(!siteData.settings.judgingFormPublished)}
                disabled={saving}
                className="rounded-full bg-blue-700 px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {siteData.settings.judgingFormPublished ? 'Unpublish form' : 'Publish for judges'}
              </button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {criteria.map((criterion, index) => (
                <ContentBlockInlineEditor
                  key={criterion.id}
                  title={`Scoring field ${index + 1}`}
                  block={criterion}
                  saving={saving}
                  onSave={saveCriterion}
                  onDelete={deleteCriterion}
                  canDelete={true}
                  deleteLabel="Delete scoring field"
                />
              ))}
            </div>
          </div>
        </details>
      ) : null}

      {pageError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {pageError}
        </div>
      ) : null}
      {pageMessage ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {pageMessage}
        </div>
      ) : null}

      {!siteData.settings.judgingFormPublished ? (
        <section className="glass-panel rounded-3xl p-6 text-sm leading-7 text-slate-700">
          {showAdminControls
            ? 'The form is in draft. Configure the scoring fields above, then publish it for judges.'
            : 'The judging form has not been published yet. Check back when the judging window opens.'}
        </section>
      ) : loading ? (
        <section className="glass-panel rounded-3xl p-6 text-sm text-slate-600">
          Loading submissions and saved scores...
        </section>
      ) : submissions.length === 0 ? (
        <section className="glass-panel rounded-3xl p-6 text-sm text-slate-600">
          No final project submissions are ready for judging yet.
        </section>
      ) : (
        <section className="space-y-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-indigo-700">
                Project scorecards
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                {filteredSubmissions.length} of {submissions.length} projects
              </h2>
            </div>
            <label className="block w-full md:max-w-md">
              <span className="mb-2 block text-sm font-semibold text-slate-800">Search projects</span>
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search team, submitter, summary, or links"
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </label>
          </div>

          {filteredSubmissions.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
              No projects match “{search.trim()}”.
            </div>
          ) : (
            <div className="space-y-6">
              {filteredSubmissions.map((submission) => {
                const entry = getEntry(submission.id);
                const projectAssignments = assignments.filter(
                  (assignment) => assignment.submissionId === submission.id
                );
                const myAssignment = projectAssignments.find(
                  (assignment) => assignment.judgeUserId === auth.user?.id
                );
                const isAssigned = Boolean(myAssignment);
                const assignmentIsFull =
                  projectAssignments.length >= MAX_JUDGES_PER_PROJECT;
                const total = getJudgingTotal(entry.scores, criterionIds);
                const maxTotal = criteria.length * MAX_CRITERION_SCORE;
                const isComplete = criterionIds.every(
                  (criterionId) => entry.scores[criterionId] !== undefined
                );
                const isSaving = savingSubmissionId === submission.id;

                return (
                  <article
                    key={submission.id}
                    className="site-card overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
                  >
                    <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
                      <div className="min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                              Submission
                            </p>
                            <h3 className="mt-2 text-2xl font-semibold text-slate-950">
                              {submission.teamName}
                            </h3>
                          </div>
                          <button
                            type="button"
                            aria-pressed={entry.starred}
                            aria-label={`${entry.starred ? 'Remove star from' : 'Star'} ${submission.teamName}`}
                            onClick={() => {
                              const nextEntry = { ...entry, starred: !entry.starred };
                              updateEntry(submission.id, () => nextEntry);
                              void persistEntry(
                                nextEntry,
                                nextEntry.starred
                                  ? `${submission.teamName} starred.`
                                  : `Star removed from ${submission.teamName}.`
                              ).catch(() => undefined);
                            }}
                            disabled={!isAssigned || isSaving}
                            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-amber-300 bg-amber-50 text-xl text-amber-700 disabled:opacity-60"
                          >
                            <span aria-hidden="true">{entry.starred ? '★' : '☆'}</span>
                          </button>
                        </div>
                        <p className="mt-3 text-sm text-slate-500">
                          Submitted by {submission.submitterName}
                        </p>
                        <p className="mt-5 whitespace-pre-line text-sm leading-7 text-slate-700">
                          {submission.projectSummary}
                        </p>
                        {submission.assetLinks ? (
                          <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                            <h4 className="text-sm font-semibold text-slate-900">Project links</h4>
                            <RichTextBody
                              body={submission.assetLinks}
                              className="mt-2 space-y-2 break-words"
                              paragraphClassName="text-sm leading-6 text-slate-700"
                            />
                          </div>
                        ) : null}
                        {submission.feedbackNotes ? (
                          <div className="mt-5 rounded-2xl border border-blue-200 bg-blue-50 p-4">
                            <h4 className="text-sm font-semibold text-blue-950">
                              Product feedback and issues
                            </h4>
                            <RichTextBody
                              body={submission.feedbackNotes}
                              className="mt-2 space-y-2 break-words"
                              paragraphClassName="text-sm leading-6 text-blue-900"
                            />
                          </div>
                        ) : null}
                        <div className="mt-5 rounded-2xl border border-indigo-200 bg-indigo-50 p-4">
                          <p className="text-sm font-semibold text-indigo-950">
                            {projectAssignments.length} / {MAX_JUDGES_PER_PROJECT} judges assigned
                          </p>
                          {!myAssignment ? (
                            <button
                              type="button"
                              onClick={() => void assignProject(submission)}
                              disabled={assignmentIsFull || isSaving}
                              className="mt-3 rounded-full bg-indigo-700 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {assignmentIsFull
                                ? 'Assignment full'
                                : isSaving
                                  ? 'Assigning...'
                                  : 'Assign to me'}
                            </button>
                          ) : (
                            <div className="mt-3 flex flex-wrap items-center gap-3">
                              <p className="text-sm font-medium text-indigo-800">
                                Assigned to you
                              </p>
                              <button
                                type="button"
                                onClick={() =>
                                  void unassignProject(submission, myAssignment, entry)
                                }
                                disabled={isSaving}
                                className="rounded-full border border-indigo-300 bg-white px-4 py-2 text-sm font-semibold text-indigo-800 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {isSaving ? 'Unassigning...' : 'Unassign me'}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {isAssigned ? (
                        <div className="min-w-0 space-y-5">
                        <div className="grid gap-4 sm:grid-cols-2">
                          {criteria.map((criterion) => {
                            const criterionInfoId = `${submission.id}-${criterion.id}`;
                            const isCriterionInfoOpen = openCriterionInfo === criterionInfoId;

                            return (
                              <div
                                key={criterionInfoId}
                                className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                              >
                              <div className="flex items-start justify-between gap-3">
                                <label
                                  htmlFor={`score-${submission.id}-${criterion.id}`}
                                  className="block text-sm font-semibold leading-6 text-slate-900"
                                >
                                  {criterion.title}
                                </label>
                                <div className="relative shrink-0">
                                  <button
                                    type="button"
                                    aria-label={`About ${criterion.title}`}
                                    aria-expanded={isCriterionInfoOpen}
                                    title={`Learn more about ${criterion.title}`}
                                    onClick={() =>
                                      setOpenCriterionInfo(
                                        isCriterionInfoOpen ? null : criterionInfoId
                                      )
                                    }
                                    className="flex h-6 w-6 cursor-pointer list-none items-center justify-center rounded-full border border-blue-200 bg-white text-blue-700 transition hover:border-blue-300 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 [&::-webkit-details-marker]:hidden"
                                  >
                                    <svg
                                      aria-hidden="true"
                                      viewBox="0 0 20 20"
                                      fill="none"
                                      className="h-4 w-4"
                                    >
                                      <circle cx="10" cy="10" r="7.5" stroke="currentColor" />
                                      <path
                                        d="M10 8.5v5M10 6.25v.25"
                                        stroke="currentColor"
                                        strokeLinecap="round"
                                        strokeWidth="1.5"
                                      />
                                    </svg>
                                  </button>
                                  {isCriterionInfoOpen ? (
                                    <div className="absolute right-0 z-20 mt-2 w-72 max-w-[calc(100vw-4rem)] rounded-xl border border-blue-100 bg-white p-4 shadow-xl">
                                      <RichTextBody
                                        body={criterion.body}
                                        className="space-y-2"
                                        paragraphClassName="text-sm leading-6 text-slate-700"
                                        unorderedListClassName="ml-4 list-disc space-y-1 text-sm leading-6 text-slate-700 marker:text-slate-400"
                                      />
                                    </div>
                                  ) : null}
                                </div>
                              </div>
                              <span className="mt-1 block text-xs font-medium text-slate-500">
                                Score out of 5
                              </span>
                              <select
                                id={`score-${submission.id}-${criterion.id}`}
                                aria-label={`${criterion.title} score for ${submission.teamName}`}
                                value={entry.scores[criterion.id] ?? ''}
                                disabled={isSaving}
                                onChange={(event) => {
                                  const score = Number(event.target.value);
                                  updateEntry(submission.id, (current) => ({
                                    ...current,
                                    scores: { ...current.scores, [criterion.id]: score },
                                  }));
                                }}
                                className="mt-3 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                <option value="">Select score</option>
                                {Array.from(
                                  { length: MAX_CRITERION_SCORE - MIN_CRITERION_SCORE + 1 },
                                  (_, index) => index + MIN_CRITERION_SCORE
                                ).map((score) => (
                                  <option key={score} value={score}>{score}</option>
                                ))}
                              </select>
                              </div>
                            );
                          })}
                        </div>
                        <label className="block">
                          <span className="mb-2 block text-sm font-semibold text-slate-900">Judge notes</span>
                          <textarea
                            aria-label="Judge notes"
                            rows={4}
                            maxLength={4000}
                            value={entry.notes}
                            disabled={isSaving}
                            onChange={(event) =>
                              updateEntry(submission.id, (current) => ({
                                ...current,
                                notes: event.target.value,
                              }))
                            }
                            className="w-full resize-y rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base disabled:cursor-not-allowed disabled:opacity-60"
                          />
                        </label>
                        <div className="flex flex-col gap-3 rounded-2xl bg-slate-950 p-4 text-white sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-sm text-slate-300">Total score</p>
                            <p className="mt-1 text-2xl font-semibold">{total} / {maxTotal}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              void persistEntry(
                                getEntry(submission.id),
                                `Scores saved for ${submission.teamName}.`
                              ).catch(() => undefined)
                            }
                            disabled={!isComplete || isSaving}
                            className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-slate-950 disabled:opacity-50"
                          >
                            {isSaving ? 'Saving...' : 'Submit scores'}
                          </button>
                        </div>
                      </div>
                        ) : (
                          <div className="flex min-h-48 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm leading-6 text-slate-600">
                            Assign this project to yourself to open its scorecard.
                          </div>
                        )}
                      </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
