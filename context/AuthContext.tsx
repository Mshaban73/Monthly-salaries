// --- START OF FILE src/context/AuthContext.tsx ---

import React, { createContext, useState, useContext, ReactNode } from 'react';

// واجهة لتحديد شكل بيانات السياق
interface AuthContextType {
  user: string | null; // اسم المستخدم، أو null إذا لم يكن مسجلاً
  login: (username: string) => void;
  logout: () => void;
}

// إنشاء السياق
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// مكون المزوّد (Provider) الذي سيغلف التطبيق
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<string | null>(localStorage.getItem('user'));

  // دالة تسجيل الدخول
  const login = (username: string) => {
    localStorage.setItem('user', username);
    setUser(username);
  };

  // دالة تسجيل الخروج
  const logout = () => {
    localStorage.removeItem('user');
    setUser(null);
  };

  const value = { user, login, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook مخصص لتسهيل استخدام السياق في المكونات الأخرى
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}