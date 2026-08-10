import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { defaultSiteData } from '@/content/defaultContent';
import { ResourcesPage } from '@/pages/ResourcesPage';

const useSitePageContextMock = vi.fn();

vi.mock('@/hooks/useSitePageContext', () => ({
  useSitePageContext: () => useSitePageContextMock(),
}));

describe('ResourcesPage', () => {
  beforeEach(() => {
    useSitePageContextMock.mockReset();
    useSitePageContextMock.mockReturnValue({
      isEditing: false,
      siteData: defaultSiteData,
      saving: false,
      saveSettings: vi.fn(),
      saveBlock: vi.fn(),
      removeBlock: vi.fn(),
    });
  });

  it('shows resource cards and supports internal and external links', () => {
    render(
      <MemoryRouter>
        <ResourcesPage />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: 'Explore learning resources' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Learning Library' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Recordings' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Upcoming sessions' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Open docs' })).toHaveAttribute(
      'href',
      'https://learn.microsoft.com/fabric/'
    );
    expect(screen.getByRole('link', { name: 'Review build guidance' })).toHaveAttribute(
      'href',
      '/build'
    );
    expect(screen.getByRole('link', { name: 'Watch recording' })).toHaveAttribute(
      'href',
      'https://example.com/rayfin-kickoff-recording'
    );
    expect(screen.getByRole('link', { name: 'Add to calendar' })).toHaveAttribute(
      'href',
      'https://teams.microsoft.com/l/meetup-join/example'
    );
  });
});
