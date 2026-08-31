import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { defaultSiteData } from '@/content/defaultContent';
import { AdminPortalPage } from '@/pages/AdminPortalPage';

const useSitePageContextMock = vi.fn();

vi.mock('@/hooks/useSitePageContext', () => ({
  useSitePageContext: () => useSitePageContextMock(),
}));

describe('AdminPortalPage', () => {
  it('lets an admin independently close registration and submissions', async () => {
    const user = userEvent.setup();
    const saveSettings = vi.fn().mockResolvedValue(undefined);
    useSitePageContextMock.mockReturnValue({
      auth: {
        user: {
          id: 'admin-1',
          email: defaultSiteData.adminEmails[0].email,
          name: 'Admin',
        },
        signOut: vi.fn(),
      },
      isAdmin: true,
      isEditing: false,
      isPreviewMode: false,
      siteData: defaultSiteData,
      saving: false,
      saveSettings,
      setPreviewMode: vi.fn(),
      setEditing: vi.fn(),
      addAdminEmail: vi.fn(),
      removeAdminEmail: vi.fn(),
      addJudgeEmail: vi.fn(),
      removeJudgeEmail: vi.fn(),
    });

    render(
      <MemoryRouter>
        <AdminPortalPage />
      </MemoryRouter>
    );

    const registrationControl = screen.getByText('Registration').parentElement?.parentElement;
    const submissionControl = screen.getByText('Submissions').parentElement?.parentElement;

    await user.click(within(registrationControl!).getByRole('button', { name: 'Close' }));
    await user.click(within(submissionControl!).getByRole('button', { name: 'Close' }));

    expect(saveSettings).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ registrationOpen: false, submissionOpen: true })
    );
    expect(saveSettings).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ registrationOpen: true, submissionOpen: false })
    );
  });
});
