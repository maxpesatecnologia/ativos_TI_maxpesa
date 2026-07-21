import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

async function isEmailAllowed(email) {
  if (!email) return false;
  const { data } = await supabase
    .from('allowed_emails')
    .select('id')
    .ilike('email', email)
    .maybeSingle();
  return !!data;
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notAllowedError, setNotAllowedError] = useState('');

  const validateSession = useCallback(async (nextSession) => {
    if (!nextSession) {
      setSession(null);
      return;
    }
    const allowed = await isEmailAllowed(nextSession.user.email);
    if (!allowed) {
      await supabase.auth.signOut();
      setSession(null);
      setNotAllowedError('Este e-mail não tem permissão para acessar o sistema. Contate o administrador.');
      return;
    }
    setSession(nextSession);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      await validateSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      validateSession(session);
    });

    return () => subscription.unsubscribe();
  }, [validateSession]);

  const value = {
    session,
    user: session?.user ?? null,
    loading,
    notAllowedError,
    clearNotAllowedError: () => setNotAllowedError(''),
    signIn: (email, password) => supabase.auth.signInWithPassword({ email, password }),
    signOut: () => supabase.auth.signOut(),
    resetPassword: (email) => supabase.auth.resetPasswordForEmail(email),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
