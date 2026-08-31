import { useEffect, useMemo, useState } from 'react';

import { RichTextBody } from '@/components/RichTextBody';
import { getBlocksForPage } from '@/content/defaultContent';
import { useSitePageContext } from '@/hooks/useSitePageContext';
import { fetchFinalProjectSubmissions } from '@/services/finalProjectSubmissions';
import {
  buildHackathonResults,
  parseHonorableMentionIds,
  serializeHonorableMentionIds,
  splitTeamMembers,
  type HackathonResult,
  type ResultMedal,
} from '@/services/hackathonResults';
import { fetchAllJudgingEntries } from '@/services/judgingEntries';
import { fetchProjectSubmissions } from '@/services/projectSubmissions';
import {
  createResultProjectDescription,
  fetchResultProjectDescriptions,
  updateResultProjectDescription,
  type ResultProjectDescriptionRecord,
} from '@/services/resultProjectDescriptions';
import { FINAL_PROJECT_SUBMISSION_LIMITS } from '@/constants/finalProjectSubmissionLimits';
import { PROJECT_SUBMISSION_LIMITS } from '@/constants/projectSubmissionLimits';
import type { FinalProjectSubmissionRecord } from '@/types/finalProjectSubmission';
import type { JudgingEntryRecord } from '@/types/judging';
import type { ProjectSubmissionRecord } from '@/types/projectSubmission';

const medalStyles = {
  Gold: 'border-amber-300 bg-gradient-to-br from-amber-50 via-white to-yellow-100 text-amber-950',
  Silver: 'border-slate-300 bg-gradient-to-br from-slate-50 via-white to-slate-200 text-slate-950',
  Bronze: 'border-orange-300 bg-gradient-to-br from-orange-50 via-white to-amber-100 text-orange-950',
} as const;

const medalIcons: Record<ResultMedal, string> = {
  Gold: '🥇',
  Silver: '🥈',
  Bronze: '🥉',
};

const medalOrder: ResultMedal[] = ['Gold', 'Silver', 'Bronze'];

function TeamDetails({
  result,
  description,
  projectLinks,
}: {
  result: Pick<HackathonResult, 'projectTitle' | 'teamMembers'>;
  description: string;
  projectLinks: string;
}) {
  return (
    <>
      <p className="mt-3 text-lg font-semibold">{result.projectTitle}</p>
      {description ? (
        <RichTextBody
          body={description}
          className="mt-3 space-y-1"
          paragraphClassName="whitespace-pre-wrap text-sm leading-7 text-current/80"
          unorderedListClassName="ml-5 list-disc space-y-1 text-sm leading-7 text-current/80"
          unorderedListItemClassName="pl-1"
        />
      ) : null}
      {projectLinks ? (
        <div className="mt-3 text-sm leading-7 text-current/80">
          <p className="font-semibold">Project links:</p>
          <RichTextBody
            body={projectLinks}
            className="mt-1 space-y-1"
            paragraphClassName="text-sm leading-7 text-current/80"
            unorderedListClassName="ml-5 list-disc space-y-1 text-sm leading-7 text-current/80"
            unorderedListItemClassName="pl-1"
          />
        </div>
      ) : null}
      <p className="mt-3 text-sm leading-7 text-current/75">
        <span className="font-semibold">Team members:</span>{' '}
        {result.teamMembers.length > 0 ? result.teamMembers.join(', ') : 'Not provided'}
      </p>
    </>
  );
}

