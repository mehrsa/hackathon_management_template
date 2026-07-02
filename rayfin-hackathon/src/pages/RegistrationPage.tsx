import { useEffect, useState, type ChangeEvent, type FormEvent, type HTMLInputTypeAttribute } from 'react';
import { Link } from 'react-router-dom';

import { useSitePageContext } from '@/hooks/useSitePageContext';
import {
  deleteFinalProjectSubmission,
  fetchMyFinalProjectSubmission,
} from '@/services/finalProjectSubmissions';
import {
  createProjectSubmission,
  deleteProjectSubmission,
  fetchMyProjectSubmission,
  updateProjectSubmission,
} from '@/services/projectSubmissions';
import {
  createEmptyProjectSubmission,
  type ProjectSubmissionRecord,
} from '@/types/projectSubmission';
import {
  formatDeadlineForDisplay,
  isSubmissionClosed,
} from '@/utils/submissionDeadline';

interface RegistrationFieldConfig {
  name: keyof Pick<
    ProjectSubmissionRecord,
    'submitterName' | 'projectTitle' | 'teamMembers' | 'teamEmails' | 'appTheme' | 'teamRoles'
  >;
  label: string;
  description?: string;
  multiline?: boolean;
  inputType?: HTMLInputTypeAttribute;
}

const registrationFields: RegistrationFieldConfig[] = [
  {
    name: 'submitterName',
    label: 'Project lead email',
    inputType: 'email',
  },
  {
    name: 'projectTitle',
    label: '1. Project title',
    description: 'Give your proposed app a clear, specific title.',
  },
  {
    name: 'teamMembers',
    label: '2. Full names of team members',
    description:
      'Enter comma-separated full names of all Microsoft FTEs in your team. If registering individually, include your own name.',
    multiline: true,
  },
  {
    name: 'teamEmails',
    label: '3. Email addresses of team members',
    description:
      'Enter the Microsoft email addresses for all team members, separated by commas.',
    multiline: true,
  },
  {
    name: 'appTheme',
    label: '4. Theme of your app',
    description: 'Use case, industry, scenario, or idea.',
  },
  {
    name: 'teamRoles',
    label: '5. Roles of team members',
    description:
      'Specify the role of each team member beside their name. Example: Jane Doe - Product Manager.',
    multiline: true,
  },
];

