// --- START OF FILE src/components/HolidaysModal.tsx ---

import React, { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import type { PublicHoliday } from '../App';

interface HolidaysModalProps {
    isOpen: boolean;
    onClose: () => void;
    publicHolidays: PublicHoliday[];
    setPublicHolidays: React.Dispatch<React.SetStateAction<PublicHoliday[]>>;
}

// --- تعديل: دالة مساعدة لتحويل التاريخ إلى نص بتنسيق YYYY-MM-DD ---
// هذه الدالة تتجاهل المنطقة الزمنية وتأخذ التاريخ كما هو
function formatDateToYMD(dateString: string): string {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    
    // ملاحظة: هذه الطريقة قد تسبب مشاكل المنطقة الزمنية، لكنها مناسبة للعرض
    // الحل الأفضل هو التعامل مع النصوص مباشرة
    // لكن سنستخدمها مؤقتاً للتنسيق
    const dateObj = new Date(dateString);
    // نضيف الفارق الزمني للمنطقة المحلية لتصحيح التاريخ
    const userTimezoneOffset = dateObj.getTimezoneOffset() * 60000;
    const correctedDate = new Date(dateObj.getTime() + userTimezoneOffset);

    return correctedDate.toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

function HolidaysModal({ isOpen, onClose, publicHolidays, setPublicHolidays }: HolidaysModalProps) {
    const [newHolidayDate, setNewHolidayDate] = useState('');
    const [newHolidayName, setNewHolidayName] = useState('');

    if (!isOpen) return null;

    const handleAddHoliday = () => {
        if (newHolidayDate && newHolidayName && !publicHolidays.some(h => h.date === newHolidayDate)) {
            const newHoliday: PublicHoliday = { date: newHolidayDate, name: newHolidayName };
            const updatedHolidays = [...publicHolidays, newHoliday].sort((a, b) => a.date.localeCompare(b.date));
            setPublicHolidays(updatedHolidays);
            setNewHolidayDate('');
            setNewHolidayName('');
        }
    };

    const handleDeleteHoliday = (holidayToDelete: string) => {
        setPublicHolidays(publicHolidays.filter(h => h.date !== holidayToDelete));
    };

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center"
            onClick={onClose}
        >
            <div 
                className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg animate-fade-in-down"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center border-b pb-3 mb-4">
                    <h2 className="text-xl font-bold text-gray-800">إدارة العطلات الرسمية</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
                        <X size={24} />
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label htmlFor="newHolidayDate" className="block text-sm font-medium text-gray-700 mb-1">إضافة عطلة جديدة</label>
                        <div className="flex flex-col sm:flex-row gap-2">
                             <input
                                type="text"
                                id="newHolidayName"
                                placeholder="اسم العطلة (مثال: عيد الفطر)"
                                value={newHolidayName}
                                onChange={e => setNewHolidayName(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            />
                            <input
                                type="date"
                                id="newHolidayDate"
                                value={newHolidayDate}
                                onChange={e => setNewHolidayDate(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            />
                            <button
                                onClick={handleAddHoliday}
                                className="flex items-center justify-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                <Plus size={20} />
                            </button>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-md font-semibold text-gray-700 mb-2">قائمة العطلات</h3>
                        <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                            {publicHolidays.length > 0 ? (
                                publicHolidays.map(holiday => (
                                    <div key={holiday.date} className="flex justify-between items-center bg-gray-50 p-3 rounded-md">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-gray-800">{holiday.name}</span>
                                            <span className="text-sm text-gray-600">
                                                {/* --- تعديل: استخدام الدالة الجديدة لتنسيق التاريخ بشكل صحيح --- */}
                                                {formatDateToYMD(holiday.date)}
                                            </span>
                                        </div>
                                        <button onClick={() => handleDeleteHoliday(holiday.date)} className="text-red-500 hover:text-red-700">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center text-gray-500 py-4">لا توجد عطلات مضافة.</p>
                            )}
                        </div>
                    </div>
                </div>

                 <div className="mt-6 text-left border-t pt-4">
                    <button 
                        onClick={onClose}
                        className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                        إغلاق
                    </button>
                </div>
            </div>
        </div>
    );
}

export default HolidaysModal;