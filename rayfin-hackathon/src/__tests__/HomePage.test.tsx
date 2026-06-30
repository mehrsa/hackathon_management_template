import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { defaultSiteData } from '@/content/defaultContent';
import { HomePage } from '@/pages/HomePage';

const useSitePageContextMock = vi.fn();

vi.mock('@/hooks/useSitePageContext', () => ({
  useSitePageContext: () => useSitePageContextMock(),
}));

describe('HomePage', () => {
  it('shows the editable welcome section content from site settings', () => {
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
            'First paragraph.\nExplore the [event guide](https://example.com/guide).',
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
  });

  it('shows the updated home page headings without the old labels', () => {
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
      screen.getByText('Everything teams need to include in the final handoff.')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Follow the event from kickoff through judging in one chronological view.')
    ).toBeInTheDocument();
    expect(screen.queryByText(/^Goals$/)).not.toBeInTheDocument();
    expect(screen.queryByText(/^Milestones$/)).not.toBeInTheDocument();
    expect(screen.queryByText(/^Pages$/)).not.toBeInTheDocument();
    expect(screen.queryByText('Hackathon announcement')).not.toBeInTheDocument();
    expect(screen.queryByText('Explore the hackathon')).not.toBeInTheDocument();
    expect(screen.queryByText('Main page')).not.toBeInTheDocument();
  });
});
