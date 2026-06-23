import { useState } from 'react';
import { Navigate } from 'react-router-dom';

import { useAuth } from '@/hooks/AuthContext';

const msLogo = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 21 21"
    className="mr-2"
  >
    <rect x="1" y="1" width="9" height="9" fill="#f25022" />
    <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
    <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
    <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
  </svg>
);

export function AuthPage() {
  const { signIn, fabricAuthEnabled, isAuthenticated, loading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleSignIn = async () => {
    setError(null);
    setIsLoading(true);

    try {
      await signIn();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign in.');
    } finally {
      setIsLoading(false);
    }
  };

  const buttonLabel = loading
    ? fabricAuthEnabled
      ? 'Checking Microsoft sign-in...'
      : 'Checking sign-in...'
    : isLoading
    ? fabricAuthEnabled
      ? 'Opening Fabric...'
      : 'Signing in...'
    : 'Sign in with Microsoft';

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="ambient-orb -right-18 top-12 h-72 w-72 bg-blue-200/80" />
      <div className="ambient-orb ambient-orb-delay -left-24 bottom-10 h-96 w-96 bg-indigo-200/70" />

      <div className="relative flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="glass-panel rounded-3xl p-8">
            <div className="mb-8 text-center">
              <h1 className="text-2xl font-bold text-gray-900">Sign in to continue</h1>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Everyone must sign in to view the site. Only approved admins can
                change website content.
              </p>
            </div>

            <button
              type="button"
              onClick={handleSignIn}
              disabled={isLoading || loading}
              className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-sm font-medium text-white shadow-md shadow-blue-600/25 transition-all hover:shadow-lg hover:shadow-blue-600/30 hover:brightness-110 disabled:opacity-50 disabled:shadow-none"
            >
              {msLogo}
              {buttonLabel}
            </button>

            {error && (
              <p className="mt-3 text-center text-sm text-red-600">{error}</p>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
