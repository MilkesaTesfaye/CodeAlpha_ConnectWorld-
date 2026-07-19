import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import Spinner from '../Spinner';

describe('Spinner', () => {
  it('renders spinner SVG', () => {
    const { container } = render(<Spinner />);
    expect(container.querySelector('svg.animate-spin')).toBeInTheDocument();
  });

  it('renders with small size', () => {
    const { container } = render(<Spinner size="sm" />);
    expect(container.querySelector('svg')?.getAttribute('class')).toContain('h-4');
  });

  it('renders with medium size', () => {
    const { container } = render(<Spinner size="md" />);
    expect(container.querySelector('svg')?.getAttribute('class')).toContain('h-6');
  });

  it('renders with large size', () => {
    const { container } = render(<Spinner size="lg" />);
    expect(container.querySelector('svg')?.getAttribute('class')).toContain('h-8');
  });

  it('applies custom className', () => {
    const { container } = render(<Spinner className="custom-spinner" />);
    expect(container.querySelector('svg')?.getAttribute('class')).toContain('custom-spinner');
  });
});
