import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { defaultSiteData } from '@/content/defaultContent';
import { SubmitPage } from '@/pages/SubmitPage';

const useSitePageContextMock = vi.fn();
const createFinalProjectSubmissionMock = vi.fn();
const fetchMyFinalProjectSubmissionMock = vi.fn();
const updateFinalProjectSubmissionMock = vi.fn();
const fetchMyProjectSubmissionMock = vi.fn();

vi.mock('@/hooks/useSitePageContext', () => ({
  useSitePageContext: () => useSitePageContextMock(),
}));

vi.mock('@/services/finalProjectSubmissions', () => ({
  createFinalProjectSubmission: (...args: unknown[]) => createFinalProjectSubmissionMock(...args),
  fetchMyFinalProjectSubmission: (...args: unknown[]) => fetchMyFinalProjectSubmissionMock(...args),
  updateFinalProjectSubmission: (...args: unknown[]) => updateFinalProjectSubmissionMock(...args),
}));

vi.mock('@/services/projectSubmissions', () => ({
  fetchMyProjectSubmission: (...args: unknown[]) => fetchMyProjectSubmissionMock(...args),
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
    isEditing: false,
    siteData: defaultSiteData,
    saving: false,
    saveSettings: vi.fn(),
    saveBlock: vi.fn(),
    removeBlock: vi.fn(),
    ...overrides,
  };
}

describe('SubmitPage', () => {
  beforeEach(() => {
    useSitePageContextMock.mockReset();
    createFinalProjectSubmissionMock.mockReset();
    fetchMyFinalProjectSubmissionMock.mockReset();
    updateFinalProjectSubmissionMock.mockReset();
    fetchMyProjectSubmissionMock.mockReset();

    fetchMyProjectSubmissionMock.mockResolvedValue({
      id: 'registration-1',
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
    fetchMyFinalProjectSubmissionMock.mockResolvedValue(null);
  });

  it('shows the final submission form with the single checklist section', async () => {
    fetchMyFinalProjectSubmissionMock.mockResolvedValueOnce({
      id: 'final-1',
      ownerUserId: 'user-1',
      ownerEmail: 'member@example.com',
      submitterName: 'Member Example',
      teamName: 'Team Atlas',
      teamMembers: 'Member Example\nJane Doe',
      projectSummary: 'A polished summary.\nSecond sentence.',
      assetLinks: 'https://github.com/example/repo',
      feedbackNotes: '- Filed #12',
      createdAt: '2026-06-29T10:00:00.000Z',
      updatedAt: '2026-06-29T12:00:00.000Z',
    });
    useSitePageContextMock.mockReturnValue({
      ...buildPageContext(),
      siteData: {
        ...defaultSiteData,
        settings: {
          ...defaultSiteData.settings,
          submitIntro:
            'Review the [submission guide](https://example.com/submission-guide) before the deadline.',
        },
        blocks: defaultSiteData.blocks.map((block) =>
          block.id === '55555555-5555-4555-8555-111111111111'
            ? {
                ...block,
                body: 'Summarize the app at https://example.com/summary-template.',
              }
            : block
        ),
      },
    });

    render(
      <MemoryRouter>
        <SubmitPage />
      </MemoryRouter>
    );

    expect(
      await screen.findByRole('heading', { name: defaultSiteData.settings.submitHeroTitle })
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'submission guide' })).toHaveAttribute(
      'href',
      'https://example.com/submission-guide'
    );
    expect(screen.getByDisplayValue('Team Atlas')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Update my submission' })).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: defaultSiteData.settings.submitChecklistTitle })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'https://example.com/summary-template' })
    ).toHaveAttribute('href', 'https://example.com/summary-template');
    expect(
      screen.getByRole('link', { name: 'Open the Registration Portal' })
    ).toHaveAttribute('href', '/register');
  });

  it('requires a saved registration before allowing the first submission', async () => {
    fetchMyProjectSubmissionMock.mockResolvedValueOnce(null);
    useSitePageContextMock.mockReturnValue(buildPageContext());

    render(
      <MemoryRouter>
        <SubmitPage />
      </MemoryRouter>
    );

    expect(await screen.findByText(/Registration required:/i)).toBeInTheDocument();
    expect(
      screen.getAllByRole('link', { name: 'Open the Registration Portal' })[0]
    ).toHaveAttribute('href', '/register');
    expect(screen.queryByRole('button', { name: 'Submit project' })).not.toBeInTheDocument();
  });

  it('creates a new final submission for a registered user and then locks identity fields', async () => {
    const user = userEvent.setup();

    createFinalProjectSubmissionMock.mockResolvedValueOnce(undefined);
    useSitePageContextMock.mockReturnValue(buildPageContext());

    render(
      <MemoryRouter>
        <SubmitPage />
      </MemoryRouter>
    );

    await screen.findByText(/Signed in as/i);

    await user.type(screen.getByRole('textbox', { name: /1\. Team name/i }), 'Team Atlas');
    await user.clear(screen.getByRole('textbox', { name: /2\. Team members/i }));
    await user.type(
      screen.getByRole('textbox', { name: /2\. Team members/i }),
      'Member Example\nJane Doe'
    );
    await user.type(
      screen.getByRole('textbox', { name: /3\. Project summary/i }),
      'An AI assistant for onboarding.\nIt helps new hires find the right steps quickly.'
    );
    await user.type(
      screen.getByRole('textbox', { name: /4\. Links to assets/i }),
      'https://github.com/example/repo\nhttps://youtu.be/demo'
    );
    await user.type(
      screen.getByRole('textbox', { name: /5\. Key product feedback or GitHub issues filed/i }),
      '- Filed https://github.com/mehrsa/rayfin_hackathon/issues/12'
    );

    await user.click(screen.getByRole('button', { name: 'Submit project' }));

    await waitFor(() => {
      expect(createFinalProjectSubmissionMock).toHaveBeenCalledWith(
        expect.objectContaining({
          ownerUserId: 'user-1',
          ownerEmail: 'member@example.com',
          submitterName: 'Member Example',
          teamName: 'Team Atlas',
          teamMembers: 'Member Example\nJane Doe',
          projectSummary:
            'An AI assistant for onboarding.\nIt helps new hires find the right steps quickly.',
          assetLinks: 'https://github.com/example/repo\nhttps://youtu.be/demo',
          feedbackNotes: '- Filed https://github.com/mehrsa/rayfin_hackathon/issues/12',
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        })
      );
    });

    expect(
      await screen.findByText(
        'Your project has been submitted. Team name and team members are now locked.'
      )
    ).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /1\. Team name/i })).toBeDisabled();
    expect(screen.getByRole('textbox', { name: /2\. Team members/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Update my submission' })).toBeInTheDocument();
  });

  it('disables submission updates after the deadline', async () => {
    fetchMyFinalProjectSubmissionMock.mockResolvedValueOnce({
      id: 'final-1',
      ownerUserId: 'user-1',
      ownerEmail: 'member@example.com',
      submitterName: 'Member Example',
      teamName: 'Team Atlas',
      teamMembers: 'Member Example\nJane Doe',
      projectSummary: 'A polished summary.',
      assetLinks: 'https://github.com/example/repo',
      feedbackNotes: '- Filed #12',
      createdAt: '2026-06-29T10:00:00.000Z',
      updatedAt: '2026-06-29T12:00:00.000Z',
    });
    useSitePageContextMock.mockReturnValue({
      ...buildPageContext(),
      siteData: {
        ...defaultSiteData,
        settings: {
          ...defaultSiteData.settings,
          submitDeadline: '2025-01-01T00:00:00.000Z',
        },
      },
    });

    render(
      <MemoryRouter>
        <SubmitPage />
      </MemoryRouter>
    );

    expect(await screen.findByText(/Submissions closed on/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Update my submission' })).toBeDisabled();
  });
});
