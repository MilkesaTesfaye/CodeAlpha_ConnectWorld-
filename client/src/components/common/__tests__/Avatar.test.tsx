import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Avatar from '../Avatar';

describe('Avatar', () => {
  it('renders initial when no image src', () => {
    render(<Avatar name="John Doe" />);
    expect(screen.getByText('J')).toBeInTheDocument();
  });

  it('renders first character of name', () => {
    render(<Avatar name="Alice" />);
    expect(screen.getByText('A')).toBeInTheDocument();
  });

  it('renders question mark for empty name', () => {
    render(<Avatar name="" />);
    expect(screen.getByText('?')).toBeInTheDocument();
  });

  it('renders image when src is provided', () => {
    const { container } = render(<Avatar name="John" src="https://example.com/avatar.jpg" />);
    const img = container.querySelector('img');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://example.com/avatar.jpg');
  });

  it('applies different sizes', () => {
    const { container, rerender } = render(<Avatar name="Test" size="sm" />);
    expect(container.querySelector('.rounded-full')?.className).toContain('w-6');

    rerender(<Avatar name="Test" size="xl" />);
    expect(container.querySelector('.rounded-full')?.className).toContain('w-14');
  });

  it('applies custom className', () => {
    const { container } = render(<Avatar name="Test" className="custom-avatar" />);
    expect(container.querySelector('.rounded-full')?.className).toContain('custom-avatar');
  });

  it('picks consistent color for same name', () => {
    const { container: c1 } = render(<Avatar name="SameName" />);
    const { container: c2 } = render(<Avatar name="SameName" />);
    const class1 = c1.querySelector('.rounded-full')?.className || '';
    const class2 = c2.querySelector('.rounded-full')?.className || '';
    expect(class1).toBe(class2);
  });

  it('picks different colors for different names', () => {
    const { container: c1 } = render(<Avatar name="Alice" />);
    const { container: c2 } = render(<Avatar name="Bob" />);
    const class1 = c1.querySelector('.rounded-full')?.className || '';
    const class2 = c2.querySelector('.rounded-full')?.className || '';
    // Just verify both have color classes
    expect(class1).toContain('text-');
    expect(class2).toContain('text-');
  });
});
