import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { AuthPage } from '@/components/AuthPage';
import { RequireAuth } from '@/components/RequireAuth';
import { SiteLayout } from '@/components/SiteLayout';
import { useAuth } from '@/hooks/AuthContext';
import { AdminPortalPage } from '@/pages/AdminPortalPage';
import { AdminSubmissionsPage } from '@/pages/AdminSubmissionsPage';
import { BuildPage } from '@/pages/BuildPage';
import { HomePage } from '@/pages/HomePage';
import { JudgingPage } from '@/pages/JudgingPage';
import { ProjectsPage } from '@/pages/ProjectsPage';
import { RegistrationPage } from '@/pages/RegistrationPage';
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
            <Route path="admin/submissions" element={<AdminSubmissionsPage />} />
            <Route path="build" element={<BuildPage />} />
            <Route path="judging" element={<JudgingPage />} />
            <Route path="register" element={<RegistrationPage />} />
            <Route path="submit" element={<SubmitPage />} />
            <Route path="projects" element={<ProjectsPage />} />
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
