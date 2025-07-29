// --- START OF FILE src/components/PermissionsModal.tsx (النهائي - تعديل الصلاحيات فقط) ---

import React, { useState } from 'react';
import { X, Save } from 'lucide-react';
import { supabase } from '../supabaseClient.js';
import type { UserWithPermissions } from '../types.ts';

interface Page {
    id: number;
    name: string;
}

interface PermissionsModalProps {
    user: UserWithPermissions;
    allPages: Page[];
    onClose: () => void;
    onSaveSuccess: () => void;
}

export default function PermissionsModal({ user, allPages, onClose, onSaveSuccess }: PermissionsModalProps) {
    const [permissions, setPermissions] = useState(() => {
        const initialPerms: { [key: number]: { view: boolean; add: boolean; edit: boolean; delete: boolean; } } = {};
        allPages.forEach(page => {
            const existingPerm = user?.permissions?.find(p => p.pages.id === page.id);
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

    const togglePermission = (pageId: number, type: 'view' | 'add' | 'edit' | 'delete') => {
        setPermissions(prev => ({
            ...prev,
            [pageId]: { ...prev[pageId], [type]: !prev[pageId][type] }
        }));
    };

    const handleSubmit = async () => {
        setIsSaving(true);
        
        const permissionsToUpsert = allPages.map(page => ({
            profile_id: user.id,
            page_id: page.id,
            can_view: permissions[page.id].view,
            can_add: permissions[page.id].add,
            can_edit: permissions[page.id].edit,
            can_delete: permissions[page.id].delete,
        }));
        
        const { error } = await supabase.from('permissions').upsert(permissionsToUpsert, { onConflict: 'profile_id, page_id' });

        if (error) {
            alert(`فشل حفظ الصلاحيات: ${error.message}`);
        } else {
            alert('تم حفظ الصلاحيات بنجاح!');
            onSaveSuccess();
            onClose();
        }
        setIsSaving(false);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white p-6 rounded-lg shadow-2xl w-full max-w-2xl flex flex-col h-auto" dir="rtl">
                <div className="flex-shrink-0 flex justify-between items-center mb-4 border-b pb-3">
                    <h2 className="text-2xl font-bold">تعديل صلاحيات: {user.profiles.email}</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800"><X size={28} /></button>
                </div>
                <div className="flex-1 overflow-y-auto pr-2">
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