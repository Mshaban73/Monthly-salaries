import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

interface Page {
  id: number;
  name: string;
}

interface Permission {
  page_id: number;
  can_view: boolean;
  can_add: boolean;
  can_edit: boolean;
  can_delete: boolean;
}

interface UserPermissions {
  email: string;
  id: string;
  permissions: Permission[];
}

const managerEmail = 'info@thinksolutioneg.com';

const UserPermissionsPage: React.FC = () => {
  const [users, setUsers] = useState<UserPermissions[]>([]);
  const [pages, setPages] = useState<Page[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchPages();
  }, []);

  useEffect(() => {
    if (pages.length > 0) fetchUsers();
  }, [pages]);

  const fetchPages = async () => {
    const { data, error } = await supabase.from('pages').select('*').order('id');
    if (error) {
      console.error('فشل تحميل الصفحات:', error.message);
    }
    if (data) setPages(data);
  };

  const fetchUsers = async () => {
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id,email');

    const { data: permissions, error: permError } = await supabase
      .from('permissions')
      .select('*');

    if (profilesError) {
      console.error('❌ خطأ في تحميل profiles:', profilesError.message);
      return;
    }

    if (permError) {
      console.error('❌ خطأ في تحميل permissions:', permError.message);
      return;
    }

    if (!profiles || !permissions) return;

    const userList: UserPermissions[] = profiles.map(profile => ({
      id: profile.id,
      email: profile.email,
      permissions: pages.map(p => {
        const match = permissions.find(
          perm => perm.page_id === p.id && perm.profile_id === profile.id
        );
        return {
          page_id: p.id,
          can_view: match?.can_view || false,
          can_add: match?.can_add || false,
          can_edit: match?.can_edit || false,
          can_delete: match?.can_delete || false,
        };
      }),
    }));

    console.log('✅ المستخدمين المحمّلين:', userList);
    setUsers(userList);
  };

  const addUser = async () => {
    const email = newEmail.trim().toLowerCase();
    const password = newPassword.trim();
    setErrorMessage('');
    setSuccessMessage('');

    if (!email || !password) {
      setErrorMessage('يرجى إدخال البريد وكلمة المرور.');
      return;
    }

    if (email === managerEmail) {
      setErrorMessage('لا يمكن إضافة المدير العام للنظام.');
      return;
    }

    const { data: newUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError || !newUser?.user?.id) {
      setErrorMessage('فشل في إنشاء المستخدم الجديد: ' + authError?.message);
      return;
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .insert([{
        id: newUser.user.id,
        email,
        username: email.split('@')[0],
        full_name: '',
        avatar_url: ''
      }]);

    if (profileError) {
      setErrorMessage('تم إنشاء المستخدم لكن فشل حفظ بياناته في profiles.');
      return;
    }

    const newPermissions: UserPermissions = {
      id: newUser.user.id,
      email,
      permissions: pages.map(p => ({
        page_id: p.id,
        can_view: false,
        can_add: false,
        can_edit: false,
        can_delete: false,
      })),
    };

    setUsers(prev => [...prev, newPermissions]);
    setNewEmail('');
    setNewPassword('');
    setSuccessMessage('✅ تم إنشاء المستخدم بنجاح.');
  };

  const deleteUser = async (userId: string, email: string) => {
    if (email === managerEmail) return;

    await supabase.from('permissions').delete().eq('profile_id', userId);
    await supabase.from('profiles').delete().eq('id', userId);
    await supabase.auth.admin.deleteUser(userId);

    setUsers(prev => prev.filter(u => u.id !== userId));
  };

  const togglePermission = (profileId: string, pageId: number, key: keyof Permission) => {
    setUsers(prev => prev.map(user => {
      if (user.id !== profileId) return user;
      return {
        ...user,
        permissions: user.permissions.map(p =>
          p.page_id === pageId ? { ...p, [key]: !p[key] } : p
        )
      };
    }));
  };

  const savePermissions = async (user: UserPermissions) => {
    const promises = user.permissions.map(p =>
      supabase.from('permissions').upsert({
        profile_id: user.id,
        page_id: p.page_id,
        can_view: p.can_view,
        can_add: p.can_add,
        can_edit: p.can_edit,
        can_delete: p.can_delete,
      }, {
        onConflict: 'profile_id,page_id'
      })
    );
    await Promise.all(promises);
    alert('✅ تم حفظ الصلاحيات بنجاح.');
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">إدارة المستخدمين والصلاحيات</h1>

      <div className="mb-6 flex flex-col gap-2">
        <input
          className="border p-2 rounded w-64"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          placeholder="البريد الإلكتروني"
        />
        <input
          className="border p-2 rounded w-64"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="كلمة المرور"
        />
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded w-fit"
          onClick={addUser}
        >
          ➕ إضافة مستخدم جديد
        </button>
        {errorMessage && <p className="text-red-600">{errorMessage}</p>}
        {successMessage && <p className="text-green-600">{successMessage}</p>}
      </div>

      {users.length === 0 ? (
        <p className="text-red-600 mt-4">⚠️ لم يتم العثور على مستخدمين حتى الآن.</p>
      ) : (
        users.map(user => (
          <div key={user.email} className="mb-6 border rounded p-4 bg-white shadow">
            <div className="flex justify-between items-center mb-2">
              <h2 className="font-bold text-lg">المستخدم: {user.email}</h2>
              {user.email !== managerEmail && (
                <button
                  className="text-red-600 text-sm underline"
                  onClick={() => deleteUser(user.id, user.email)}
                >
                  🗑 حذف المستخدم
                </button>
              )}
            </div>
            <table className="w-full text-sm border">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2 border">الصفحة</th>
                  <th className="p-2 border">تصفح</th>
                  <th className="p-2 border">إضافة</th>
                  <th className="p-2 border">تعديل</th>
                  <th className="p-2 border">حذف</th>
                </tr>
              </thead>
              <tbody>
                {pages.map(page => {
                  const perm = user.permissions.find(p => p.page_id === page.id);
                  return (
                    <tr key={page.id}>
                      <td className="p-2 border font-bold">{page.name}</td>
                      <td className="p-2 border text-center">
                        <input
                          type="checkbox"
                          checked={perm?.can_view || false}
                          onChange={() => togglePermission(user.id, page.id, 'can_view')}
                        />
                      </td>
                      <td className="p-2 border text-center">
                        <input
                          type="checkbox"
                          checked={perm?.can_add || false}
                          onChange={() => togglePermission(user.id, page.id, 'can_add')}
                        />
                      </td>
                      <td className="p-2 border text-center">
                        <input
                          type="checkbox"
                          checked={perm?.can_edit || false}
                          onChange={() => togglePermission(user.id, page.id, 'can_edit')}
                        />
                      </td>
                      <td className="p-2 border text-center">
                        <input
                          type="checkbox"
                          checked={perm?.can_delete || false}
                          onChange={() => togglePermission(user.id, page.id, 'can_delete')}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {user.email !== managerEmail && (
              <button
                className="mt-3 bg-green-600 text-white px-4 py-1 rounded"
                onClick={() => savePermissions(user)}
              >
                💾 حفظ الصلاحيات
              </button>
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default UserPermissionsPage;
