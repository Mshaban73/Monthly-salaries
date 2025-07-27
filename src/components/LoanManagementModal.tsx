// --- START OF FILE src/components/LoanManagementModal.tsx (مع إصلاح تاريخ النهاية) ---

import React, { useState, useMemo, useEffect } from 'react';
import { X, Edit, Trash2 } from 'lucide-react';
import { supabase } from '../supabaseClient.js';

const initialLoanFormState = { employee_id: '', total_amount: '', installments: '', start_date: '', description: '' };

export default function LoanManagementModal({ employees, loans, setLoans, onClose }) {
    const [loanData, setLoanData] = useState(initialLoanFormState);
    const [editingLoanId, setEditingLoanId] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isDropdownVisible, setIsDropdownVisible] = useState(false);

    const searchResults = useMemo(() => {
        if (!searchQuery) return [];
        return employees.filter(emp => emp.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }, [searchQuery, employees]);

    useEffect(() => {
        if (editingLoanId) {
            const employee = employees.find(e => e.id === Number(loanData.employee_id));
            if (employee) setSearchQuery(employee.name);
        }
    }, [editingLoanId, loanData.employee_id, employees]);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
        setLoanData(prev => ({ ...prev, employee_id: '' }));
        setIsDropdownVisible(true);
    };

    const handleSelectEmployee = (employee: any) => {
        setLoanData(prev => ({ ...prev, employee_id: employee.id.toString() }));
        setSearchQuery(employee.name);
        setIsDropdownVisible(false);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setLoanData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleEditClick = (loan: any) => {
        setEditingLoanId(loan.id);
        setLoanData({
            employee_id: loan.employee_id.toString(),
            total_amount: loan.total_amount.toString(),
            installments: loan.installments.toString(),
            start_date: loan.start_date,
            description: loan.description || '',
        });
    };

    const handleCancelEdit = () => {
        setEditingLoanId(null);
        setLoanData(initialLoanFormState);
        setSearchQuery('');
    };
    
    const handleSaveLoan = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!loanData.employee_id) { alert('الرجاء اختيار موظف.'); return; }
        
        const payload = { 
            employee_id: Number(loanData.employee_id), 
            total_amount: Number(loanData.total_amount), 
            installments: Number(loanData.installments), 
            start_date: loanData.start_date, 
            description: loanData.description 
        };

        if (editingLoanId) {
            const { data, error } = await supabase.from('loans').update(payload).eq('id', editingLoanId).select().single();
            if (error) { alert('فشل تحديث السلفة'); console.error(error); } 
            else { setLoans(prev => prev.map(l => l.id === editingLoanId ? data : l)); }
        } else {
            const { data, error } = await supabase.from('loans').insert(payload).select().single();
            if (error) { alert('فشل إضافة السلفة'); console.error(error); } 
            else { setLoans(prev => [...prev, data].sort((a,b) => a.start_date.localeCompare(b.start_date))); }
        }
        handleCancelEdit();
    };

    const handleDeleteLoan = async (loanId: number) => {
        if (window.confirm('هل أنت متأكد؟')) {
            const { error } = await supabase.from('loans').delete().eq('id', loanId);
            if (error) { alert('فشل حذف السلفة'); } 
            else { setLoans(prev => prev.filter(l => l.id !== loanId)); }
        }
    };

    // ▼▼▼ هذا هو الإصلاح لمنطق تاريخ النهاية ▼▼▼
    const getEndDate = (start: string, months: number): string => {
        if (!start || !months) return '-';
        const [year, month] = start.split('-').map(Number);
        const endDate = new Date(year, month - 1 + months - 1); // نطرح 1 لأن الشهور تبدأ من 0
        return `${endDate.getFullYear()}-${(endDate.getMonth() + 1).toString().padStart(2, '0')}`;
    };
    // ▲▲▲ نهاية الإصلاح ▲▲▲

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4" onClick={handleCancelEdit}>
            <div className="bg-white p-6 rounded-lg shadow-2xl w-full max-w-5xl flex flex-col h-[95vh] animate-fade-in-down" dir="rtl" onClick={e => e.stopPropagation()}>
                <div className="flex-shrink-0 flex justify-between items-center mb-4 border-b pb-3"><h2 className="text-2xl font-bold text-gray-800">إدارة السلف</h2><button onClick={onClose} className="text-gray-500 hover:text-gray-800"><X size={28} /></button></div>
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-hidden">
                    <div className="flex flex-col p-2 overflow-y-auto"><h3 className="text-xl font-semibold mb-4 text-gray-700 sticky top-0 bg-white pb-2">{editingLoanId ? 'تعديل السلفة' : 'إضافة سلفة جديدة'}</h3>
                        <form onSubmit={handleSaveLoan} className="space-y-4">
                            <div className="relative">
                                <label className="block text-sm font-medium">الموظف</label>
                                <input type="text" value={searchQuery} onChange={handleSearchChange} onFocus={() => setIsDropdownVisible(true)} placeholder="ابحث عن اسم الموظف..." autoComplete="off" className="w-full px-3 py-2 border rounded-md" />
                                {isDropdownVisible && searchResults.length > 0 && (
                                    <div className="absolute z-20 w-full bg-white border rounded-md mt-1 max-h-48 overflow-y-auto shadow-lg">{searchResults.map(emp => (<div key={emp.id} onClick={() => handleSelectEmployee(emp)} className="px-3 py-2 hover:bg-gray-100 cursor-pointer">{emp.name}</div>))}</div>
                                )}
                            </div>
                            <div><label>إجمالي مبلغ السلفة</label><input name="total_amount" type="number" value={loanData.total_amount} onChange={handleInputChange} required className="w-full px-3 py-2 border rounded-md"/></div>
                            <div><label>عدد أشهر السداد</label><input name="installments" type="number" value={loanData.installments} onChange={handleInputChange} required className="w-full px-3 py-2 border rounded-md"/></div>
                            <div><label>تاريخ بداية السداد</label><input name="start_date" type="month" value={loanData.start_date} onChange={handleInputChange} required className="w-full px-3 py-2 border rounded-md"/></div>
                            <div><label>وصف / ملاحظات</label><textarea name="description" value={loanData.description} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-md" rows={2}/></div>
                            <div className="flex gap-4 pt-2">
                                <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg">{editingLoanId ? 'حفظ التعديلات' : 'إضافة'}</button>
                                {editingLoanId && (<button type="button" onClick={handleCancelEdit} className="bg-gray-500 text-white px-6 py-2 rounded-lg">إلغاء</button>)}
                            </div>
                        </form>
                    </div>
                    <div className="flex flex-col min-h-0"><h3 className="text-xl font-semibold mb-4">قائمة السلف الحالية</h3>
                        <div className="flex-1 overflow-y-auto border rounded-md">
                            <table className="w-full text-sm"><thead className="bg-gray-100 sticky top-0 z-10"><tr><th className="p-2 text-right">الموظف</th><th className="p-2">المبلغ</th><th className="p-2">القسط</th><th className="p-2">البداية</th><th className="p-2">النهاية</th><th className="p-2">إجراءات</th></tr></thead>
                                <tbody>
                                    {loans.map(loan => { const empName = employees.find(e => e.id === loan.employee_id)?.name || 'غير معروف'; return (
                                        <tr key={loan.id} className="border-b hover:bg-gray-50">
                                            <td className="p-2 font-medium">{empName}</td><td className="p-2 text-center">{loan.total_amount.toLocaleString()}</td>
                                            <td className="p-2 text-center">{(loan.total_amount / loan.installments).toFixed(2)}</td>
                                            <td className="p-2 text-center">{loan.start_date}</td><td className="p-2 text-center">{getEndDate(loan.start_date, loan.installments)}</td>
                                            <td className="p-2 text-center flex justify-center gap-3">
                                                <button onClick={() => handleEditClick(loan)} className="text-blue-500 hover:text-blue-700"><Edit size={16} /></button>
                                                <button onClick={() => handleDeleteLoan(loan.id)} className="text-red-500 hover:text-red-700"><Trash2 size={16} /></button>
                                            </td>
                                        </tr>
                                    );})}
                                </tbody>
                            </table>
                            {loans.length === 0 && <p className="text-center text-gray-500 mt-8">لا توجد سلف مسجلة.</p>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}