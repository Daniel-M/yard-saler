import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { DrawerProvider, useDrawer } from './DrawerContext';

const TestComponent: React.FC = () => {
  const { isDrawerOpen, openDrawer, closeDrawer, toggleDrawer } = useDrawer();
  return (
    <div>
      <div data-testid="drawer-status">{isDrawerOpen ? 'open' : 'closed'}</div>
      <button onClick={openDrawer} data-testid="btn-open">Open</button>
      <button onClick={closeDrawer} data-testid="btn-close">Close</button>
      <button onClick={toggleDrawer} data-testid="btn-toggle">Toggle</button>
    </div>
  );
};

describe('DrawerContext', () => {
  it('should have initial state isDrawerOpen as false', () => {
    render(
      <DrawerProvider>
        <TestComponent />
      </DrawerProvider>
    );
    expect(screen.getByTestId('drawer-status').textContent).toBe('closed');
  });

  it('should set isDrawerOpen to true when openDrawer is called', () => {
    render(
      <DrawerProvider>
        <TestComponent />
      </DrawerProvider>
    );
    const openBtn = screen.getByTestId('btn-open');
    act(() => {
      openBtn.click();
    });
    expect(screen.getByTestId('drawer-status').textContent).toBe('open');
  });

  it('should set isDrawerOpen to false when closeDrawer is called', () => {
    render(
      <DrawerProvider>
        <TestComponent />
      </DrawerProvider>
    );
    const openBtn = screen.getByTestId('btn-open');
    const closeBtn = screen.getByTestId('btn-close');
    
    act(() => {
      openBtn.click();
    });
    expect(screen.getByTestId('drawer-status').textContent).toBe('open');

    act(() => {
      closeBtn.click();
    });
    expect(screen.getByTestId('drawer-status').textContent).toBe('closed');
  });

  it('should toggle isDrawerOpen when toggleDrawer is called', () => {
    render(
      <DrawerProvider>
        <TestComponent />
      </DrawerProvider>
    );
    const toggleBtn = screen.getByTestId('btn-toggle');
    
    expect(screen.getByTestId('drawer-status').textContent).toBe('closed');

    act(() => {
      toggleBtn.click();
    });
    expect(screen.getByTestId('drawer-status').textContent).toBe('open');

    act(() => {
      toggleBtn.click();
    });
    expect(screen.getByTestId('drawer-status').textContent).toBe('closed');
  });

  it('should throw an error if useDrawer is used outside DrawerProvider', () => {
    const consoleError = console.error;
    console.error = () => {};

    expect(() => render(<TestComponent />)).toThrow(
      'useDrawer must be used within a DrawerProvider'
    );

    console.error = consoleError;
  });
});
