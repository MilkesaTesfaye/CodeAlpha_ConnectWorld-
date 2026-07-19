import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import EmptyState from '../EmptyState';

describe('EmptyState', () => {
  it('renders title', () => {
    render(<EmptyState title="No items found" />);
    expect(screen.getByText('No items found')).toBeInTheDocument();
  });

  it('renders description when provided', () => {
    render(<EmptyState title="Empty" description="There are no items to show" />);
    expect(screen.getByText('There are no items to show')).toBeInTheDocument();
  });

  it('renders icon when provided', () => {
    render(<EmptyState title="Empty" icon="📦" />);
    expect(screen.getByText('📦')).toBeInTheDocument();
  });

  it('renders action element when provided', () => {
    render(<EmptyState title="Empty" action={<button>Create</button>} />);
    expect(screen.getByRole('button', { name: 'Create' })).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<EmptyState title="Test" className="custom-empty" />);
    expect(container.firstElementChild?.className).toContain('custom-empty');
  });

  it('does not render description when not provided', () => {
    render(<EmptyState title="Only title" />);
    expect(screen.getByText('Only title')).toBeInTheDocument();
  });

  it('does not render icon when not provided', () => {
    const { container } = render(<EmptyState title="No icon" />);
    expect(container.querySelector('.text-4xl')).not.toBeInTheDocument();
  });
});
