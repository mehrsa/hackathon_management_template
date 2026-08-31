import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { defaultSiteData } from '@/content/defaultContent';
import { AdminSubmissionsPage } from '@/pages/AdminSubmissionsPage';

const useSitePageContextMock = vi.fn();
const fetchFinalProjectSubmissionsMock = vi.fn();
const fetchJudgeAssignmentsMock = vi.fn();
const assignJudgeToProjectAsAdminMock = vi.fn();
const unassignJudgeFromProjectAsAdminMock = vi.fn();
const fetchAllJudgingEntriesMock = vi.fn();

vi.mock('@/hooks/useSitePageContext', () => ({
  useSitePageContext: () => useSitePageContextMock(),
}));

vi.mock('@/services/finalProjectSubmissions', () => ({
  fetchFinalProjectSubmissions: (...args: unknown[]) => fetchFinalProjectSubmissionsMock(...args),
}));

vi.mock('@/services/judgeAssignments', () => ({
  fetchJudgeAssignments: (...args: unknown[]) => fetchJudgeAssignmentsMock(...args),
  assignJudgeToProjectAsAdmin: (...args: unknown[]) =>
    assignJudgeToProjectAsAdminMock(...args),
  unassignJudgeFromProjectAsAdmin: (...args: unknown[]) =>
    unassignJudgeFromProjectAsAdminMock(...args),
}));

vi.mock('@/services/judgingEntries', () => ({
  fetchAllJudgingEntries: (...args: unknown[]) => fetchAllJudgingEntriesMock(...args),
}));

describe('AdminSubmissionsPage', () => {
  beforeEach(() => {
    useSitePageContextMock.mockReset();
    fetchFinalProjectSubmissionsMock.mockReset();
    fetchJudgeAssignmentsMock.mockReset();
    assignJudgeToProjectAsAdminMock.mockReset();
    unassignJudgeFromProjectAsAdminMock.mockReset();
    fetchAllJudgingEntriesMock.mockReset();
    fetchJudgeAssignmentsMock.mockResolvedValue([]);
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

  it('shows every judge assigned to each project', async () => {
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
    fetchJudgeAssignmentsMock.mockResolvedValueOnce([
      {
        id: 'assignment-2',
        submissionId: 'final-1',
        slot: 2,
        judgeUserId: 'judge-2',
        createdAt: '2026-08-10T10:01:00.000Z',
      },
      {
        id: 'assignment-1',
        submissionId: 'final-1',
        slot: 1,
        judgeUserId: 'judge-1',
        judgeName: 'Judge One',
        judgeEmail: 'judge1@example.com',
        createdAt: '2026-08-10T10:00:00.000Z',
      },
    ]);

    render(
      <MemoryRouter>
        <AdminSubmissionsPage />
      </MemoryRouter>
    );

    expect(await screen.findByText('Assigned judges')).toBeVisible();
    expect(screen.getByText('Judge One')).toBeVisible();
    expect(screen.getByText('(judge1@example.com)')).toBeVisible();
    expect(screen.getByText('Judge 2')).toBeVisible();
    expect(screen.queryByText('judge-2')).not.toBeInTheDocument();
  });

  it('lets an admin unassign a judge from a project', async () => {
    const user = userEvent.setup();
    vi.spyOn(window, 'confirm').mockReturnValueOnce(true);
    unassignJudgeFromProjectAsAdminMock.mockResolvedValueOnce(undefined);
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
    fetchJudgeAssignmentsMock.mockResolvedValueOnce([
      {
        id: 'assignment-1',
        submissionId: 'final-1',
        slot: 1,
        judgeUserId: 'judge-1',
        judgeName: 'Judge One',
        judgeEmail: 'judge1@example.com',
        createdAt: '2026-08-10T10:00:00.000Z',
      },
    ]);

    render(
      <MemoryRouter>
        <AdminSubmissionsPage />
      </MemoryRouter>
    );

    await user.click(
      await screen.findByRole('button', {
        name: 'Unassign Judge One from Team Nova',
      })
    );

    expect(unassignJudgeFromProjectAsAdminMock).toHaveBeenCalledWith('assignment-1');
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Judge One was unassigned from Team Nova.'
    );
    expect(screen.getByText('No judges assigned.')).toBeVisible();
  });

  it('lets an admin assign an approved replacement judge', async () => {
    const user = userEvent.setup();
    useSitePageContextMock.mockReturnValue({
      auth: {
        user: {
          id: 'admin-1',
          email: 'admin@example.com',
          name: 'Admin Example',
        },
      },
      isAdmin: true,
      siteData: {
        ...defaultSiteData,
        judgeEmails: [
          {
            id: 'judge-email-1',
            email: 'replacement@example.com',
            addedByEmail: 'admin@example.com',
          },
        ],
      },
    });
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
    assignJudgeToProjectAsAdminMock.mockResolvedValueOnce({
      id: 'assignment-2',
      submissionId: 'final-1',
      slot: 1,
      judgeUserId: 'email:replacement@example.com',
      judgeName: 'replacement@example.com',
      judgeEmail: 'replacement@example.com',
      createdAt: '2026-08-20T10:00:00.000Z',
    });

    render(
      <MemoryRouter>
        <AdminSubmissionsPage />
      </MemoryRouter>
    );

    await user.selectOptions(
      await screen.findByRole('combobox', { name: 'Assign a judge to Team Nova' }),
      'replacement@example.com'
    );
    await user.click(screen.getByRole('button', { name: 'Assign judge' }));

    expect(assignJudgeToProjectAsAdminMock).toHaveBeenCalledWith(
      'final-1',
      'replacement@example.com'
    );
    expect(await screen.findByRole('status')).toHaveTextContent(
      'replacement@example.com was assigned to Team Nova.'
    );
  });
});
