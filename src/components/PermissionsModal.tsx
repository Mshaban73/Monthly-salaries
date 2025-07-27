// --- START OF FILE src/components/PermissionsModal.tsx (النهائي بالكامل - مع كل الميزات) ---

import React, { useState } from 'react';
import { X, Save } from 'lucide-react';
import { supabase } from '../supabaseClient.js';

export default function PermissionsModal({ user, allPages, onClose, onSaveSuccess }) {
    const [userData, setUserData] = useState({ email: '', password: '' });
    const [permissions, setPermissions] = useState(() => {
        const initialPerms = {};
        allPages.forEach(page => {
            const existingPerm = user?.permissions?.find(p => p.page_id === page.id);
            initialPerms[page.id] = {
                view: existingPerm?.can_view || false,
                add: existingPerm?.can_add || false,
                edit: existingPerm?.can_edit || false,
                delete: existingPerm?.can_delete || false,
            };
        });
        return initialPerms;
    });
    const [isSaving, setIsSaving] = useState(false);
    const isNewUser = !user;

    const handleUserChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setUserData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const togglePermission = (pageId: number, type: string) => {
        setPermissions(prev => ({
            ...prev,
            [pageId]: { ...prev[pageId], [type]: !prev[pageId][type] }
        }));
    };

    const handleSubmit = async () => {
        setIsSaving(true);
        let userId = user?.id;
        let newUserEmail = '';

        if (isNewUser) {
            if (!userData.email || !userData.password) {
                alert('الرجاء إدخال الإيميل وكلمة المرور.');
                setIsSaving(false);
                return;
            }
            
            try {
                const { data, error } = await supabase.functions.invoke('create-user', {
                    body: { email: userData.email, password: userData.password }
                });
                if (error) throw error;
                if (data.error) throw new Error(data.error);
                userId = data.user.id;
                newUserEmail = data.user.email;
            } catch (err) {
                alert(`فشل إنشاء المستخدم: ${err.message}`);
                setIsSaving(false);
                return;
            }
        } else if (userData.password) {
            const { error } = await supabase.auth.admin.updateUserById(userId, { password: userData.password });
            if (error) { alert(`فشل تحديث كلمة المرور: ${error.message}`); }
        }

        if (!userId) {
            alert('حدث خطأ غير متوقع.');
            setIsSaving(false);
            return;
        }
        
        const permissionsToUpsert = allPages.map(page => ({
            profile_id: userId,
            page_id: page.id,
            can_view: permissions[page.id].view,
            can_add: permissions[page.id].add,
            can_edit: permissions[page.id].edit,
            can_delete: permissions[page.id].delete,
        }));
        
        const { error: permError } = await supabase.from('permissions').upsert(permissionsToUpsert, { onConflict: 'profile_id, page_id' });

        if (permError) {
            alert(`فشل حفظ الصلاحيات: ${permError.message}`);
            if (isNewUser && userId) {
                await supabase.auth.admin.deleteUser(userId);
                alert(`تم التراجع عن إنشاء المستخدم "${newUserEmail}".`);
            }
        } else {
            alert('تم حفظ البيانات بنجاح!');
            onSaveSuccess();
            onClose();
        }
        setIsSaving(false);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white p-6 rounded-lg shadow-2xl w-full max-w-3xl flex flex-col h-[95vh]" dir="rtl">
                <div className="flex-shrink-0 flex justify-between items-center mb-4 border-b pb-3">
                    <h2 className="text-2xl font-bold">{isNewUser ? 'إضافة مستخدم جديد' : `تعديل صلاحيات: ${user.profiles.email}`}</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800"><X size={28} /></button>
                </div>
                <div className="flex-1 overflow-y-auto pr-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">البريد الإلكتروني</label><input name="email" value={isNewUser ? userData.email : user.profiles.email} onChange={handleUserChange} className="w-full border p-2 rounded-md" disabled={!isNewUser} /></div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">كلمة المرور</label><input name="password" type="password" onChange={handleUserChange} className="w-full border p-2 rounded-md" placeholder={isNewUser ? "كلمة مرور جديدة" : "اتركه فارغاً لعدم التغيير"} /></div>
                    </div>
                    <h3 className="text-lg font-semibold mb-2">صلاحيات الصفحات</h3>
                    <table className="w-full text-sm border">
                        <thead className="bg-gray-100"><tr><th className="p-2 border text-right">الصفحة</th><th className="p-2 border">تصفح</th><th className="p-2 border">إضافة</th><th className="p-2 border">تعديل</th><th className="p-2 border">حذف</th></tr></thead>
                        <tbody>
                            {allPages.map(page => (
                                <tr key={page.id}>
                                    <td className="p-2 border font-bold">{page.name}</td>
                                    <td className="p-2 border text-center"><input className="h-5 w-5" type="checkbox" checked={permissions[page.id]?.view} onChange={() => togglePermission(page.id, 'view')} /></td>
                                    <td className="p-2 border text-center"><input className="h-5 w-5" type="checkbox" checked={permissions[page.id]?.add} onChange={() => togglePermission(page.id, 'add')} /></td>
                                    <td className="p-2 border text-center"><input className="h-5 w-5" type="checkbox" checked={permissions[page.id]?.edit} onChange={() => togglePermission(page.id, 'edit')} /></td>
                                    <td className="p-2 border text-center"><input className="h-5 w-5" type="checkbox" checked={permissions[page.id]?.delete} onChange={() => togglePermission(page.id, 'delete')} /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="flex-shrink-0 flex justify-end gap-4 mt-4 border-t pt-4">
                    <button onClick={onClose} className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg" disabled={isSaving}>إلغاء</button>
                    <button onClick={handleSubmit} className="bg-green-600 text-white px-6 py-2 rounded-lg flex items-center" disabled={isSaving}>
                        {isSaving ? 'جاري الحفظ...' : <><Save size={18} className="ml-2"/>حفظ</>}
                    </button>
                </div>
            </div>
        </div>
    );
}