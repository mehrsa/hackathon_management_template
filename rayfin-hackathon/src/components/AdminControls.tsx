import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { getNavigationItems } from '@/content/defaultContent';
import {
  DEFAULT_ADMIN_EMAIL,
  normalizeEmail,
  type AdminEmailRecord,
  type SiteSettingsRecord,
} from '@/types/site';

export function AdminControls({
  isAdmin,
  isEditing,
  isPreviewMode,
  saving,
  currentUserEmail,
  adminEmails,
  settings,
  onSetEditing,
  onSetPreviewMode,
  onAddAdmin,
  onRemoveAdmin,
  onSignOut,
}: {
  isAdmin: boolean;
  isEditing: boolean;
  isPreviewMode: boolean;
  saving: boolean;
  currentUserEmail: string | null;
  adminEmails: AdminEmailRecord[];
  settings: SiteSettingsRecord;
  onSetEditing: (value: boolean) => void;
  onSetPreviewMode: (value: boolean) => void;
  onAddAdmin: (email: string) => Promise<void>;
  onRemoveAdmin: (id: string) => Promise<void>;
  onSignOut: () => Promise<void>;
}) {
  const [inviteEmail, setInviteEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const adminEmailsByNormalizedAddress = useMemo(
    () => new Set(adminEmails.map((entry) => normalizeEmail(entry.email))),
    [adminEmails]
  );
  const editablePages = useMemo(
    () => [{ to: '/', label: 'Announcement' }, ...getNavigationItems(settings)],
    [settings]
  );

  const handleAddAdmin = async () => {
    const normalized = normalizeEmail(inviteEmail);
    setMessage(null);
    setError(null);

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      setError('Enter a valid email address.');
      return;
    }

    if (adminEmailsByNormalizedAddress.has(normalized)) {
      setError('That email already has admin access.');
      return;
    }

    try {
      await onAddAdmin(normalized);
      setInviteEmail('');
      setMessage('Admin email added.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to add admin email.');
    }
  };

  const handleRemoveAdmin = async (id: string) => {
    setMessage(null);
    setError(null);

    try {
      await onRemoveAdmin(id);
      setMessage('Admin email removed.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to remove admin email.');
    }
  };

  if (!isAdmin) {
    return (
      <section className="glass-panel rounded-3xl p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-amber-700">
          Admin portal
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-950">Access restricted</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
          This signed-in account is not on the admin allowlist, so it can browse the site
          but cannot manage content or admin access.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Link
            to="/"
            className="rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Back to site
          </Link>
          <button
            type="button"
            onClick={() => void onSignOut()}
            className="rounded-full border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-800 transition hover:bg-slate-100"
          >
            Sign out
          </button>
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <section className="glass-panel rounded-[2rem] p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-700">
          Admin portal
        </p>
        <div className="mt-4 flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-slate-950">Manage content and preview modes</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
              Use this portal to switch between participant preview and admin editing,
              then jump to the page you want to update.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700">
                Signed in as {currentUserEmail}
              </span>
              <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-800">
                Admin
              </span>
              {isPreviewMode ? (
                <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-800">
                  Participant preview
                </span>
              ) : null}
              {isEditing ? (
                <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800">
                  Inline editing on
                </span>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => onSetPreviewMode(!isPreviewMode)}
              className={[
                'rounded-full px-5 py-2.5 text-sm font-semibold transition',
                isPreviewMode
                  ? 'border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100'
                  : 'border border-slate-300 text-slate-800 hover:bg-slate-100',
              ].join(' ')}
            >
              {isPreviewMode ? 'Return to admin view' : 'Preview as participant'}
            </button>
            <button
              type="button"
              onClick={() => onSetEditing(!isEditing)}
              disabled={isPreviewMode}
              className="rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isEditing ? 'Turn off inline editing' : 'Turn on inline editing'}
            </button>
            <button
              type="button"
              onClick={() => void onSignOut()}
              className="rounded-full border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-800 transition hover:bg-slate-100"
            >
              Sign out
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <div className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">
                Edit in place
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                Open a page and edit where the content appears
              </h2>
            </div>
          </div>

          <div className="mt-5 grid gap-3">
            {editablePages.map((page) => (
              <Link
                key={page.to}
                to={page.to}
                className="site-card rounded-2xl border border-slate-200 bg-slate-50/80 p-4 transition hover:border-blue-200 hover:bg-blue-50/60"
              >
                <p className="font-semibold text-slate-950">{page.label}</p>
                <p className="mt-1 text-sm text-slate-600">
                  {isPreviewMode
                    ? 'Open this page in participant preview.'
                    : isEditing
                      ? 'Open this page with inline editing controls visible.'
                      : 'Open this page in admin view.'}
                </p>
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">
            Admin allowlist
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">
            Grant or revoke admin access
          </h2>
          <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-end">
            <label className="block flex-1">
              <span className="mb-2 block text-sm font-medium text-slate-700">
                Admin email
              </span>
              <input
                value={inviteEmail}
                onChange={(event) => setInviteEmail(event.target.value)}
                placeholder="teammate@example.com"
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </label>

            <button
              type="button"
              disabled={saving}
              onClick={() => void handleAddAdmin()}
              className="rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Add admin
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {adminEmails.map((entry) => {
              const isDefault = normalizeEmail(entry.email) === DEFAULT_ADMIN_EMAIL;
              return (
                <div
                  key={entry.id}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
                >
                  <span>{entry.email}</span>
                  {isDefault ? (
                    <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-slate-600">
                      default
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void handleRemoveAdmin(entry.id)}
                      className="text-rose-700 transition hover:text-rose-800"
                    >
                      Remove
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {message ? <p className="mt-3 text-sm text-emerald-700">{message}</p> : null}
          {error ? <p className="mt-3 text-sm text-rose-700">{error}</p> : null}
        </div>
      </section>
    </div>
  );
}
