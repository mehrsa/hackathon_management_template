import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { useSitePageContext } from '@/hooks/useSitePageContext';
import { fetchFinalProjectSubmissions } from '@/services/finalProjectSubmissions';
import { fetchAllJudgingEntries } from '@/services/judgingEntries';
import { splitMultilineValues, type FinalProjectSubmissionRecord } from '@/types/finalProjectSubmission';
import {
  getLatestJudgingEntriesByJudge,
  type JudgingEntryRecord,
} from '@/types/judging';
import { formatDeadlineForDisplay } from '@/utils/submissionDeadline';

const urlPattern = /https?:\/\/\S+/i;

function splitTeamMembers(value?: string | null): string[] {
  if (typeof value !== 'string' || !value.trim()) {
    return [];
  }

  return value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function getUrlFromText(value?: string | null): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const match = value.match(urlPattern);

  if (!match) {
    return null;
  }

  try {
    return new URL(match[0]).toString();
  } catch {
    return null;
  }
}

function matchesSearch(submission: FinalProjectSubmissionRecord, query: string): boolean {
  const haystack = [
    submission.teamName,
    submission.teamMembers,
    submission.projectSummary,
    submission.assetLinks,
    submission.feedbackNotes,
    submission.submitterName,
    submission.ownerEmail,
  ]
    .join('\n')
    .toLowerCase();

  return haystack.includes(query);
}

