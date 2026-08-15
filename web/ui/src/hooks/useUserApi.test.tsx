import { renderHook, act } from '@testing-library/react';
import { useUserApi } from './useUserApi';
import { AuthContext } from '../context/AuthContext';
import { vi, describe, it, expect, beforeEach, afterEach, Mock } from 'vitest';
import React from 'react';

describe('useUserApi', () => {
  const mockFetch = vi.fn();
  global.fetch = mockFetch;
  
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthContext.Provider value={{ token: 'test-token', setToken: vi.fn() }}>
      {children}
    </AuthContext.Provider>
  );

  const nullTokenWrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthContext.Provider value={{ token: null, setToken: vi.fn() }}>
      {children}
    </AuthContext.Provider>
  );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('preRegister makes correct POST request', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ success: true }),
      headers: new Headers(),
    });

    const { result } = renderHook(() => useUserApi(), { wrapper });

    const response = await act(async () => {
      return result.current.preRegister({ email: 'test@example.com', password: 'password123' });
    });

    expect(mockFetch).toHaveBeenCalledWith('/user/pre-register', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com', password: 'password123' }),
    }));
    
    // Check headers
    const callArgs = mockFetch.mock.calls[0][1];
    expect(callArgs.headers.get('Content-Type')).toBe('application/json');
    expect(callArgs.headers.get('Authorization')).toBe('Bearer test-token');
    
    expect(response).toEqual({ success: true });
  });

  it('verify makes correct POST request', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ success: true }),
      headers: new Headers(),
    });

    const { result } = renderHook(() => useUserApi(), { wrapper });

    const response = await act(async () => {
      return result.current.verify({ email: 'test@example.com', verification_code: '123456' });
    });

    expect(mockFetch).toHaveBeenCalledWith('/user/verify', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com', verification_code: '123456' }),
    }));
    expect(response).toEqual({ success: true });
  });

  it('editDetails makes correct PUT request', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ success: true }),
      headers: new Headers(),
    });

    const { result } = renderHook(() => useUserApi(), { wrapper });

    const response = await act(async () => {
      return result.current.editDetails({ firstName: 'John', lastName: 'Doe' });
    });

    expect(mockFetch).toHaveBeenCalledWith('/user/edit-details', expect.objectContaining({
      method: 'PUT',
      body: JSON.stringify({ first_name: 'John', last_name: 'Doe' }),
    }));
    
    const callArgs = mockFetch.mock.calls[0][1];
    expect(callArgs.headers.get('Authorization')).toBe('Bearer test-token');
    
    expect(response).toEqual({ success: true });
  });

  it('passwordReset makes correct POST request', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ success: true }),
      headers: new Headers(),
    });

    const { result } = renderHook(() => useUserApi(), { wrapper });

    const response = await act(async () => {
      return result.current.passwordReset({ passwordChangeCode: 'code', password: 'new-password' });
    });

    expect(mockFetch).toHaveBeenCalledWith('/user/password-reset', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ passwordChangeCode: 'code', password: 'new-password' }),
    }));
    expect(response).toEqual({ success: true });
  });

  it('throws correct error on API failure with JSON message', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      json: async () => ({ message: 'Custom error message' }),
      headers: new Headers(),
    });

    const { result } = renderHook(() => useUserApi(), { wrapper });

    await expect(
      act(async () => result.current.preRegister({ email: 'test' }))
    ).rejects.toThrow('Custom error message');
  });

  it('throws fallback error on API failure without JSON message', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: async () => { throw new Error('Not JSON'); },
      headers: new Headers(),
    });

    const { result } = renderHook(() => useUserApi(), { wrapper });

    await expect(
      act(async () => result.current.preRegister({ email: 'test' }))
    ).rejects.toThrow('API Error: 500 Internal Server Error');
  });
  
  it('does not include Authorization header if token is null', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ success: true }),
      headers: new Headers(),
    });

    const { result } = renderHook(() => useUserApi(), { wrapper: nullTokenWrapper });

    await act(async () => {
      return result.current.preRegister({ email: 'test@example.com' });
    });

    const callArgs = mockFetch.mock.calls[0][1];
    expect(callArgs.headers.get('Authorization')).toBeNull();
  });

  it('falls back to localStorage token when used outside AuthProvider', async () => {
    // Mock localStorage
    const getItemSpy = vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('local-storage-token');

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ success: true }),
      headers: new Headers(),
    });

    // Render without wrapper
    const { result } = renderHook(() => useUserApi());

    await act(async () => {
      return result.current.preRegister({ email: 'test@example.com' });
    });

    const callArgs = mockFetch.mock.calls[0][1];
    expect(callArgs.headers.get('Authorization')).toBe('Bearer local-storage-token');
    
    getItemSpy.mockRestore();
  });

  it('falls back to localStorage token when context is present but token is null', async () => {
    // Mock localStorage
    const getItemSpy = vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('local-storage-token');

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ success: true }),
      headers: new Headers(),
    });

    const { result } = renderHook(() => useUserApi(), { wrapper: nullTokenWrapper });

    await act(async () => {
      return result.current.preRegister({ email: 'test@example.com' });
    });

    const callArgs = mockFetch.mock.calls[0][1];
    expect(callArgs.headers.get('Authorization')).toBe('Bearer local-storage-token');
    
    getItemSpy.mockRestore();
  });
});
