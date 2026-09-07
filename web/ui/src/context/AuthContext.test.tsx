import React from 'react';
import { render, screen, renderHook, act } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';
import userEvent from '@testing-library/user-event';

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('initializes token from localStorage', () => {
    localStorage.setItem('token', 'initial-token');
    
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
    expect(localStorage.getItem('token')).toBe('new-token');
  });

  it('removes token from localStorage when setToken is called with null', () => {
    localStorage.setItem('token', 'existing-token');
    
    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
    });

    act(() => {
      result.current.setToken(null);
    });

    expect(result.current.token).toBeNull();
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('initializes user to null and updates via setUser', () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
    });

    expect(result.current.user).toBeNull();

    const testUser = {
      id: 'usr_123',
      displayName: 'Jane Doe',
      email: 'jane@example.com',
      initials: 'JD',
    };

    act(() => {
      result.current.setUser(testUser);
    });

    expect(result.current.user).toEqual(testUser);
  });

  it('resets user to null when token becomes null or empty', () => {
    localStorage.setItem('token', 'existing-token');
    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
    });

    const testUser = {
      id: 'usr_123',
      displayName: 'Jane Doe',
      email: 'jane@example.com',
      initials: 'JD',
    };

    act(() => {
      result.current.setUser(testUser);
    });

    expect(result.current.user).toEqual(testUser);

    act(() => {
      result.current.setToken(null);
    });

    expect(result.current.user).toBeNull();
  });

  it('throws error if useAuth is used outside of AuthProvider', () => {
    // Suppress console.error for expected error thrown in render
    const consoleSpy = vi.spyOn(console, 'error');
    consoleSpy.mockImplementation(() => {});
    
    expect(() => renderHook(() => useAuth())).toThrow('useAuth must be used within an AuthProvider');
    
    consoleSpy.mockRestore();
  });
});
