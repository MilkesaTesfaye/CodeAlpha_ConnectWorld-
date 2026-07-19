import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Input from '../Input';

describe('Input', () => {
  it('renders with label', () => {
    render(<Input label="Email" />);
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  it('renders without label', () => {
    render(<Input placeholder="Enter text" />);
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
  });

  it('displays error message', () => {
    render(<Input label="Email" error="Invalid email" />);
    expect(screen.getByText('Invalid email')).toBeInTheDocument();
  });

  it('applies error styling when error is present', () => {
    render(<Input label="Email" error="Error" />);
    expect(screen.getByRole('textbox').className).toContain('border-red-500');
  });

  it('displays help text', () => {
    render(<Input label="Email" helpText="Enter your email address" />);
    expect(screen.getByText('Enter your email address')).toBeInTheDocument();
  });

  it('does not show help text when error is present', () => {
    render(<Input label="Email" helpText="Help" error="Error message" />);
    expect(screen.queryByText('Help')).not.toBeInTheDocument();
  });

  it('calls onChange when typed in', async () => {
    const onChange = vi.fn();
    render(<Input label="Name" onChange={onChange} />);
    const input = screen.getByLabelText('Name');
    await userEvent.type(input, 'John');
    expect(onChange).toHaveBeenCalled();
  });

  it('forwards ref correctly', () => {
    const ref = vi.fn();
    render(<Input label="Ref test" ref={ref} />);
    expect(ref).toHaveBeenCalled();
  });

  it('renders with placeholder', () => {
    render(<Input placeholder="Type here..." />);
    expect(screen.getByPlaceholderText('Type here...')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<Input className="custom-input" />);
    expect(screen.getByRole('textbox').className).toContain('custom-input');
  });

  it('generates id from label', () => {
    render(<Input label="Full Name" />);
    expect(screen.getByLabelText('Full Name')).toHaveAttribute('id', 'full-name');
  });

  it('disables input when disabled', () => {
    render(<Input label="Disabled" disabled />);
    expect(screen.getByLabelText('Disabled')).toBeDisabled();
  });
});
