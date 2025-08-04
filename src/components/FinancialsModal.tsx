import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import type { Driver, FinancialItem } from '../types';
import { X } from 'lucide-react';

type FinancialsModalProps = {
  driver: Driver;
  periodKey: string;
  existingFinancials: FinancialItem[];
  onClose: () => void;
  onSaveSuccess: () => void;
};

export default function FinancialsModal({ driver, periodKey, existingFinancials, onClose, onSaveSuccess }: FinancialsModalProps) {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'extra' | 'deduction'>('extra');
  const [error, setError] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = parseFloat(amount);

    if (isNaN(numericAmount) || numericAmount <= 0) {
      setError('الرجاء إدخال مبلغ صحيح وأكبر من الصفر.');
      return;
    }
    if (!description.trim()) {
      setError('الرجاء إدخال وصف.');
      return;
    }

    setError('');

    const newFinancialItem = {
      driver_id: driver.id,
      period: periodKey,
      type: type,
      amount: numericAmount,
      description: description.trim(),
    };

    try {
      const { error: saveError } = await supabase.from('transport_financials').insert(newFinancialItem);

      if (saveError) {
        throw saveError;
      }

      alert('تم الحفظ بنجاح!');
      onSaveSuccess();
      onClose();

    } catch (err: any) {
      console.error("Error saving financial item:", err);
      setError(`فشل الحفظ: ${err.message}`);
    }
  };

  // --- START OF CORRECTION ---
  // تم تعديل الدالة للتعامل مع احتمالية أن يكون الـ ID غير موجود (احتياطياً)
  const handleDelete = async (itemId: number) => {
    if (window.confirm('هل أنت متأكد من حذف هذا البند؟')) {
      const { error: deleteError } = await supabase.from('transport_financials').delete().eq('id', itemId);
      if (deleteError) {
        alert('فشل الحذف.');
        console.error(deleteError);
      } else {
        alert('تم الحذف بنجاح.');
        onSaveSuccess();
      }
    }
  };
  // --- END OF CORRECTION ---

  const extras = existingFinancials.filter(f => f.type === 'extra');
  const deductions = existingFinancials.filter(f => f.type === 'deduction');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50" dir="rtl">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">الإدارة المالية للسائق: {driver.name}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800"><X size={24} /></button>
        </div>

        <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end p-4 border rounded-lg mb-6">
          <div className="md:col-span-2">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">الوصف</label>
            <input id="description" type="text" value={description} onChange={e => setDescription(e.target.value)} className="mt-1 w-full border p-2 rounded" />
          </div>
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700">المبلغ</label>
            <input id="amount" type="number" value={amount} onChange={e => setAmount(e.target.value)} className="mt-1 w-full border p-2 rounded" />
          </div>
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700">النوع</label>
            <select id="type" value={type} onChange={e => setType(e.target.value as 'extra' | 'deduction')} className="mt-1 w-full border p-2 rounded bg-white">
              <option value="extra">مستحق</option>
              <option value="deduction">خصم</option>
            </select>
          </div>
          <div className="md:col-span-4">
            <button type="submit" className="w-full bg-blue-600 text-white px-4 py-2 rounded">إضافة وحفظ</button>
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          </div>
        </form>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold mb-2 text-green-700">المستحقات الأخرى</h3>
            <ul className="space-y-2">
              {extras.map(item => (
                <li key={item.id} className="flex justify-between items-center bg-green-50 p-2 rounded">
                  <span>{item.description}</span>
                  <span className="font-bold">{item.amount}</span>
                  {/* --- START OF CORRECTION --- */}
                  <button onClick={() => { if (item.id) { handleDelete(item.id) } }} className="text-red-500 text-xs">حذف</button>
                  {/* --- END OF CORRECTION --- */}
                </li>
              ))}
              {extras.length === 0 && <li className="text-gray-500">لا يوجد</li>}
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2 text-red-700">الخصومات</h3>
            <ul className="space-y-2">
              {deductions.map(item => (
                <li key={item.id} className="flex justify-between items-center bg-red-50 p-2 rounded">
                  <span>{item.description}</span>
                  <span className="font-bold">{item.amount}</span>
                  {/* --- START OF CORRECTION --- */}
                  <button onClick={() => { if (item.id) { handleDelete(item.id) } }} className="text-red-500 text-xs">حذف</button>
                  {/* --- END OF CORRECTION --- */}
                </li>
              ))}
              {deductions.length === 0 && <li className="text-gray-500">لا يوجد</li>}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}