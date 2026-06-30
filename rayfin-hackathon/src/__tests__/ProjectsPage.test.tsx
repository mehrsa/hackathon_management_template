import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { defaultSiteData } from '@/content/defaultContent';
import { ProjectsPage } from '@/pages/ProjectsPage';

const useSitePageContextMock = vi.fn();
const fetchProjectSubmissionsMock = vi.fn();

vi.mock('@/hooks/useSitePageContext', () => ({
  useSitePageContext: () => useSitePageContextMock(),
}));

vi.mock('@/services/projectSubmissions', () => ({
  fetchProjectSubmissions: (...args: unknown[]) => fetchProjectSubmissionsMock(...args),
}));

describe('ProjectsPage', () => {
  beforeEach(() => {
    useSitePageContextMock.mockReset();
    fetchProjectSubmissionsMock.mockReset();
  });

  it('shows submitted project cards with team details and portal link', async () => {
    fetchProjectSubmissionsMock.mockResolvedValueOnce([
      {
        id: 'submission-1',
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
      },
    ]);
    useSitePageContextMock.mockReturnValue({
      auth: {
        user: {
          id: 'user-1',
          email: 'member@example.com',
          name: 'Member Example',
        },
      },
      siteData: defaultSiteData,
    });

    render(
      <MemoryRouter>
        <ProjectsPage />
      </MemoryRouter>
    );

    expect(await screen.findByRole('heading', { name: 'Team Atlas' })).toBeInTheDocument();
    expect(screen.getByText('Your submission')).toBeInTheDocument();
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'member@example.com' })).toHaveAttribute(
      'href',
      'mailto:member@example.com'
    );
    expect(screen.getByRole('link', { name: 'Open the Registration Portal' })).toHaveAttribute(
      'href',
      '/register'
    );
    expect(screen.getByRole('textbox', { name: 'Search proposed projects' })).toBeInTheDocument();
    expect(screen.getByText('1 result')).toBeInTheDocument();
  });

  it('filters proposed projects by search text and moves the carousel with controls', async () => {
    const user = userEvent.setup();

    fetchProjectSubmissionsMock.mockResolvedValueOnce([
      {
        id: 'submission-1',
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
      },
      {
        id: 'submission-2',
        ownerUserId: 'user-2',
        ownerEmail: 'builder@example.com',
        submitterName: 'Builder Example',
        projectTitle: 'Team Nova',
        teamMembers: 'Builder Example, Sam Doe',
        teamEmails: 'builder@example.com, sam@example.com',
        appTheme: 'Incident response workspace',
        teamRoles: 'Builder Example - Lead, Sam Doe - PM',
        createdAt: '2026-06-28T10:00:00.000Z',
        updatedAt: '2026-06-29T13:00:00.000Z',
      },
    ]);
    useSitePageContextMock.mockReturnValue({
      auth: {
        user: {
          id: 'user-1',
          email: 'member@example.com',
          name: 'Member Example',
        },
      },
      siteData: defaultSiteData,
    });

    render(
      <MemoryRouter>
        <ProjectsPage />
      </MemoryRouter>
    );

    expect(await screen.findByRole('heading', { name: 'Team Atlas' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Team Nova' })).toBeInTheDocument();

    const carousel = screen.getByLabelText('Available proposed projects');
    const scrollByMock = vi.fn();
    Object.assign(carousel, { scrollBy: scrollByMock });

    await user.click(screen.getByRole('button', { name: 'Next' }));

    expect(scrollByMock).toHaveBeenCalledOnce();
    expect(scrollByMock).toHaveBeenCalledWith({
      behavior: 'smooth',
      left: expect.any(Number),
    });

    await user.type(screen.getByRole('textbox', { name: 'Search proposed projects' }), 'nova');

    expect(screen.queryByRole('heading', { name: 'Team Atlas' })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Team Nova' })).toBeInTheDocument();
    expect(screen.getByText('1 result')).toBeInTheDocument();

    await user.clear(screen.getByRole('textbox', { name: 'Search proposed projects' }));
    await user.type(screen.getByRole('textbox', { name: 'Search proposed projects' }), 'zzz');

    expect(screen.getByText('No proposed projects match your current search.')).toBeInTheDocument();
  });
});
