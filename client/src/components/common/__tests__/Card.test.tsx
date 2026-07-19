import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Card from '../Card';

describe('Card', () => {
  it('renders children', () => {
    render(<Card><p>Content</p></Card>);
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('renders with default padding (md)', () => {
    const { container } = render(<Card>Content</Card>);
    expect(container.firstElementChild?.className).toContain('p-6');
  });

  it('renders with no padding', () => {
    const { container } = render(<Card padding="none">Content</Card>);
    expect(container.firstElementChild?.className).not.toContain('p-');
  });

  it('renders with small padding', () => {
    const { container } = render(<Card padding="sm">Content</Card>);
    expect(container.firstElementChild?.className).toContain('p-4');
  });

  it('renders with large padding', () => {
    const { container } = render(<Card padding="lg">Content</Card>);
    expect(container.firstElementChild?.className).toContain('p-8');
  });

  it('applies custom className', () => {
    const { container } = render(<Card className="custom-card">Content</Card>);
    expect(container.firstElementChild?.className).toContain('custom-card');
  });

  it('has border and rounded styles', () => {
    const { container } = render(<Card>Content</Card>);
    expect(container.firstElementChild?.className).toContain('rounded-2xl');
    expect(container.firstElementChild?.className).toContain('border');
  });
});