export function AdminSubmissionsPage() {
  const { auth, isAdmin, siteData } = useSitePageContext();
  const [search, setSearch] = useState('');
  const [submissions, setSubmissions] = useState<FinalProjectSubmissionRecord[]>([]);
  const [judgingEntries, setJudgingEntries] = useState<JudgingEntryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin) {
      setSubmissions([]);
      setJudgingEntries([]);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;

    setLoading(true);
    setError(null);

    Promise.all([fetchFinalProjectSubmissions(), fetchAllJudgingEntries()])
      .then(([submissionRows, entryRows]) => {
        if (!cancelled) {
          setSubmissions(submissionRows);
          setJudgingEntries(entryRows);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unable to load team submissions.');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isAdmin]);

  const filteredSubmissions = useMemo(() => {
    const normalized = search.trim().toLowerCase();

    if (!normalized) {
      return submissions;
    }

    return submissions.filter((submission) => matchesSearch(submission, normalized));
  }, [search, submissions]);
  const starredEntriesBySubmission = useMemo(() => {
    const entriesBySubmission = new Map<string, JudgingEntryRecord[]>();

    for (const entry of judgingEntries) {
      const projectEntries = entriesBySubmission.get(entry.submissionId) ?? [];
      projectEntries.push(entry);
      entriesBySubmission.set(entry.submissionId, projectEntries);
    }

    return new Map(
      [...entriesBySubmission].map(([submissionId, entries]) => [
        submissionId,
        getLatestJudgingEntriesByJudge(entries).filter((entry) => entry.starred),
      ])
    );
  }, [judgingEntries]);

  const deadlineLabel = formatDeadlineForDisplay(siteData.settings.submitDeadline);

  if (!isAdmin) {
    return (
      <section className="glass-panel rounded-3xl p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-amber-700">
          Project review
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-950">Access restricted</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
          Only approved admins can search and review final project submissions.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Back to site
          </Link>
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-8">
      <section className="glass-panel rounded-[2rem] px-8 py-7 md:px-10 md:py-8">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-700">
          Admin review
        </p>
        <h1 className="mt-4 max-w-4xl text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl lg:text-[2.7rem]">
          Search submitted projects
        </h1>
        <p className="mt-4 max-w-3xl text-[1.02rem] leading-8 text-slate-700">
          Review every final submission in one place, search by team or owner, and inspect the full
          handoff package before judging.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-slate-600">
          <span className="rounded-full border border-slate-200 bg-white px-3 py-1">
            Signed in as {auth.user?.email}
          </span>
          {deadlineLabel ? (
            <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-blue-800">
              Submission deadline: {deadlineLabel}
            </span>
          ) : null}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <label className="block w-full max-w-2xl">
            <span className="mb-2 block text-sm font-medium text-slate-700">
              Search submissions
            </span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by team, member, submitter, email, summary, or links"
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </label>

          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm text-slate-700">
              {filteredSubmissions.length} result{filteredSubmissions.length === 1 ? '' : 's'}
            </span>
            <Link
              to="/admin"
              className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-100"
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

      {loading ? (
        <div className="glass-panel rounded-3xl px-6 py-8 text-sm text-slate-600">
          Loading team submissions...
        </div>
      ) : filteredSubmissions.length === 0 ? (
        <div className="glass-panel rounded-3xl px-6 py-8 text-sm text-slate-600">
          {submissions.length === 0
            ? 'No final project submissions have been saved yet.'
            : 'No submissions match your current search.'}
        </div>
      ) : (
        <section className="grid gap-6 xl:grid-cols-2">
          {filteredSubmissions.map((submission) => {
            const assetLinks = splitMultilineValues(submission.assetLinks);
            const feedbackNotes = splitMultilineValues(submission.feedbackNotes);
            const teamMembers = splitTeamMembers(submission.teamMembers);
            const starredEntries = starredEntriesBySubmission.get(submission.id) ?? [];

            return (
              <article
                key={submission.id}
                className="site-card rounded-3xl border border-white/70 bg-white/90 p-6 shadow-sm"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-xl font-semibold text-slate-950">{submission.teamName}</h2>
                  {starredEntries.length > 0 ? (
                    <span
                      className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800"
                      title={starredEntries
                        .map((entry) => entry.judgeName || entry.judgeEmail || 'Unknown judge')
                        .join(', ')}
                    >
                      <span aria-hidden="true">★</span>{' '}
                      Starred by {starredEntries.length} judge
                      {starredEntries.length === 1 ? '' : 's'}
                    </span>
                  ) : null}
                  {submission.ownerUserId === auth.user?.id ? (
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800">
                      Your team
                    </span>
                  ) : null}
                </div>

                <p className="mt-2 text-sm text-slate-500">
                  Submitted by {submission.submitterName} ({submission.ownerEmail})
                </p>

                <div className="mt-5 space-y-5">
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Team members
                    </h3>
                    <ul className="mt-3 space-y-2 text-sm text-slate-700">
                      {teamMembers.map((member) => (
                        <li key={`${submission.id}-${member}`}>{member}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Project summary
                    </h3>
                    <p className="mt-2 whitespace-pre-line text-sm leading-7 text-slate-700">
                      {submission.projectSummary}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Asset links
                    </h3>
                    <ul className="mt-3 space-y-2 text-sm">
                      {assetLinks.map((item) => {
                        const url = getUrlFromText(item);

                        return (
                          <li key={`${submission.id}-asset-${item}`}>
                            {url ? (
                              <a
                                href={url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-blue-700 underline decoration-blue-300 underline-offset-4"
                              >
                                {item}
                              </a>
                            ) : (
                              <span className="text-slate-700">{item}</span>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Product feedback and issues
                    </h3>
                    <ul className="mt-3 space-y-2 text-sm">
                      {feedbackNotes.map((item) => {
                        const url = getUrlFromText(item);

                        return (
                          <li key={`${submission.id}-feedback-${item}`}>
                            {url ? (
                              <a
                                href={url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-blue-700 underline decoration-blue-300 underline-offset-4"
                              >
                                {item}
                              </a>
                            ) : (
                              <span className="text-slate-700">{item}</span>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>

                <div className="mt-5 border-t border-slate-200 pt-4 text-sm text-slate-500">
                  Last updated {new Date(submission.updatedAt).toLocaleString()}
                </div>
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}
