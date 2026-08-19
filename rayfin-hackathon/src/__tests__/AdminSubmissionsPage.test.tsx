import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { defaultSiteData } from '@/content/defaultContent';
import { AdminSubmissionsPage } from '@/pages/AdminSubmissionsPage';

const useSitePageContextMock = vi.fn();
const fetchFinalProjectSubmissionsMock = vi.fn();
const fetchAllJudgingEntriesMock = vi.fn();

vi.mock('@/hooks/useSitePageContext', () => ({
  useSitePageContext: () => useSitePageContextMock(),
}));

vi.mock('@/services/finalProjectSubmissions', () => ({
  fetchFinalProjectSubmissions: (...args: unknown[]) => fetchFinalProjectSubmissionsMock(...args),
}));

vi.mock('@/services/judgingEntries', () => ({
  fetchAllJudgingEntries: (...args: unknown[]) => fetchAllJudgingEntriesMock(...args),
}));

describe('AdminSubmissionsPage', () => {
  beforeEach(() => {
    useSitePageContextMock.mockReset();
    fetchFinalProjectSubmissionsMock.mockReset();
    fetchAllJudgingEntriesMock.mockReset();
    fetchAllJudgingEntriesMock.mockResolvedValue([]);

    useSitePageContextMock.mockReturnValue({
      auth: {
        user: {
          id: 'admin-1',
          email: 'admin@example.com',
          name: 'Admin Example',
        },
      },
      isAdmin: true,
      siteData: defaultSiteData,
    });
  });

  it('loads admin submissions and filters them by search text', async () => {
    const user = userEvent.setup();

    fetchFinalProjectSubmissionsMock.mockResolvedValueOnce([
      {
        id: 'final-1',
        ownerUserId: 'user-2',
        ownerEmail: 'owner@example.com',
        submitterName: 'Owner Example',
        teamName: 'Team Nova',
        teamMembers: 'Owner Example\nJane Doe',
        projectSummary: 'A tool for faster incident response.',
        assetLinks: 'GitHub repo: https://github.com/example/team-nova',
        feedbackNotes: '- Filed https://github.com/mehrsa/rayfin_hackathon/issues/42',
        createdAt: '2026-06-29T10:00:00.000Z',
        updatedAt: '2026-06-29T12:00:00.000Z',
      },
      {
        id: 'final-2',
        ownerUserId: 'user-3',
        ownerEmail: 'builder@example.com',
        submitterName: 'Builder Example',
        teamName: 'Team Atlas',
        teamMembers: 'Builder Example\nJordan Doe',
        projectSummary: 'An onboarding assistant for new hires.',
        assetLinks: 'Demo: https://youtu.be/team-atlas',
        feedbackNotes: '- Asked for easier setup',
        createdAt: '2026-06-29T10:00:00.000Z',
        updatedAt: '2026-06-29T12:30:00.000Z',
      },
    ]);

    render(
      <MemoryRouter>
        <AdminSubmissionsPage />
      </MemoryRouter>
    );

    expect(await screen.findByRole('heading', { name: 'Team Nova' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Team Atlas' })).toBeInTheDocument();

    await user.type(screen.getByRole('textbox', { name: 'Search submissions' }), 'atlas');

    expect(screen.queryByRole('heading', { name: 'Team Nova' })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Team Atlas' })).toBeInTheDocument();
    expect(screen.getByText('1 result')).toBeInTheDocument();
  });

  it('renders legacy submissions that are missing newer text fields', async () => {
    fetchFinalProjectSubmissionsMock.mockResolvedValueOnce([
      {
        id: 'final-legacy',
        ownerUserId: 'user-2',
        ownerEmail: 'owner@example.com',
        submitterName: 'Owner Example',
        teamName: 'Team Legacy',
        teamMembers: undefined,
        projectSummary: 'A legacy submission.',
        assetLinks: undefined,
        feedbackNotes: undefined,
        createdAt: '2026-06-29T10:00:00.000Z',
        updatedAt: '2026-06-29T12:00:00.000Z',
      },
    ]);

    render(
      <MemoryRouter>
        <AdminSubmissionsPage />
      </MemoryRouter>
    );

    expect(await screen.findByRole('heading', { name: 'Team Legacy' })).toBeInTheDocument();
    expect(screen.getByText('1 result')).toBeInTheDocument();
  });

  it('shows admins when a judge has starred a project', async () => {
    fetchFinalProjectSubmissionsMock.mockResolvedValueOnce([
      {
        id: 'final-1',
        ownerUserId: 'user-2',
        ownerEmail: 'owner@example.com',
        submitterName: 'Owner Example',
        teamName: 'Team Nova',
        teamMembers: 'Owner Example',
        projectSummary: 'A tool for faster incident response.',
        assetLinks: '',
        feedbackNotes: '',
        createdAt: '2026-06-29T10:00:00.000Z',
        updatedAt: '2026-06-29T12:00:00.000Z',
      },
    ]);
    fetchAllJudgingEntriesMock.mockResolvedValueOnce([
      {
        id: 'entry-old',
        submissionId: 'final-1',
        judgeUserId: 'judge-1',
        judgeName: 'Judge One',
        judgeEmail: 'judge1@example.com',
        scores: {},
        notes: '',
        starred: false,
        createdAt: '2026-06-29T10:00:00.000Z',
        updatedAt: '2026-06-29T11:00:00.000Z',
      },
      {
        id: 'entry-latest',
        submissionId: 'final-1',
        judgeUserId: 'judge-1',
        judgeName: 'Judge One',
        judgeEmail: 'judge1@example.com',
        scores: {},
        notes: '',
        starred: true,
        createdAt: '2026-06-29T10:00:00.000Z',
        updatedAt: '2026-06-29T12:00:00.000Z',
      },
    ]);

    render(
      <MemoryRouter>
        <AdminSubmissionsPage />
      </MemoryRouter>
    );

    expect(await screen.findByText('Starred by 1 judge')).toHaveAttribute('title', 'Judge One');
  });
});
