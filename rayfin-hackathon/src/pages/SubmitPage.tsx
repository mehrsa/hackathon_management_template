import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { Link } from 'react-router-dom';

import {
  ContentBlockInlineEditor,
  SiteSettingsInlineEditor,
} from '@/components/ContentEditors';
import { RichTextBody } from '@/components/RichTextBody';
import { getBlocksForPage } from '@/content/defaultContent';
import { useSitePageContext } from '@/hooks/useSitePageContext';
import {
  createFinalProjectSubmission,
  fetchMyFinalProjectSubmission,
  updateFinalProjectSubmission,
} from '@/services/finalProjectSubmissions';
import { fetchMyProjectSubmission } from '@/services/projectSubmissions';
import {
  createEmptyFinalProjectSubmission,
  type FinalProjectSubmissionRecord,
} from '@/types/finalProjectSubmission';
import {
  formatDeadlineForDisplay,
  isSubmissionClosed,
} from '@/utils/submissionDeadline';

interface SubmissionFieldConfig {
  name: keyof Pick<
    FinalProjectSubmissionRecord,
    'teamName' | 'teamMembers' | 'projectSummary' | 'assetLinks' | 'feedbackNotes'
  >;
  label: string;
  description: string;
  multiline?: boolean;
  rows?: number;
  lockedAfterSubmission?: boolean;
}

const submissionFields: SubmissionFieldConfig[] = [
  {
    name: 'teamName',
    label: '1. Team name',
    description: 'Use the final team name you want judges to see on your submission.',
    lockedAfterSubmission: true,
  },
  {
    name: 'teamMembers',
    label: '2. Team members',
    description: 'List every teammate on its own line or separate names with commas.',
    multiline: true,
    rows: 4,
    lockedAfterSubmission: true,
  },
  {
    name: 'projectSummary',
    label: '3. Project summary',
    description: 'Share a concise 2-3 sentence overview of the project and the problem it solves.',
    multiline: true,
    rows: 5,
  },
  {
    name: 'assetLinks',
    label: '4. Links to assets',
    description:
      'Paste one item per line, such as your GitHub repo, demo recording, deck, or any other handoff materials.',
    multiline: true,
    rows: 5,
  },
  {
    name: 'feedbackNotes',
    label: '5. Key product feedback or GitHub issues filed',
    description:
      'Add bullet points or links that highlight product feedback, bugs, or GitHub issues your team filed.',
    multiline: true,
    rows: 5,
  },
];

