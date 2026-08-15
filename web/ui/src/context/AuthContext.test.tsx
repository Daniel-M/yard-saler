import React from 'react';
import { render, screen, renderHook, act } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';
import userEvent from '@testing-library/user-event';

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('initializes token from localStorage', () => {
    localStorage.setItem('paseto_token', 'initial-token');
    
    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
    });

    expect(result.current.token).toBe('initial-token');
  });

  it('updates token and localStorage when setToken is called', () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
    });

    act(() => {
      result.current.setToken('new-token');
    });

    expect(result.current.token).toBe('new-token');
    expect(localStorage.getItem('paseto_token')).toBe('new-token');
  });

  it('removes token from localStorage when setToken is called with null', () => {
    localStorage.setItem('paseto_token', 'existing-token');
    
    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
    });

    act(() => {
      result.current.setToken(null);
    });

    expect(result.current.token).toBeNull();
    expect(localStorage.getItem('paseto_token')).toBeNull();
  });

  it('throws error if useAuth is used outside of AuthProvider', () => {
    // Suppress console.error for expected error thrown in render
    const consoleSpy = vi.spyOn(console, 'error');
    consoleSpy.mockImplementation(() => {});
    
    expect(() => renderHook(() => useAuth())).toThrow('useAuth must be used within an AuthProvider');
    
    consoleSpy.mockRestore();
  });
});
