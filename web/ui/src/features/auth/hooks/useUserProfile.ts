import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../../context/AuthContext';
import type { UserProfile } from '@type/auth.types';
import { UserApiClient } from '../api/auth.api';

export const useUserProfile = () => {
  const { setUser, user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchProfile = useCallback(async (): Promise<UserProfile | null> => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    
    setIsLoading(true);
    setError(null);
    try {
      const client = new UserApiClient();
      const data = await client.getProfile(abortControllerRef.current.signal);
      if (data) {
        const profile: UserProfile = {
          id: data.id,
          displayName: data.display_name,
          email: data.email,
          initials: data.initials,
          avatarUrl: data.avatar_url,
          firstName: data.first_name,
          lastName: data.last_name,
          isVerified: data.verified_at != null,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
          verifiedAt: data.verified_at,
          mobilePhone: data.mobile_phone,
          socials: data.socials,
          profile_complete: data.profile_complete,
        };
        setUser(profile);
        return profile;
      }
      return null;
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        return null;
      }
      const errorObj = err instanceof Error ? err : new Error(String(err));
      setError(errorObj);
      throw errorObj;
    } finally {
      setIsLoading(false);
    }
  }, [setUser]);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    data: user,
    isLoading,
    error,
    refetch: async () => {
      await fetchProfile();
    },
    fetchProfile,
  };
};
