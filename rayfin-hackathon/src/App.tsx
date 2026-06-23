import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { AuthPage } from '@/components/AuthPage';
import { RequireAuth } from '@/components/RequireAuth';
import { SiteLayout } from '@/components/SiteLayout';
import { useAuth } from '@/hooks/AuthContext';
import { AdminPortalPage } from '@/pages/AdminPortalPage';
import { BuildPage } from '@/pages/BuildPage';
import { HomePage } from '@/pages/HomePage';
import { JudgingPage } from '@/pages/JudgingPage';
import { SubmitPage } from '@/pages/SubmitPage';

function App() {
  const { isAuthenticated } = useAuth();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route element={<RequireAuth />}>
          <Route path="/" element={<SiteLayout />}>
            <Route index element={<HomePage />} />
            <Route path="admin" element={<AdminPortalPage />} />
            <Route path="build" element={<BuildPage />} />
            <Route path="judging" element={<JudgingPage />} />
            <Route path="submit" element={<SubmitPage />} />
          </Route>
        </Route>
        <Route
          path="*"
          element={<Navigate to={isAuthenticated ? '/' : '/auth'} replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
