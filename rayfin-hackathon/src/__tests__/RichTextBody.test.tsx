import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { RichTextBody } from '@/components/RichTextBody';

describe('RichTextBody', () => {
  it('renders safely when body is missing', () => {
    const { container } = render(<RichTextBody body={undefined} />);

    expect(container.querySelector('p')).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('renders lists, bold text, colors, and links from rich text content', () => {
    render(
      <RichTextBody
        body={[
          'Review the **final checklist** before launch.',
          '- Share the [demo walkthrough](https://example.com/demo)',
          '- Highlight {green}production-ready{/green} details',
          '1. Confirm owners',
          '2. Publish updates',
        ].join('\n')}
      />
    );

    expect(screen.getByText('final checklist')).toContainHTML('strong');
    expect(screen.getByText('production-ready')).toHaveClass('text-emerald-700');
    expect(screen.getByRole('link', { name: 'demo walkthrough' })).toHaveAttribute(
      'href',
      'https://example.com/demo'
    );
    expect(screen.getAllByRole('list')).toHaveLength(2);
    expect(screen.getAllByRole('listitem')).toHaveLength(4);
  });
});