export function SubmitPage() {
  const {
    auth,
    isEditing,
    siteData,
    saving,
    saveSettings,
    saveBlock,
    removeBlock,
  } = useSitePageContext();
  const blocks = getBlocksForPage(siteData.blocks, 'submit');
  const checklistBlock = blocks[0] ?? null;
  const [form, setForm] = useState<FinalProjectSubmissionRecord | null>(null);
  const [hasRegistration, setHasRegistration] = useState(false);
  const [hasPersistedSubmission, setHasPersistedSubmission] = useState(false);
  const [loadingSubmission, setLoadingSubmission] = useState(true);
  const [savingSubmission, setSavingSubmission] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [submittedIdentity, setSubmittedIdentity] = useState<Pick<
    FinalProjectSubmissionRecord,
    'teamName' | 'teamMembers'
  > | null>(null);

  const deadlineLabel = formatDeadlineForDisplay(siteData.settings.submitDeadline);
  const submissionClosed = isSubmissionClosed(siteData.settings.submitDeadline);
  const canAccessSubmissionForm = hasRegistration || hasPersistedSubmission;
  const checklistSection = checklistBlock ? (
    <section className="rounded-[2rem] border border-blue-200/80 bg-gradient-to-br from-blue-50 via-white to-indigo-100 p-7 text-slate-950 shadow-xl shadow-blue-950/10 ring-1 ring-blue-100">
      <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-700">
        {siteData.settings.submitChecklistEyebrow}
      </p>
      <h2 className="mt-3 text-2xl font-semibold tracking-tight">
        {siteData.settings.submitChecklistTitle}
      </h2>
      <article className="mt-5 rounded-3xl border border-white/80 bg-white/90 p-5 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-950">{checklistBlock.title}</h3>
        <RichTextBody
          body={checklistBlock.body}
          className="mt-3 space-y-3"
          paragraphClassName="text-sm leading-7 text-slate-700"
        />
        {checklistBlock.ctaLabel && checklistBlock.ctaUrl ? (
          <a
            href={checklistBlock.ctaUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-5 inline-flex rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            {checklistBlock.ctaLabel}
          </a>
        ) : null}

        {isEditing ? (
          <div className="mt-5 border-t border-slate-200 pt-5">
            <ContentBlockInlineEditor
              title="Edit checklist section"
              block={checklistBlock}
              saving={saving}
              onSave={saveBlock}
              onDelete={removeBlock}
              canDelete={false}
              showCallToActionFields={true}
              bodyPlaceholder="Describe what teams need to submit. Use [link text](https://example.com) for supporting resources."
            />
          </div>
        ) : null}
      </article>
    </section>
  ) : (
    <section className="rounded-[2rem] border border-dashed border-slate-300 bg-white/90 p-6 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-700">
        {siteData.settings.submitChecklistEyebrow}
      </p>
      <h2 className="mt-2 text-2xl font-semibold text-slate-950">
        {siteData.settings.submitChecklistTitle}
      </h2>
      <p className="mt-4 text-sm leading-7 text-slate-600">
        No checklist section has been published yet.
      </p>
      {isEditing ? (
        <button
          type="button"
          onClick={() =>
            void saveBlock({
              id: crypto.randomUUID(),
              pageKey: 'submit',
              blockKind: 'submission',
              title: 'Submission checklist',
              body: 'Explain the single checklist section teams should review before submitting.',
              sortOrder: 1,
            }).catch(() => undefined)
          }
          disabled={saving}
          className="mt-4 rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Create checklist section
        </button>
      ) : null}
    </section>
  );

  useEffect(() => {
    const currentUser = auth.user;

    if (!currentUser) {
      setForm(null);
      setHasRegistration(false);
      setHasPersistedSubmission(false);
      setSubmittedIdentity(null);
      setLoadingSubmission(false);
      return;
    }

    let cancelled = false;

    setLoadingSubmission(true);
    setSubmissionError(null);
    setSaveMessage(null);

    Promise.allSettled([
      fetchMyProjectSubmission(currentUser.id),
      fetchMyFinalProjectSubmission(currentUser.id),
    ])
      .then(([registrationResult, submissionResult]) => {
        if (cancelled) {
          return;
        }

        const registration =
          registrationResult.status === 'fulfilled' ? registrationResult.value : null;
        const submission =
          submissionResult.status === 'fulfilled' ? submissionResult.value : null;

        const nextError =
          registrationResult.status === 'rejected'
            ? registrationResult.reason instanceof Error
              ? registrationResult.reason.message
              : 'Unable to load your registration.'
            : submissionResult.status === 'rejected'
              ? submissionResult.reason instanceof Error
                ? submissionResult.reason.message
                : 'Unable to load your saved submission.'
              : null;

        setHasRegistration(Boolean(registration) || Boolean(submission));
        setHasPersistedSubmission(Boolean(submission));
        setSubmittedIdentity(
          submission
            ? {
                teamName: submission.teamName,
                teamMembers: submission.teamMembers,
              }
            : null
        );
        setForm(
          submission ??
            createEmptyFinalProjectSubmission(currentUser, {
              teamMembers: registration?.teamMembers ?? '',
            })
        );
        setSubmissionError(nextError);
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingSubmission(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [auth.user]);

  function handleChange(event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = event.target;

    setForm((current) =>
      current
        ? {
            ...current,
            [name]: value,
          }
        : current
    );
    setSaveMessage(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!auth.user || !form) {
      return;
    }

    if (!canAccessSubmissionForm) {
      setSubmissionError('Complete the Registration Portal before submitting your project.');
      return;
    }

    if (submissionClosed) {
      setSubmissionError(
        deadlineLabel
          ? `Submissions closed on ${deadlineLabel}.`
          : 'Submissions are currently closed.'
      );
      return;
    }

    const now = new Date().toISOString();
    const teamName = submittedIdentity?.teamName ?? form.teamName.trim();
    const teamMembers = submittedIdentity?.teamMembers ?? form.teamMembers.trim();
    const trimmedForm: FinalProjectSubmissionRecord = {
      ...form,
      teamName,
      teamMembers,
      projectSummary: form.projectSummary.trim(),
      assetLinks: form.assetLinks.trim(),
      feedbackNotes: form.feedbackNotes.trim(),
      ownerUserId: auth.user.id,
      ownerEmail: auth.user.email,
      submitterName: auth.user.name,
      updatedAt: now,
    };

    if (!trimmedForm.createdAt) {
      trimmedForm.createdAt = now;
    }

    setSavingSubmission(true);
    setSubmissionError(null);
    setSaveMessage(null);

    try {
      if (hasPersistedSubmission) {
        await updateFinalProjectSubmission(trimmedForm);
        setSaveMessage('Your project submission has been updated.');
      } else {
        await createFinalProjectSubmission(trimmedForm);
        setSaveMessage(
          'Your project has been submitted. Team name and team members are now locked.'
        );
        setHasPersistedSubmission(true);
        setSubmittedIdentity({
          teamName: trimmedForm.teamName,
          teamMembers: trimmedForm.teamMembers,
        });
      }

      setForm(trimmedForm);
    } catch (err) {
      setSubmissionError(
        err instanceof Error ? err.message : 'Unable to save your project submission.'
      );
    } finally {
      setSavingSubmission(false);
    }
  }

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 px-8 py-9 text-white shadow-xl md:px-10 md:py-10">
        <div className="absolute bottom-0 right-0 h-36 w-36 rounded-full bg-blue-400/15 blur-3xl" />
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-200">
          {siteData.settings.navSubmitLabel}
        </p>
        <h1 className="mt-4 max-w-4xl text-3xl font-semibold tracking-tight md:text-4xl lg:text-[2.7rem]">
          {siteData.settings.submitHeroTitle}
        </h1>
        <RichTextBody
          body={siteData.settings.submitIntro}
          className="mt-4 max-w-3xl space-y-3"
          paragraphClassName="text-[1.02rem] leading-8 text-slate-200"
        />

        {isEditing ? (
          <div className="mt-8 max-w-3xl">
            <SiteSettingsInlineEditor
              title="Edit page introduction"
              description="Update the submission guidance shown at the top of this page."
              settings={siteData.settings}
              saving={saving}
              onSave={saveSettings}
              fields={[
                {
                  key: 'navSubmitLabel',
                  label: 'Menu and page label',
                },
                {
                  key: 'submitHeroTitle',
                  label: 'Hero title',
                  multiline: true,
                },
                {
                  key: 'submitIntro',
                  label: 'Page introduction (supports [link text](https://example.com))',
                  multiline: true,
                },
                {
                  key: 'submitChecklistEyebrow',
                  label: 'Checklist section eyebrow',
                },
                {
                  key: 'submitChecklistTitle',
                  label: 'Checklist section title',
                },
              ]}
            />
          </div>
        ) : null}
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.85fr)]">
        <div className="space-y-6">
          <article className="glass-panel rounded-3xl p-6">
            <div className="flex flex-col gap-3 border-b border-slate-200 pb-5">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-700">
                Final submission form
              </p>
              <h2 className="text-2xl font-semibold text-slate-950">
                Submit your finished hackathon project
              </h2>
              <p className="max-w-3xl text-base leading-8 text-slate-700">
                Capture the final team, summary, handoff links, and product feedback so judges and
                admins can review one consistent submission package.
              </p>
              <p className="text-sm font-medium text-slate-700">
                Signed in as <span className="font-semibold">{auth.user?.email}</span>.
              </p>
            </div>

            {deadlineLabel ? (
              <div
                className={[
                  'mt-5 rounded-2xl px-4 py-3 text-sm',
                  submissionClosed
                    ? 'border border-rose-200 bg-rose-50 text-rose-800'
                    : 'border border-blue-200 bg-blue-50 text-blue-900',
                ].join(' ')}
              >
                {submissionClosed
                  ? `Submissions closed on ${deadlineLabel}.`
                  : `Submission deadline: ${deadlineLabel}.`}
              </div>
            ) : null}

            {submissionError ? (
              <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                {submissionError}
              </div>
            ) : null}

            {saveMessage ? (
              <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                {saveMessage}
              </div>
            ) : null}

            {loadingSubmission || !form ? (
              <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-600">
                Loading your saved submission...
              </div>
            ) : !canAccessSubmissionForm ? (
              <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-5 text-sm text-amber-900">
                <span className="font-semibold">Registration required:</span> open the Registration
                Portal first, then return here to submit your project.
                <div className="mt-4">
                  <Link
                    to="/register"
                    className="inline-flex rounded-full bg-white px-4 py-2 font-semibold text-amber-900 transition hover:bg-amber-100"
                  >
                    Open the Registration Portal
                  </Link>
                </div>
              </div>
            ) : (
              <form className="mt-6 space-y-6" onSubmit={(event) => void handleSubmit(event)}>
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  {hasPersistedSubmission ? (
                    <>
                      <span className="font-semibold">Locked fields:</span> team name and team
                      members cannot change after the first submission, but you can still update the
                      rest of the handoff before the deadline.
                    </>
                  ) : (
                    <>
                      <span className="font-semibold">Required:</span> team name and team members
                      lock after your first project submission.
                    </>
                  )}
                </div>

                {submissionFields.map((field) => {
                  const value = form[field.name];
                  const isLocked = Boolean(field.lockedAfterSubmission && hasPersistedSubmission);

                  return (
                    <label key={field.name} className="block space-y-2">
                      <span className="block text-base font-semibold text-slate-950">
                        {field.label}
                      </span>
                      <span className="block text-sm leading-6 text-slate-600">
                        {field.description}
                      </span>
                      {field.multiline ? (
                        <textarea
                          name={field.name}
                          value={value}
                          onChange={handleChange}
                          required={true}
                          disabled={isLocked}
                          rows={field.rows ?? 4}
                          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 shadow-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                        />
                      ) : (
                        <input
                          name={field.name}
                          value={value}
                          onChange={handleChange}
                          required={true}
                          disabled={isLocked}
                          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 shadow-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                        />
                      )}
                    </label>
                  );
                })}

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={savingSubmission || submissionClosed}
                    className="inline-flex items-center justify-center rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-950/15 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {savingSubmission
                      ? 'Saving...'
                      : hasPersistedSubmission
                        ? 'Update my submission'
                        : 'Submit project'}
                  </button>
                  {form.updatedAt ? (
                    <span className="text-sm text-slate-500">
                      Last saved {new Date(form.updatedAt).toLocaleString()}
                    </span>
                  ) : null}
                </div>
              </form>
            )}
          </article>

        </div>

        <aside className="space-y-6">
          <section className="rounded-3xl border border-blue-200/70 bg-gradient-to-br from-blue-50 to-indigo-50 p-6 text-blue-950 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-700">
              Registration Portal
            </p>
            <h2 className="mt-2 text-xl font-semibold">Need to register or update details first?</h2>
            <p className="mt-3 text-sm leading-7 text-blue-900/85">
              Use the Registration Portal to register your team or modify your details before the
              first project submission.
            </p>
            <Link
              to="/register"
              className="mt-5 inline-flex rounded-full bg-white px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
            >
              Open the Registration Portal
            </Link>
          </section>

          {checklistSection}
        </aside>
      </section>
    </div>
  );
}
