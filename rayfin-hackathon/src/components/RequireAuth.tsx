import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { useAuth } from '@/hooks/AuthContext';

export function RequireAuth() {
  const auth = useAuth();
  const location = useLocation();

  if (auth.loading) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50">
        <div className="ambient-orb -left-16 top-10 h-72 w-72 bg-blue-200/80" />
        <div className="ambient-orb ambient-orb-delay -right-16 bottom-10 h-80 w-80 bg-indigo-200/70" />
        <div className="glass-panel rounded-3xl px-8 py-6 text-slate-700">
          Checking sign-in...
        </div>
      </div>
    );
  }

  if (!auth.isAuthenticated) {
    return <Navigate to="/auth" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
