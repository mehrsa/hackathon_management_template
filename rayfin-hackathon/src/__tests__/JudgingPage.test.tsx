import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { defaultSiteData } from '@/content/defaultContent';
import { JudgingPage } from '@/pages/JudgingPage';

const useSitePageContextMock = vi.fn();

vi.mock('@/hooks/useSitePageContext', () => ({
  useSitePageContext: () => useSitePageContextMock(),
}));

describe('JudgingPage', () => {
  it('renders linked phrases in the page intro, criteria bodies, and rewards section', () => {
    useSitePageContextMock.mockReturnValue({
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

    render(<JudgingPage />);

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
});
