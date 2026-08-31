import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { defaultSiteData } from '@/content/defaultContent';
import { ResultsPage } from '@/pages/ResultsPage';

const useSitePageContextMock = vi.fn();
const fetchProjectSubmissionsMock = vi.fn();
const fetchFinalProjectSubmissionsMock = vi.fn();
const fetchAllJudgingEntriesMock = vi.fn();
const fetchResultProjectDescriptionsMock = vi.fn();
const createResultProjectDescriptionMock = vi.fn();
const updateResultProjectDescriptionMock = vi.fn();

vi.mock('@/hooks/useSitePageContext', () => ({
  useSitePageContext: () => useSitePageContextMock(),
}));
vi.mock('@/services/projectSubmissions', () => ({
  fetchProjectSubmissions: () => fetchProjectSubmissionsMock(),
}));
vi.mock('@/services/finalProjectSubmissions', () => ({
  fetchFinalProjectSubmissions: () => fetchFinalProjectSubmissionsMock(),
}));
vi.mock('@/services/judgingEntries', () => ({
  fetchAllJudgingEntries: () => fetchAllJudgingEntriesMock(),
}));
vi.mock('@/services/resultProjectDescriptions', () => ({
  fetchResultProjectDescriptions: () => fetchResultProjectDescriptionsMock(),
  createResultProjectDescription: (...args: unknown[]) =>
    createResultProjectDescriptionMock(...args),
  updateResultProjectDescription: (...args: unknown[]) =>
    updateResultProjectDescriptionMock(...args),
}));

const criteria = defaultSiteData.blocks.filter(
  (block) => block.pageKey === 'judging' && block.blockKind === 'criterion'
);

