import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { defaultSiteData, getBlocksForPage } from '@/content/defaultContent';
import { BuildPage } from '@/pages/BuildPage';

const useSitePageContextMock = vi.fn();

vi.mock('@/hooks/useSitePageContext', () => ({
  useSitePageContext: () => useSitePageContextMock(),
}));

describe('BuildPage', () => {
  it('renders URLs in idea card body copy as clickable links', () => {
    useSitePageContextMock.mockReturnValue({
      isEditing: false,
      siteData: {
        ...defaultSiteData,
        blocks: defaultSiteData.blocks.map((block) =>
          block.id === '33333333-3333-4333-8333-111111111111'
            ? {
                ...block,
                body: 'Review the reference app at https://example.com/demo for inspiration.',
              }
            : block
        ),
      },
      saving: false,
      saveSettings: vi.fn(),
      saveBlock: vi.fn(),
      removeBlock: vi.fn(),
    });

    render(<BuildPage />);

    expect(
      screen.getByRole('link', {
        name: 'https://example.com/demo',
      })
    ).toHaveAttribute('href', 'https://example.com/demo');
  });

  it('allows deleting the default idea cards while editing', () => {
    useSitePageContextMock.mockReturnValue({
      isEditing: true,
      siteData: defaultSiteData,
      saving: false,
      saveSettings: vi.fn(),
      saveBlock: vi.fn(),
      removeBlock: vi.fn(),
    });

    render(<BuildPage />);

    expect(screen.getAllByRole('button', { name: 'Delete idea card' })).toHaveLength(
      getBlocksForPage(defaultSiteData.blocks, 'build').length
    );
  });
});
