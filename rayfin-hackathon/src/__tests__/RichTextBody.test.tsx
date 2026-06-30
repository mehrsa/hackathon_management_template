import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { RichTextBody } from '@/components/RichTextBody';

describe('RichTextBody', () => {
  it('renders safely when body is missing', () => {
    const { container } = render(<RichTextBody body={undefined} />);

    expect(container.querySelector('p')).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});
