import { describe, it, expect } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { ToastProvider, useToast } from './ToastContext';

function TestComponent() {
  const { showToast, removeToast } = useToast();
  return (
    <div>
      <button onClick={() => showToast('Test message', 'success')}>Show Toast</button>
      <button onClick={() => removeToast(1)}>Remove Toast</button>
    </div>
  );
}

describe('ToastContext', () => {
  it('should render children within ToastProvider', () => {
    render(
      <ToastProvider>
        <div>Hello</div>
      </ToastProvider>
    );
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('should show a toast message', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    act(() => {
      screen.getByText('Show Toast').click();
    });

    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  it('useToast should return fallback when outside provider', () => {
    // useToast returns a fallback instead of throwing
    function StandaloneComponent() {
      const { showToast } = useToast();
      return <button onClick={() => showToast('test')}>Click</button>;
    }

    render(<StandaloneComponent />);
    // Should not throw
    expect(screen.getByText('Click')).toBeInTheDocument();
  });
});
