"use client";

import { useState, useEffect, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { AuthService } from '@/services/authService';
import { Profile } from '@/lib/types';

export interface AuthState {
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    isLoading: true,
  });

  const refreshSession = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      const result = await AuthService.getCurrentUserWithProfile();

      setState({
        user: result?.user ?? null,
        profile: result?.profile ?? null,
        isLoading: false,
      });
    } catch (error) {
      console.error('[useAuth] Error sincronizando estado de autenticación:', error);
      setState({
        user: null,
        profile: null,
        isLoading: false,
      });
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const safeRefreshSession = async () => {
      if (!cancelled) {
        setState((prev) => ({ ...prev, isLoading: true }));
      }

      try {
        const result = await AuthService.getCurrentUserWithProfile();

        if (!cancelled) {
          setState({
            user: result?.user ?? null,
            profile: result?.profile ?? null,
            isLoading: false,
          });
        }
      } catch (error) {
        console.error('[useAuth] Error sincronizando estado de autenticación:', error);

        if (!cancelled) {
          setState({
            user: null,
            profile: null,
            isLoading: false,
          });
        }
      }
    };

    safeRefreshSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;

      if (event === 'SIGNED_OUT' || !session) {
        setState({
          user: null,
          profile: null,
          isLoading: false,
        });
        return;
      }

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        void safeRefreshSession();
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  return {
    ...state,
    refreshSession,
  };
}