describe('ResultsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchResultProjectDescriptionsMock.mockResolvedValue([]);
    createResultProjectDescriptionMock.mockResolvedValue(undefined);
    updateResultProjectDescriptionMock.mockResolvedValue(undefined);
    useSitePageContextMock.mockReturnValue({
      siteData: {
        ...defaultSiteData,
        settings: {
          ...defaultSiteData.settings,
          resultsPublished: true,
          honorableMentionSubmissionIds: 'mention-1',
        },
      },
    });
    fetchProjectSubmissionsMock.mockResolvedValue([
      {
        id: 'registration-1',
        ownerUserId: 'owner-1',
        ownerEmail: 'winner@example.com',
        submitterName: 'winner@example.com',
        projectTitle: 'Winning Project',
        teamMembers: 'Alex Winner, Sam Builder',
        teamEmails: '',
        appTheme: '',
        teamRoles: '',
        createdAt: '',
        updatedAt: '',
      },
      {
        id: 'registration-2',
        ownerUserId: 'owner-2',
        ownerEmail: 'mention@example.com',
        submitterName: 'mention@example.com',
        projectTitle: 'Community Favorite',
        teamMembers: 'Taylor Maker',
        teamEmails: '',
        appTheme: '',
        teamRoles: '',
        createdAt: '',
        updatedAt: '',
      },
    ]);
    fetchFinalProjectSubmissionsMock.mockResolvedValue([
      {
        id: 'winner-1',
        ownerUserId: 'owner-1',
        ownerEmail: 'winner@example.com',
        submitterName: 'Alex Winner',
        teamName: 'Team Winner',
        teamMembers: 'Alex Winner, Sam Builder',
        projectSummary: 'A winning tool that helps teams ship faster.',
        assetLinks: '',
        feedbackNotes: '',
        createdAt: '',
        updatedAt: '',
      },
      {
        id: 'mention-1',
        ownerUserId: 'owner-2',
        ownerEmail: 'mention@example.com',
        submitterName: 'Taylor Maker',
        teamName: 'Team Spark',
        teamMembers: 'Taylor Maker',
        projectSummary: 'A community-focused assistant for new builders.',
        assetLinks: '',
        feedbackNotes: '',
        createdAt: '',
        updatedAt: '',
      },
    ]);
    fetchAllJudgingEntriesMock.mockResolvedValue([
      {
        id: 'entry-1',
        submissionId: 'winner-1',
        judgeUserId: 'judge-1',
        judgeName: 'Hidden Judge',
        judgeEmail: 'hidden@example.com',
        scores: Object.fromEntries(criteria.map((criterion) => [criterion.id, 5])),
        notes: 'Private judging notes',
        starred: false,
        createdAt: '',
        updatedAt: '2026-08-01T00:00:00.000Z',
      },
    ]);
  });

  it('shows winners, honorable mentions, and stats without judges or scores', async () => {
    render(
      <MemoryRouter>
        <ResultsPage />
      </MemoryRouter>
    );

    expect(await screen.findByText('Gold winner')).toBeVisible();
    expect(screen.getByText('Winning Project')).toBeVisible();
    expect(screen.getByText('A winning tool that helps teams ship faster.')).toBeVisible();
    expect(screen.getByText('Alex Winner, Sam Builder')).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Honorable mentions' })).toBeVisible();
    expect(screen.getByText('Community Favorite')).toBeVisible();
    expect(screen.getByText('Registered teams')).toBeVisible();
    expect(screen.getByText('Submission percentage')).toBeVisible();
    expect(screen.getByText('100%')).toBeVisible();
    expect(screen.getByRole('img', { name: 'Gold medal' })).toBeVisible();
    expect(screen.queryByText('Registered participants')).not.toBeInTheDocument();
    expect(screen.queryByText('Final submissions')).not.toBeInTheDocument();
    expect(screen.queryByText('Projects judged')).not.toBeInTheDocument();
    expect(screen.queryByText('Hidden Judge')).not.toBeInTheDocument();
    expect(screen.queryByText('hidden@example.com')).not.toBeInTheDocument();
    expect(screen.queryByText(/\/ 20/)).not.toBeInTheDocument();
  });

  it('lets admins review the complete results page before publishing', async () => {
    const saveSettings = vi.fn().mockResolvedValue(undefined);
    const setPreviewMode = vi.fn();
    useSitePageContextMock.mockReturnValue({
      isAdmin: true,
      isPreviewMode: false,
      saving: false,
      saveSettings,
      setPreviewMode,
      siteData: {
        ...defaultSiteData,
        settings: {
          ...defaultSiteData.settings,
          resultsPublished: false,
          honorableMentionSubmissionIds: 'mention-1',
        },
      },
    });

    render(
      <MemoryRouter>
        <ResultsPage />
      </MemoryRouter>
    );

    expect(await screen.findByText('Gold winner')).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Honorable mentions' })).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Edit honorable mentions' })).toBeVisible();
    expect(screen.getByText('These results are not published')).toBeVisible();
    expect(screen.queryByText('Results are coming soon')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'View as participant' }));
    expect(setPreviewMode).toHaveBeenCalledWith(true);

    await userEvent.click(screen.getByRole('button', { name: 'Remove mention' }));
    expect(saveSettings).toHaveBeenCalledWith(
      expect.objectContaining({ honorableMentionSubmissionIds: '' })
    );

    const descriptionButtons = screen.getAllByRole('button', { name: 'Edit project details' });
    await userEvent.click(descriptionButtons[0]);
    const titleInput = screen.getByRole('textbox', {
      name: 'Public project title',
    });
    const descriptionInput = screen.getByRole('textbox', {
      name: 'Public project description',
    });
    const linksInput = screen.getByRole('textbox', {
      name: 'Public project links',
    });
    expect(titleInput).toHaveValue('Winning Project');
    expect(descriptionInput).toHaveValue('A winning tool that helps teams ship faster.');
    await userEvent.clear(titleInput);
    await userEvent.type(titleInput, 'Admin-edited Winning Project');
    await userEvent.clear(descriptionInput);
    await userEvent.type(
      descriptionInput,
      'An admin-written winner description: https://example.com/details'
    );
    await userEvent.type(linksInput, 'https://example.com/demo');
    await userEvent.click(screen.getByRole('button', { name: 'Save project details' }));
    expect(createResultProjectDescriptionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        submissionId: 'winner-1',
        projectTitle: 'Admin-edited Winning Project',
        description: 'An admin-written winner description: https://example.com/details',
        projectLinks: 'https://example.com/demo',
      })
    );
    expect(await screen.findByText('Admin-edited Winning Project')).toBeVisible();
    expect(screen.getByRole('link', { name: 'https://example.com/details' })).toHaveAttribute(
      'href',
      'https://example.com/details'
    );
    expect(screen.getByRole('link', { name: 'https://example.com/demo' })).toHaveAttribute(
      'href',
      'https://example.com/demo'
    );
  });

  it('keeps unpublished results hidden in participant preview', async () => {
    const setPreviewMode = vi.fn();
    useSitePageContextMock.mockReturnValue({
      isAdmin: true,
      isPreviewMode: true,
      setPreviewMode,
      siteData: {
        ...defaultSiteData,
        settings: {
          ...defaultSiteData.settings,
          resultsPublished: false,
          honorableMentionSubmissionIds: 'mention-1',
        },
      },
    });

    render(
      <MemoryRouter>
        <ResultsPage />
      </MemoryRouter>
    );

    expect(await screen.findByText('Results are coming soon')).toBeVisible();
    expect(
      screen.getByText('You are seeing this page exactly as participants see it.')
    ).toBeVisible();
    expect(screen.queryByText('Gold winner')).not.toBeInTheDocument();
    expect(screen.queryByText('These results are not published')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Return to admin view' }));
    expect(setPreviewMode).toHaveBeenCalledWith(false);
  });
});
