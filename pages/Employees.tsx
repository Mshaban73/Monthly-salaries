// --- START OF FILE src/pages/Employees.tsx (النسخة النهائية الكاملة والمصححة) ---

import React, { useState } from 'react';
import { PlusCircle, Trash2, Edit } from 'lucide-react';
import type { Employee } from '../App';

interface EmployeesProps {
  employees: Employee[];
  setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>;
}

interface NewEmployeeState {
  name: string;
  jobTitle: string;
  workLocation: string;
  salaryType: 'شهري' | 'يومي';
  salaryAmount: string;
  paymentSource: string;
  restDays: string[];
  transportAllowance: string;
  expatriationAllowance: string;
  mealAllowance: string;
  housingAllowance: string;
  hoursPerDay: string;
  isHeadOffice: boolean;
}

const initialFormState: NewEmployeeState = {
  name: '',
  jobTitle: '',
  workLocation: 'الادارة',
  salaryType: 'شهري',
  salaryAmount: '',
  paymentSource: '',
  restDays: ['الجمعة'],
  transportAllowance: '',
  expatriationAllowance: '',
  mealAllowance: '',
  housingAllowance: '',
  hoursPerDay: '8',
  isHeadOffice: true,
};

const weekDays = ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];

function Employees({ employees, setEmployees }: EmployeesProps) {
  const [employeeData, setEmployeeData] = useState<NewEmployeeState>(initialFormState);
  const [showForm, setShowForm] = useState(false);
  const [editingEmployeeId, setEditingEmployeeId] = useState<number | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === 'checkbox';
    const checked = (e.target as HTMLInputElement).checked;

    setEmployeeData(prev => ({
      ...prev,
      [name]: isCheckbox ? checked : value,
    }));
  };

  const handleRestDayChange = (day: string) => {
    const { restDays } = employeeData;
    const updatedRestDays = restDays.includes(day)
      ? restDays.filter((d) => d !== day)
      : [...restDays, day];
    setEmployeeData({ ...employeeData, restDays: updatedRestDays });
  };

  const handleAddNew = () => {
    setEditingEmployeeId(null);
    setEmployeeData(initialFormState);
    setShowForm(true);
  };

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
      transportAllowance: employeeToEdit.transportAllowance?.toString() || '',
      expatriationAllowance: employeeToEdit.expatriationAllowance?.toString() || '',
      mealAllowance: employeeToEdit.mealAllowance?.toString() || '',
      housingAllowance: employeeToEdit.housingAllowance?.toString() || '',
    });
    setShowForm(true);
  };
  
  const handleCancel = () => {
    setShowForm(false);
    setEditingEmployeeId(null);
    setEmployeeData(initialFormState);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { name, jobTitle, workLocation, salaryType, paymentSource, restDays, salaryAmount, transportAllowance, expatriationAllowance, mealAllowance, housingAllowance, hoursPerDay, isHeadOffice } = employeeData;

    const employeePayload = {
      name, jobTitle, workLocation, salaryType, paymentSource, restDays,
      salaryAmount: Number(salaryAmount),
      hoursPerDay: Number(hoursPerDay),
      isHeadOffice: isHeadOffice,
      transportAllowance: Number(transportAllowance) || undefined,
      expatriationAllowance: Number(expatriationAllowance) || undefined,
      mealAllowance: Number(mealAllowance) || undefined,
      housingAllowance: Number(housingAllowance) || undefined,
    };

    if (editingEmployeeId) {
      setEmployees(employees.map(emp => (emp.id === editingEmployeeId ? { ...emp, ...employeePayload } : emp)));
    } else {
      setEmployees([...employees, { id: Date.now(), ...employeePayload }]);
    }

    handleCancel();
  };

  const handleDelete = (id: number) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الموظف؟')) {
      setEmployees(employees.filter(emp => emp.id !== id));
    }
  };

  return (
    <div className="p-4 md:p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">إدارة الموظفين</h2>
        {!showForm ? (<button onClick={handleAddNew} className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-300 shadow"><PlusCircle size={20} className="ml-2" />إضافة موظف جديد</button>) : (<button onClick={handleCancel} className="flex items-center bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors duration-300 shadow">إلغاء</button>)}
      </div>

      {showForm && (
        <div className="bg-white p-8 rounded-lg shadow-md mb-6 animate-fade-in-down">
          <h3 className="text-2xl font-bold mb-4 text-gray-700">{editingEmployeeId ? 'تعديل بيانات الموظف' : 'إضافة موظف جديد'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div><label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">اسم الموظف</label><input type="text" name="name" id="name" value={employeeData.name} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" required /></div>
              <div><label htmlFor="jobTitle" className="block text-sm font-medium text-gray-700 mb-1">الوظيفة</label><input type="text" name="jobTitle" id="jobTitle" value={employeeData.jobTitle} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" required /></div>
              <div><label htmlFor="workLocation" className="block text-sm font-medium text-gray-700 mb-1">موقع العمل (للعرض)</label><input type="text" name="workLocation" id="workLocation" value={employeeData.workLocation} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" /></div>
              <div><label htmlFor="salaryType" className="block text-sm font-medium text-gray-700 mb-1">نوع الراتب</label><select name="salaryType" id="salaryType" value={employeeData.salaryType} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white"><option value="شهري">شهري</option><option value="يومي">يومي</option></select></div>
              <div><label htmlFor="salaryAmount" className="block text-sm font-medium text-gray-700 mb-1">الراتب / فئة اليوم</label><input type="number" name="salaryAmount" id="salaryAmount" value={employeeData.salaryAmount} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" required /></div>
              <div><label htmlFor="hoursPerDay" className="block text-sm font-medium text-gray-700 mb-1">ساعات العمل اليومية</label><input type="number" name="hoursPerDay" id="hoursPerDay" value={employeeData.hoursPerDay} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" required /></div>
              <div><label htmlFor="paymentSource" className="block text-sm font-medium text-gray-700 mb-1">جهة الصرف</label><input type="text" name="paymentSource" id="paymentSource" value={employeeData.paymentSource} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" required /></div>
              <div><label htmlFor="transportAllowance" className="block text-sm font-medium text-gray-700 mb-1">بدل انتقالات</label><input type="number" name="transportAllowance" id="transportAllowance" value={employeeData.transportAllowance} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" /></div>
              <div><label htmlFor="expatriationAllowance" className="block text-sm font-medium text-gray-700 mb-1">بدل اغتراب</label><input type="number" name="expatriationAllowance" id="expatriationAllowance" value={employeeData.expatriationAllowance} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" /></div>
              <div><label htmlFor="mealAllowance" className="block text-sm font-medium text-gray-700 mb-1">بدل وجبة</label><input type="number" name="mealAllowance" id="mealAllowance" value={employeeData.mealAllowance} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" /></div>
              <div><label htmlFor="housingAllowance" className="block text-sm font-medium text-gray-700 mb-1">بدل سكن</label><input type="number" name="housingAllowance" id="housingAllowance" value={employeeData.housingAllowance} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" /></div>
            </div>
            <div className="md:col-span-3 mt-6"><label className="block text-sm font-medium text-gray-700 mb-2">أيام الراحة الأسبوعية</label><div className="flex flex-wrap gap-4">{weekDays.map(day => (<label key={day} className="flex items-center space-x-2 space-x-reverse cursor-pointer"><input type="checkbox" checked={employeeData.restDays.includes(day)} onChange={() => handleRestDayChange(day)} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" /><span className="text-gray-700">{day}</span></label>))}</div></div>
            <div className="md:col-span-3 mt-6">
              <label className="flex items-center space-x-2 space-x-reverse cursor-pointer">
                <input type="checkbox" name="isHeadOffice" checked={employeeData.isHeadOffice} onChange={handleInputChange} className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                <span className="text-gray-700 font-medium">يعمل في الإدارة (المكتب الرئيسي)؟</span>
              </label>
              <p className="text-xs text-gray-500 mt-1">إذا تم تحديد هذا الخيار، سيتم حساب إضافي الخميس بناءً على 3 ساعات عمل. وإلا، سيتم حسابه بناءً على 4 ساعات.</p>
            </div>
            <div className="mt-6 text-left"><button type="submit" className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors duration-300 shadow">حفظ التغييرات</button></div>
          </form>
        </div>
      )}

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold text-gray-700 mb-4">قائمة الموظفين</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-3 px-4 text-right text-xs font-medium text-gray-500">الاسم</th><th className="py-3 px-4 text-right text-xs font-medium text-gray-500">الوظيفة</th><th className="py-3 px-4 text-right text-xs font-medium text-gray-500">موقع العمل</th><th className="py-3 px-4 text-right text-xs font-medium text-gray-500">الراتب</th><th className="py-3 px-4 text-right text-xs font-medium text-gray-500">أيام الراحة</th><th className="py-3 px-4 text-center text-xs font-medium text-gray-500">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {employees.length > 0 ? employees.map(emp => (<tr key={emp.id} className="hover:bg-gray-50"><td className="py-4 px-4 whitespace-nowrap font-medium text-gray-900">{emp.name}</td><td className="py-4 px-4 whitespace-nowrap text-gray-600">{emp.jobTitle}</td><td className="py-4 px-4 whitespace-nowrap text-gray-600">{emp.workLocation}</td><td className="py-4 px-4 whitespace-nowrap text-gray-600">{emp.salaryAmount} ({emp.salaryType})</td><td className="py-4 px-4 whitespace-nowrap text-gray-600">{emp.restDays.join('، ')}</td>
              <td className="py-4 px-4 whitespace-nowrap text-center">
                <div className="flex justify-center items-center gap-4">
                  <button onClick={() => handleEdit(emp)} className="text-blue-600 hover:text-blue-800 transition-colors" title="تعديل">
                    <Edit size={20} />
                  </button>
                  <button onClick={() => handleDelete(emp.id)} className="text-red-600 hover:text-red-800 transition-colors" title="حذف">
                    <Trash2 size={20} />
                  </button>
                </div>
              </td>
              </tr>)) : (<tr><td colSpan={6} className="text-center py-10 text-gray-500">لم يتم إضافة أي موظفين بعد.</td></tr>)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Employees;