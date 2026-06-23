import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { defaultSiteData } from '@/content/defaultContent';
import { registrationOpenLabel } from '@/content/registration';
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
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 5, 30, 12, 0, 0));

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
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('uses the updated green header theme for the top navigation', () => {
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

    expect(screen.getByRole('banner')).toHaveClass('bg-emerald-50/80');
    expect(screen.getByRole('link', { name: 'Create with Rayfin' })).toHaveClass(
      'bg-emerald-200'
    );
    expect(screen.getByRole('link', { name: 'official brief' })).toHaveAttribute(
      'href',
      'https://example.com/brief'
    );
    expect(screen.getByText(registrationOpenLabel)).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Registration link' })).not.toBeInTheDocument();
  });

  it('shows the registration link once July 1st 2026 arrives', () => {
    vi.setSystemTime(new Date(2026, 6, 1, 0, 0, 0));

    render(
      <MemoryRouter initialEntries={['/build']}>
        <Routes>
          <Route path="/" element={<SiteLayout />}>
            <Route path="build" element={<div>Build page</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByRole('link', { name: 'Registration link' })).toHaveAttribute(
      'href',
      defaultSiteData.settings.registerUrl
    );
    expect(screen.queryByText(registrationOpenLabel)).not.toBeInTheDocument();
  });
});
