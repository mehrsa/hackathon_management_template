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
          homeIntroBody: 'First paragraph.\nSecond paragraph.',
          homeExploreTitle: 'Explore this event',
          navBuildLabel: 'Create with Rayfin',
        },
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
    expect(screen.getByText('Second paragraph.')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Explore this event' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Create with Rayfin/ })).toBeInTheDocument();
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
