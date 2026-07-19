import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Badge from '../Badge';

describe('Badge', () => {
  it('renders children text', () => {
    render(<Badge>Active</Badge>);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('renders with default (gray) variant', () => {
    render(<Badge>Default</Badge>);
    expect(screen.getByText('Default').className).toContain('bg-dark-100');
  });

  it('renders with success variant', () => {
    render(<Badge variant="success">Success</Badge>);
    expect(screen.getByText('Success').className).toContain('bg-green-100');
  });

  it('renders with warning variant', () => {
    render(<Badge variant="warning">Warning</Badge>);
    expect(screen.getByText('Warning').className).toContain('bg-amber-100');
  });

  it('renders with danger variant', () => {
    render(<Badge variant="danger">Danger</Badge>);
    expect(screen.getByText('Danger').className).toContain('bg-red-100');
  });

  it('renders with info variant', () => {
    render(<Badge variant="info">Info</Badge>);
    expect(screen.getByText('Info').className).toContain('bg-blue-100');
  });

  it('renders with purple variant', () => {
    render(<Badge variant="purple">Purple</Badge>);
    expect(screen.getByText('Purple').className).toContain('bg-purple-100');
  });

  it('shows dot when dot prop is true', () => {
    const { container } = render(<Badge dot>Live</Badge>);
    expect(container.querySelector('.rounded-full')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<Badge className="custom-badge">Custom</Badge>);
    expect(screen.getByText('Custom').className).toContain('custom-badge');
  });
});
