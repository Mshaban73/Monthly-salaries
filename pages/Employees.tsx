// --- START OF FILE src/pages/Employees.tsx (النسخة الكاملة والنهائية والمعدلة) ---

import React, { useState, useMemo, useRef } from 'react';
import { PlusCircle, Trash2, Edit, Search, FileDown, FileUp, CheckCircle, XCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import type { Employee, Allowance } from '../App';
import { useAuth } from '../context/AuthContext';

interface EmployeesProps {
  employees: Employee[];
  setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>;
}

// Note: Ensure `Employee` type in App.tsx includes `isActive: boolean;`
// export interface Employee {
//   // ... other properties
//   isActive: boolean;
// }

interface FormData {
  name: string; jobTitle: string; workLocation: string;
  salaryType: 'شهري' | 'يومي'; salaryAmount: string; paymentSource: string;
  restDays: string[]; hoursPerDay: string; isHeadOffice: boolean;
  transportAmount: string; transportType: 'شهري' | 'يومي';
  expatriationAmount: string; expatriationType: 'شهري' | 'يومي';
  mealAmount: string; mealType: 'شهري' | 'يومي';
  housingAmount: string; housingType: 'شهري' | 'يومي';
  isActive: boolean; //  -- إضافة حقل الحالة --
}

const initialFormState: FormData = {
  name: '', jobTitle: '', workLocation: 'الادارة',
  salaryType: 'شهري', salaryAmount: '', paymentSource: '',
  restDays: ['الجمعة'], hoursPerDay: '8', isHeadOffice: true,
  transportAmount: '', transportType: 'شهري',
  expatriationAmount: '', expatriationType: 'شهري',
  mealAmount: '', mealType: 'شهري',
  housingAmount: '', housingType: 'شهري',
  isActive: true, // -- القيمة الافتراضية "نشط" --
};

const weekDays = ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];

const inputStyles = "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500";
const selectStyles = `${inputStyles} bg-white`;

