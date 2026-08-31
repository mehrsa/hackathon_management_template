import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PROJECT_SUBMISSION_LIMITS } from '@/constants/projectSubmissionLimits';
import { defaultSiteData } from '@/content/defaultContent';
import { RegistrationPage } from '@/pages/RegistrationPage';

const useSitePageContextMock = vi.fn();
const createProjectSubmissionMock = vi.fn();
const deleteFinalProjectSubmissionMock = vi.fn();
const deleteProjectSubmissionMock = vi.fn();
const fetchMyFinalProjectSubmissionMock = vi.fn();
const fetchMyProjectSubmissionMock = vi.fn();
const updateProjectSubmissionMock = vi.fn();

vi.mock('@/hooks/useSitePageContext', () => ({
  useSitePageContext: () => useSitePageContextMock(),
}));

vi.mock('@/content/registration', () => ({
  isRegistrationOpen: () => true,
  registrationOpenLabel: 'Registration Opens on July 1st 2026',
}));

vi.mock('@/services/projectSubmissions', () => ({
  createProjectSubmission: (...args: unknown[]) => createProjectSubmissionMock(...args),
  deleteProjectSubmission: (...args: unknown[]) => deleteProjectSubmissionMock(...args),
  fetchMyProjectSubmission: (...args: unknown[]) => fetchMyProjectSubmissionMock(...args),
  updateProjectSubmission: (...args: unknown[]) => updateProjectSubmissionMock(...args),
}));

vi.mock('@/services/finalProjectSubmissions', () => ({
  deleteFinalProjectSubmission: (...args: unknown[]) => deleteFinalProjectSubmissionMock(...args),
  fetchMyFinalProjectSubmission: (...args: unknown[]) => fetchMyFinalProjectSubmissionMock(...args),
}));

function buildPageContext(overrides: Record<string, unknown> = {}) {
  return {
    auth: {
      user: {
        id: 'user-1',
        email: 'member@example.com',
        name: 'Member Example',
      },
    },
    siteData: defaultSiteData,
    ...overrides,
  };
}

