import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Button from '../Button';

describe('Button', () => {
  it('renders children text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Submit</Button>);
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('shows loading spinner when isLoading is true', () => {
    const { container } = render(<Button isLoading>Loading</Button>);
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('disables button when loading', () => {
    render(<Button isLoading>Loading</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('disables button when disabled prop is set', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('renders with primary variant styles', () => {
    render(<Button variant="primary">Primary</Button>);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('bg-primary-500');
  });

  it('renders with secondary variant styles', () => {
    render(<Button variant="secondary">Secondary</Button>);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('border');
  });

  it('renders with danger variant styles', () => {
    render(<Button variant="danger">Danger</Button>);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('bg-red-500');
  });

  it('renders with ghost variant styles', () => {
    render(<Button variant="ghost">Ghost</Button>);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('text-dark-600');
  });

  it('renders different sizes', () => {
    const { rerender } = render(<Button size="sm">Small</Button>);
    expect(screen.getByRole('button').className).toContain('text-xs');

    rerender(<Button size="lg">Large</Button>);
    expect(screen.getByRole('button').className).toContain('text-base');
  });

  it('renders left icon', () => {
    render(<Button leftIcon={<span data-testid="icon">→</span>}>With Icon</Button>);
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<Button className="custom-class">Custom</Button>);
    expect(screen.getByRole('button').className).toContain('custom-class');
  });

  it('does not call onClick when disabled', async () => {
    const onClick = vi.fn();
    render(<Button disabled onClick={onClick}>Disabled</Button>);
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('renders as a button element', () => {
    render(<Button>Test</Button>);
    expect(screen.getByRole('button').tagName).toBe('BUTTON');
  });
});
