import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import getSupabase from '../utils/supabase';
import { getProfile, signOut as authSignOut } from '../utils/auth';
import type { UserProfile } from '../types';

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isLoggedIn: boolean;
  isAdmin: boolean;
  isGroup: boolean;
  usertype: number;
  needsProfileCompletion: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (authUser: User) => {
    if (!authUser) {
      setProfile(null);
      return;
    }
    let p = await getProfile(authUser.id);

    // OAuth 사용자 첫 로그인 시 자동 프로필 생성
    if (!p) {
      const client = getSupabase();
      if (client) {
        const meta = authUser.user_metadata || {};
        const { data, error } = await client
          .from('user_profiles')
          .insert({
            id: authUser.id,
            name: meta.full_name || meta.name || '',
            email: authUser.email || '',
            gender: '',
            phone: '',
            usertype: 0
          })
          .select()
          .single();
        if (!error && data) p = data as UserProfile;
      }
    }
    setProfile(p);
  }, []);

  useEffect(() => {
    const client = getSupabase();
    if (!client) {
      setLoading(false);
      return;
    }

    client.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) loadProfile(u);
      setLoading(false);
    });

    const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        loadProfile(u);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [loadProfile]);

  const signOut = useCallback(async () => {
    await authSignOut();
    setUser(null);
    setProfile(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) await loadProfile(user);
  }, [user, loadProfile]);

  // usertype: 0=개인, 1=그룹, 2=관리자, 3=서브그룹
  const usertype = profile?.usertype ?? 0;
  const ADMIN_EMAILS = ['aebon@kakao.com', 'aebon@kyonggi.ac.kr', 'ryuwebpd@gmail.com'];
  const isAdmin = usertype === 2 || !!(user?.email && ADMIN_EMAILS.includes(user.email));
  const isGroup = usertype === 1 || usertype === 3;
  const isLoggedIn = !!user;
  // 인구통계학적 정보 미완성 체크 (OAuth 사용자용)
  const needsProfileCompletion = isLoggedIn && !!profile && !profile.name;

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      isLoggedIn,
      isAdmin,
      isGroup,
      usertype,
      needsProfileCompletion,
      signOut,
      refreshProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
