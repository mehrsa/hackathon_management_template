import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
} from 'react-router-dom';

import { getNavigationItems, isAdminEmail, isJudgeEmail } from '@/content/defaultContent';
import { useAuth } from '@/hooks/AuthContext';
import { useSiteContent } from '@/hooks/useSiteContent';
import type { AuthContextValue } from '@/hooks/AuthContext';
import type {
  AdminEmailRecord,
  ContentBlockRecord,
  JudgeEmailRecord,
  SiteData,
  SiteSettingsRecord,
  TimelineMilestoneRecord,
} from '@/types/site';

export interface SitePageContextValue {
  auth: AuthContextValue;
  isAdmin: boolean;
  isJudge: boolean;
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
  addJudgeEmail: (entry: JudgeEmailRecord) => Promise<void>;
  removeJudgeEmail: (id: string) => Promise<void>;
}

const homeIcon = (
  <svg
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    className="h-4 w-4"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10.5 12 3l9 7.5" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 9.75V21h13.5V9.75" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 21v-6h3v6" />
  </svg>
);

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
    addJudge,
    removeJudge,
  } = useSiteContent({ includeAdminEmails: true });

  const isAdmin = useMemo(
    () => isAdminEmail(auth.user?.email, siteData.adminEmails),
    [auth.user?.email, siteData.adminEmails]
  );
  const canManageContent = isAdmin && !isPreviewMode;
  const isJudge = useMemo(
    () => isAdmin || isJudgeEmail(auth.user?.email, siteData.judgeEmails),
    [auth.user?.email, isAdmin, siteData.judgeEmails]
  );
  const isEditing = canManageContent && editingEnabled;
  const navigationItems = useMemo(
    () => [
      { to: '/register', label: 'Registration Portal' },
      ...getNavigationItems(siteData.settings),
      { to: '/results', label: 'Results' },
      ...(isJudge ? [{ to: '/judge', label: 'Judge projects' }] : []),
      ...(isAdmin ? [{ to: '/admin', label: 'Admin' }] : []),
    ],
    [isAdmin, isJudge, siteData.settings]
  );
  const currentPageLabel =
    location.pathname === '/admin'
      ? 'Admin portal'
      : location.pathname === '/admin/report'
        ? 'Admin judging report'
      : location.pathname === '/admin/submissions'
        ? 'Admin submission review'
      : location.pathname === '/judge'
        ? 'Judge projects'
      : location.pathname === '/register'
        ? 'Registration Portal'
      : location.pathname === '/results'
        ? 'Results'
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
      isJudge,
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
      addJudgeEmail: async (entry) => {
        requireAdminAccess();
        await addJudge(entry);
      },
      removeJudgeEmail: async (id) => {
        requireAdminAccess();
        await removeJudge(id);
      },
    }),
    [
      auth,
      isAdmin,
      isJudge,
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
      addJudge,
      removeJudge,
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

      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/88 shadow-sm shadow-slate-900/5 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <Link
            to="/"
            className="inline-flex bg-gradient-to-r from-slate-950 via-slate-800 to-blue-700 bg-clip-text text-lg font-bold tracking-tight text-transparent md:text-xl"
          >
            {siteData.settings.siteTitle}
          </Link>

          <div className="mt-3 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <nav className="flex flex-wrap items-center gap-2">
              <NavLink
                to="/"
                end={true}
                aria-label="Home"
                className={({ isActive }) =>
                  [
                    'inline-flex items-center justify-center rounded-full px-3 py-2 text-sm font-medium transition duration-200',
                    isActive
                      ? 'bg-slate-950 text-white shadow-lg shadow-slate-900/10'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-950',
                  ].join(' ')
                }
              >
                {homeIcon}
                <span className="sr-only">Home</span>
              </NavLink>
              {navigationItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={true}
                  className={({ isActive }) =>
                    [
                      'rounded-full px-4 py-2 text-sm font-medium transition duration-200',
                      isActive
                        ? 'bg-slate-950 text-white shadow-lg shadow-slate-900/10'
                        : 'text-slate-700 hover:bg-slate-100 hover:text-slate-950',
                    ].join(' ')
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>

            <div className="flex flex-wrap items-center gap-3 xl:justify-end">
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
              <button
                type="button"
                onClick={() => void auth.signOut()}
                className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-100"
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

      <footer className="relative z-10 mt-12 border-t border-slate-200 bg-slate-950 text-slate-300">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-6 text-sm md:flex-row md:items-center md:justify-between">
          <p className="font-medium text-white">{siteData.settings.siteTitle}</p>
          <div className="flex flex-wrap items-center gap-4">
            <span>Current page: {currentPageLabel}</span>
            <Link to="/register" className="font-semibold text-blue-300 transition hover:text-blue-200">
              Registration Portal
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
