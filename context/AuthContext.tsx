// --- START OF FILE src/context/AuthContext.tsx ---

import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
// --- تعديل: استيراد الواجهات من المصدر المركزي الصحيح ---
import { UserPermissions, Permission } from '../App';

export const PERMISSIONS_KEY = 'user_permissions_v1';

// Interfaces
interface AuthenticatedUser {
  name: string;
  permissions: UserPermissions;
  isSuperAdmin: boolean;
}

interface AuthContextType {
  user: AuthenticatedUser | null;
  login: (username: string, password?: string) => boolean;
  logout: () => void;
  can: (action: keyof Omit<Permission, 'page'>, page: string) => boolean;
  userPermissions: UserPermissions[];
  setUserPermissions: React.Dispatch<React.SetStateAction<UserPermissions[]>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const defaultPages = ['Dashboard', 'Employees', 'Attendance', 'Payroll', 'Transport', 'History', 'Permissions'];

const superAdminPermissions = (username: string): UserPermissions => ({
    username,
    password: '', // Super admin password is not stored here
    permissions: defaultPages.map(page => ({ page, view: true, add: true, edit: true, delete: true }))
});

const createEmptyPermissions = (username: string): UserPermissions => ({
    username,
    permissions: defaultPages.map(page => ({ page, view: false, add: false, edit: false, delete: false }))
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [userPermissions, setUserPermissions] = useState<UserPermissions[]>(() => {
    const saved = localStorage.getItem(PERMISSIONS_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem(PERMISSIONS_KEY, JSON.stringify(userPermissions));
  }, [userPermissions]);

  useEffect(() => {
    let username: string | null = null;
    try {
        const savedUser = localStorage.getItem('user');
        if (savedUser) { username = JSON.parse(savedUser); }
    } catch (error) {
        localStorage.removeItem('user');
    }

    if (username) {
      if (username.toLowerCase() === 'shaban') {
        setUser({ name: username, permissions: superAdminPermissions(username), isSuperAdmin: true });
      } else {
        const userPerms = userPermissions.find(p => p.username.toLowerCase() === username!.toLowerCase());
        setUser({ name: username, permissions: userPerms || createEmptyPermissions(username), isSuperAdmin: false });
      }
    } else {
        setUser(null);
    }
  }, [userPermissions]);

  const login = (username: string, password?: string): boolean => {
    if (username.toLowerCase() === 'shaban' && password === '22473') { // Super admin password
      const authUser: AuthenticatedUser = { name: username, permissions: superAdminPermissions(username), isSuperAdmin: true };
      localStorage.setItem('user', JSON.stringify(username));
      setUser(authUser);
      return true;
    }

    const userToLogin = userPermissions.find(p => p.username.toLowerCase() === username.toLowerCase());
    if (userToLogin && userToLogin.password === password) {
      const authUser: AuthenticatedUser = { name: username, permissions: userToLogin, isSuperAdmin: false };
      localStorage.setItem('user', JSON.stringify(username));
      setUser(authUser);
      return true;
    }
    
    return false;
  };

  const logout = () => {
    localStorage.removeItem('user');
    setUser(null);
  };

  const can = (action: keyof Omit<Permission, 'page'>, page: string): boolean => {
    if (!user) return false;
    if (user.isSuperAdmin) return true;
    const pagePermission = user.permissions.permissions.find(p => p.page === page);
    if (!pagePermission) return false;
    return pagePermission[action] === true;
  };

  const value = { user, login, logout, can, userPermissions, setUserPermissions };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}