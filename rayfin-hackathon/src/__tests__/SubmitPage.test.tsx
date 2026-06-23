import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { defaultSiteData, getBlocksForPage } from '@/content/defaultContent';
import { SubmitPage } from '@/pages/SubmitPage';

const useSitePageContextMock = vi.fn();

vi.mock('@/hooks/useSitePageContext', () => ({
  useSitePageContext: () => useSitePageContextMock(),
}));

describe('SubmitPage', () => {
  it('renders linked phrases in the page intro and checklist bodies', () => {
    useSitePageContextMock.mockReturnValue({
      isEditing: false,
      siteData: {
        ...defaultSiteData,
        settings: {
          ...defaultSiteData.settings,
          submitIntro:
            'Review the [submission guide](https://example.com/submission-guide) before you hand off the project.',
        },
        blocks: defaultSiteData.blocks.map((block) =>
          block.id === '55555555-5555-4555-8555-111111111111'
            ? {
                ...block,
                body: 'Upload final assets to https://example.com/uploads before the deadline.',
              }
            : block
        ),
      },
      saving: false,
      saveSettings: vi.fn(),
      saveBlock: vi.fn(),
      removeBlock: vi.fn(),
    });

    render(<SubmitPage />);

    expect(screen.getByRole('link', { name: 'submission guide' })).toHaveAttribute(
      'href',
      'https://example.com/submission-guide'
    );
    expect(screen.getByRole('link', { name: 'https://example.com/uploads' })).toHaveAttribute(
      'href',
      'https://example.com/uploads'
    );
  });

  it('allows deleting the default checklist items while editing', () => {
    useSitePageContextMock.mockReturnValue({
      isEditing: true,
      siteData: defaultSiteData,
      saving: false,
      saveSettings: vi.fn(),
      saveBlock: vi.fn(),
      removeBlock: vi.fn(),
    });

    render(<SubmitPage />);

    expect(screen.getAllByRole('button', { name: 'Delete checklist item' })).toHaveLength(
      getBlocksForPage(defaultSiteData.blocks, 'submit').length
    );
  });
});
