// --- START OF FILE src/components/HolidaysModal.tsx (كامل ومع دالة الحذف المكتملة) ---

import React, { useState } from 'react';
import { X, Plus, Trash2, Edit, Save } from 'lucide-react';
import { supabase } from '../supabaseClient.js';
import type { PublicHoliday } from '../types.ts';

interface HolidaysModalProps {
    isOpen: boolean;
    onClose: () => void;
    publicHolidays: PublicHoliday[];
    setPublicHolidays: React.Dispatch<React.SetStateAction<PublicHoliday[]>>;
    canEdit: boolean;
}

function formatDateForDisplay(dateString: string): string {
    const dateObj = new Date(dateString + 'T00:00:00Z');
    return dateObj.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
}

function HolidaysModal({ isOpen, onClose, publicHolidays, setPublicHolidays, canEdit }: HolidaysModalProps) {
    const [newHolidayDate, setNewHolidayDate] = useState<string>('');
    const [newHolidayName, setNewHolidayName] = useState<string>('');
    const [editingHolidayId, setEditingHolidayId] = useState<number | null>(null);

    if (!isOpen) return null;

    const handleEditClick = (holiday: PublicHoliday) => {
        setEditingHolidayId(holiday.id);
        setNewHolidayName(holiday.name);
        setNewHolidayDate(holiday.date);
    };

    const handleCancelEdit = () => {
        setEditingHolidayId(null);
        setNewHolidayName('');
        setNewHolidayDate('');
    };

    const handleSaveHoliday = async () => {
        if (!newHolidayDate || !newHolidayName) return;

        if (editingHolidayId) {
            // --- وضع التعديل ---
            const { data, error } = await supabase
                .from('public_holidays')
                .update({ name: newHolidayName, date: newHolidayDate })
                .eq('id', editingHolidayId)
                .select()
                .single();
            if (error) { alert('فشل تحديث العطلة.'); console.error(error); } 
            else {
                setPublicHolidays(publicHolidays.map(h => h.id === editingHolidayId ? data : h).sort((a, b) => a.date.localeCompare(b.date)));
            }
        } else {
            // --- وضع الإضافة ---
            if (publicHolidays.some(h => h.date === newHolidayDate)) {
                alert('هذا التاريخ مضاف بالفعل كعطلة.'); return;
            }
            const { data, error } = await supabase.from('public_holidays').insert({ name: newHolidayName, date: newHolidayDate }).select().single();
            if (error) { alert('فشل إضافة العطلة.'); console.error(error); } 
            else if (data) { // التأكد من أن data ليست null
                setPublicHolidays([...publicHolidays, data].sort((a, b) => a.date.localeCompare(b.date)));
            }
        }
        handleCancelEdit(); // مسح الفورم بعد الحفظ
    };

    // --- بداية التعديل: إكمال دالة الحذف ---
    const handleDeleteHoliday = async (holidayToDelete: PublicHoliday) => {
        if (window.confirm(`هل أنت متأكد من حذف عطلة "${holidayToDelete.name}"؟`)) {
            const { error } = await supabase
                .from('public_holidays')
                .delete()
                .eq('id', holidayToDelete.id);

            if (error) {
                alert('فشل حذف العطلة.');
                console.error('Error deleting holiday:', error);
            } else {
                setPublicHolidays(publicHolidays.filter(h => h.id !== holidayToDelete.id));
                alert('تم حذف العطلة بنجاح.');
            }
        }
    };
    // --- نهاية التعديل ---

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg animate-fade-in-down" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center border-b pb-3 mb-4">
                    <h2 className="text-xl font-bold">{editingHolidayId ? 'تعديل العطلة' : 'إدارة العطلات الرسمية'}</h2>
                    <button onClick={onClose}><X size={24} /></button>
                </div>
                <div className="space-y-4">
                    {canEdit && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{editingHolidayId ? 'تعديل بيانات العطلة' : 'إضافة عطلة جديدة'}</label>
                            <div className="flex flex-col sm:flex-row gap-2">
                                <input type="text" placeholder="اسم العطلة" value={newHolidayName} onChange={e => setNewHolidayName(e.target.value)} className="w-full border p-2 rounded" />
                                <input type="date" value={newHolidayDate} onChange={e => setNewHolidayDate(e.target.value)} className="w-full border p-2 rounded" />
                                <button onClick={handleSaveHoliday} className={`flex items-center justify-center text-white px-4 py-2 rounded-lg ${editingHolidayId ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
                                    {editingHolidayId ? <Save size={20} /> : <Plus size={20} />}
                                </button>
                                {editingHolidayId && <button onClick={handleCancelEdit} className="bg-gray-500 text-white px-4 py-2 rounded-lg"><X size={20} /></button>}
                            </div>
                        </div>
                    )}
                    <div>
                        <h3 className="text-md font-semibold text-gray-700 mb-2">قائمة العطلات</h3>
                        <div className="max-h-60 overflow-y-auto space-y-2 pr-2 border rounded-md p-2">
                            {publicHolidays.map((holiday: PublicHoliday) => (
                                <div key={holiday.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-md">
                                    <div><span className="font-bold">{holiday.name}</span><span className="text-sm text-gray-600 block">{formatDateForDisplay(holiday.date)}</span></div>
                                    {canEdit && (
                                        <div className="flex gap-3">
                                            <button onClick={() => handleEditClick(holiday)} className="text-blue-500 hover:text-blue-700"><Edit size={18} /></button>
                                            <button onClick={() => handleDeleteHoliday(holiday)} className="text-red-500 hover:text-red-700"><Trash2 size={18} /></button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                 <div className="mt-6 text-left border-t pt-4">
                    <button onClick={onClose} className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg">إغلاق</button>
                </div>
            </div>
        </div>
    );
}

export default HolidaysModal;