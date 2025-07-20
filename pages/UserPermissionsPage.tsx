// --- START OF FILE src/pages/UserPermissionsPage.tsx ---

import React, { useState } from 'react';
import { UserPlus, ShieldCheck, Edit, Trash2, X, Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
// --- تعديل: استيراد الواجهات من المصدر المركزي الصحيح ---
import type { UserPermissions, Permission } from '../App';

// الصفحات الافتراضية للنظام
const defaultPages = ['Dashboard', 'Employees', 'Attendance', 'Payroll', 'Transport', 'History', 'Permissions'];

// دالة لإنشاء مستخدم جديد بصلاحيات افتراضية
const createDefaultUser = (username: string, password?: string): UserPermissions => ({
  username,
  password,
  permissions: defaultPages.map(page => ({
    page,
    view: true, // صلاحية العرض مفعلة افتراضياً
    add: false,
    edit: false,
    delete: false,
  }))
});

const UserPermissionsPage: React.FC = () => {
  const { userPermissions, setUserPermissions } = useAuth();
  
  const [editingUser, setEditingUser] = useState<UserPermissions | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAddNewUser = () => {
    setEditingUser(createDefaultUser('', ''));
    setIsModalOpen(true);
  };

  const handleEditUser = (user: UserPermissions) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };
  
  const handleDeleteUser = (username: string) => {
    if (username.toLowerCase() === 'shaban') {
      alert('لا يمكن حذف المستخدم المدير.');
      return;
    }
    if (window.confirm(`هل أنت متأكد من حذف المستخدم "${username}"؟`)) {
        setUserPermissions(prev => prev.filter(u => u.username !== username));
    }
  };

  const handleSaveUser = (userToSave: UserPermissions) => {
    const isDuplicate = userPermissions.some(
      u => u.username.toLowerCase() === userToSave.username.toLowerCase() && u.username !== editingUser?.username
    );

    if (isDuplicate) {
      alert('اسم المستخدم هذا موجود بالفعل. الرجاء اختيار اسم آخر.');
      return;
    }

    if (editingUser && editingUser.username === '') {
      setUserPermissions(prev => [...prev, userToSave]);
    } else {
      setUserPermissions(prev => prev.map(u => u.username === editingUser?.username ? userToSave : u));
    }
    setIsModalOpen(false);
  };

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <ShieldCheck size={32} className="text-blue-600"/>
          <h1 className="text-3xl font-bold text-gray-800">إدارة المستخدمين والصلاحيات</h1>
        </div>
        <button
          className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          onClick={handleAddNewUser}
        >
          <UserPlus size={20} className="ml-2"/>
          إضافة مستخدم جديد
        </button>
      </div>

      {userPermissions.length === 0 && <p className="text-gray-500 text-center py-10 bg-white rounded-lg shadow">لا يوجد مستخدمين مضافين حالياً.</p>}

      <div className="space-y-8">
        {userPermissions.map(user => (
          <div key={user.username} className="border rounded-lg p-4 bg-white shadow-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-xl text-gray-800">المستخدم: <span className="text-indigo-700">{user.username}</span></h2>
              <div className="flex gap-4">
                <button onClick={() => handleEditUser(user)} className="text-blue-600 hover:text-blue-800" title="تعديل"><Edit size={20}/></button>
                <button onClick={() => handleDeleteUser(user.username)} className="text-red-600 hover:text-red-800" title="حذف"><Trash2 size={20}/></button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
                {user.permissions.filter(p => p.view).map(p => (
                    <span key={p.page} className="bg-gray-200 text-gray-700 text-xs font-semibold px-2.5 py-0.5 rounded-full">{p.page}</span>
                ))}
            </div>
          </div>
        ))}
      </div>
      
      {isModalOpen && editingUser && (
        <PermissionsModal 
          user={editingUser}
          onSave={handleSaveUser}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
};

interface PermissionsModalProps { user: UserPermissions; onSave: (user: UserPermissions) => void; onClose: () => void; }
function PermissionsModal({ user, onSave, onClose }: PermissionsModalProps) {
    const [userData, setUserData] = useState<UserPermissions>(user);
    const isNewUser = user.username === '';

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setUserData(prev => ({...prev, [name]: value}));
    };

    const togglePermission = (page: string, type: keyof Omit<Permission, 'page'>) => {
        setUserData(prev => ({
            ...prev,
            permissions: prev.permissions.map(p => 
                p.page === page ? {...p, [type]: !p[type]} : p
            )
        }));
    };

    const handleSubmit = () => {
        if (!userData.username.trim()) {
            alert('اسم المستخدم لا يمكن أن يكون فارغاً.');
            return;
        }
        if (isNewUser && (!userData.password || !userData.password.trim())) {
            alert('كلمة المرور مطلوبة للمستخدم الجديد.');
            return;
        }
        onSave(userData);
    };
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white p-6 rounded-lg shadow-2xl w-full max-w-3xl flex flex-col h-full max-h-[95vh] animate-fade-in-down">
                <div className="flex-shrink-0 flex justify-between items-center mb-4 border-b pb-3">
                    <h2 className="text-2xl font-bold text-gray-800">{isNewUser ? 'إضافة مستخدم جديد' : `تعديل المستخدم: ${user.username}`}</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800"><X size={28} /></button>
                </div>
                <div className="flex-1 overflow-y-auto pr-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">اسم المستخدم (انجليزي)</label>
                            <input id="username" name="username" value={userData.username} onChange={handleInputChange} className="w-full border p-2 rounded-md" disabled={!isNewUser} />
                            {!isNewUser && <p className="text-xs text-gray-500 mt-1">لا يمكن تغيير اسم المستخدم بعد إنشائه.</p>}
                        </div>
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">كلمة المرور</label>
                            <input id="password" name="password" type="password" onChange={handleInputChange} className="w-full border p-2 rounded-md" placeholder={isNewUser ? "كلمة مرور جديدة" : "اتركه فارغاً لعدم التغيير"} />
                        </div>
                    </div>
                    
                    <h3 className="text-lg font-semibold mb-2">صلاحيات الصفحات</h3>
                    <table className="w-full text-sm border">
                        <thead className="bg-gray-100">
                            <tr className="text-center"><th className="p-2 border text-right">الصفحة</th><th className="p-2 border">تصفح</th><th className="p-2 border">إضافة</th><th className="p-2 border">تعديل</th><th className="p-2 border">حذف</th></tr>
                        </thead>
                        <tbody>
                            {userData.permissions.map(perm => (
                                <tr key={perm.page}>
                                    <td className="p-2 border font-bold">{perm.page}</td>
                                    <td className="p-2 border text-center"><input className="h-5 w-5" type="checkbox" checked={perm.view} onChange={() => togglePermission(perm.page, 'view')} /></td>
                                    <td className="p-2 border text-center"><input className="h-5 w-5" type="checkbox" checked={perm.add} onChange={() => togglePermission(perm.page, 'add')} /></td>
                                    <td className="p-2 border text-center"><input className="h-5 w-5" type="checkbox" checked={perm.edit} onChange={() => togglePermission(perm.page, 'edit')} /></td>
                                    <td className="p-2 border text-center"><input className="h-5 w-5" type="checkbox" checked={perm.delete} onChange={() => togglePermission(perm.page, 'delete')} /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="flex-shrink-0 flex justify-end gap-4 mt-4 border-t pt-4">
                    <button onClick={onClose} className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-300 transition">إلغاء</button>
                    <button onClick={handleSubmit} className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition flex items-center"><Save size={18} className="ml-2"/>حفظ</button>
                </div>
            </div>
        </div>
    );
}

export default UserPermissionsPage;