export function ResultsPage() {
  const {
    isAdmin,
    isPreviewMode,
    siteData,
    saveSettings,
    saving,
    setPreviewMode,
  } = useSitePageContext();
  const [registrations, setRegistrations] = useState<ProjectSubmissionRecord[]>([]);
  const [submissions, setSubmissions] = useState<FinalProjectSubmissionRecord[]>([]);
  const [entries, setEntries] = useState<JudgingEntryRecord[]>([]);
  const [descriptions, setDescriptions] = useState<ResultProjectDescriptionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [editingDescriptionId, setEditingDescriptionId] = useState<string | null>(null);
  const [titleDraft, setTitleDraft] = useState('');
  const [descriptionDraft, setDescriptionDraft] = useState('');
  const [projectLinksDraft, setProjectLinksDraft] = useState('');
  const [savingDescriptionId, setSavingDescriptionId] = useState<string | null>(null);
  const criterionIds = useMemo(
    () =>
      getBlocksForPage(siteData.blocks, 'judging')
        .filter((block) => block.blockKind === 'criterion')
        .map((block) => block.id),
    [siteData.blocks]
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([
      fetchProjectSubmissions(),
      fetchFinalProjectSubmissions(),
      fetchAllJudgingEntries(),
      fetchResultProjectDescriptions(),
    ])
      .then(([registrationRows, submissionRows, entryRows, descriptionRows]) => {
        if (cancelled) return;
        setRegistrations(registrationRows);
        setSubmissions(submissionRows);
        setEntries(entryRows);
        setDescriptions(descriptionRows);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unable to load hackathon results.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const { ranked, stats } = useMemo(
    () => buildHackathonResults(registrations, submissions, entries, criterionIds),
    [criterionIds, entries, registrations, submissions]
  );
  const winners = ranked.filter((result) => result.medal !== null);
  const winnerIds = new Set(winners.map((result) => result.submissionId));
  const mentionIds = parseHonorableMentionIds(
    siteData.settings.honorableMentionSubmissionIds
  );
  const registrationsByOwner = new Map(
    registrations.map((registration) => [registration.ownerUserId, registration])
  );
  const submissionsById = new Map(
    submissions.map((submission) => [submission.id, submission])
  );
  const descriptionsBySubmissionId = new Map(
    descriptions.map((description) => [description.submissionId, description])
  );
  const honorableMentions = submissions
    .filter(
      (submission) => mentionIds.includes(submission.id) && !winnerIds.has(submission.id)
    )
    .map((submission) => {
      const registration = registrationsByOwner.get(submission.ownerUserId);
      return {
        submissionId: submission.id,
        teamName: submission.teamName,
        projectTitle:
          descriptionsBySubmissionId.get(submission.id)?.projectTitle ||
          registration?.projectTitle ||
          submission.teamName,
        teamMembers: splitTeamMembers(
          submission.teamMembers || registration?.teamMembers || submission.submitterName
        ),
        description:
          descriptionsBySubmissionId.get(submission.id)?.description ||
          submission.projectSummary,
        projectLinks:
          descriptionsBySubmissionId.get(submission.id)?.projectLinks || '',
      };
    });
  const submissionPercentage =
    stats.registeredTeams > 0
      ? Math.round((stats.finalSubmissions / stats.registeredTeams) * 100)
      : 0;
  const isAdminDraftPreview =
    isAdmin && !isPreviewMode && !siteData.settings.resultsPublished;
  const canViewResults = siteData.settings.resultsPublished || isAdminDraftPreview;
  const canEditResults = isAdmin && !isPreviewMode;

  async function toggleHonorableMention(submissionId: string) {
    const selected = mentionIds.includes(submissionId);
    const nextIds = selected
      ? mentionIds.filter((id) => id !== submissionId)
      : mentionIds.concat(submissionId);

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

  function getPublicDescription(submissionId: string): string {
    return (
      descriptionsBySubmissionId.get(submissionId)?.description ||
      submissionsById.get(submissionId)?.projectSummary ||
      ''
    );
  }

  function getPublicTitle(result: HackathonResult): string {
    return descriptionsBySubmissionId.get(result.submissionId)?.projectTitle || result.projectTitle;
  }

  function getPublicLinks(submissionId: string): string {
    return descriptionsBySubmissionId.get(submissionId)?.projectLinks || '';
  }

  function beginEditingDescription(submissionId: string, projectTitle: string) {
    setEditingDescriptionId(submissionId);
    setTitleDraft(projectTitle);
    setDescriptionDraft(getPublicDescription(submissionId));
    setProjectLinksDraft(getPublicLinks(submissionId));
    setError(null);
    setMessage(null);
  }

  async function saveDescription(submissionId: string) {
    const projectTitle = titleDraft.trim();
    const description = descriptionDraft.trim();
    const projectLinks = projectLinksDraft.trim();
    if (!projectTitle) {
      setError('Enter a public project title before saving.');
      return;
    }
    if (!description) {
      setError('Enter a public project description before saving.');
      return;
    }

    const existing = descriptionsBySubmissionId.get(submissionId);
    const record: ResultProjectDescriptionRecord = {
      id: existing?.id ?? crypto.randomUUID(),
      submissionId,
      projectTitle,
      description,
      projectLinks,
      updatedAt: new Date().toISOString(),
    };

    setSavingDescriptionId(submissionId);
    setError(null);
    setMessage(null);

    try {
      if (existing) {
        await updateResultProjectDescription(record);
        setDescriptions((current) =>
          current.map((item) => (item.id === record.id ? record : item))
        );
      } else {
        await createResultProjectDescription(record);
        setDescriptions((current) => current.concat(record));
      }
      setEditingDescriptionId(null);
      setTitleDraft('');
      setDescriptionDraft('');
      setProjectLinksDraft('');
      setMessage('Public project details saved.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save the project details.');
    } finally {
      setSavingDescriptionId(null);
    }
  }

  function renderDescriptionEditor(submissionId: string, projectTitle: string) {
    if (!canEditResults) return null;

    if (editingDescriptionId !== submissionId) {
      return (
        <button
          type="button"
          onClick={() => beginEditingDescription(submissionId, projectTitle)}
          className="mt-4 rounded-full border border-current/30 bg-white/70 px-4 py-2 text-xs font-semibold transition hover:bg-white"
        >
          Edit project details
        </button>
      );
    }

    return (
      <div className="mt-4 rounded-2xl border border-current/20 bg-white/80 p-4 text-slate-950">
        <label className="block text-sm font-semibold">
          Public project title
          <input
            value={titleDraft}
            maxLength={PROJECT_SUBMISSION_LIMITS.projectTitle}
            onChange={(event) => setTitleDraft(event.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-normal outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </label>
        <p className="mt-1 text-right text-xs text-slate-500">
          {titleDraft.length} / {PROJECT_SUBMISSION_LIMITS.projectTitle}
        </p>
        <label className="mt-3 block text-sm font-semibold">
          Public project description
          <textarea
            value={descriptionDraft}
            maxLength={FINAL_PROJECT_SUBMISSION_LIMITS.projectSummary}
            rows={5}
            onChange={(event) => setDescriptionDraft(event.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-normal leading-6 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </label>
        <p className="mt-1 text-right text-xs text-slate-500">
          {descriptionDraft.length} / {FINAL_PROJECT_SUBMISSION_LIMITS.projectSummary}
        </p>
        <label className="mt-3 block text-sm font-semibold">
          Public project links
          <textarea
            value={projectLinksDraft}
            maxLength={FINAL_PROJECT_SUBMISSION_LIMITS.assetLinks}
            rows={3}
            placeholder={'[Live demo](https://example.com)\n[Source code](https://github.com/example/project)'}
            onChange={(event) => setProjectLinksDraft(event.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-normal leading-6 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </label>
        <p className="mt-1 text-xs text-slate-500">
          Add one link per line as a full URL or [link label](https://example.com).
        </p>
        <p className="mt-1 text-right text-xs text-slate-500">
          {projectLinksDraft.length} / {FINAL_PROJECT_SUBMISSION_LIMITS.assetLinks}
        </p>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            disabled={savingDescriptionId === submissionId}
            onClick={() => void saveDescription(submissionId)}
            className="rounded-full bg-slate-950 px-4 py-2 text-xs font-semibold text-white disabled:opacity-60"
          >
            {savingDescriptionId === submissionId ? 'Saving...' : 'Save project details'}
          </button>
          <button
            type="button"
            disabled={savingDescriptionId === submissionId}
            onClick={() => {
              setEditingDescriptionId(null);
              setTitleDraft('');
              setDescriptionDraft('');
              setProjectLinksDraft('');
            }}
            className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 disabled:opacity-60"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {isAdmin ? (
        <section className="flex flex-col gap-4 rounded-3xl border border-blue-200 bg-blue-50/90 p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">
              Results view
            </p>
            <p className="mt-1 text-sm leading-6 text-slate-700">
              {isPreviewMode
                ? 'You are seeing this page exactly as participants see it.'
                : 'Switch to participant view to check the published results experience.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setPreviewMode(!isPreviewMode)}
            className={[
              'shrink-0 rounded-full px-5 py-2.5 text-sm font-semibold transition',
              isPreviewMode
                ? 'border border-blue-300 bg-white text-blue-800 hover:bg-blue-100'
                : 'bg-blue-700 text-white hover:bg-blue-800',
            ].join(' ')}
          >
            {isPreviewMode ? 'Return to admin view' : 'View as participant'}
          </button>
        </section>
      ) : null}

      <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-900 px-8 py-10 text-white shadow-xl">
        <div className="absolute -right-12 -top-12 h-56 w-56 rounded-full bg-amber-300/15 blur-3xl" />
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-200">
          Hackathon showcase
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-5xl">
          Results and highlights
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-8 text-slate-200">
          Celebrate the teams, projects, and participation that made this hackathon possible.
        </p>
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
          Loading hackathon highlights...
        </div>
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-2">
            {[
              ['Registered teams', stats.registeredTeams],
              ['Submission percentage', `${submissionPercentage}%`],
            ].map(([label, value]) => (
              <article
                key={label}
                className="rounded-3xl border border-slate-200 bg-white p-5 text-center shadow-sm"
              >
                <p className="text-3xl font-semibold text-slate-950">{value}</p>
                <p className="mt-2 text-sm font-medium text-slate-600">{label}</p>
              </article>
            ))}
          </section>

          {isAdminDraftPreview ? (
            <section className="rounded-3xl border border-amber-300 bg-amber-50 p-6 text-amber-950">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-800">
                Admin preview
              </p>
              <h2 className="mt-2 text-2xl font-semibold">These results are not published</h2>
              <p className="mt-3 text-sm leading-7 text-amber-900/80">
                You can review the complete results page below. Participants will continue to see
                the coming soon message until results are published.
              </p>
            </section>
          ) : null}

          {!canViewResults ? (
            <section className="rounded-3xl border border-blue-200 bg-blue-50 p-8 text-center text-blue-950">
              <h2 className="text-2xl font-semibold">Results are coming soon</h2>
              <p className="mt-3 text-sm leading-7 text-blue-900/80">
                The judging team is finalizing winners and special recognitions.
              </p>
            </section>
          ) : (
            <>
              <section>
                <div className="mb-5">
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-amber-700">
                    Podium
                  </p>
                  <h2 className="mt-2 text-3xl font-semibold text-slate-950">
                    Winning teams
                  </h2>
                </div>
                {winners.length === 0 ? (
                  <p className="rounded-3xl border border-slate-200 bg-white p-6 text-slate-600">
                    No winning teams have been finalized yet.
                  </p>
                ) : (
                  <div className="space-y-6">
                    {medalOrder.map((medal) => {
                      const medalWinners = winners.filter((winner) => winner.medal === medal);
                      if (medalWinners.length === 0) return null;

                      return (
                        <div key={medal}>
                          <div className="mb-3 flex items-center gap-3">
                            <span
                              role="img"
                              aria-label={`${medal} medal`}
                              className="text-4xl drop-shadow-sm"
                            >
                              {medalIcons[medal]}
                            </span>
                            <h3 className="text-xl font-bold text-slate-950">{medal} winners</h3>
                          </div>
                          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {medalWinners.map((winner) => (
                              <article
                                key={winner.submissionId}
                                className={`rounded-3xl border p-6 shadow-sm ${medalStyles[medal]}`}
                              >
                                <p className="text-sm font-bold uppercase tracking-[0.2em]">
                                  {medal} winner
                                </p>
                                <h4 className="mt-3 text-2xl font-semibold">{winner.teamName}</h4>
                                <TeamDetails
                                  result={{
                                    ...winner,
                                    projectTitle: getPublicTitle(winner),
                                  }}
                                  description={getPublicDescription(winner.submissionId)}
                                  projectLinks={getPublicLinks(winner.submissionId)}
                                />
                                {renderDescriptionEditor(
                                  winner.submissionId,
                                  getPublicTitle(winner)
                                )}
                              </article>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              {canEditResults ? (
                <section className="rounded-[2rem] border border-violet-300 bg-violet-50 p-7">
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-violet-700">
                    Admin editor
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                    Edit honorable mentions
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Add or remove submitted projects. Medal winners are excluded automatically.
                  </p>
                  <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {submissions
                      .filter((submission) => !winnerIds.has(submission.id))
                      .sort((left, right) => left.teamName.localeCompare(right.teamName))
                      .map((submission) => {
                        const selected = mentionIds.includes(submission.id);
                        return (
                          <div
                            key={submission.id}
                            className="flex items-center justify-between gap-4 rounded-2xl border border-violet-200 bg-white p-4"
                          >
                            <p className="min-w-0 truncate font-semibold text-slate-950">
                              {submission.teamName}
                            </p>
                            <button
                              type="button"
                              aria-pressed={selected}
                              disabled={saving}
                              onClick={() => void toggleHonorableMention(submission.id)}
                              className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                                selected
                                  ? 'bg-violet-700 text-white hover:bg-violet-800'
                                  : 'border border-violet-300 text-violet-800 hover:bg-violet-100'
                              }`}
                            >
                              {selected ? 'Remove mention' : 'Add mention'}
                            </button>
                          </div>
                        );
                      })}
                  </div>
                </section>
              ) : null}

              {honorableMentions.length > 0 ? (
                <section className="rounded-[2rem] border border-violet-200 bg-gradient-to-br from-violet-50 via-white to-fuchsia-50 p-7">
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-violet-700">
                    Special recognition
                  </p>
                  <h2 className="mt-2 text-3xl font-semibold text-slate-950">
                    Honorable mentions
                  </h2>
                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    {honorableMentions.map((mention) => (
                      <article
                        key={mention.submissionId}
                        className="rounded-3xl border border-violet-200 bg-white p-5 text-slate-950 shadow-sm"
                      >
                        <h3 className="text-xl font-semibold">{mention.teamName}</h3>
                        <TeamDetails
                          result={mention}
                          description={mention.description}
                          projectLinks={mention.projectLinks}
                        />
                        {renderDescriptionEditor(mention.submissionId, mention.projectTitle)}
                      </article>
                    ))}
                  </div>
                </section>
              ) : null}
            </>
          )}
        </>
      )}
    </div>
  );
}
