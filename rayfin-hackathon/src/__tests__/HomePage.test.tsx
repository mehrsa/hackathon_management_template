import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { defaultSiteData } from '@/content/defaultContent';
import { HomePage } from '@/pages/HomePage';

const fetchFinalProjectSubmissionsMock = vi.fn();
const fetchProjectSubmissionsMock = vi.fn();
const useSitePageContextMock = vi.fn();

vi.mock('@/hooks/useSitePageContext', () => ({
  useSitePageContext: () => useSitePageContextMock(),
}));

vi.mock('@/services/finalProjectSubmissions', () => ({
  fetchFinalProjectSubmissions: (...args: unknown[]) =>
    fetchFinalProjectSubmissionsMock(...args),
}));

vi.mock('@/services/projectSubmissions', () => ({
  fetchProjectSubmissions: (...args: unknown[]) => fetchProjectSubmissionsMock(...args),
}));

describe('HomePage', () => {
  beforeEach(() => {
    fetchFinalProjectSubmissionsMock.mockReset();
    fetchProjectSubmissionsMock.mockReset();
    useSitePageContextMock.mockReset();

    fetchProjectSubmissionsMock.mockResolvedValue([]);
    fetchFinalProjectSubmissionsMock.mockResolvedValue([]);
  });

  it('shows the editable welcome section content from site settings', async () => {
    useSitePageContextMock.mockReturnValue({
      isEditing: false,
      siteData: {
        ...defaultSiteData,
        settings: {
          ...defaultSiteData.settings,
          homeIntroTitle: 'Welcome section title',
          bannerDescription:
            'Review the [event details](https://example.com/event-details) before you register.',
          homeIntroBody:
            'First paragraph.\n- Explore the [event guide](https://example.com/guide).\n- Review the [starter agenda](https://example.com/agenda).',
          homeExploreTitle: 'Explore this event',
          navBuildLabel: 'Create with Rayfin',
          homeExploreBuildDescription:
            'Choose an app concept and review [starter kits](https://example.com/starter-kits).',
          homeExploreJudgingDescription: 'Understand how the final project is scored.',
          homeExploreSubmitDescription: 'See what the judges expect in the final handoff.',
          navProjectsLabel: 'Proposed projects',
          homeExploreProjectsDescription:
            'Browse project ideas and reach out to teams you want to join.',
        },
        blocks: defaultSiteData.blocks.map((block) =>
          block.id === '22222222-2222-4222-8222-111111111111'
            ? {
                ...block,
                body: 'Track progress at https://example.com/goals.',
              }
            : block
        ),
        timeline: defaultSiteData.timeline.map((item) =>
          item.id === '66666666-6666-4666-8666-111111111111'
            ? {
                ...item,
                description:
                  'Theme, rules, and [registration details](https://example.com/register) are published on the main page.',
              }
            : item
        ),
      },
      saving: false,
      saveSettings: vi.fn(),
      saveBlock: vi.fn(),
      removeBlock: vi.fn(),
      saveTimelineMilestone: vi.fn(),
      removeTimelineMilestone: vi.fn(),
    });

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: 'Welcome section title' })).toBeInTheDocument();
    expect(screen.getByText('First paragraph.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'event details' })).toHaveAttribute(
      'href',
      'https://example.com/event-details'
    );
    expect(screen.getByRole('link', { name: 'event guide' })).toHaveAttribute(
      'href',
      'https://example.com/guide'
    );
    expect(screen.getByRole('link', { name: 'starter agenda' })).toHaveAttribute(
      'href',
      'https://example.com/agenda'
    );
    expect(screen.getByRole('list').firstElementChild).toHaveClass('site-card');
    expect(screen.getByRole('link', { name: 'https://example.com/goals' })).toHaveAttribute(
      'href',
      'https://example.com/goals'
    );
    expect(screen.getByRole('link', { name: 'registration details' })).toHaveAttribute(
      'href',
      'https://example.com/register'
    );
    expect(screen.getByRole('heading', { name: 'Explore this event' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Create with Rayfin' })).toHaveAttribute(
      'href',
      '/build'
    );
    expect(screen.getByRole('link', { name: 'Judging Criteria & Rewards' })).toHaveAttribute(
      'href',
      '/judging'
    );
    expect(screen.getByRole('link', { name: 'Resources' })).toHaveAttribute(
      'href',
      '/resources'
    );
    expect(screen.getByRole('link', { name: 'Submit your project' })).toHaveAttribute(
      'href',
      '/submit'
    );
    expect(screen.getByRole('link', { name: 'Proposed projects' })).toHaveAttribute(
      'href',
      '/projects'
    );
    expect(screen.getByRole('link', { name: 'starter kits' })).toHaveAttribute(
      'href',
      'https://example.com/starter-kits'
    );
    expect(screen.getByRole('link', { name: 'Register now' })).toHaveAttribute(
      'href',
      '/register'
    );
    expect(
      screen.getByText('Understand how the final project is scored.')
    ).toBeInTheDocument();
    expect(
      screen.getByText('See what the judges expect in the final handoff.')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Browse project ideas and reach out to teams you want to join.')
    ).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('Teams').closest('article')).toHaveTextContent('0');
    });
  });

  it('shows the updated home page headings without the old labels', async () => {
    useSitePageContextMock.mockReturnValue({
      isEditing: false,
      siteData: defaultSiteData,
      saving: false,
      saveSettings: vi.fn(),
      saveBlock: vi.fn(),
      removeBlock: vi.fn(),
      saveTimelineMilestone: vi.fn(),
      removeTimelineMilestone: vi.fn(),
    });

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    expect(
      screen.getByRole('heading', { name: 'Welcome to Rayfin Hackathon!' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'What you need to know ...' })
    ).toBeInTheDocument();
    expect(
      screen.getByText('Examples and prompts to help teams choose a strong direction.')
    ).toBeInTheDocument();
    expect(
      screen.getByText('A clear view of how entries will be evaluated.')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Curated docs, learning links, and starter material for participants.')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Everything teams need to include in the final handoff.')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Follow the event from kickoff through judging in one chronological view.')
    ).toBeInTheDocument();
    expect(screen.queryByText(/^Goals$/)).not.toBeInTheDocument();
    expect(screen.queryByText(/^Milestones$/)).not.toBeInTheDocument();
    expect(screen.queryByText(/^Pages$/)).not.toBeInTheDocument();
    expect(screen.queryByText(/^Stop 1$/)).not.toBeInTheDocument();
    expect(screen.queryByText(/^Stop 2$/)).not.toBeInTheDocument();
    expect(screen.queryByText(/^Stop 3$/)).not.toBeInTheDocument();
    expect(screen.queryByText(/^Open$/)).not.toBeInTheDocument();
    expect(screen.queryByText('Hackathon announcement')).not.toBeInTheDocument();
    expect(screen.queryByText('Explore the hackathon')).not.toBeInTheDocument();
    expect(screen.queryByText('Main page')).not.toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('Teams').closest('article')).toHaveTextContent('0');
    });
  });

  it('shows aggregate registration and submission stats in the banner', async () => {
    fetchProjectSubmissionsMock.mockResolvedValueOnce([
      {
        id: 'submission-1',
        ownerUserId: 'user-1',
        ownerEmail: 'lead1@example.com',
        submitterName: 'lead1@example.com',
        projectTitle: 'Team Atlas',
        teamMembers: 'Member Example, Jane Doe',
        teamEmails: 'lead1@example.com, jane@example.com',
        appTheme: 'AI onboarding assistant',
        teamRoles: 'Member Example - Engineer, Jane Doe - Designer',
        createdAt: '2026-06-29T10:00:00.000Z',
        updatedAt: '2026-06-29T12:00:00.000Z',
      },
      {
        id: 'submission-2',
        ownerUserId: 'user-2',
        ownerEmail: 'lead2@example.com',
        submitterName: 'lead2@example.com',
        projectTitle: 'Team Nova',
        teamMembers: 'Builder Example, Sam Doe, Jordan Roe',
        teamEmails: 'lead2@example.com, sam@example.com, jordan@example.com',
        appTheme: 'Incident response workspace',
        teamRoles: 'Builder Example - Lead, Sam Doe - PM, Jordan Roe - Engineer',
        createdAt: '2026-06-28T10:00:00.000Z',
        updatedAt: '2026-06-29T13:00:00.000Z',
      },
    ]);
    fetchFinalProjectSubmissionsMock.mockResolvedValueOnce([
      {
        id: 'final-1',
        ownerUserId: 'user-1',
        ownerEmail: 'lead1@example.com',
        submitterName: 'Lead One',
        teamName: 'Team Atlas',
        teamMembers: 'Member Example\nJane Doe',
        projectSummary: 'A polished summary.',
        assetLinks: 'https://github.com/example/repo',
        feedbackNotes: '- Filed #12',
        createdAt: '2026-06-29T10:00:00.000Z',
        updatedAt: '2026-06-29T12:00:00.000Z',
      },
    ]);
    useSitePageContextMock.mockReturnValue({
      isEditing: false,
      siteData: defaultSiteData,
      saving: false,
      saveSettings: vi.fn(),
      saveBlock: vi.fn(),
      removeBlock: vi.fn(),
      saveTimelineMilestone: vi.fn(),
      removeTimelineMilestone: vi.fn(),
    });

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    const teamsCard = (await screen.findByText('Teams')).closest('article');
    const registrantsCard = screen.getByText('Registrants').closest('article');
    const submissionsCard = screen.getByText('Submissions').closest('article');

    expect(teamsCard).not.toBeNull();
    expect(registrantsCard).not.toBeNull();
    expect(submissionsCard).not.toBeNull();
    expect(teamsCard).toHaveTextContent('2');
    expect(registrantsCard).toHaveTextContent('5');
    expect(submissionsCard).toHaveTextContent('1');
  });

  it('uses the thinner banner aspect ratio for the hero image', async () => {
    useSitePageContextMock.mockReturnValue({
      isEditing: false,
      siteData: defaultSiteData,
      saving: false,
      saveSettings: vi.fn(),
      saveBlock: vi.fn(),
      removeBlock: vi.fn(),
      saveTimelineMilestone: vi.fn(),
      removeTimelineMilestone: vi.fn(),
    });

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    expect(screen.getByAltText('Rayfin Hackathon banner').parentElement).toHaveClass(
      'aspect-[256/101]'
    );
    await waitFor(() => {
      expect(screen.getByText('Teams').closest('article')).toHaveTextContent('0');
    });
  });
});
