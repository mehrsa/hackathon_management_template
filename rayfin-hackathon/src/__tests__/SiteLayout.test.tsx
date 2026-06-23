import { render, screen } from '@testing-library/react';
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
    });
  });

  it('uses the updated green header theme for the top navigation', () => {
    useSiteContentMock.mockReturnValue({
      siteData: {
        ...defaultSiteData,
        settings: {
          ...defaultSiteData.settings,
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
  });
});
