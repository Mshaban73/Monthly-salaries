// --- START OF FILE src/context/AuthContext.tsx (النسخة النهائية والجديدة) ---

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { UserPermissions } from '../App';

interface AuthContextType {
    user: UserPermissions | null;
    userPermissions: UserPermissions[];
    setUserPermissions: React.Dispatch<React.SetStateAction<UserPermissions[]>>;
    login: (username: string, password?: string) => boolean;
    logout: () => void;
    can: (action: 'view' | 'add' | 'edit' | 'delete', page: string) => boolean;
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
    // حالة المستخدم الذي قام بتسجيل الدخول
    const [user, setUser] = useState<UserPermissions | null>(() => {
        const savedUser = localStorage.getItem('currentUser_v2');
        return savedUser ? JSON.parse(savedUser) : null;
    });

    // حالة قائمة كل المستخدمين وصلاحياتهم
    const [userPermissions, setUserPermissions] = useState<UserPermissions[]>(() => {
        const savedPermissions = localStorage.getItem('userPermissions_v2');
        if (savedPermissions) {
            return JSON.parse(savedPermissions);
        }
        // قيمة افتراضية عند أول تشغيل للتطبيق
        return [
            {
                username: 'shaban',
                password: '22473',
                permissions: [
                    { page: 'Dashboard', view: true, add: true, edit: true, delete: true },
                    { page: 'Employees', view: true, add: true, edit: true, delete: true },
                    { page: 'Attendance', view: true, add: true, edit: true, delete: true },
                    { page: 'Payroll', view: true, add: true, edit: true, delete: true },
                    { page: 'Transport', view: true, add: true, edit: true, delete: true },
                    { page: 'History', view: true, add: true, edit: true, delete: true },
                    { page: 'Permissions', view: true, add: true, edit: true, delete: true },
                ]
            }
        ];
    });
    
    // حفظ قائمة المستخدمين عند أي تغيير
    useEffect(() => {
        localStorage.setItem('userPermissions_v2', JSON.stringify(userPermissions));
    }, [userPermissions]);

    // حفظ المستخدم الحالي عند تسجيل الدخول/الخروج
    useEffect(() => {
        if (user) {
            localStorage.setItem('currentUser_v2', JSON.stringify(user));
        } else {
            localStorage.removeItem('currentUser_v2');
        }
    }, [user]);

    const login = (username: string, password?: string): boolean => {
        const foundUser = userPermissions.find(
            u => u.username.toLowerCase() === username.toLowerCase()
        );
        
        if (foundUser && foundUser.password === password) {
            setUser(foundUser);
            return true;
        }
        
        return false;
    };

    const logout = () => {
        setUser(null);
    };

    const can = (action: 'view' | 'add' | 'edit' | 'delete', page: string): boolean => {
        if (!user) {
            return false;
        }

        if (user.username.toLowerCase() === 'shaban') {
            return true;
        }
        
        if (page === 'Permissions') {
            return false;
        }

        const permissionForPage = user.permissions.find(p => p.page === page);
        if (!permissionForPage) {
            return false;
        }
        
        // --- تعديل بسيط: التعامل مع صفحة ملخص الحضور AttendanceSummary ---
        // إذا كان المستخدم لديه صلاحية على Attendance، فلديه صلاحية على ملخصها
        if (page === 'AttendanceSummary') {
            const mainAttendancePerms = user.permissions.find(p => p.page === 'Attendance');
            return mainAttendancePerms ? mainAttendancePerms[action] : false;
        }

        return permissionForPage[action];
    };

    return (
        <AuthContext.Provider value={{ user, userPermissions, setUserPermissions, login, logout, can }}>
            {children}
        </AuthContext.Provider>
    );
};