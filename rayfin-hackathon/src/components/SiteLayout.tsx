import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
} from 'react-router-dom';

import { RichTextBody } from '@/components/RichTextBody';
import { getNavigationItems, isAdminEmail } from '@/content/defaultContent';
import { useAuth } from '@/hooks/AuthContext';
import { useSiteContent } from '@/hooks/useSiteContent';
import type { AuthContextValue } from '@/hooks/AuthContext';
import type {
  AdminEmailRecord,
  ContentBlockRecord,
  SiteData,
  SiteSettingsRecord,
  TimelineMilestoneRecord,
} from '@/types/site';

export interface SitePageContextValue {
  auth: AuthContextValue;
  isAdmin: boolean;
  isPreviewMode: boolean;
  canManageContent: boolean;
  isEditing: boolean;
  siteData: SiteData;
  saving: boolean;
  error: string | null;
  setPreviewMode: (value: boolean) => void;
  setEditing: (value: boolean) => void;
  saveSettings: (settings: SiteSettingsRecord) => Promise<void>;
  saveBlock: (block: ContentBlockRecord) => Promise<void>;
  removeBlock: (id: string) => Promise<void>;
  saveTimelineMilestone: (item: TimelineMilestoneRecord) => Promise<void>;
  removeTimelineMilestone: (id: string) => Promise<void>;
  addAdminEmail: (entry: AdminEmailRecord) => Promise<void>;
  removeAdminEmail: (id: string) => Promise<void>;
}

export function SiteLayout() {
  const auth = useAuth();
  const [editingEnabled, setEditingEnabled] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const location = useLocation();
  const {
    siteData,
    loading,
    saving,
    error,
    saveSettings,
    saveBlock,
    removeBlock,
    saveTimelineMilestone,
    removeTimelineMilestone,
    addAdmin,
    removeAdmin,
  } = useSiteContent({ includeAdminEmails: true });

  const isAdmin = useMemo(
    () => isAdminEmail(auth.user?.email, siteData.adminEmails),
    [auth.user?.email, siteData.adminEmails]
  );
  const canManageContent = isAdmin && !isPreviewMode;
  const isEditing = canManageContent && editingEnabled;
  const navigationItems = useMemo(
    () => getNavigationItems(siteData.settings),
    [siteData.settings]
  );
  const currentPageLabel =
    location.pathname === '/admin'
      ? 'Admin portal'
      : location.pathname === '/'
        ? 'Main page'
        : navigationItems.find((item) => item.to === location.pathname)?.label ?? 'Main page';

  const requireAdminAccess = useCallback(() => {
    if (!isAdmin) {
      throw new Error('Only approved admins can change website content.');
    }
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) {
      setEditingEnabled(false);
      setIsPreviewMode(false);
    }
  }, [isAdmin]);

  const updatePreviewMode = useCallback((value: boolean) => {
    setIsPreviewMode(value);
    if (value) {
      setEditingEnabled(false);
    }
  }, []);

  const updateEditing = useCallback(
    (value: boolean) => {
      if (value && !canManageContent) {
        throw new Error('Turn off participant preview before enabling edit mode.');
      }
      setEditingEnabled(value);
    },
    [canManageContent]
  );

  const context = useMemo<SitePageContextValue>(
    () => ({
      auth,
      isAdmin,
      isPreviewMode,
      canManageContent,
      isEditing,
      siteData,
      saving,
      error,
      setPreviewMode: updatePreviewMode,
      setEditing: updateEditing,
      saveSettings: async (settings) => {
        requireAdminAccess();
        await saveSettings(settings);
      },
      saveBlock: async (block) => {
        requireAdminAccess();
        await saveBlock(block);
      },
      removeBlock: async (id) => {
        requireAdminAccess();
        await removeBlock(id);
      },
      saveTimelineMilestone: async (item) => {
        requireAdminAccess();
        await saveTimelineMilestone(item);
      },
      removeTimelineMilestone: async (id) => {
        requireAdminAccess();
        await removeTimelineMilestone(id);
      },
      addAdminEmail: async (entry) => {
        requireAdminAccess();
        await addAdmin(entry);
      },
      removeAdminEmail: async (id) => {
        requireAdminAccess();
        await removeAdmin(id);
      },
    }),
    [
      auth,
      isAdmin,
      isPreviewMode,
      canManageContent,
      isEditing,
      siteData,
      saving,
      error,
      updatePreviewMode,
      updateEditing,
      requireAdminAccess,
      saveSettings,
      saveBlock,
      removeBlock,
      saveTimelineMilestone,
      removeTimelineMilestone,
      addAdmin,
      removeAdmin,
    ]
  );

  if (loading) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden">
        <div className="ambient-orb -left-16 top-10 h-72 w-72 bg-blue-200/80" />
        <div className="ambient-orb ambient-orb-delay -right-16 bottom-10 h-80 w-80 bg-indigo-200/70" />
        <div className="glass-panel rounded-3xl px-8 py-6 text-slate-700">
          Loading hackathon site...
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden text-slate-950">
      <div className="ambient-orb -left-24 top-24 h-80 w-80 bg-blue-200/70" />
      <div className="ambient-orb ambient-orb-delay right-0 top-10 h-96 w-96 bg-indigo-200/60" />
      <div className="ambient-orb bottom-0 left-1/3 h-72 w-72 bg-cyan-100/70" />

      <header className="sticky top-0 z-20 border-b border-emerald-100/80 bg-emerald-50/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Link
              to="/"
              className="inline-flex bg-gradient-to-r from-emerald-950 via-emerald-800 to-teal-700 bg-clip-text text-xl font-bold tracking-tight text-transparent"
            >
              {siteData.settings.siteTitle}
            </Link>
            <RichTextBody
              body={siteData.settings.siteDescription}
              className="mt-1 max-w-2xl space-y-1"
              paragraphClassName="text-sm text-slate-600"
            />
            {isAdmin ? (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Link
                  to="/admin"
                  className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800 transition hover:border-emerald-300 hover:bg-emerald-100"
                >
                  Admin
                </Link>
                {isPreviewMode ? (
                  <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-800">
                    Viewing as participant
                  </span>
                ) : null}
                {isEditing ? (
                  <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800">
                    Edit mode
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="flex flex-col gap-4 lg:items-end">
            <nav className="flex flex-wrap items-center gap-2">
              {navigationItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={true}
                  className={({ isActive }) =>
                    [
                      'rounded-full px-4 py-2 text-sm font-medium transition duration-200',
                      isActive
                        ? 'bg-emerald-200 text-emerald-950 shadow-lg shadow-emerald-950/10'
                        : 'text-emerald-900 hover:bg-white/85 hover:text-emerald-950',
                    ].join(' ')
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => void auth.signOut()}
                className="rounded-full border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-900 transition hover:bg-white/80"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-6 py-8">
        {error ? (
          <div className="glass-panel rounded-2xl border border-rose-200 bg-rose-50/90 px-4 py-3 text-sm text-rose-800">
            {error}
          </div>
        ) : null}

        <div className="mt-8">
          <Outlet context={context} />
        </div>
      </main>

      <footer className="relative z-10 mt-12 border-t border-white/60 bg-white/55 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-6 text-sm text-slate-600 md:flex-row md:items-center md:justify-between">
          <p>{siteData.settings.siteTitle}</p>
          <div className="flex flex-wrap items-center gap-4">
            <span>Current page: {currentPageLabel}</span>
            <a
              href={siteData.settings.registerUrl}
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-blue-700 hover:text-blue-800"
            >
              Registration link
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
