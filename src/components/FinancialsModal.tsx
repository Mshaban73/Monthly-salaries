// --- START OF FILE src/components/FinancialsModal.tsx (النهائي والمصحح تماماً) ---

import React, { useState } from 'react';
import { X, PlusCircle, Trash2, Save } from 'lucide-react';
import { supabase } from '../supabaseClient.js';
import type { Driver, FinancialItem } from '../types.ts';

// --- FinancialSection Component ---
interface FinancialSectionProps {
    title: string;
    items: FinancialItem[];
    setItems: React.Dispatch<React.SetStateAction<FinancialItem[]>>;
    color: 'green' | 'red';
    driverId: number;   // <-- إضافة
    periodKey: string;  // <-- إضافة
}
function FinancialSection({ title, items, setItems, color, driverId, periodKey }: FinancialSectionProps) {
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');

    const handleAddItem = () => {
        if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) { alert('الرجاء إدخال مبلغ صحيح.'); return; }
        // --- بداية التعديل: إضافة الخصائص المفقودة ---
        const newItem: FinancialItem = { 
            id: Date.now(), // Temporary ID
            amount: Number(amount), 
            description: description, 
            type: color === 'green' ? 'extra' : 'deduction',
            driver_id: driverId, // <-- تم إضافته
            period: periodKey,   // <-- تم إضافته
        };
        // --- نهاية التعديل ---
        setItems((prev: FinancialItem[]) => [...prev, newItem]);
        setAmount(''); setDescription('');
    };
    
    const handleDeleteItem = (id: number) => { setItems((prev: FinancialItem[]) => prev.filter(item => item.id !== id)); };
    const total = items.reduce((sum, item) => sum + item.amount, 0);

    return (
        <div className="flex flex-col min-h-0 border rounded-lg p-4 bg-gray-50">
            <h3 className={`text-xl font-semibold mb-4 text-${color}-600`}>{title}</h3>
            <div className="flex items-end gap-2 mb-4">
                <div className="flex-grow"><label className="text-xs">المبلغ</label><input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="w-full p-2 border rounded-md" /></div>
                <div className="flex-grow"><label className="text-xs">البيان</label><input type="text" value={description} onChange={e => setDescription(e.target.value)} className="w-full p-2 border rounded-md" /></div>
                <button onClick={handleAddItem} className={`bg-${color}-500 text-white p-2 rounded-md hover:bg-${color}-600 shrink-0`}><PlusCircle/></button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 border-t pt-2">
                {items.map(item => (
                    <div key={item.id} className="flex items-center justify-between bg-white p-2 rounded shadow-sm">
                        <span className="flex-1 text-sm">{item.description || 'بدون بيان'}</span>
                        <span className="font-semibold mx-4">{item.amount.toLocaleString()}</span>
                        <button onClick={() => handleDeleteItem(item.id!)} className="text-gray-400 hover:text-red-600"><Trash2 size={16}/></button>
                    </div>
                ))}
                {items.length === 0 && <p className="text-center text-gray-400 pt-4">لا توجد بنود.</p>}
            </div>
            <div className={`mt-4 pt-2 border-t font-bold text-lg text-right text-${color}-600`}>الإجمالي: {total.toLocaleString()}</div>
        </div>
    );
}

// --- Main Modal Component ---
interface FinancialsModalProps {
    driver: Driver;
    periodKey: string;
    existingFinancials: FinancialItem[];
    onClose: () => void;
    onSaveSuccess: () => void;
}
export default function FinancialsModal({ driver, periodKey, existingFinancials, onClose, onSaveSuccess }: FinancialsModalProps) {
    const [extras, setExtras] = useState<FinancialItem[]>(existingFinancials.filter(f => f.type === 'extra'));
    const [deductions, setDeductions] = useState<FinancialItem[]>(existingFinancials.filter(f => f.type === 'deduction'));

    const handleSave = async () => {
        const { error: deleteError } = await supabase.from('transport_financials')
            .delete()
            .eq('driver_id', driver.id)
            .eq('period', periodKey);

        if (deleteError) {
            alert('فشل تحديث البيانات المالية.');
            console.error(deleteError);
            return;
        }

        const extrasToInsert = extras.map(e => ({ driver_id: driver.id, period: periodKey, type: 'extra' as const, amount: e.amount, description: e.description }));
        const deductionsToInsert = deductions.map(d => ({ driver_id: driver.id, period: periodKey, type: 'deduction' as const, amount: d.amount, description: d.description }));
        const allItemsToInsert = [...extrasToInsert, ...deductionsToInsert];

        if (allItemsToInsert.length > 0) {
            const { error: insertError } = await supabase.from('transport_financials').insert(allItemsToInsert);
            if (insertError) {
                alert('فشل حفظ البيانات المالية.');
                console.error(insertError);
                return;
            }
        }
        
        alert('تم الحفظ بنجاح!');
        onSaveSuccess();
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white p-6 rounded-lg shadow-2xl w-full max-w-4xl flex flex-col h-[90vh]" dir="rtl">
                <div className="flex-shrink-0 flex justify-between items-center mb-4 border-b pb-3"><h2 className="text-2xl font-bold text-gray-800">إدارة مالية للسائق: {driver.name}</h2><button onClick={onClose} className="text-gray-500 hover:text-gray-800"><X size={28} /></button></div>
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-hidden">
                    <FinancialSection title="مستحقات أخرى" items={extras} setItems={setExtras} color="green" driverId={driver.id} periodKey={periodKey} />
                    <FinancialSection title="خصومات" items={deductions} setItems={setDeductions} color="red" driverId={driver.id} periodKey={periodKey} />
                </div>
                <div className="flex-shrink-0 mt-6 text-left border-t pt-4"><button onClick={handleSave} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center"><Save className="mr-2"/>حفظ التغييرات</button></div>
            </div>
        </div>
    );
}