import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { AdminControls } from '@/components/AdminControls';
import { formatDeadlineForDisplay, formatDeadlineForInput, parseDeadlineInput } from '@/utils/submissionDeadline';
import { useSitePageContext } from '@/hooks/useSitePageContext';

export function AdminPortalPage() {
  const {
    auth,
    isAdmin,
    isEditing,
    isPreviewMode,
    siteData,
    saving,
    saveSettings,
    setPreviewMode,
    setEditing,
    addAdminEmail,
    removeAdminEmail,
    addJudgeEmail,
    removeJudgeEmail,
  } = useSitePageContext();
  const [deadlineInput, setDeadlineInput] = useState('');
  const [deadlineMessage, setDeadlineMessage] = useState<string | null>(null);
  const [deadlineError, setDeadlineError] = useState<string | null>(null);
  const [controlMessage, setControlMessage] = useState<string | null>(null);
  const [controlError, setControlError] = useState<string | null>(null);

  useEffect(() => {
    setDeadlineInput(formatDeadlineForInput(siteData.settings.submitDeadline));
  }, [siteData.settings.submitDeadline]);

  const activeDeadline = formatDeadlineForDisplay(siteData.settings.submitDeadline);

  async function handleSaveDeadline() {
    setDeadlineMessage(null);
    setDeadlineError(null);

    try {
      const submitDeadline = parseDeadlineInput(deadlineInput) ?? '';
      await saveSettings({
        ...siteData.settings,
        submitDeadline,
      });
      setDeadlineMessage(submitDeadline ? 'Submission deadline saved.' : 'Submission deadline cleared.');
    } catch (err) {
      setDeadlineError(err instanceof Error ? err.message : 'Unable to save the submission deadline.');
    }
  }

  async function handleToggle(
    key: 'registrationOpen' | 'submissionOpen' | 'resultsPublished',
    label: string
  ) {
    setControlMessage(null);
    setControlError(null);

    try {
      const nextValue = !siteData.settings[key];
      await saveSettings({
        ...siteData.settings,
        [key]: nextValue,
      });
      const stateLabel =
        key === 'resultsPublished'
          ? nextValue
            ? 'published'
            : 'unpublished'
          : nextValue
            ? 'opened'
            : 'closed';
      setControlMessage(`${label} ${stateLabel}.`);
    } catch (err) {
      setControlError(err instanceof Error ? err.message : `Unable to update ${label}.`);
    }
  }

  return (
    <div className="space-y-6">
      <AdminControls
        isAdmin={isAdmin}
        isEditing={isEditing}
        isPreviewMode={isPreviewMode}
        saving={saving}
        currentUserEmail={auth.user?.email ?? null}
        adminEmails={siteData.adminEmails}
        judgeEmails={siteData.judgeEmails}
        settings={siteData.settings}
        onSetEditing={setEditing}
        onSetPreviewMode={setPreviewMode}
        onAddAdmin={async (email) => {
          await addAdminEmail({
            id: crypto.randomUUID(),
            email,
            addedByEmail: auth.user?.email ?? email,
          });
        }}
        onRemoveAdmin={removeAdminEmail}
        onAddJudge={async (email) => {
          await addJudgeEmail({
            id: crypto.randomUUID(),
            email,
            addedByEmail: auth.user?.email ?? email,
          });
        }}
        onRemoveJudge={removeJudgeEmail}
        onSignOut={auth.signOut}
      />

      {isAdmin ? (
        <section className="grid gap-6 xl:grid-cols-3">
          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-3">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-700">
              Event controls
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">
              Open or close participant workflows
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Closed workflows become read-only immediately. Publish results only after winners and
              honorable mentions are finalized.
            </p>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {(
                [
                  ['registrationOpen', 'Registration'],
                  ['submissionOpen', 'Submissions'],
                  ['resultsPublished', 'Results'],
                ] as const
              ).map(([key, label]) => {
                const isOpen = siteData.settings[key];
                return (
                  <div
                    key={key}
                    className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div>
                      <p className="font-semibold text-slate-950">{label}</p>
                      <p className={`mt-1 text-xs font-medium ${isOpen ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {isOpen ? (key === 'resultsPublished' ? 'Published' : 'Open') : (key === 'resultsPublished' ? 'Hidden' : 'Closed')}
                      </p>
                    </div>
                    <button
                      type="button"
                      aria-pressed={isOpen}
                      onClick={() => void handleToggle(key, label)}
                      disabled={saving}
                      className={`rounded-full px-4 py-2 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
                        isOpen ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'
                      }`}
                    >
                      {isOpen
                        ? key === 'resultsPublished'
                          ? 'Unpublish'
                          : 'Close'
                        : key === 'resultsPublished'
                          ? 'Publish'
                          : 'Open'}
                    </button>
                  </div>
                );
              })}
            </div>
            {controlMessage ? <p className="mt-4 text-sm text-emerald-700">{controlMessage}</p> : null}
            {controlError ? <p className="mt-4 text-sm text-rose-700">{controlError}</p> : null}
          </article>

          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">
              Submission window
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">
              Set the final submission deadline
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
              Teams can submit and update their handoff until this deadline. After the deadline, the
              submission form becomes read-only for participants.
            </p>

            <label className="mt-5 block">
              <span className="mb-2 block text-sm font-medium text-slate-700">
                Submission deadline
              </span>
              <input
                type="datetime-local"
                value={deadlineInput}
                onChange={(event) => setDeadlineInput(event.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </label>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => void handleSaveDeadline()}
                disabled={saving}
                className="rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Save deadline
              </button>
              <button
                type="button"
                onClick={() => setDeadlineInput('')}
                disabled={saving}
                className="rounded-full border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-800 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Clear
              </button>
            </div>

            {activeDeadline ? (
              <p className="mt-4 text-sm text-slate-600">Current deadline: {activeDeadline}</p>
            ) : (
              <p className="mt-4 text-sm text-slate-600">
                No deadline is set yet. Teams can keep submitting until you add one.
              </p>
            )}
            {deadlineMessage ? <p className="mt-3 text-sm text-emerald-700">{deadlineMessage}</p> : null}
            {deadlineError ? <p className="mt-3 text-sm text-rose-700">{deadlineError}</p> : null}
          </article>

          <article className="rounded-3xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50 to-teal-50 p-6 text-emerald-950 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
              Judging report
            </p>
            <h2 className="mt-2 text-2xl font-semibold">Track progress and score trends</h2>
            <p className="mt-3 text-sm leading-7 text-emerald-900/85">
              See top projects, judging completion, score trends, and the teams that still need
              judges or completed scorecards.
            </p>
            <Link
              to="/admin/report"
              className="mt-5 inline-flex rounded-full bg-white px-4 py-2 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100"
            >
              Open judging report
            </Link>
          </article>

          <article className="rounded-3xl border border-blue-200/70 bg-gradient-to-br from-blue-50 to-indigo-50 p-6 text-blue-950 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">
              Project review
            </p>
            <h2 className="mt-2 text-2xl font-semibold">Search and review submitted projects</h2>
            <p className="mt-3 text-sm leading-7 text-blue-900/85">
              Open the dedicated admin review page to search every final submission by team, owner,
              or content and review the full handoff details in one place.
            </p>
            <Link
              to="/admin/submissions"
              className="mt-5 inline-flex rounded-full bg-white px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
            >
              Open project review
            </Link>
          </article>
        </section>
      ) : null}
    </div>
  );
}
