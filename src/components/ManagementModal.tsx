// --- START OF FILE src/components/ManagementModal.tsx (كامل ومع الأنواع الصحيحة) ---

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../supabaseClient.js';
import type { Employee, BonusDeduction } from '../types.ts';

interface ManagementModalProps {
    employee: Employee;
    periodKey: string;
    existingRecord?: BonusDeduction;
    onClose: () => void;
    onSaveSuccess: (record: BonusDeduction) => void;
}

export default function ManagementModal({ employee, periodKey, existingRecord, onClose, onSaveSuccess }: ManagementModalProps) {
    const [bonus, setBonus] = useState<string>((existingRecord?.bonus_amount || 0).toString());
    const [deduction, setDeduction] = useState<string>((existingRecord?.deduction_amount || 0).toString());

    const handleSave = async () => {
        const recordToUpsert = {
            employee_id: employee.id,
            period: periodKey,
            bonus_amount: parseFloat(bonus) || 0,
            deduction_amount: parseFloat(deduction) || 0,
        };

        const { data, error } = await supabase
            .from('bonuses_deductions')
            .upsert(recordToUpsert, { onConflict: 'employee_id, period' })
            .select()
            .single();

        if (error) {
            alert('فشل حفظ البيانات.');
            console.error(error);
        } else {
            alert('تم الحفظ بنجاح.');
            onSaveSuccess(data);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-md animate-fade-in-down" dir="rtl">
                <div className="flex justify-between items-center mb-6">
                    {/* --- التعديل الأول هنا --- */}
                    <h2 className="text-2xl font-bold text-gray-800">إدارة المستحقات/المكافآت والخصومات</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800"><X size={28} /></button>
                </div>
                <p className="text-lg mb-6">الموظف: <span className="font-semibold text-blue-700">{employee.name}</span></p>
                <div className="space-y-6">
                    <div>
                        {/* --- التعديل الثاني هنا --- */}
                        <label className="block text-sm font-medium text-gray-700 mb-1">مستحقات - مكافآت (مبلغ)</label>
                        <input type="number" value={bonus} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBonus(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">الخصومات (مبلغ)</label>
                        <input type="number" value={deduction} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDeduction(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                    </div>
                </div>
                <div className="mt-8 flex justify-end gap-4">
                    <button onClick={onClose} className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-300">إلغاء</button>
                    <button onClick={handleSave} className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition">حفظ</button>
                </div>
            </div>
        </div>
    );
}