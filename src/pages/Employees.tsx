// --- START OF FILE src/pages/Employees.tsx (كامل ومُعدَّل لدعم القراءة أوفلاين) ---

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { PlusCircle, Trash2, Edit, Search, FileDown, FileUp, CheckCircle, XCircle, Loader } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useAuth } from '../context/AuthContext.tsx';
import { supabase } from '../supabaseClient.js';
import { Employee, Allowance } from '../types.ts';
import { useLiveQuery } from 'dexie-react-hooks'; // <-- 1. استيراد hook جديد
import { db } from '../db.ts'; // <-- 2. استيراد قاعدة البيانات المحلية

// --- 3. دالة جديدة لمزامنة بيانات الموظفين ---
const syncEmployees = async () => {
  try {
    console.log('Attempting to sync employees from Supabase...');
    const { data, error } = await supabase.from('employees').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    
    // حفظ البيانات المحدثة في قاعدة البيانات المحلية (Dexie)
    await db.employees.bulkPut(data || []);
    console.log('Employees sync successful!');
    return { success: true };
  } catch (error) {
    console.error('Employees sync failed, app is likely offline.', error);
    return { success: false };
  }
};

interface FormData {
    name: string; jobTitle: string; workLocation: string;
    salaryType: 'شهري' | 'يومي'; salaryAmount: string; paymentSource: string;
    restDays: string[]; hoursPerDay: string; isHeadOffice: boolean;
    transportAmount: string; transportType: 'شهري' | 'يومي';
    expatriationAmount: string; expatriationType: 'شهري' | 'يومي';
    mealAmount: string; mealType: 'شهري' | 'يومي';
    housingAmount: string; housingType: 'شهري' | 'يومي';
    isActive: boolean;
}

const initialFormState: FormData = { name: '', jobTitle: '', workLocation: 'الادارة', salaryType: 'شهري', salaryAmount: '', paymentSource: '', restDays: ['الجمعة'], hoursPerDay: '8', isHeadOffice: true, transportAmount: '', transportType: 'شهري', expatriationAmount: '', expatriationType: 'شهري', mealAmount: '', mealType: 'شهري', housingAmount: '', housingType: 'شهري', isActive: true, };
const weekDays = ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];
const inputStyles = "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500";
const selectStyles = `${inputStyles} bg-white`;

