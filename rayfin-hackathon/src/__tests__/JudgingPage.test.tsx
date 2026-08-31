import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { defaultSiteData } from '@/content/defaultContent';
import { JudgingCriteriaPage } from '@/pages/JudgingCriteriaPage';
import { JudgingPage } from '@/pages/JudgingPage';

const useSitePageContextMock = vi.fn();
const fetchFinalProjectSubmissionsMock = vi.fn();
const fetchJudgeAssignmentsMock = vi.fn();
const assignJudgeToProjectMock = vi.fn();
const unassignJudgeFromProjectMock = vi.fn();
const fetchMyJudgingEntriesMock = vi.fn();
const createJudgingEntryMock = vi.fn();
const deleteJudgingEntryMock = vi.fn();

vi.mock('@/services/finalProjectSubmissions', () => ({
  fetchFinalProjectSubmissions: (...args: unknown[]) => fetchFinalProjectSubmissionsMock(...args),
}));

vi.mock('@/services/judgingEntries', () => ({
  fetchMyJudgingEntries: (...args: unknown[]) => fetchMyJudgingEntriesMock(...args),
  createJudgingEntry: (...args: unknown[]) => createJudgingEntryMock(...args),
  deleteJudgingEntry: (...args: unknown[]) => deleteJudgingEntryMock(...args),
  updateJudgingEntry: vi.fn(),
}));

vi.mock('@/services/judgeAssignments', () => ({
  fetchJudgeAssignments: (...args: unknown[]) => fetchJudgeAssignmentsMock(...args),
  assignJudgeToProject: (...args: unknown[]) => assignJudgeToProjectMock(...args),
  isAssignmentForJudge: (
    assignment: { judgeUserId: string; judgeEmail?: string },
    judge: { id: string; email?: string }
  ) =>
    assignment.judgeUserId === judge.id ||
    assignment.judgeEmail?.toLocaleLowerCase() === judge.email?.toLocaleLowerCase(),
  unassignJudgeFromProject: (...args: unknown[]) => unassignJudgeFromProjectMock(...args),
}));

vi.mock('@/hooks/useSitePageContext', () => ({
  useSitePageContext: () => useSitePageContextMock(),
}));

