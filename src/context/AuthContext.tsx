// --- START OF FILE src/context/AuthContext.tsx (النسخة النهائية الصحيحة) ---

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient.js';
import type { Session, User } from '@supabase/supabase-js';
import type { Permission } from '../types.ts';

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
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);

  // يفضل جلب هذا من متغيرات البيئة
  const managerEmail = import.meta.env.VITE_MANAGER_EMAIL || 'info@thinksolutioneg.com';

  const fetchSessionAndPermissions = useCallback(async () => { // استخدام useCallback
    const { data: { session } } = await supabase.auth.getSession();
    setSession(session);
    setUser(session?.user ?? null);

    if (!session?.user?.email) {
      setPermissions([]);
      setLoading(false);
      return;
    }

    const email = session.user.email;

    if (email === managerEmail) {
      const { data: allPages } = await supabase.from('pages').select('id, name');
      const managerPermissions: Permission[] = (allPages || []).map((p: { id: number; name: string }) => ({
        profile_id: session.user!.id,
        page_id: p.id,
        pages: { id: p.id, name: p.name },
        can_view: true,
        can_add: true,
        can_edit: true,
        can_delete: true,
      }));
      setPermissions(managerPermissions);
      setLoading(false);
      return;
    }
    
    const { data: userPermissions, error } = await supabase
      .from('permissions')
      .select(`
        profile_id,
        page_id,
        can_view,
        can_add,
        can_edit,
        can_delete,
        pages ( id, name )
      `)
      .eq('profile_id', session.user.id);

    if (error) {
      console.error('Error fetching permissions:', error.message);
      setPermissions([]);
    } else {
      // --- بداية التعديل 1: حل مشكلة عدم تطابق الأنواع ---
      // هذا يخبر TypeScript بتجاهل النوع المستنتج واعتبار البيانات من نوع Permission[]
      setPermissions((userPermissions as unknown as Permission[]) || []);
      // --- نهاية التعديل 1 ---
    }

    setLoading(false);
  }, []); // تم إزالة الاعتماديات غير الضرورية لأن الدالة تستدعى مرة واحدة

  useEffect(() => {
    fetchSessionAndPermissions();

    // --- بداية التعديل 2: حل مشكلة المتغير غير المستخدم ---
    // تم تغيير 'session' إلى '_session' للإشارة إلى أنه غير مستخدم عن قصد
    const { data: authListener } = supabase.auth.onAuthStateChange((_event: string, _session: Session | null) => {
      fetchSessionAndPermissions();
    });
    // --- نهاية التعديل 2 ---

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [fetchSessionAndPermissions]); // إضافة الاعتمادية الصحيحة

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
      const perm = permissions.find((p: Permission) => p.pages?.name === pageName);
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