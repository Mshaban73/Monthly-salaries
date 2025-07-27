// --- START OF FILE src/context/AuthContext.tsx (النسخة النهائية والنظيفة) ---

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import type { Session, User } from '@supabase/supabase-js';

interface AuthContextType {
    session: Session | null;
    user: User | null;
    login: (email, password) => Promise<void>;
    logout: () => Promise<void>;
    // سنضيف دالة can لاحقاً عندما نصل إلى الصلاحيات
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

interface AuthProviderProps {
    children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
        });
    
        const { data: listener } = supabase.auth.onAuthStateChange(
          async (_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
          }
        );
    
        return () => {
          listener?.subscription.unsubscribe();
        };
      }, []);

    const login = async (email, password) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
    
        if (error) {
            throw error;
        }
    };
    
    const logout = async () => {
        const { error } = await supabase.auth.signOut();

        if (error) {
            throw error;
        }
    };

    // ▼▼▼ هذا هو التغيير الذي تم تنفيذه: تم حذف دالة can القديمة من هنا ▼▼▼
    // ▲▲▲ نهاية التغيير ▲▲▲

    const value = {
        session,
        user,
        login,
        logout,
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </Auth-Context.Provider>
    );
};