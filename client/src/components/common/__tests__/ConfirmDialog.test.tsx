import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ConfirmDialog from '../ConfirmDialog';

describe('ConfirmDialog', () => {
  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <ConfirmDialog
        isOpen={false}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        title="Delete?"
        message="Are you sure?"
      />
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders title and message when isOpen is true', () => {
    render(
      <ConfirmDialog
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        title="Delete?"
        message="Are you sure?"
      />
    );
    expect(screen.getByText('Delete?')).toBeInTheDocument();
    expect(screen.getByText('Are you sure?')).toBeInTheDocument();
  });

  it('renders default confirm and cancel labels', () => {
    render(
      <ConfirmDialog
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        title="Delete?"
        message="Are you sure?"
      />
    );
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  it('renders custom button labels', () => {
    render(
      <ConfirmDialog
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        title="Delete?"
        message="Are you sure?"
        confirmLabel="Yes, Delete"
        cancelLabel="No, Keep"
      />
    );
    expect(screen.getByRole('button', { name: 'Yes, Delete' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'No, Keep' })).toBeInTheDocument();
  });

  it('calls onConfirm when confirm button is clicked', async () => {
    const onConfirm = vi.fn();
    render(
      <ConfirmDialog
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={onConfirm}
        title="Delete?"
        message="Are you sure?"
      />
    );
    await userEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when cancel button is clicked', async () => {
    const onClose = vi.fn();
    render(
      <ConfirmDialog
        isOpen={true}
        onClose={onClose}
        onConfirm={vi.fn()}
        title="Delete?"
        message="Are you sure?"
      />
    );
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('disables Confirm and Cancel buttons when isLoading is true', () => {
    render(
      <ConfirmDialog
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        title="Delete?"
        message="Are you sure?"
        isLoading={true}
      />
    );
    const confirmBtn = screen.getByRole('button', { name: 'Confirm' });
    const cancelBtn = screen.getByRole('button', { name: 'Cancel' });
    expect(confirmBtn).toBeDisabled();
    expect(cancelBtn).toBeDisabled();
  });

  it('renders with danger variant by default', () => {
    render(
      <ConfirmDialog
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        title="Delete?"
        message="Are you sure?"
      />
    );
    const confirmBtn = screen.getByRole('button', { name: 'Confirm' });
    expect(confirmBtn.className).toContain('bg-red-500');
  });

  it('renders with primary variant when specified', () => {
    render(
      <ConfirmDialog
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        title="Save?"
        message="Are you sure?"
        variant="primary"
      />
    );
    const confirmBtn = screen.getByRole('button', { name: 'Confirm' });
    expect(confirmBtn.className).toContain('bg-primary-500');
  });

  it('calls onClose when Escape key is pressed via Modal', async () => {
    const onClose = vi.fn();
    render(
      <ConfirmDialog
        isOpen={true}
        onClose={onClose}
        onConfirm={vi.fn()}
        title="Delete?"
        message="Are you sure?"
      />
    );
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