export function RegistrationPage() {
  const { auth, siteData } = useSitePageContext();
  const [form, setForm] = useState<ProjectSubmissionRecord | null>(null);
  const [hasPersistedSubmission, setHasPersistedSubmission] = useState(false);
  const [loadingSubmission, setLoadingSubmission] = useState(true);
  const [savingSubmission, setSavingSubmission] = useState(false);
  const [deletingSubmission, setDeletingSubmission] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const deadlineLabel = formatDeadlineForDisplay(siteData.settings.submitDeadline);
  const submissionClosed = isSubmissionClosed(siteData.settings.submitDeadline);
  const registrationClosedMessage = deadlineLabel
    ? `Registration closed on ${deadlineLabel}.`
    : 'Registration is currently closed.';

  useEffect(() => {
    const currentUser = auth.user;

    if (!currentUser) {
      setForm(null);
      setHasPersistedSubmission(false);
      setLoadingSubmission(false);
      return;
    }

    let cancelled = false;

    setLoadingSubmission(true);
    setError(null);
    setSaveMessage(null);

    fetchMyProjectSubmission(currentUser.id)
      .then((submission) => {
        if (cancelled) {
          return;
        }

        setHasPersistedSubmission(Boolean(submission));
        setForm(submission ?? createEmptyProjectSubmission(currentUser));
      })
      .catch((err) => {
        if (cancelled) {
          return;
        }

        setError(err instanceof Error ? err.message : 'Unable to load your registration.');
        setHasPersistedSubmission(false);
        setForm(createEmptyProjectSubmission(currentUser));
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

    if (submissionClosed) {
      setError(registrationClosedMessage);
      setSaveMessage(null);
      return;
    }

    const now = new Date().toISOString();
    const trimmedForm: ProjectSubmissionRecord = {
      ...form,
      submitterName: form.submitterName.trim(),
      projectTitle: form.projectTitle.trim(),
      teamMembers: form.teamMembers.trim(),
      teamEmails: form.teamEmails.trim(),
      appTheme: form.appTheme.trim(),
      teamRoles: form.teamRoles.trim(),
      ownerUserId: auth.user.id,
      ownerEmail: auth.user.email,
      updatedAt: now,
    };

    if (!trimmedForm.createdAt) {
      trimmedForm.createdAt = now;
    }

    setSavingSubmission(true);
    setError(null);
    setSaveMessage(null);

    try {
      if (hasPersistedSubmission) {
        await updateProjectSubmission(trimmedForm);
        setSaveMessage('Your registration has been updated.');
      } else {
        await createProjectSubmission(trimmedForm);
        setSaveMessage('Your registration has been saved.');
        setHasPersistedSubmission(true);
      }

      setForm(trimmedForm);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save your registration.');
    } finally {
      setSavingSubmission(false);
    }
  }

  async function handleUnregister() {
    if (!auth.user || !form || !hasPersistedSubmission) {
      return;
    }

    if (submissionClosed) {
      setError(registrationClosedMessage);
      setSaveMessage(null);
      return;
    }

    const confirmed = window.confirm(
      deadlineLabel
        ? `Are you sure you want to unregister? This removes your saved registration and any final submission tied to it. You can register again until ${deadlineLabel}.`
        : 'Are you sure you want to unregister? This removes your saved registration and any final submission tied to it.'
    );

    if (!confirmed) {
      return;
    }

    setDeletingSubmission(true);
    setError(null);
    setSaveMessage(null);

    try {
      const finalSubmission = await fetchMyFinalProjectSubmission(auth.user.id);

      if (finalSubmission) {
        await deleteFinalProjectSubmission(finalSubmission.id);
      }

      await deleteProjectSubmission(form.id);
      setForm(createEmptyProjectSubmission(auth.user));
      setHasPersistedSubmission(false);
      setSaveMessage(
        finalSubmission
          ? 'Your registration and final submission have been removed.'
          : 'Your registration has been removed.'
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to remove your registration.');
    } finally {
      setDeletingSubmission(false);
    }
  }

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 px-8 py-9 text-white shadow-xl md:px-10 md:py-10">
        <div className="absolute bottom-0 right-0 h-36 w-36 rounded-full bg-blue-400/15 blur-3xl" />
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-200">
          Registration Portal
        </p>
        <h1 className="mt-4 max-w-4xl text-3xl font-semibold tracking-tight md:text-4xl lg:text-[2.7rem]">
          Register or update your team details
        </h1>
        <p className="mt-4 max-w-3xl text-[1.02rem] leading-8 text-slate-200">
          Share your team details, proposed app, and point of contact so others can discover what
          you are building before the hackathon submission deadline.
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.85fr)]">
        <article className="glass-panel rounded-3xl p-6">
          <div className="flex flex-col gap-3 border-b border-slate-200 pb-5">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-700">
              Registration Portal
            </p>
            <h2 className="text-2xl font-semibold text-slate-950">
              Fabric Apps (Rayfin) Hackathon Registration Portal
            </h2>
            <p className="max-w-3xl text-base leading-8 text-slate-700">
              Register yourself or your team for the Fabric Apps Hackathon. If working in a team, we
              strongly recommend not exceeding three teammates.
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
                ? `Registration closed on ${deadlineLabel}.`
                : `Registration updates and unregistering stay open until ${deadlineLabel}.`}
            </div>
          ) : null}

          {error ? (
            <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
              {error}
            </div>
          ) : null}

          {saveMessage ? (
            <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              {saveMessage}
            </div>
          ) : null}

          {loadingSubmission || !form ? (
            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-600">
              Loading your saved registration...
            </div>
          ) : (
            <form className="mt-6 space-y-6" onSubmit={(event) => void handleSubmit(event)}>
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                {submissionClosed ? (
                  <>
                    <span className="font-semibold">Read-only:</span> registrations can no longer be
                    changed or withdrawn after the submission deadline.
                  </>
                ) : (
                  <>
                    <span className="font-semibold">Required:</span> you can return to update or
                    unregister this registration any time before the submission deadline.
                  </>
                )}
              </div>

              {registrationFields.map((field) => {
                const value = form[field.name];

                return (
                  <label key={field.name} className="block space-y-2">
                    <span className="block text-base font-semibold text-slate-950">
                      {field.label}
                    </span>
                    {field.description ? (
                      <span className="block text-sm leading-6 text-slate-600">
                        {field.description}
                      </span>
                    ) : null}
                    {field.multiline ? (
                      <textarea
                        name={field.name}
                        value={value}
                        onChange={handleChange}
                        required={true}
                        rows={4}
                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 shadow-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                      />
                    ) : (
                      <input
                        type={field.inputType ?? 'text'}
                        name={field.name}
                        value={value}
                        onChange={handleChange}
                        required={true}
                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 shadow-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                      />
                    )}
                  </label>
                );
              })}

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={savingSubmission || deletingSubmission || submissionClosed}
                  className="inline-flex items-center justify-center rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-950/15 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingSubmission
                    ? 'Saving...'
                    : hasPersistedSubmission
                      ? 'Update my registration'
                      : 'Save my registration'}
                </button>
                {hasPersistedSubmission ? (
                  <button
                    type="button"
                    onClick={() => void handleUnregister()}
                    disabled={savingSubmission || deletingSubmission || submissionClosed}
                    className="inline-flex items-center justify-center rounded-full border border-rose-300 px-6 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {deletingSubmission ? 'Removing...' : 'Unregister'}
                  </button>
                ) : null}
                {form.updatedAt ? (
                  <span className="text-sm text-slate-500">
                    Last saved {new Date(form.updatedAt).toLocaleString()}
                  </span>
                ) : null}
              </div>
            </form>
          )}
        </article>

        <aside className="space-y-6">
          <section className="rounded-3xl border border-blue-200/70 bg-gradient-to-br from-blue-50 to-indigo-50 p-6 text-blue-950 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-700">
              Discovery
            </p>
            <h2 className="mt-2 text-xl font-semibold">See what other teams are building</h2>
            <p className="mt-3 text-sm leading-7 text-blue-900/85">
              Browse all submitted project ideas to avoid duplicate proposals or find a team you may
              want to join.
            </p>
            <Link
              to="/projects"
              className="mt-5 inline-flex rounded-full bg-white px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
            >
              Browse proposed projects
            </Link>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-950">Before you submit the final app</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Review the submission page for the final checklist, demo expectations, and the
              materials judges need in the final handoff.
            </p>
            <Link
              to="/submit"
              className="mt-5 inline-flex rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-100"
            >
              View submission requirements
            </Link>
          </section>
        </aside>
      </section>
    </div>
  );
}
