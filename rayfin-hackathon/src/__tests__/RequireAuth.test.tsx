import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { RequireAuth } from '@/components/RequireAuth';
import type { AuthContextValue } from '@/hooks/AuthContext';

const useAuthMock = vi.fn<() => AuthContextValue>();

vi.mock('@/hooks/AuthContext', () => ({
  useAuth: () => useAuthMock(),
}));

function buildAuthContext(
  overrides: Partial<AuthContextValue> = {}
): AuthContextValue {
  return {
    user: null,
    loading: false,
    error: null,
    signIn: vi.fn(),
    signOut: vi.fn(),
    isAuthenticated: false,
    fabricAuthEnabled: false,
    ...overrides,
  };
}

describe('RequireAuth', () => {
  beforeEach(() => {
    useAuthMock.mockReset();
  });

  it('shows a loading state while the auth session is being resolved', () => {
    useAuthMock.mockReturnValue(buildAuthContext({ loading: true }));

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route element={<RequireAuth />}>
            <Route path="/" element={<div>Protected content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Checking sign-in...')).toBeInTheDocument();
  });

  it('redirects signed-out visitors to the sign-in page', () => {
    useAuthMock.mockReturnValue(buildAuthContext());

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/auth" element={<div>Sign-in page</div>} />
          <Route element={<RequireAuth />}>
            <Route path="/" element={<div>Protected content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Sign-in page')).toBeInTheDocument();
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
  });

  it('renders protected routes for signed-in visitors', () => {
    useAuthMock.mockReturnValue(
      buildAuthContext({
        isAuthenticated: true,
        user: {
          id: 'user-1',
          email: 'member@example.com',
          name: 'Member',
        },
      })
    );

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route element={<RequireAuth />}>
            <Route path="/" element={<div>Protected content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Protected content')).toBeInTheDocument();
  });
});
