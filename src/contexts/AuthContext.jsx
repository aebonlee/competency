import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import getSupabase from '../utils/supabase';
import { getProfile, signOut as authSignOut } from '../utils/auth';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (authUser) => {
    if (!authUser) {
      setProfile(null);
      return;
    }
    const p = await getProfile(authUser.id);
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
  const ADMIN_EMAILS = ['aebon@kakao.com', 'aebon@kyonggi.ac.kr'];
  const isAdmin = usertype === 2 || !!(user?.email && ADMIN_EMAILS.includes(user.email));
  const isGroup = usertype === 1 || usertype === 3;
  const isLoggedIn = !!user;

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      isLoggedIn,
      isAdmin,
      isGroup,
      usertype,
      signOut,
      refreshProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