export default function Employees() {
  const { can } = useAuth();
  // --- 4. تعديل جلب البيانات ليقرأ من Dexie ---
  const employees = useLiveQuery(() => db.employees.orderBy('created_at').reverse().toArray(), []);
  
  const [loading, setLoading] = useState(true);
  const [employeeData, setEmployeeData] = useState<FormData>(initialFormState);
  const [showForm, setShowForm] = useState(false);
  const [editingEmployeeId, setEditingEmployeeId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- 5. تعديل useEffect ليقوم بالمزامنة مرة واحدة ---
  useEffect(() => {
    const runInitialSync = async () => {
      if (!can('view', 'Employees')) { setLoading(false); return; } 
      setLoading(true);
      await syncEmployees();
      setLoading(false);
    };
    runInitialSync();
  }, [can]);

  const filteredEmployees = useMemo(() => { if (!employees) return []; return employees.filter(emp => emp.name.toLowerCase().includes(searchTerm.toLowerCase())); }, [employees, searchTerm]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => { 
      const { name, value, type } = e.target; 
      const isCheckbox = type === 'checkbox'; 
      const checked = (e.target as HTMLInputElement).checked; 
      setEmployeeData(prev => ({ ...prev, [name]: isCheckbox ? checked : value })); 
  };
  
  const handleRestDayChange = (day: string) => { 
      const { restDays } = employeeData; 
      const updatedRestDays = restDays.includes(day) ? restDays.filter((d) => d !== day) : [...restDays, day]; 
      setEmployeeData({ ...employeeData, restDays: updatedRestDays }); 
  };
  
  const handleAddNew = () => { 
      setEditingEmployeeId(null); 
      setEmployeeData(initialFormState); 
      setShowForm(true); 
  };
  
  const handleEdit = (emp: Employee) => { 
      setEditingEmployeeId(emp.id); 
      setEmployeeData({ 
          name: emp.name || '', 
          jobTitle: emp.job_title || '', 
          workLocation: emp.work_location || '', 
          salaryType: emp.salary_type || 'شهري', 
          salaryAmount: (emp.salary_amount || '').toString(), 
          paymentSource: emp.payment_source || '', 
          restDays: emp.rest_days || ['الجمعة'], 
          hoursPerDay: (emp.hours_per_day || '8').toString(), 
          isHeadOffice: emp.is_head_office === true, 
          isActive: emp.is_active !== false, 
          transportAmount: (emp.transport_allowance?.amount || '').toString(), 
          transportType: emp.transport_allowance?.type || 'شهري', 
          expatriationAmount: (emp.expatriation_allowance?.amount || '').toString(), 
          expatriationType: emp.expatriation_allowance?.type || 'شهري', 
          mealAmount: (emp.meal_allowance?.amount || '').toString(), 
          mealType: emp.meal_allowance?.type || 'شهري', 
          housingAmount: (emp.housing_allowance?.amount || '').toString(), 
          housingType: emp.housing_allowance?.type || 'شهري', 
      }); 
      setShowForm(true); 
  };

  const handleCancel = () => { 
      setShowForm(false); 
      setEditingEmployeeId(null); 
      setEmployeeData(initialFormState); 
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // (المرحلة 3) - هذا سيعمل أونلاين فقط حالياً، وسنعدله لاحقاً
    const trimmedName = employeeData.name.trim();
    if (!trimmedName) { alert('الرجاء إدخال اسم الموظف.'); return; }

    const isNameExists = (employees || []).some(emp => emp.name.toLowerCase() === trimmedName.toLowerCase() && emp.id !== editingEmployeeId);
    if (isNameExists) {
        alert('هذا الاسم موجود بالفعل. الرجاء إدخال اسم مختلف.');
        return;
    }

    const createAllowance = (amountStr: string, type: 'شهري' | 'يومي'): Allowance | undefined => { const amount = parseFloat(amountStr); return !isNaN(amount) && amount > 0 ? { amount, type } : undefined; };
    const submissionPayload = { name: trimmedName, job_title: employeeData.jobTitle, work_location: employeeData.workLocation, salary_type: employeeData.salaryType, salary_amount: parseFloat(employeeData.salaryAmount) || 0, payment_source: employeeData.paymentSource, hours_per_day: parseFloat(employeeData.hoursPerDay) || 8, rest_days: employeeData.restDays, is_head_office: employeeData.isHeadOffice, is_active: employeeData.isActive, transport_allowance: createAllowance(employeeData.transportAmount, employeeData.transportType), expatriation_allowance: createAllowance(employeeData.expatriationAmount, employeeData.expatriationType), meal_allowance: createAllowance(employeeData.mealAmount, employeeData.mealType), housing_allowance: createAllowance(employeeData.housingAmount, employeeData.housingType), };
    
    if (editingEmployeeId) {
      if (!can('edit', 'Employees')) { alert('ليس لديك صلاحية للتعديل.'); return; }
      const { data, error } = await supabase.from('employees').update(submissionPayload).eq('id', editingEmployeeId).select().single();
      if (error) { alert(`فشل تحديث الموظف. الخطأ: ${error.message}`); console.error(error); } 
      else { await db.employees.put(data); }
    } else {
      if (!can('add', 'Employees')) { alert('ليس لديك صلاحية للإضافة.'); return; }
      const { data, error } = await supabase.from('employees').insert(submissionPayload).select().single();
      if (error) { alert(`فشل إضافة الموظف. الخطأ: ${error.message}`); console.error(error); } 
      else if (data) { await db.employees.put(data); }
    }
    handleCancel();
  };
  
  const handleDelete = async (id: number) => { 
      // (المرحلة 3) - هذا سيعمل أونلاين فقط حالياً، وسنعدله لاحقاً
      if (!can('delete', 'Employees')) { alert('ليس لديك صلاحية للحذف.'); return; } 
      if (window.confirm('هل أنت متأكد من حذف هذا الموظف؟')) { 
          const { error } = await supabase.from('employees').delete().eq('id', id); 
          if (error) { alert('فشل حذف الموظف.'); console.error(error); } 
          else { await db.employees.delete(id); } 
      } 
  };
  
  const handleExport = () => {
    if (filteredEmployees.length === 0) { alert("لا توجد بيانات لتصديرها."); return; }
    const dataToExport = filteredEmployees.map((emp: Employee) => ({ 'الاسم': emp.name, 'الوظيفة': emp.job_title, 'موقع العمل': emp.work_location, 'نوع الراتب': emp.salary_type, 'قيمة الراتب': emp.salary_amount, 'جهة الصرف': emp.payment_source, 'ساعات العمل اليومية': emp.hours_per_day, 'يعمل في الإدارة': emp.is_head_office ? 'نعم' : 'لا', 'حالة الموظف': emp.is_active ? 'نشط' : 'غير نشط', 'بدل انتقالات': emp.transport_allowance?.amount || 0, 'نوع بدل الانتقالات': emp.transport_allowance?.type || '', 'بدل اغتراب': emp.expatriation_allowance?.amount || 0, 'نوع بدل الاغتراب': emp.expatriation_allowance?.type || '', 'بدل وجبة': emp.meal_allowance?.amount || 0, 'نوع بدل الوجبة': emp.meal_allowance?.type || '', 'بدل سكن': emp.housing_allowance?.amount || 0, 'نوع بدل السكن': emp.housing_allowance?.type || '', 'أيام الراحة': (emp.rest_days || []).join(', '), }));
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "الموظفين");
    XLSX.writeFile(wb, "employees_export.xlsx");
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e: ProgressEvent<FileReader>) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet) as any[];
        const createAllowance = (amount: number, type: string): Allowance | undefined => (amount > 0 ? { amount, type: type === 'يومي' ? 'يومي' : 'شهري' } : undefined);
        const employeesToInsert = json.map(row => ({ name: row['الاسم'] || '', job_title: row['الوظيفة'] || '', work_location: row['موقع العمل'] || 'غير محدد', salary_type: row['نوع الراتب'] === 'يومي' ? 'يومي' : 'شهري', salary_amount: Number(row['قيمة الراتب']) || 0, payment_source: row['جهة الصرف'] || '', hours_per_day: Number(row['ساعات العمل اليومية']) || 8, is_head_office: row['يعمل في الإدارة'] === 'نعم', is_active: row['حالة الموظف'] !== 'غير نشط', transport_allowance: createAllowance(Number(row['بدل انتقالات']), row['نوع بدل الانتقالات']), expatriation_allowance: createAllowance(Number(row['بدل اغتراب']), row['نوع بدل الاغتراب']), meal_allowance: createAllowance(Number(row['بدل وجبة']), row['نوع بدل الوجبة']), housing_allowance: createAllowance(Number(row['بدل سكن']), row['نوع بدل السكن']), rest_days: (row['أيام الراحة'] || '').split(',').map((d:string) => d.trim()).filter(Boolean), })).filter(emp => emp.name);
        if (employeesToInsert.length > 0 && window.confirm(`تم العثور على ${employeesToInsert.length} موظف. هل تريد إضافتهم إلى قاعدة البيانات؟`)) {
          const { error } = await supabase.from('employees').insert(employeesToInsert);
          if (error) { throw error; }
          alert('تم استيراد الموظفين بنجاح!');
          await syncEmployees(); // إعادة المزامنة بعد الاستيراد
        }
      } catch (error: any) { alert(`فشل استيراد الملف. تأكد أن أعمدة الملف تطابق النموذج وأن الأسماء غير مكررة. الخطأ: ${error.message}`); console.error("Import error:", error); } 
      finally { if(fileInputRef.current) fileInputRef.current.value = ""; }
    };
    reader.readAsArrayBuffer(file);
  };

  if (loading && !employees?.length) { return <div className="flex justify-center items-center h-64"><Loader className="animate-spin text-blue-500" size={48} /></div>; }
  if (!can('view', 'Employees')) { return <div className="text-center p-8 bg-yellow-100 text-yellow-800 rounded-lg"><h1 className="text-2xl font-bold">صفحة الموظفين</h1><p className="mt-2">ليس لديك صلاحية لعرض هذه الصفحة.</p></div>; }
  
  return (
    <div className="p-4 md:p-6" dir="rtl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">إدارة الموظفين</h2>
        <div>
          {can('add', 'Employees') && !showForm && ( <button onClick={handleAddNew} className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 shadow"><PlusCircle size={20} className="ml-2" />إضافة موظف</button> )}
          {showForm && ( <button onClick={handleCancel} className="flex items-center bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 shadow">إلغاء</button> )}
        </div>
      </div>
      {showForm && ( <div className="bg-white p-8 rounded-lg shadow-md mb-6 animate-fade-in-down"> <h3 className="text-2xl font-bold mb-6 text-gray-700">{editingEmployeeId ? 'تعديل بيانات الموظف' : 'إضافة موظف جديد'}</h3> <form onSubmit={handleSubmit}> <div className="space-y-4"> <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"> <div><label className="block text-sm font-medium text-gray-700 mb-1">اسم الموظف</label><input name="name" value={employeeData.name} onChange={handleInputChange} className={inputStyles} required /></div> <div><label className="block text-sm font-medium text-gray-700 mb-1">الوظيفة</label><input name="jobTitle" value={employeeData.jobTitle} onChange={handleInputChange} className={inputStyles} required /></div> <div><label className="block text-sm font-medium text-gray-700 mb-1">موقع العمل</label><input name="workLocation" value={employeeData.workLocation} onChange={handleInputChange} className={inputStyles} /></div> <div><label className="block text-sm font-medium text-gray-700 mb-1">نوع الراتب</label><select name="salaryType" value={employeeData.salaryType} onChange={handleInputChange} className={selectStyles}><option value="شهري">شهري</option><option value="يومي">يومي</option></select></div> <div><label className="block text-sm font-medium text-gray-700 mb-1">الراتب / فئة اليوم</label><input name="salaryAmount" type="number" value={employeeData.salaryAmount} onChange={handleInputChange} className={inputStyles} required /></div> <div><label className="block text-sm font-medium text-gray-700 mb-1">ساعات العمل اليومية</label><input name="hoursPerDay" type="number" value={employeeData.hoursPerDay} onChange={handleInputChange} className={inputStyles} required /></div> <div><label className="block text-sm font-medium text-gray-700 mb-1">جهة الصرف</label><input name="paymentSource" value={employeeData.paymentSource} onChange={handleInputChange} className={inputStyles} /></div> </div> <div className="pt-4 mt-2"><h4 className="text-lg font-semibold text-gray-600 mb-2">إعدادات إضافية</h4><div className="p-4 border rounded-md bg-gray-50 flex items-center space-x-6 space-x-reverse"><label className="flex items-center space-x-2 space-x-reverse cursor-pointer"><input type="checkbox" name="isHeadOffice" checked={employeeData.isHeadOffice} onChange={handleInputChange} className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" /><span className="text-gray-700 font-medium">يعمل في الإدارة؟</span></label><label className="flex items-center space-x-2 space-x-reverse cursor-pointer"><input type="checkbox" name="isActive" checked={employeeData.isActive} onChange={handleInputChange} className="h-5 w-5 rounded border-gray-300 text-green-600 focus:ring-green-500" /><span className="text-gray-700 font-medium">موظف نشط؟</span></label></div></div> <div className="pt-2"><h4 className="text-lg font-semibold text-gray-600 mb-2">البدلات</h4><div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-md bg-gray-50"><div className="grid grid-cols-[100px_1fr_100px] items-center gap-2"><label>بدل انتقالات</label><input name="transportAmount" type="number" value={employeeData.transportAmount} onChange={handleInputChange} className={inputStyles} placeholder="المبلغ" /><select name="transportType" value={employeeData.transportType} onChange={handleInputChange} className={selectStyles}><option value="شهري">شهري</option><option value="يومي">يومي</option></select></div><div className="grid grid-cols-[100px_1fr_100px] items-center gap-2"><label>بدل اغتراب</label><input name="expatriationAmount" type="number" value={employeeData.expatriationAmount} onChange={handleInputChange} className={inputStyles} placeholder="المبلغ" /><select name="expatriationType" value={employeeData.expatriationType} onChange={handleInputChange} className={selectStyles}><option value="شهري">شهري</option><option value="يومي">يومي</option></select></div><div className="grid grid-cols-[100px_1fr_100px] items-center gap-2"><label>بدل وجبة</label><input name="mealAmount" type="number" value={employeeData.mealAmount} onChange={handleInputChange} className={inputStyles} placeholder="المبلغ" /><select name="mealType" value={employeeData.mealType} onChange={handleInputChange} className={selectStyles}><option value="شهري">شهري</option><option value="يومي">يومي</option></select></div><div className="grid grid-cols-[100px_1fr_100px] items-center gap-2"><label>بدل سكن</label><input name="housingAmount" type="number" value={employeeData.housingAmount} onChange={handleInputChange} className={inputStyles} placeholder="المبلغ" /><select name="housingType" value={employeeData.housingType} onChange={handleInputChange} className={selectStyles}><option value="شهري">شهري</option><option value="يومي">يومي</option></select></div></div></div> <div className="pt-2"><label className="block text-sm font-medium text-gray-700 mb-2">أيام الراحة</label><div className="flex flex-wrap gap-4">{weekDays.map(day => (<label key={day} className="flex items-center space-x-2 space-x-reverse cursor-pointer"><input type="checkbox" checked={employeeData.restDays.includes(day)} onChange={() => handleRestDayChange(day)} className="h-4 w-4 rounded border-gray-300 text-blue-600" /><span className="text-gray-700">{day}</span></label>))}</div></div> </div> <div className="mt-6 text-left border-t pt-4"><button type="submit" className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 shadow">حفظ التغييرات</button></div> </form> </div> )}
      <div className="bg-white p-6 rounded-lg shadow-md"> <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4"><h3 className="text-xl font-semibold text-gray-700">قائمة الموظفين</h3><div className="flex items-center gap-2"><button onClick={handleExport} className="flex items-center text-sm bg-green-100 text-green-800 px-3 py-2 rounded-lg hover:bg-green-200 transition"><FileDown size={16} className="ml-2"/>تصدير</button><button onClick={() => fileInputRef.current?.click()} className="flex items-center text-sm bg-blue-100 text-blue-800 px-3 py-2 rounded-lg hover:bg-blue-200 transition"><FileUp size={16} className="ml-2"/>استيراد</button><input type="file" ref={fileInputRef} className="hidden" accept=".xlsx, .xls" onChange={handleImport} /><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} /><input type="text" placeholder="ابحث بالاسم..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full md:w-64 px-4 py-2 pl-10 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/></div></div></div> <div className="overflow-x-auto"><table className="min-w-full bg-white"><thead className="bg-gray-50"><tr><th className="py-3 px-4 text-right text-xs font-medium text-gray-500">الاسم</th><th className="py-3 px-4 text-right text-xs font-medium text-gray-500">الوظيفة</th><th className="py-3 px-4 text-right text-xs font-medium text-gray-500">الحالة</th><th className="py-3 px-4 text-right text-xs font-medium text-gray-500">الراتب</th><th className="py-3 px-4 text-right text-xs font-medium text-gray-500">أيام الراحة</th><th className="py-3 px-4 text-center text-xs font-medium text-gray-500">إجراءات</th></tr></thead><tbody className="divide-y divide-gray-200">{filteredEmployees.length > 0 ? filteredEmployees.map((emp: Employee) => (<tr key={emp.id} className={`hover:bg-gray-50 ${!emp.is_active ? 'bg-red-50 text-gray-500' : ''}`}><td className="py-4 px-4 whitespace-nowrap font-medium text-gray-900">{emp.name}</td><td className="py-4 px-4 whitespace-nowrap">{emp.job_title}</td><td className="py-4 px-4 whitespace-nowrap"><span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${emp.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{emp.is_active ? <CheckCircle size={14} className="ml-1"/> : <XCircle size={14} className="ml-1"/>}{emp.is_active ? 'نشط' : 'غير نشط'}</span></td><td className="py-4 px-4 whitespace-nowrap">{emp.salary_amount} ({emp.salary_type})</td><td className="py-4 px-4 whitespace-nowrap text-center">{(emp.rest_days || []).join('، ')}</td><td className="py-4 px-4 whitespace-nowrap text-center"><div className="flex justify-center items-center gap-4">{can('edit', 'Employees') && (<button onClick={() => handleEdit(emp)} className="text-blue-600 hover:text-blue-800 transition-colors" title="تعديل"><Edit size={20} /></button>)}{can('delete', 'Employees') && (<button onClick={() => handleDelete(emp.id)} className="text-red-600 hover:text-red-800 transition-colors" title="حذف"><Trash2 size={20} /></button>)}</div></td></tr>)) : (<tr><td colSpan={6} className="text-center py-10 text-gray-500">{loading ? 'جاري تحميل الموظفين...' : (searchTerm ? 'لم يتم العثور على موظفين بهذا الاسم.' : 'لم يتم إضافة أي موظفين بعد.')}</td></tr>)}</tbody></table></div> </div>
    </div>
  );
}