function Employees({ employees, setEmployees }: EmployeesProps) {
  const [employeeData, setEmployeeData] = useState<FormData>(initialFormState);
  const [showForm, setShowForm] = useState(false);
  const [editingEmployeeId, setEditingEmployeeId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { can } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredEmployees = useMemo(() => { return employees.filter(emp => emp.name.toLowerCase().includes(searchTerm.toLowerCase())); }, [employees, searchTerm]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === 'checkbox';
    const checked = (e.target as HTMLInputElement).checked;
    setEmployeeData(prev => ({ ...prev, [name]: isCheckbox ? checked : value }));
  };

  const handleRestDayChange = (day: string) => { const { restDays } = employeeData; const updatedRestDays = restDays.includes(day) ? restDays.filter((d) => d !== day) : [...restDays, day]; setEmployeeData({ ...employeeData, restDays: updatedRestDays }); };
  const handleAddNew = () => { setEditingEmployeeId(null); setEmployeeData(initialFormState); setShowForm(true); };
  
  const handleEdit = (employeeToEdit: Employee) => {
    setEditingEmployeeId(employeeToEdit.id);
    setEmployeeData({
      name: employeeToEdit.name,
      jobTitle: employeeToEdit.jobTitle,
      workLocation: employeeToEdit.workLocation,
      salaryType: employeeToEdit.salaryType,
      salaryAmount: employeeToEdit.salaryAmount.toString(),
      paymentSource: employeeToEdit.paymentSource,
      restDays: employeeToEdit.restDays,
      hoursPerDay: employeeToEdit.hoursPerDay.toString(),
      isHeadOffice: employeeToEdit.isHeadOffice,
      transportAmount: employeeToEdit.transportAllowance?.amount.toString() || '',
      transportType: employeeToEdit.transportAllowance?.type || 'شهري',
      expatriationAmount: employeeToEdit.expatriationAllowance?.amount.toString() || '',
      expatriationType: employeeToEdit.expatriationAllowance?.type || 'شهري',
      mealAmount: employeeToEdit.mealAllowance?.amount.toString() || '',
      mealType: employeeToEdit.mealAllowance?.type || 'شهري',
      housingAmount: employeeToEdit.housingAllowance?.amount.toString() || '',
      housingType: employeeToEdit.housingAllowance?.type || 'شهري',
      isActive: employeeToEdit.isActive, // -- جلب حالة الموظف عند التعديل --
    });
    setShowForm(true);
  };
  
  const handleCancel = () => { setShowForm(false); setEditingEmployeeId(null); setEmployeeData(initialFormState); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const createAllowance = (amountStr: string, type: 'شهري' | 'يومي'): Allowance | undefined => {
        const amount = Number(amountStr);
        return amount > 0 ? { amount, type } : undefined;
    };
    const employeePayload = {
        name: employeeData.name, jobTitle: employeeData.jobTitle, workLocation: employeeData.workLocation,
        salaryType: employeeData.salaryType, salaryAmount: Number(employeeData.salaryAmount),
        paymentSource: employeeData.paymentSource, restDays: employeeData.restDays,
        hoursPerDay: Number(employeeData.hoursPerDay), isHeadOffice: employeeData.isHeadOffice,
        transportAllowance: createAllowance(employeeData.transportAmount, employeeData.transportType),
        expatriationAllowance: createAllowance(employeeData.expatriationAmount, employeeData.expatriationType),
        mealAllowance: createAllowance(employeeData.mealAmount, employeeData.mealType),
        housingAllowance: createAllowance(employeeData.housingAmount, employeeData.housingType),
        isActive: employeeData.isActive, // -- حفظ حالة الموظف --
    };
    if (editingEmployeeId) {
      setEmployees(employees.map(emp => (emp.id === editingEmployeeId ? { id: emp.id, ...employeePayload } : emp)));
    } else {
      setEmployees([...employees, { id: Date.now(), ...employeePayload }]);
    }
    handleCancel();
  };

  const handleDelete = (id: number) => { if (window.confirm('هل أنت متأكد؟')) { setEmployees(employees.filter(emp => emp.id !== id)); } };
  
  const handleExport = () => {
    const dataToExport = filteredEmployees.map(emp => ({
      'الاسم': emp.name,
      'الوظيفة': emp.jobTitle,
      'موقع العمل': emp.workLocation,
      'نوع الراتب': emp.salaryType,
      'قيمة الراتب': emp.salaryAmount,
      'جهة الصرف': emp.paymentSource,
      'ساعات العمل اليومية': emp.hoursPerDay,
      'يعمل في الإدارة': emp.isHeadOffice ? 'نعم' : 'لا',
      'حالة الموظف': emp.isActive ? 'نشط' : 'غير نشط', // -- إضافة الحالة للتصدير --
      'بدل انتقالات': emp.transportAllowance?.amount || 0,
      'نوع بدل الانتقالات': emp.transportAllowance?.type || '',
      'بدل اغتراب': emp.expatriationAllowance?.amount || 0,
      'نوع بدل الاغتراب': emp.expatriationAllowance?.type || '',
      'بدل وجبة': emp.mealAllowance?.amount || 0,
      'نوع بدل الوجبة': emp.mealAllowance?.type || '',
      'بدل سكن': emp.housingAllowance?.amount || 0,
      'نوع بدل السكن': emp.housingAllowance?.type || '',
      'أيام الراحة': emp.restDays.join(', '),
    }));
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "الموظفين");
    XLSX.writeFile(wb, "employees_export.xlsx");
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet) as any[];
        const createAllowance = (amount: number, type: string): Allowance | undefined => (amount > 0 ? { amount, type: type === 'يومي' ? 'يومي' : 'شهري' } : undefined);
        const newEmployees: Employee[] = json.map(row => ({
          id: Date.now() + Math.random(),
          name: row['الاسم'] || '',
          jobTitle: row['الوظيفة'] || '',
          workLocation: row['موقع العمل'] || 'غير محدد',
          salaryType: row['نوع الراتب'] === 'يومي' ? 'يومي' : 'شهري',
          salaryAmount: Number(row['قيمة الراتب']) || 0,
          paymentSource: row['جهة الصرف'] || '',
          hoursPerDay: Number(row['ساعات العمل اليومية']) || 8,
          isHeadOffice: row['يعمل في الإدارة'] === 'نعم',
          isActive: row['حالة الموظف'] !== 'غير نشط', // -- استيراد الحالة (الافتراضي نشط) --
          transportAllowance: createAllowance(Number(row['بدل انتقالات']), row['نوع بدل الانتقالات']),
          expatriationAllowance: createAllowance(Number(row['بدل اغتراب']), row['نوع بدل الاغتراب']),
          mealAllowance: createAllowance(Number(row['بدل وجبة']), row['نوع بدل الوجبة']),
          housingAllowance: createAllowance(Number(row['بدل سكن']), row['نوع بدل السكن']),
          restDays: (row['أيام الراحة'] || '').split(',').map((d:string) => d.trim()),
        })).filter(emp => emp.name);

        if (newEmployees.length > 0 && window.confirm(`تم العثور على ${newEmployees.length} موظف. هل تريد إضافتهم إلى القائمة الحالية؟`)) {
          setEmployees(prev => [...prev, ...newEmployees]);
          alert('تم استيراد الموظفين بنجاح!');
        }
      } catch (error) { alert('فشل استيراد الملف.'); console.error("Import error:", error); }
      finally { if(fileInputRef.current) fileInputRef.current.value = ""; }
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="p-4 md:p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">إدارة الموظفين</h2>
        {can('add', 'Employees') && !showForm && ( <button onClick={handleAddNew} className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 shadow"><PlusCircle size={20} className="ml-2" />إضافة موظف</button> )}
        {showForm && ( <button onClick={handleCancel} className="flex items-center bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 shadow">إلغاء</button> )}
      </div>

      {showForm && (
        <div className="bg-white p-8 rounded-lg shadow-md mb-6 animate-fade-in-down">
          <h3 className="text-2xl font-bold mb-6 text-gray-700">{editingEmployeeId ? 'تعديل بيانات الموظف' : 'إضافة موظف جديد'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">اسم الموظف</label><input name="name" value={employeeData.name} onChange={handleInputChange} className={inputStyles} required /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">الوظيفة</label><input name="jobTitle" value={employeeData.jobTitle} onChange={handleInputChange} className={inputStyles} required /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">موقع العمل</label><input name="workLocation" value={employeeData.workLocation} onChange={handleInputChange} className={inputStyles} /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">نوع الراتب</label><select name="salaryType" value={employeeData.salaryType} onChange={handleInputChange} className={selectStyles}><option value="شهري">شهري</option><option value="يومي">يومي</option></select></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">الراتب / فئة اليوم</label><input name="salaryAmount" type="number" value={employeeData.salaryAmount} onChange={handleInputChange} className={inputStyles} required /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">ساعات العمل اليومية</label><input name="hoursPerDay" type="number" value={employeeData.hoursPerDay} onChange={handleInputChange} className={inputStyles} required /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">جهة الصرف</label><input name="paymentSource" value={employeeData.paymentSource} onChange={handleInputChange} className={inputStyles} required /></div>
              </div>
              
              <div className="pt-4 mt-2">
                <h4 className="text-lg font-semibold text-gray-600 mb-2">إعدادات إضافية</h4>
                <div className="p-4 border rounded-md bg-gray-50 flex items-center space-x-6 space-x-reverse">
                    <label className="flex items-center space-x-2 space-x-reverse cursor-pointer"><input type="checkbox" name="isHeadOffice" checked={employeeData.isHeadOffice} onChange={handleInputChange} className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" /><span className="text-gray-700 font-medium">يعمل في الإدارة؟</span></label>
                    <label className="flex items-center space-x-2 space-x-reverse cursor-pointer"><input type="checkbox" name="isActive" checked={employeeData.isActive} onChange={handleInputChange} className="h-5 w-5 rounded border-gray-300 text-green-600 focus:ring-green-500" /><span className="text-gray-700 font-medium">موظف نشط؟</span></label>
                </div>
              </div>

              <div className="pt-2">
                <h4 className="text-lg font-semibold text-gray-600 mb-2">البدلات</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-md bg-gray-50">
                  <div className="grid grid-cols-[100px_1fr_100px] items-center gap-2"><label>بدل انتقالات</label><input name="transportAmount" type="number" value={employeeData.transportAmount} onChange={handleInputChange} className={inputStyles} placeholder="المبلغ" /><select name="transportType" value={employeeData.transportType} onChange={handleInputChange} className={selectStyles}><option value="شهري">شهري</option><option value="يومي">يومي</option></select></div>
                  <div className="grid grid-cols-[100px_1fr_100px] items-center gap-2"><label>بدل اغتراب</label><input name="expatriationAmount" type="number" value={employeeData.expatriationAmount} onChange={handleInputChange} className={inputStyles} placeholder="المبلغ" /><select name="expatriationType" value={employeeData.expatriationType} onChange={handleInputChange} className={selectStyles}><option value="شهري">شهري</option><option value="يومي">يومي</option></select></div>
                  <div className="grid grid-cols-[100px_1fr_100px] items-center gap-2"><label>بدل وجبة</label><input name="mealAmount" type="number" value={employeeData.mealAmount} onChange={handleInputChange} className={inputStyles} placeholder="المبلغ" /><select name="mealType" value={employeeData.mealType} onChange={handleInputChange} className={selectStyles}><option value="شهري">شهري</option><option value="يومي">يومي</option></select></div>
                  <div className="grid grid-cols-[100px_1fr_100px] items-center gap-2"><label>بدل سكن</label><input name="housingAmount" type="number" value={employeeData.housingAmount} onChange={handleInputChange} className={inputStyles} placeholder="المبلغ" /><select name="housingType" value={employeeData.housingType} onChange={handleInputChange} className={selectStyles}><option value="شهري">شهري</option><option value="يومي">يومي</option></select></div>
                </div>
              </div>

              <div className="pt-2"><label className="block text-sm font-medium text-gray-700 mb-2">أيام الراحة</label><div className="flex flex-wrap gap-4">{weekDays.map(day => (<label key={day} className="flex items-center space-x-2 space-x-reverse cursor-pointer"><input type="checkbox" checked={employeeData.restDays.includes(day)} onChange={() => handleRestDayChange(day)} className="h-4 w-4 rounded border-gray-300 text-blue-600" /><span className="text-gray-700">{day}</span></label>))}</div></div>
            </div>
            <div className="mt-6 text-left border-t pt-4"><button type="submit" className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 shadow">حفظ التغييرات</button></div>
          </form>
        </div>
      )}

      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4"><h3 className="text-xl font-semibold text-gray-700">قائمة الموظفين</h3><div className="flex items-center gap-2"><button onClick={handleExport} className="flex items-center text-sm bg-green-100 text-green-800 px-3 py-2 rounded-lg hover:bg-green-200 transition"><FileDown size={16} className="ml-2"/>تصدير</button><button onClick={() => fileInputRef.current?.click()} className="flex items-center text-sm bg-blue-100 text-blue-800 px-3 py-2 rounded-lg hover:bg-blue-200 transition"><FileUp size={16} className="ml-2"/>استيراد</button><input type="file" ref={fileInputRef} className="hidden" accept=".xlsx, .xls" onChange={handleImport} /><div className="relative"><Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} /><input type="text" placeholder="ابحث بالاسم..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full md:w-64 px-4 py-2 pr-10 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/></div></div></div>
        <div className="overflow-x-auto"><table className="min-w-full bg-white"><thead className="bg-gray-50"><tr><th className="py-3 px-4 text-right text-xs font-medium text-gray-500">الاسم</th><th className="py-3 px-4 text-right text-xs font-medium text-gray-500">الوظيفة</th><th className="py-3 px-4 text-right text-xs font-medium text-gray-500">الحالة</th><th className="py-3 px-4 text-right text-xs font-medium text-gray-500">الراتب</th><th className="py-3 px-4 text-right text-xs font-medium text-gray-500">أيام الراحة</th><th className="py-3 px-4 text-center text-xs font-medium text-gray-500">إجراءات</th></tr></thead><tbody className="divide-y divide-gray-200">{filteredEmployees.length > 0 ? filteredEmployees.map(emp => (<tr key={emp.id} className={`hover:bg-gray-50 ${!emp.isActive ? 'bg-red-50 text-gray-500' : ''}`}><td className="py-4 px-4 whitespace-nowrap font-medium text-gray-900">{emp.name}</td><td className="py-4 px-4 whitespace-nowrap">{emp.jobTitle}</td><td className="py-4 px-4 whitespace-nowrap"><span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${emp.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{emp.isActive ? <CheckCircle size={14} className="ml-1"/> : <XCircle size={14} className="ml-1"/>}{emp.isActive ? 'نشط' : 'غير نشط'}</span></td><td className="py-4 px-4 whitespace-nowrap">{emp.salaryAmount} ({emp.salaryType})</td><td className="py-4 px-4 whitespace-nowrap">{emp.restDays.join('، ')}</td><td className="py-4 px-4 whitespace-nowrap text-center"><div className="flex justify-center items-center gap-4">{can('edit', 'Employees') && (<button onClick={() => handleEdit(emp)} className="text-blue-600 hover:text-blue-800 transition-colors" title="تعديل"><Edit size={20} /></button>)}{can('delete', 'Employees') && (<button onClick={() => handleDelete(emp.id)} className="text-red-600 hover:text-red-800 transition-colors" title="حذف"><Trash2 size={20} /></button>)}</div></td></tr>)) : (<tr><td colSpan={6} className="text-center py-10 text-gray-500">{searchTerm ? 'لم يتم العثور على موظفين بهذا الاسم.' : 'لم يتم إضافة أي موظفين بعد.'}</td></tr>)}</tbody></table></div>
      </div>
    </div>
  );
}

export default Employees;