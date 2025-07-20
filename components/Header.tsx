// --- START OF FILE src/components/Header.tsx ---

import React, { useState, useEffect } from 'react';
import { LogOut, UserCircle, Settings, X, Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import type { UserPermissions } from '../pages/UserPermissionsPage';

function Header() {
  const { user, logout, userPermissions, setUserPermissions } = useAuth();
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  useEffect(() => {
    const timerId = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timerId);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleProfileUpdate = (newName: string, newPassword?: string) => {
    if (!user) return;
    
    // لا نسمح للمدير العام بتغيير اسمه
    if (user.isSuperAdmin && user.name.toLowerCase() !== newName.toLowerCase()) {
      alert("لا يمكن تغيير اسم المستخدم الخاص بالمدير العام.");
      return;
    }
    
    // التحقق من أن الاسم الجديد غير مستخدم
    const isNameTaken = userPermissions.some(
        p => p.username.toLowerCase() === newName.toLowerCase() && p.username.toLowerCase() !== user.name.toLowerCase()
    );
    if(isNameTaken) {
        alert("اسم المستخدم هذا محجوز. الرجاء اختيار اسم آخر.");
        return;
    }

    setUserPermissions(prev =>
      prev.map(p => {
        if (p.username.toLowerCase() === user.name.toLowerCase()) {
          return {
            ...p,
            username: newName,
            password: newPassword && newPassword.length > 0 ? newPassword : p.password
          };
        }
        return p;
      })
    );
    
    // تحديث اسم المستخدم المحفوظ في localStorage لتسجيل الدخول
    logout();
    alert("تم تحديث بياناتك بنجاح. الرجاء تسجيل الدخول مرة أخرى بالبيانات الجديدة.");
    navigate('/login');
  };


  return (
    <header className="bg-white shadow-md p-4 flex justify-between items-center">
      <div className="flex items-center gap-4">
        <div className="flex items-center">
          <UserCircle size={28} className="text-gray-600 mr-2" />
          <span className="text-lg font-semibold text-gray-700">
            مرحباً، {user ? user.name : 'زائر'}
          </span>
        </div>
        <button onClick={() => setIsProfileModalOpen(true)} className="text-gray-500 hover:text-blue-600" title="إدارة حسابي">
            <Settings size={20} />
        </button>
      </div>
      
      <div className="flex items-center gap-6">
        <div className="text-center">
          <p className="text-sm font-medium text-gray-800">
            {currentTime.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
          </p>
          <p className="text-xs text-gray-500">
            {currentTime.toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <button 
          onClick={handleLogout}
          className="flex items-center text-red-600 hover:text-red-800 transition-colors"
          title="تسجيل الخروج"
        >
          <LogOut size={22} />
          <span className="mr-2 hidden md:block">خروج</span>
        </button>
      </div>

      {isProfileModalOpen && user && (
        <ProfileModal 
            currentUser={user}
            onSave={handleProfileUpdate}
            onClose={() => setIsProfileModalOpen(false)} 
        />
      )}
    </header>
  );
}

// مكون نافذة إدارة الحساب
interface ProfileModalProps {
    currentUser: { name: string, isSuperAdmin: boolean };
    onSave: (newName: string, newPassword?: string) => void;
    onClose: () => void;
}

function ProfileModal({ currentUser, onSave, onClose }: ProfileModalProps) {
    const [newName, setNewName] = useState(currentUser.name);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');

    const handleSave = () => {
        if (newPassword && newPassword !== confirmPassword) {
            setError("كلمتا المرور غير متطابقتين.");
            return;
        }
        if (newPassword && newPassword.length < 4) {
            setError("يجب أن تكون كلمة المرور 4 أحرف على الأقل.");
            return;
        }
        setError('');
        onSave(newName, newPassword || undefined);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white p-6 rounded-lg shadow-2xl w-full max-w-md animate-fade-in-down">
                <div className="flex justify-between items-center mb-4 border-b pb-2">
                    <h2 className="text-xl font-bold text-gray-800">إدارة حسابي</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800"><X size={24} /></button>
                </div>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">اسم المستخدم</label>
                        <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} disabled={currentUser.isSuperAdmin} className="w-full border p-2 rounded-md disabled:bg-gray-200" />
                        {currentUser.isSuperAdmin && <p className="text-xs text-gray-500 mt-1">لا يمكن تغيير اسم المستخدم الخاص بالمدير العام.</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">كلمة المرور الجديدة</label>
                        <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full border p-2 rounded-md" placeholder="اتركه فارغاً لعدم التغيير" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">تأكيد كلمة المرور الجديدة</label>
                        <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full border p-2 rounded-md" />
                    </div>
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                </div>
                <div className="mt-6 flex justify-end gap-4">
                    <button onClick={onClose} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition">إلغاء</button>
                    <button onClick={handleSave} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center"><Save size={18} className="ml-2"/>حفظ التغييرات</button>
                </div>
            </div>
        </div>
    );
}

export default Header;