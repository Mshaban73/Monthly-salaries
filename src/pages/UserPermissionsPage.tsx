// --- START OF FILE src/pages/UserPermissionsPage.tsx (كامل ومع التعديلات الصحيحة) ---

import React, { useState, useEffect, useCallback } from 'react';
import { UserPlus, ShieldCheck, Edit, Trash2, Loader, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { supabase } from '../supabaseClient.js';
import PermissionsModal from '../components/PermissionsModal.tsx';
import type { UserWithPermissions, Page, Permission } from '../types.ts'; // استيراد Page و Permission

const managerEmail = import.meta.env.VITE_MANAGER_EMAIL || 'info@thinksolutioneg.com'; // استخدام متغيرات البيئة

export default function UserPermissionsPage() {
  const { can, user: currentUser } = useAuth();
  const [allUsersWithPerms, setAllUsersWithPerms] = useState<UserWithPermissions[]>([]);
  const [allPages, setAllPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [editingUser, setEditingUser] = useState<UserWithPermissions | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
        const { data: profiles, error: profilesError } = await supabase.from('profiles').select('id, email');
        if (profilesError) throw profilesError;

        const { data: permissions, error: permError } = await supabase
            .from('permissions')
            .select(`
                *, 
                pages (id, name)
            `);
        if (permError) throw permError;

        const { data: pagesData, error: pagesError } = await supabase.from('pages').select('*');
        if (pagesError) throw pagesError;
        setAllPages(pagesData || []);

        const userList: UserWithPermissions[] = (profiles || []).map(profile => {
            const userPermissions = (permissions || []).filter((p: any) => p.profile_id === profile.id);
            return {
                id: profile.id,
                profiles: { id: profile.id, email: profile.email },
                permissions: userPermissions as Permission[] // استخدام as لتحديد النوع
            };
        });
        setAllUsersWithPerms(userList);
    } catch (error) {
        // التحقق من نوع الخطأ قبل عرضه
        if (error instanceof Error) {
            console.error("Error fetching data:", error.message);
        } else {
            console.error("An unknown error occurred:", error);
        }
    } finally {
        setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleEditUser = (user: UserWithPermissions) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };
  
  const handleDeleteUser = async (userToDelete: UserWithPermissions) => {
    if (userToDelete.profiles.email === currentUser?.email) { alert('لا يمكنك حذف نفسك.'); return; }
    if (userToDelete.profiles.email === managerEmail) { alert('لا يمكن حذف المدير العام.'); return; }
    if (window.confirm(`هل أنت متأكد من حذف المستخدم "${userToDelete.profiles.email}"؟ سيتم حذف كل بياناته بشكل نهائي.`)) {
        // تأكد من أن لديك صلاحيات admin لحذف المستخدمين
        const { error } = await supabase.auth.admin.deleteUser(userToDelete.id);
        if (error) {
            alert(`فشل حذف المستخدم: ${error.message}`);
        } else {
            alert('تم حذف المستخدم بنجاح.');
            fetchData();
        }
    }
  };
  
  if (loading) { return <div className="flex justify-center items-center h-screen"><Loader className="animate-spin text-blue-500" size={48} /></div>; }
  
  if (!can('view', 'Permissions')) {
    return (
        <div className="p-8 text-center flex flex-col items-center" dir="rtl">
            <AlertTriangle size={64} className="text-yellow-500 mb-4" />
            <h1 className="text-3xl font-bold text-red-600">غير مصرح لك بالوصول</h1>
            <p className="mt-4 text-gray-600 max-w-md">هذه الصفحة مخصصة لمدير النظام فقط.</p>
        </div>
    );
  }

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen" dir="rtl">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <ShieldCheck size={32} className="text-blue-600"/>
          <h1 className="text-3xl font-bold text-gray-800">إدارة صلاحيات المستخدمين</h1>
        </div>
        <a href={`https://supabase.com/dashboard/project/${import.meta.env.VITE_SUPABASE_PROJECT_ID}/auth/users`} target="_blank" rel="noopener noreferrer"
          className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
          <UserPlus size={20} className="ml-2"/>
          إضافة مستخدم جديد (من Supabase)
        </a>
      </div>
      <div className="space-y-8">
        {allUsersWithPerms.map(user => (
          <div key={user.id} className="border rounded-lg p-4 bg-white shadow-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-xl text-gray-800">{user.profiles.email}</h2>
              <div className="flex gap-4">
                {user.profiles.email.toLowerCase() !== managerEmail && (
                  <>
                    <button onClick={() => handleEditUser(user)} className="text-blue-600" title="تعديل الصلاحيات"><Edit size={20}/></button>
                    <button onClick={() => handleDeleteUser(user)} className="text-red-600" title="حذف المستخدم"><Trash2 size={20}/></button>
                  </>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
                {user.permissions.filter(p => p.can_view).map((p: Permission) => ( // استخدام النوع الصحيح
                    // التأكد من وجود p.pages قبل الوصول إليه
                    p.pages && <span key={p.pages.id} className="bg-gray-200 text-gray-700 text-xs font-semibold px-2.5 py-0.5 rounded-full">{p.pages.name}</span>
                ))}
            </div>
          </div>
        ))}
      </div>
      
      {/* --- بداية التعديل --- */}
      {/* نعرض المكون فقط إذا كان isModalOpen صحيحاً و editingUser لديه قيمة */}
      {isModalOpen && editingUser && (
        <PermissionsModal 
          user={editingUser}
          allPages={allPages}
          onSaveSuccess={fetchData}
          onClose={() => setIsModalOpen(false)}
        />
      )}
      {/* --- نهاية التعديل --- */}
    </div>
  );
};