import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { defaultSiteData } from '@/content/defaultContent';
import { AdminReportPage } from '@/pages/AdminReportPage';

const useSitePageContextMock = vi.fn();
const fetchFinalProjectSubmissionsMock = vi.fn();
const fetchJudgeAssignmentsMock = vi.fn();
const fetchAllJudgingEntriesMock = vi.fn();
const updateJudgingEntryMock = vi.fn();

vi.mock('@/hooks/useSitePageContext', () => ({
  useSitePageContext: () => useSitePageContextMock(),
}));

vi.mock('@/services/finalProjectSubmissions', () => ({
  fetchFinalProjectSubmissions: (...args: unknown[]) => fetchFinalProjectSubmissionsMock(...args),
}));

vi.mock('@/services/judgeAssignments', () => ({
  fetchJudgeAssignments: (...args: unknown[]) => fetchJudgeAssignmentsMock(...args),
}));

vi.mock('@/services/judgingEntries', () => ({
  fetchAllJudgingEntries: (...args: unknown[]) => fetchAllJudgingEntriesMock(...args),
  updateJudgingEntry: (...args: unknown[]) => updateJudgingEntryMock(...args),
}));

const criteria = defaultSiteData.blocks.filter(
  (block) => block.pageKey === 'judging' && block.blockKind === 'criterion'
);

function scores(value: number) {
  return Object.fromEntries(criteria.map((criterion) => [criterion.id, value]));
}

describe('AdminReportPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useSitePageContextMock.mockReturnValue({
      isAdmin: true,
      siteData: defaultSiteData,
    });
    fetchFinalProjectSubmissionsMock.mockResolvedValue([
      {
        id: 'project-1',
        ownerUserId: 'owner-1',
        ownerEmail: 'nova@example.com',
        submitterName: 'Nova Owner',
        teamName: 'Team Nova',
        teamMembers: 'Nova Owner',
        projectSummary: 'Project Nova',
        assetLinks: '',
        feedbackNotes: '',
        createdAt: '2026-08-01T10:00:00.000Z',
        updatedAt: '2026-08-01T10:00:00.000Z',
      },
      {
        id: 'project-2',
        ownerUserId: 'owner-2',
        ownerEmail: 'atlas@example.com',
        submitterName: 'Atlas Owner',
        teamName: 'Team Atlas',
        teamMembers: 'Atlas Owner',
        projectSummary: 'Project Atlas',
        assetLinks: '',
        feedbackNotes: '',
        createdAt: '2026-08-01T10:00:00.000Z',
        updatedAt: '2026-08-01T10:00:00.000Z',
      },
    ]);
    fetchJudgeAssignmentsMock.mockResolvedValue([
      {
        id: 'assignment-1',
        submissionId: 'project-1',
        slot: 1,
        judgeUserId: 'judge-1',
        judgeName: 'Judge One',
        judgeEmail: 'judge1@example.com',
        createdAt: '',
      },
      {
        id: 'assignment-2',
        submissionId: 'project-1',
        slot: 2,
        judgeUserId: 'judge-2',
        judgeName: 'Judge Two',
        judgeEmail: 'judge2@example.com',
        createdAt: '',
      },
      { id: 'assignment-3', submissionId: 'project-2', slot: 1, judgeUserId: 'judge-1', createdAt: '' },
    ]);
    fetchAllJudgingEntriesMock.mockResolvedValue([
      {
        id: 'entry-1',
        submissionId: 'project-1',
        judgeUserId: 'judge-1',
        judgeName: 'Judge One',
        judgeEmail: 'judge1@example.com',
        scores: scores(5),
        notes: 'Excellent customer impact.',
        starred: true,
        createdAt: '',
        updatedAt: '2026-08-10T10:00:00.000Z',
      },
      {
        id: 'entry-2',
        submissionId: 'project-1',
        judgeUserId: 'judge-2',
        judgeName: 'Judge Two',
        judgeEmail: 'judge2@example.com',
        scores: scores(4),
        notes: '',
        starred: false,
        createdAt: '',
        updatedAt: '2026-08-10T11:00:00.000Z',
      },
    ]);
    updateJudgingEntryMock.mockResolvedValue(undefined);
  });

  it('summarizes rankings and highlights projects that still need judges', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <AdminReportPage />
      </MemoryRouter>
    );

    expect(await screen.findByRole('heading', { name: 'Top projects' })).toBeVisible();
    expect(screen.getAllByText('Team Nova').length).toBeGreaterThan(0);
    expect(screen.getAllByText('18.0 / 20')).toHaveLength(2);
    expect(screen.getByText('Needs 1 judge')).toBeVisible();
    expect(screen.getByText('1 star')).toHaveAttribute('title', 'Judge One');
    expect(screen.getAllByText('Judge One').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Judge Two').length).toBeGreaterThan(0);

    await user.click(screen.getByText('View scorecard details (2)'));

    expect(screen.getByText('Excellent customer impact.')).toBeVisible();
    expect(screen.getByText('judge1@example.com')).toBeVisible();
    expect(screen.getByText('Starred project')).toBeVisible();

    await user.click(screen.getByRole('button', { name: 'Edit scores for Judge One' }));
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Problem value score for Judge One' }),
      '3'
    );
    await user.click(screen.getByRole('button', { name: 'Save score changes' }));

    expect(updateJudgingEntryMock).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'entry-1',
        scores: expect.objectContaining({ [criteria[0].id]: 3 }),
      })
    );
    expect(screen.getByText('Scores updated for Judge One.')).toBeVisible();
    expect(screen.getAllByText('17.0 / 20')).toHaveLength(2);

    await user.click(screen.getByRole('button', { name: 'Need judges (1)' }));

    expect(screen.getByText('Team Atlas')).toBeVisible();
    expect(screen.queryByText('Nova Owner · nova@example.com')).not.toBeInTheDocument();
  });

  it('redirects non-admin users without loading report data', () => {
    useSitePageContextMock.mockReturnValue({
      isAdmin: false,
      siteData: defaultSiteData,
    });

    render(
      <MemoryRouter initialEntries={['/admin/report']}>
        <Routes>
          <Route path="/" element={<div>Home page</div>} />
          <Route path="/admin/report" element={<AdminReportPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Home page')).toBeVisible();
    expect(fetchFinalProjectSubmissionsMock).not.toHaveBeenCalled();
    expect(fetchJudgeAssignmentsMock).not.toHaveBeenCalled();
    expect(fetchAllJudgingEntriesMock).not.toHaveBeenCalled();
  });
});