describe('RegistrationPage', () => {
  beforeEach(() => {
    useSitePageContextMock.mockReset();
    createProjectSubmissionMock.mockReset();
    deleteFinalProjectSubmissionMock.mockReset();
    deleteProjectSubmissionMock.mockReset();
    fetchMyFinalProjectSubmissionMock.mockReset();
    fetchMyProjectSubmissionMock.mockReset();
    updateProjectSubmissionMock.mockReset();
  });

  it('loads an existing registration into the form', async () => {
    fetchMyProjectSubmissionMock.mockResolvedValueOnce({
      id: 'submission-1',
      ownerUserId: 'user-1',
      ownerEmail: 'member@example.com',
      submitterName: 'Member Example',
      projectTitle: 'Team Atlas',
      teamMembers: 'Member Example, Jane Doe',
      teamEmails: 'member@example.com, jane@example.com',
      appTheme: 'AI onboarding assistant',
      teamRoles: 'Member Example - Engineer, Jane Doe - Designer',
      createdAt: '2026-06-29T10:00:00.000Z',
      updatedAt: '2026-06-29T12:00:00.000Z',
    });
    useSitePageContextMock.mockReturnValue(buildPageContext());

    render(
      <MemoryRouter>
        <RegistrationPage />
      </MemoryRouter>
    );

    expect(await screen.findByDisplayValue('Team Atlas')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Member Example, Jane Doe')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Update my registration' })).toBeInTheDocument();
  });

  it('creates a new registration for the signed-in user', async () => {
    const user = userEvent.setup();

    fetchMyProjectSubmissionMock.mockResolvedValueOnce(null);
    createProjectSubmissionMock.mockResolvedValueOnce(undefined);
    useSitePageContextMock.mockReturnValue(buildPageContext());

    render(
      <MemoryRouter>
        <RegistrationPage />
      </MemoryRouter>
    );

    await screen.findByText(/Signed in as/i);

    expect(
      screen.getByRole('textbox', {
        name: 'Project lead email',
      })
    ).toHaveValue('member@example.com');
    await user.type(screen.getByRole('textbox', { name: /1\. Project title/i }), 'Team Atlas');
    await user.type(
      screen.getByRole('textbox', { name: /2\. Full names of team members/i }),
      'Member Example, Jane Doe'
    );
    await user.type(
      screen.getByRole('textbox', { name: /3\. Email addresses of team members/i }),
      'member@example.com, jane@example.com'
    );
    await user.type(
      screen.getByRole('textbox', { name: /4\. Theme of your app/i }),
      'AI onboarding assistant'
    );
    await user.type(
      screen.getByRole('textbox', { name: /5\. Roles of team members/i }),
      'Member Example - Engineer, Jane Doe - Designer'
    );

    await user.click(screen.getByRole('button', { name: 'Save my registration' }));

    await waitFor(() => {
      expect(createProjectSubmissionMock).toHaveBeenCalledWith(
        expect.objectContaining({
          ownerUserId: 'user-1',
          ownerEmail: 'member@example.com',
          submitterName: 'member@example.com',
          projectTitle: 'Team Atlas',
          teamMembers: 'Member Example, Jane Doe',
          teamEmails: 'member@example.com, jane@example.com',
          appTheme: 'AI onboarding assistant',
          teamRoles: 'Member Example - Engineer, Jane Doe - Designer',
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        })
      );
    });

    expect(await screen.findByText('Your registration has been saved.')).toBeInTheDocument();
  });

  it('shows visible character limits for registration fields', async () => {
    fetchMyProjectSubmissionMock.mockResolvedValueOnce(null);
    useSitePageContextMock.mockReturnValue(buildPageContext());

    render(
      <MemoryRouter>
        <RegistrationPage />
      </MemoryRouter>
    );

    await screen.findByText(/Signed in as/i);

    expect(
      screen.getByText(`18 / ${PROJECT_SUBMISSION_LIMITS.submitterName} characters`)
    ).toBeInTheDocument();
    expect(
      screen.getByText(`0 / ${PROJECT_SUBMISSION_LIMITS.projectTitle} characters`)
    ).toBeInTheDocument();
    expect(screen.getAllByText(`0 / ${PROJECT_SUBMISSION_LIMITS.teamMembers} characters`)).toHaveLength(
      2
    );
  });

  it('lets a participant unregister before the deadline after confirming the warning', async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    fetchMyProjectSubmissionMock.mockResolvedValueOnce({
      id: 'submission-1',
      ownerUserId: 'user-1',
      ownerEmail: 'member@example.com',
      submitterName: 'Member Example',
      projectTitle: 'Team Atlas',
      teamMembers: 'Member Example, Jane Doe',
      teamEmails: 'member@example.com, jane@example.com',
      appTheme: 'AI onboarding assistant',
      teamRoles: 'Member Example - Engineer, Jane Doe - Designer',
      createdAt: '2026-06-29T10:00:00.000Z',
      updatedAt: '2026-06-29T12:00:00.000Z',
    });
    fetchMyFinalProjectSubmissionMock.mockResolvedValueOnce({
      id: 'final-1',
      ownerUserId: 'user-1',
      ownerEmail: 'member@example.com',
      submitterName: 'Member Example',
      teamName: 'Team Atlas',
      teamMembers: 'Member Example, Jane Doe',
      projectSummary: 'A polished summary.',
      assetLinks: 'https://github.com/example/repo',
      feedbackNotes: '- Filed #12',
      createdAt: '2026-06-29T10:00:00.000Z',
      updatedAt: '2026-06-29T12:00:00.000Z',
    });
    deleteFinalProjectSubmissionMock.mockResolvedValueOnce(undefined);
    deleteProjectSubmissionMock.mockResolvedValueOnce(undefined);
    useSitePageContextMock.mockReturnValue(buildPageContext());

    render(
      <MemoryRouter>
        <RegistrationPage />
      </MemoryRouter>
    );

    await screen.findByRole('button', { name: 'Unregister' });
    await user.click(screen.getByRole('button', { name: 'Unregister' }));

    await waitFor(() => {
      expect(confirmSpy).toHaveBeenCalled();
      expect(fetchMyFinalProjectSubmissionMock).toHaveBeenCalledWith('user-1');
      expect(deleteFinalProjectSubmissionMock).toHaveBeenCalledWith('final-1');
      expect(deleteProjectSubmissionMock).toHaveBeenCalledWith('submission-1');
    });

    expect(
      await screen.findByText('Your registration and final submission have been removed.')
    ).toBeInTheDocument();

    confirmSpy.mockRestore();
  });

  it('locks registration changes after the submission deadline', async () => {
    fetchMyProjectSubmissionMock.mockResolvedValueOnce({
      id: 'submission-1',
      ownerUserId: 'user-1',
      ownerEmail: 'member@example.com',
      submitterName: 'Member Example',
      projectTitle: 'Team Atlas',
      teamMembers: 'Member Example, Jane Doe',
      teamEmails: 'member@example.com, jane@example.com',
      appTheme: 'AI onboarding assistant',
      teamRoles: 'Member Example - Engineer, Jane Doe - Designer',
      createdAt: '2026-06-29T10:00:00.000Z',
      updatedAt: '2026-06-29T12:00:00.000Z',
    });
    useSitePageContextMock.mockReturnValue(
      buildPageContext({
        siteData: {
          ...defaultSiteData,
          settings: {
            ...defaultSiteData.settings,
            submitDeadline: '2025-01-01T00:00:00.000Z',
          },
        },
      })
    );

    render(
      <MemoryRouter>
        <RegistrationPage />
      </MemoryRouter>
    );

    expect(await screen.findByText(/Registration closed on/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Update my registration' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Unregister' })).toBeDisabled();
  });

  it('locks registration when an admin closes registration', async () => {
    fetchMyProjectSubmissionMock.mockResolvedValueOnce(null);
    useSitePageContextMock.mockReturnValue(
      buildPageContext({
        siteData: {
          ...defaultSiteData,
          settings: {
            ...defaultSiteData.settings,
            registrationOpen: false,
          },
        },
      })
    );

    render(
      <MemoryRouter>
        <RegistrationPage />
      </MemoryRouter>
    );

    expect(await screen.findByText('Registration is currently closed.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save my registration' })).toBeDisabled();
    expect(screen.getByRole('textbox', { name: /1\. Project title/i })).toBeDisabled();
  });
});
