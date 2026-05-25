import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

interface UserProfile {
  id: number;
  mocha_user_id: string;
  email: string;
  full_name: string;
  role: string;
  plan: string;
  referral_code: string;
  balance: number;
  points: number;
  phone?: string;
  avatar_url?: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      // Se for um ID simulado (mock), carregar diretamente do localStorage para evitar erro 400 UUID no banco
      if (userId.startsWith('mock-user-')) {
        const mockProfiles = JSON.parse(localStorage.getItem('supabase.mock-profiles') || '[]');
        const localProfileIndex = mockProfiles.findIndex((p: any) => p.mocha_user_id === userId);
        if (localProfileIndex !== -1) {
          const localProfile = mockProfiles[localProfileIndex];
          setProfile({
            ...localProfile,
            id: localProfile.id || (localProfileIndex + 1000)
          });
          return;
        }
        // Fallback fallback se não for achado no mock profiles
        setProfile({
          id: 9999,
          mocha_user_id: userId,
          email: 'mock@email.com',
          full_name: 'Usuário Simulador',
          role: 'afiliado',
          plan: 'empreendedor',
          referral_code: 'CASARAOMOCK',
          balance: 0,
          points: 0
        });
        return;
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('mocha_user_id', userId)
        .single();

      if (error) {
        // Fallback para perfis locais em localStorage se houver erro ou não encontrado
        const mockProfiles = JSON.parse(localStorage.getItem('supabase.mock-profiles') || '[]');
        const localProfileIndex = mockProfiles.findIndex((p: any) => p.mocha_user_id === userId);
        if (localProfileIndex !== -1) {
          const localProfile = mockProfiles[localProfileIndex];
          setProfile({
            ...localProfile,
            id: localProfile.id || (localProfileIndex + 1000)
          });
          return;
        }
        throw error;
      }
      setProfile(data);
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
      // Segunda tentativa caso caia no catch
      const mockProfiles = JSON.parse(localStorage.getItem('supabase.mock-profiles') || '[]');
      const localProfileIndex = mockProfiles.findIndex((p: any) => p.mocha_user_id === userId);
      if (localProfileIndex !== -1) {
        const localProfile = mockProfiles[localProfileIndex];
        setProfile({
          ...localProfile,
          id: localProfile.id || (localProfileIndex + 1000)
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const checkSession = async () => {
      // 1. Verificar sessão simulada (mock) de desenvolvimento
      const mockSessionStr = localStorage.getItem('supabase.auth.mock-session');
      if (mockSessionStr) {
        try {
          const mockSession = JSON.parse(mockSessionStr);
          if (mockSession?.user) {
            setUser(mockSession.user);
            await fetchProfile(mockSession.user.id);
            return;
          }
        } catch (e) {
          console.error('Erro ao carregar sessão simulada:', e);
        }
      }

      // 2. Verificar sessão real do Supabase
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setLoading(false);
        }
      } catch (e) {
        console.error('Erro ao obter sessão do Supabase:', e);
        setLoading(false);
      }
    };

    checkSession();

    // Ouvir mudanças na autenticação real do Supabase
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const mockSessionStr = localStorage.getItem('supabase.auth.mock-session');
      if (mockSessionStr) {
        try {
          const mockSession = JSON.parse(mockSessionStr);
          if (mockSession?.user) {
            setUser(mockSession.user);
            fetchProfile(mockSession.user.id);
            return;
          }
        } catch (e) {
          console.error(e);
        }
      }

      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    // Ouvir mudanças na autenticação simulada (mock)
    const handleMockAuthChange = () => {
      const mockSessionStr = localStorage.getItem('supabase.auth.mock-session');
      if (mockSessionStr) {
        try {
          const mockSession = JSON.parse(mockSessionStr);
          if (mockSession?.user) {
            setUser(mockSession.user);
            fetchProfile(mockSession.user.id);
          }
        } catch (e) {
          console.error('Erro ao ler sessão simulada no evento:', e);
        }
      } else {
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    };

    window.addEventListener('mock-auth-change', handleMockAuthChange);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('mock-auth-change', handleMockAuthChange);
    };
  }, []);

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  const signOut = async () => {
    localStorage.removeItem('supabase.auth.mock-session');
    window.dispatchEvent(new Event('mock-auth-change'));
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}
