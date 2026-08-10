import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { defaultSiteData, getBlocksForPage } from '@/content/defaultContent';
import { BuildPage } from '@/pages/BuildPage';

const useSitePageContextMock = vi.fn();

vi.mock('@/hooks/useSitePageContext', () => ({
  useSitePageContext: () => useSitePageContextMock(),
}));

describe('BuildPage', () => {
  it('renders custom link text in idea card body copy as clickable links', () => {
    useSitePageContextMock.mockReturnValue({
      isEditing: false,
      siteData: {
        ...defaultSiteData,
        blocks: defaultSiteData.blocks.map((block) =>
          block.id === '33333333-3333-4333-8333-111111111111'
            ? {
                ...block,
                body:
                  'Review the [reference app](https://example.com/demo) for inspiration.',
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
        name: 'reference app',
      })
    ).toHaveAttribute('href', 'https://example.com/demo');
  });

  it('still renders plain URLs in idea card body copy as clickable links', () => {
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

  it('prevents duplicate idea cards from a rapid double click', () => {
    const saveBlock = vi.fn(
      () =>
        new Promise<void>(() => {
          // Keep the request pending so the synchronous re-entry guard stays active.
        })
    );

    useSitePageContextMock.mockReturnValue({
      isEditing: true,
      siteData: defaultSiteData,
      saving: false,
      saveSettings: vi.fn(),
      saveBlock,
      removeBlock: vi.fn(),
    });

    render(<BuildPage />);

    const addButton = screen.getByRole('button', { name: 'Add idea card' });
    fireEvent.click(addButton);
    fireEvent.click(addButton);

    expect(saveBlock).toHaveBeenCalledTimes(1);
  });
});
