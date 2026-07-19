import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Modal from '../Modal';

describe('Modal', () => {
  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <Modal isOpen={false} onClose={vi.fn()}>
        <p>Content</p>
      </Modal>
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders children when isOpen is true', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()}>
        <p>Modal Content</p>
      </Modal>
    );
    expect(screen.getByText('Modal Content')).toBeInTheDocument();
  });

  it('renders the title when provided', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()} title="My Title">
        <p>Content</p>
      </Modal>
    );
    expect(screen.getByText('My Title')).toBeInTheDocument();
  });

  it('does not render title section when title is not provided', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()}>
        <p>Content</p>
      </Modal>
    );
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  it('calls onClose when Escape key is pressed', async () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={onClose}>
        <p>Content</p>
      </Modal>
    );
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not call onClose for Escape when modal is closed', async () => {
    const onClose = vi.fn();
    const { rerender } = render(
      <Modal isOpen={false} onClose={onClose}>
        <p>Content</p>
      </Modal>
    );
    await userEvent.keyboard('{Escape}');
    expect(onClose).not.toHaveBeenCalled();

    rerender(
      <Modal isOpen={true} onClose={onClose}>
        <p>Content</p>
      </Modal>
    );
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when backdrop is clicked', async () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={onClose}>
        <p>Content</p>
      </Modal>
    );
    // Click the backdrop (the first child of the container)
    const backdrop = screen.getByText('Content').parentElement?.parentElement
      ?.previousElementSibling as HTMLElement;
    if (backdrop) {
      await userEvent.click(backdrop);
      expect(onClose).toHaveBeenCalledTimes(1);
    }
  });

  it('does not call onClose when clicking inside the panel', async () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={onClose}>
        <p>Content</p>
      </Modal>
    );
    await userEvent.click(screen.getByText('Content'));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('renders close button in the title header', async () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={onClose} title="Title">
        <p>Content</p>
      </Modal>
    );
    const closeBtn = screen.getByRole('button', { name: 'Close' });
    expect(closeBtn).toBeInTheDocument();
    await userEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('applies custom size class', () => {
    const { container } = render(
      <Modal isOpen={true} onClose={vi.fn()} size="lg">
        <p>Content</p>
      </Modal>
    );
    const panel = container.querySelector('.max-w-lg');
    expect(panel).toBeInTheDocument();
  });

  it('applies sm size class', () => {
    const { container } = render(
      <Modal isOpen={true} onClose={vi.fn()} size="sm">
        <p>Content</p>
      </Modal>
    );
    const panel = container.querySelector('.max-w-sm');
    expect(panel).toBeInTheDocument();
  });

  it('uses md as default size', () => {
    const { container } = render(
      <Modal isOpen={true} onClose={vi.fn()}>
        <p>Content</p>
      </Modal>
    );
    const panel = container.querySelector('.max-w-md');
    expect(panel).toBeInTheDocument();
  });

  it('cleans up event listener on unmount', () => {
    const onClose = vi.fn();
    const { unmount } = render(
      <Modal isOpen={true} onClose={onClose}>
        <p>Content</p>
      </Modal>
    );
    unmount();
    // Dispatching Escape after unmount should not call onClose
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(onClose).not.toHaveBeenCalled();
  });
});