describe('JudgingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchJudgeAssignmentsMock.mockResolvedValue([]);
    fetchMyJudgingEntriesMock.mockResolvedValue([]);
  });

  it('redirects non-judges away from the scoring workspace', () => {
    useSitePageContextMock.mockReturnValue({
      auth: {
        user: { id: 'member-1', email: 'member@example.com', name: 'Member' },
      },
      isAdmin: false,
      isJudge: false,
      siteData: {
        ...defaultSiteData,
        settings: { ...defaultSiteData.settings, judgingFormPublished: true },
      },
      saving: false,
      saveSettings: vi.fn(),
      saveBlock: vi.fn(),
      removeBlock: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/judge']}>
        <Routes>
          <Route path="/" element={<div>Home page</div>} />
          <Route path="/judge" element={<JudgingPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Home page')).toBeVisible();
    expect(fetchFinalProjectSubmissionsMock).not.toHaveBeenCalled();
  });

  it('lets admins collapse scoring configuration and preview the judge view', async () => {
    const user = userEvent.setup();
    useSitePageContextMock.mockReturnValue({
      auth: {
        user: { id: 'admin-1', email: 'admin@example.com', name: 'Admin Example' },
      },
      isAdmin: true,
      isJudge: true,
      siteData: {
        ...defaultSiteData,
        settings: { ...defaultSiteData.settings, judgingFormPublished: false },
      },
      saving: false,
      saveSettings: vi.fn(),
      saveBlock: vi.fn(),
      removeBlock: vi.fn(),
    });

    render(
      <MemoryRouter>
        <JudgingPage />
      </MemoryRouter>
    );

    const scoringConfiguration = screen.getByText('Manage scoring fields').closest('details');
    expect(scoringConfiguration).not.toHaveAttribute('open');

    await user.click(screen.getByRole('button', { name: 'View as judge' }));

    expect(screen.getByText('Judge view')).toBeVisible();
    expect(screen.queryByText('Manage scoring fields')).not.toBeInTheDocument();
    expect(
      screen.getByText('The judging form has not been published yet. Check back when the judging window opens.')
    ).toBeVisible();
    expect(screen.getByRole('button', { name: 'Exit judge view' })).toBeVisible();
  });

  it('keeps criteria and rewards on the separate information page', () => {
    useSitePageContextMock.mockReturnValue({
      auth: {
        user: {
          id: 'judge-1',
          email: 'judge@example.com',
          name: 'Judge Example',
        },
      },
      isAdmin: false,
      isEditing: false,
      siteData: {
        ...defaultSiteData,
        settings: {
          ...defaultSiteData.settings,
          judgingIntro:
            'Read the [judge handbook](https://example.com/judge-handbook) before scoring entries.',
        },
        blocks: defaultSiteData.blocks.map((block) =>
          block.id === '44444444-4444-4444-8444-111111111111'
            ? {
                ...block,
                body: 'Scoring notes live at https://example.com/scoring-notes.',
              }
            : block.id === '44444444-4444-4444-8444-555555555555'
              ? {
                  ...block,
                  body: 'Winners will be celebrated in the [closing showcase](https://example.com/showcase).',
                }
            : block
        ),
      },
      saving: false,
      saveSettings: vi.fn(),
      saveBlock: vi.fn(),
      removeBlock: vi.fn(),
    });

    render(<JudgingCriteriaPage />);

    expect(screen.getByRole('link', { name: 'judge handbook' })).toHaveAttribute(
      'href',
      'https://example.com/judge-handbook'
    );
    expect(
      screen.getByRole('link', { name: 'https://example.com/scoring-notes' })
    ).toHaveAttribute('href', 'https://example.com/scoring-notes');
    expect(
      screen.getByRole('link', { name: 'closing showcase' })
    ).toHaveAttribute('href', 'https://example.com/showcase');
    expect(screen.getByRole('heading', { name: 'Rewards and celebrating your success' })).toBeVisible();
  });

  it('lets a judge score, note, star, and submit a published project', async () => {
    const user = userEvent.setup();
    fetchFinalProjectSubmissionsMock.mockResolvedValueOnce([
      {
        id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        ownerUserId: 'builder-1',
        ownerEmail: 'builder@example.com',
        submitterName: 'Builder Example',
        teamName: 'Team Nova',
        teamMembers: 'Builder Example',
        projectSummary: 'A polished incident response assistant.',
        assetLinks: 'https://example.com/demo',
        feedbackNotes:
          'The issue workflow needs clearer validation.\nhttps://github.com/example/project/issues/42',
        createdAt: '2026-08-01T10:00:00.000Z',
        updatedAt: '2026-08-01T11:00:00.000Z',
      },
    ]);
    fetchMyJudgingEntriesMock.mockResolvedValueOnce([]);
    assignJudgeToProjectMock.mockResolvedValueOnce({
      id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
      submissionId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      slot: 1,
      judgeUserId: 'judge-1',
      createdAt: '2026-08-10T10:00:00.000Z',
    });
    createJudgingEntryMock.mockResolvedValueOnce(undefined);

    useSitePageContextMock.mockReturnValue({
      auth: {
        user: {
          id: 'judge-1',
          email: 'judge@example.com',
          name: 'Judge Example',
        },
      },
      isAdmin: false,
      isJudge: true,
      isEditing: false,
      siteData: {
        ...defaultSiteData,
        settings: {
          ...defaultSiteData.settings,
          judgingFormPublished: true,
        },
      },
      saving: false,
      saveSettings: vi.fn(),
      saveBlock: vi.fn(),
      removeBlock: vi.fn(),
    });

    render(<JudgingPage />);

    expect(await screen.findByRole('heading', { name: 'Team Nova' })).toBeVisible();
    expect(screen.getByRole('link', { name: 'https://example.com/demo' })).toHaveAttribute(
      'target',
      '_blank'
    );
    expect(
      screen.getByRole('heading', { name: 'Product feedback and issues' })
    ).toBeVisible();
    expect(screen.getByText('The issue workflow needs clearer validation.')).toBeVisible();
    expect(
      screen.getByRole('link', { name: 'https://github.com/example/project/issues/42' })
    ).toHaveAttribute('target', '_blank');
    await user.click(screen.getByRole('button', { name: 'Assign to me' }));

    const criterionInfo = screen.getByRole('button', { name: 'About Problem value' });
    await user.click(criterionInfo);
    expect(screen.getByText(/define the user problem/i)).toBeVisible();

    const scoreFields = screen.getAllByRole('combobox');
    for (const scoreField of scoreFields) {
      await user.selectOptions(scoreField, '4');
    }
    await user.type(screen.getByRole('textbox', { name: 'Judge notes' }), 'Strong workflow.');
    await user.click(screen.getByRole('button', { name: 'Star Team Nova' }));
    await user.click(screen.getByRole('button', { name: 'Submit scores' }));

    expect(screen.getByText('16 / 20')).toBeVisible();
    expect(createJudgingEntryMock).toHaveBeenCalled();
  });

  it('prevents a third judge from assigning to a full project', async () => {
    fetchFinalProjectSubmissionsMock.mockResolvedValueOnce([
      {
        id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        ownerUserId: 'builder-1',
        ownerEmail: 'builder@example.com',
        submitterName: 'Builder Example',
        teamName: 'Team Nova',
        teamMembers: 'Builder Example',
        projectSummary: 'Incident response assistant.',
        assetLinks: '',
        feedbackNotes: '',
        createdAt: '2026-08-01T10:00:00.000Z',
        updatedAt: '2026-08-01T11:00:00.000Z',
      },
    ]);
    fetchJudgeAssignmentsMock.mockResolvedValueOnce([
      {
        id: '11111111-1111-4111-8111-111111111111',
        submissionId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        slot: 1,
        judgeUserId: 'judge-2',
        createdAt: '2026-08-10T10:00:00.000Z',
      },
      {
        id: '22222222-2222-4222-8222-222222222222',
        submissionId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        slot: 2,
        judgeUserId: 'judge-3',
        createdAt: '2026-08-10T10:01:00.000Z',
      },
    ]);
    fetchMyJudgingEntriesMock.mockResolvedValueOnce([]);
    useSitePageContextMock.mockReturnValue({
      auth: {
        user: { id: 'judge-1', email: 'judge@example.com', name: 'Judge Example' },
      },
      isAdmin: false,
      isJudge: true,
      siteData: {
        ...defaultSiteData,
        settings: { ...defaultSiteData.settings, judgingFormPublished: true },
      },
      saving: false,
      saveSettings: vi.fn(),
      saveBlock: vi.fn(),
      removeBlock: vi.fn(),
    });

    render(<JudgingPage />);

    expect(await screen.findByText('2 / 2 judges assigned')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Assignment full' })).toBeDisabled();
    expect(screen.queryAllByRole('combobox')).toHaveLength(0);
  });

  it('confirms before unassigning and resets the saved judging entry', async () => {
    const user = userEvent.setup();
    const confirmMock = vi.spyOn(window, 'confirm').mockReturnValue(true);
    fetchFinalProjectSubmissionsMock.mockResolvedValueOnce([
      {
        id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        ownerUserId: 'builder-1',
        ownerEmail: 'builder@example.com',
        submitterName: 'Builder Example',
        teamName: 'Team Nova',
        teamMembers: 'Builder Example',
        projectSummary: 'Incident response assistant.',
        assetLinks: '',
        feedbackNotes: '',
        createdAt: '2026-08-01T10:00:00.000Z',
        updatedAt: '2026-08-01T11:00:00.000Z',
      },
    ]);
    fetchJudgeAssignmentsMock.mockResolvedValueOnce([
      {
        id: '11111111-1111-4111-8111-111111111111',
        submissionId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        slot: 1,
        judgeUserId: 'judge-1',
        createdAt: '2026-08-10T10:00:00.000Z',
      },
    ]);
    fetchMyJudgingEntriesMock.mockResolvedValueOnce([
      {
        id: '33333333-3333-4333-8333-333333333333',
        submissionId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        judgeUserId: 'judge-1',
        judgeEmail: 'judge@example.com',
        scores: { '44444444-4444-4444-8444-222222222222': 4 },
        notes: 'Strong workflow.',
        starred: true,
        createdAt: '2026-08-10T10:00:00.000Z',
        updatedAt: '2026-08-10T10:00:00.000Z',
      },
    ]);
    deleteJudgingEntryMock.mockResolvedValueOnce(undefined);
    unassignJudgeFromProjectMock.mockResolvedValueOnce(undefined);
    useSitePageContextMock.mockReturnValue({
      auth: {
        user: { id: 'judge-1', email: 'judge@example.com', name: 'Judge Example' },
      },
      isAdmin: false,
      isJudge: true,
      siteData: {
        ...defaultSiteData,
        settings: { ...defaultSiteData.settings, judgingFormPublished: true },
      },
      saving: false,
      saveSettings: vi.fn(),
      saveBlock: vi.fn(),
      removeBlock: vi.fn(),
    });

    render(<JudgingPage />);

    await user.click(await screen.findByRole('button', { name: 'Unassign me' }));

    expect(confirmMock).toHaveBeenCalledWith(
      'Unassign yourself from Team Nova? Your saved scores, notes, and star for this project will be permanently reset.'
    );
    expect(deleteJudgingEntryMock).toHaveBeenCalledWith(
      '33333333-3333-4333-8333-333333333333'
    );
    expect(unassignJudgeFromProjectMock).toHaveBeenCalledWith(
      expect.objectContaining({ id: '11111111-1111-4111-8111-111111111111' }),
      'judge-1',
      'judge@example.com'
    );
    expect(screen.getByRole('button', { name: 'Assign to me' })).toBeVisible();
    expect(screen.queryAllByRole('combobox')).toHaveLength(0);

    confirmMock.mockRestore();
  });

  it('filters projects in the judge workspace', async () => {
    const user = userEvent.setup();
    fetchFinalProjectSubmissionsMock.mockResolvedValueOnce([
      {
        id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        ownerUserId: 'builder-1',
        ownerEmail: 'builder@example.com',
        submitterName: 'Builder Example',
        teamName: 'Team Nova',
        teamMembers: 'Builder Example',
        projectSummary: 'Incident response assistant.',
        assetLinks: '',
        feedbackNotes: '',
        createdAt: '2026-08-01T10:00:00.000Z',
        updatedAt: '2026-08-01T11:00:00.000Z',
      },
      {
        id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
        ownerUserId: 'builder-2',
        ownerEmail: 'finance@example.com',
        submitterName: 'Finance Builder',
        teamName: 'Ledger Lab',
        teamMembers: 'Finance Builder',
        projectSummary: 'Finance reconciliation workflow.',
        assetLinks: '',
        feedbackNotes: '',
        createdAt: '2026-08-01T10:00:00.000Z',
        updatedAt: '2026-08-01T11:00:00.000Z',
      },
    ]);
    fetchMyJudgingEntriesMock.mockResolvedValueOnce([]);
    useSitePageContextMock.mockReturnValue({
      auth: {
        user: { id: 'judge-1', email: 'judge@example.com', name: 'Judge Example' },
      },
      isAdmin: false,
      isJudge: true,
      siteData: {
        ...defaultSiteData,
        settings: { ...defaultSiteData.settings, judgingFormPublished: true },
      },
      saving: false,
      saveSettings: vi.fn(),
      saveBlock: vi.fn(),
      removeBlock: vi.fn(),
    });

    render(<JudgingPage />);
    expect(await screen.findByRole('heading', { name: 'Team Nova' })).toBeVisible();
    await user.type(screen.getByRole('searchbox', { name: 'Search projects' }), 'ledger');
    expect(screen.queryByRole('heading', { name: 'Team Nova' })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Ledger Lab' })).toBeVisible();
  });
});
