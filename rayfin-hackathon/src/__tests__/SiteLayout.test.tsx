import { cleanup, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { defaultSiteData } from '@/content/defaultContent';
import { SiteLayout } from '@/components/SiteLayout';
import type { AuthContextValue } from '@/hooks/AuthContext';

const useAuthMock = vi.fn<() => AuthContextValue>();
const useSiteContentMock = vi.fn();

vi.mock('@/hooks/AuthContext', () => ({
  useAuth: () => useAuthMock(),
}));

vi.mock('@/hooks/useSiteContent', () => ({
  useSiteContent: () => useSiteContentMock(),
}));

function buildAuthContext(
  overrides: Partial<AuthContextValue> = {}
): AuthContextValue {
  return {
    user: {
      id: 'user-1',
      email: 'member@example.com',
      name: 'Member',
    },
    loading: false,
    error: null,
    signIn: vi.fn(),
    signOut: vi.fn(),
    isAuthenticated: true,
    fabricAuthEnabled: false,
    ...overrides,
  };
}

describe('SiteLayout', () => {
  beforeEach(() => {
    useAuthMock.mockReset();
    useSiteContentMock.mockReset();

    useAuthMock.mockReturnValue(buildAuthContext());
    useSiteContentMock.mockReturnValue({
      siteData: defaultSiteData,
      loading: false,
      saving: false,
      error: null,
      saveSettings: vi.fn(),
      saveBlock: vi.fn(),
      removeBlock: vi.fn(),
      saveTimelineMilestone: vi.fn(),
      removeTimelineMilestone: vi.fn(),
      addAdmin: vi.fn(),
      removeAdmin: vi.fn(),
      addJudge: vi.fn(),
      removeJudge: vi.fn(),
    });
  });

  it('uses the sharper neutral header theme for the top navigation', () => {
    useSiteContentMock.mockReturnValue({
      siteData: {
        ...defaultSiteData,
        settings: {
          ...defaultSiteData.settings,
          siteDescription:
            'Get the [official brief](https://example.com/brief) before exploring the event.',
          navBuildLabel: 'Create with Rayfin',
        },
      },
      loading: false,
      saving: false,
      error: null,
      saveSettings: vi.fn(),
      saveBlock: vi.fn(),
      removeBlock: vi.fn(),
      saveTimelineMilestone: vi.fn(),
      removeTimelineMilestone: vi.fn(),
      addAdmin: vi.fn(),
      removeAdmin: vi.fn(),
      addJudge: vi.fn(),
      removeJudge: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/build']}>
        <Routes>
          <Route path="/" element={<SiteLayout />}>
            <Route path="build" element={<div>Build page</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByRole('banner')).toHaveClass('bg-white/88');
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'Create with Rayfin' })).toHaveClass(
      'bg-slate-950'
    );
    expect(screen.queryByRole('link', { name: 'official brief' })).not.toBeInTheDocument();
    const registrationLinks = screen.getAllByRole('link', { name: 'Registration Portal' });

    expect(registrationLinks[0]).toHaveAttribute(
      'href',
      '/register'
    );
    expect(registrationLinks[1]).toHaveAttribute(
      'href',
      '/register'
    );
  });

  it('shows admin as a menu item only for admins', () => {
    useAuthMock.mockReturnValue(
      buildAuthContext({
        user: {
          id: 'admin-1',
          email: defaultSiteData.adminEmails[0].email,
          name: 'Admin',
        },
      })
    );

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route path="/" element={<SiteLayout />}>
            <Route path="admin" element={<div>Admin page</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByRole('link', { name: 'Admin' })).toHaveAttribute('href', '/admin');

    useAuthMock.mockReturnValue(buildAuthContext());
    cleanup();

    render(
      <MemoryRouter initialEntries={['/build']}>
        <Routes>
          <Route path="/" element={<SiteLayout />}>
            <Route path="build" element={<div>Build page</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.queryByRole('link', { name: 'Admin' })).not.toBeInTheDocument();
  });

  it('orders top navigation items with registration first and admin last', () => {
    useAuthMock.mockReturnValue(
      buildAuthContext({
        user: {
          id: 'admin-1',
          email: defaultSiteData.adminEmails[0].email,
          name: 'Admin',
        },
      })
    );

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route path="/" element={<SiteLayout />}>
            <Route path="admin" element={<div>Admin page</div>} />
            <Route path="register" element={<div>Register page</div>} />
            <Route path="judging" element={<div>Judging page</div>} />
            <Route path="build" element={<div>Build page</div>} />
            <Route path="resources" element={<div>Resources page</div>} />
            <Route path="projects" element={<div>Projects page</div>} />
            <Route path="submit" element={<div>Submit page</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    const topNavigation = within(screen.getByRole('banner')).getByRole('navigation');
    const linkNames = within(topNavigation)
      .getAllByRole('link')
      .map((link) => link.getAttribute('aria-label') ?? link.textContent ?? '');

    expect(linkNames).toEqual([
      'Home',
      'Registration Portal',
      defaultSiteData.settings.navJudgingLabel,
      defaultSiteData.settings.navBuildLabel,
      'Resources',
      defaultSiteData.settings.navProjectsLabel,
      defaultSiteData.settings.navSubmitLabel,
      'Results',
      'Judge projects',
      'Admin',
    ]);
  });

  it('shows the judge workspace only to judges and admins', () => {
    render(
      <MemoryRouter initialEntries={['/build']}>
        <Routes>
          <Route path="/" element={<SiteLayout />}>
            <Route path="build" element={<div>Build page</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.queryByRole('link', { name: 'Judge projects' })).not.toBeInTheDocument();

    cleanup();
    useSiteContentMock.mockReturnValue({
      siteData: {
        ...defaultSiteData,
        judgeEmails: [
          {
            id: 'judge-email-1',
            email: 'member@example.com',
            addedByEmail: defaultSiteData.adminEmails[0].email,
          },
        ],
      },
      loading: false,
      saving: false,
      error: null,
      saveSettings: vi.fn(),
      saveBlock: vi.fn(),
      removeBlock: vi.fn(),
      saveTimelineMilestone: vi.fn(),
      removeTimelineMilestone: vi.fn(),
      addAdmin: vi.fn(),
      removeAdmin: vi.fn(),
      addJudge: vi.fn(),
      removeJudge: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/judge']}>
        <Routes>
          <Route path="/" element={<SiteLayout />}>
            <Route path="judge" element={<div>Judge page</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByRole('link', { name: 'Judge projects' })).toHaveAttribute('href', '/judge');
  });
});
