// src/context/AuthContext.tsx

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import type { Session, User } from '@supabase/supabase-js';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  can: (action: 'view' | 'add' | 'edit' | 'delete', pageName: string) => boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const managerEmail = 'info@thinksolutioneg.com';

  const fetchSessionAndPermissions = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setSession(session);
    setUser(session?.user ?? null);

    if (!session?.user?.email) {
      setPermissions([]);
      setLoading(false);
      return;
    }

    const email = session.user.email;

    // المدير له كل الصلاحيات دائمًا
    if (email === managerEmail) {
      const { data: allPages } = await supabase.from('pages').select('name');
      const managerPermissions = (allPages || []).map((p) => ({
        pages: { name: p.name },
        can_view: true,
        can_add: true,
        can_edit: true,
        can_delete: true,
      }));
      setPermissions(managerPermissions);
      setLoading(false);
      return;
    }

    // الحصول على id من جدول profiles
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single();

    if (profileError || !profile?.id) {
      console.error('❌ لم يتم العثور على ملف المستخدم في جدول profiles');
      setPermissions([]);
      setLoading(false);
      return;
    }

    // تحميل الصلاحيات من جدول permissions
    const { data: userPermissions, error } = await supabase
      .from('permissions')
      .select(`
        can_view,
        can_add,
        can_edit,
        can_delete,
        pages ( name )
      `)
      .eq('profile_id', profile.id);

    if (error) {
      console.error('❌ فشل تحميل الصلاحيات:', error.message);
      setPermissions([]);
    } else {
      setPermissions(userPermissions || []);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchSessionAndPermissions();

    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      fetchSessionAndPermissions();
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const can = useCallback(
    (action: 'view' | 'add' | 'edit' | 'delete', pageName: string): boolean => {
      const perm = permissions.find((p) => p.pages?.name === pageName);
      if (!perm) return false;
      switch (action) {
        case 'view': return perm.can_view;
        case 'add': return perm.can_add;
        case 'edit': return perm.can_edit;
        case 'delete': return perm.can_delete;
        default: return false;
      }
    },
    [permissions]
  );

  const value: AuthContextType = {
    session,
    user,
    can,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
