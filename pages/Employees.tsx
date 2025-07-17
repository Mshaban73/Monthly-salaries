import React, { useState } from 'react';
import { PlusCircle, Trash2 } from 'lucide-react';
import type { Employee } from '../App';

// Define props for the component
interface EmployeesProps {
  employees: Employee[];
  setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>;
}

// Define the shape of the form state
interface NewEmployeeState {
  name: string;
  jobTitle: string;
  workLocation: string;
  salaryType: 'شهري' | 'يومي';
  salaryAmount: string;
  paymentSource: string;
  restDays: string[];
}

const weekDays = ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];

function Employees({ employees, setEmployees }: EmployeesProps) {
  const [newEmployee, setNewEmployee] = useState<NewEmployeeState>({
    name: '',
    jobTitle: '',
    workLocation: '',
    salaryType: 'شهري',
    salaryAmount: '',
    paymentSource: '',
    restDays: [],
  });
  const [showForm, setShowForm] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewEmployee(prev => ({
        ...prev,
        [name]: value,
    }));
  };

  const handleRestDayChange = (day: string) => {
    const { restDays } = newEmployee;
    const updatedRestDays = restDays.includes(day)
      ? restDays.filter((d) => d !== day)
      : [...restDays, day];
    setNewEmployee({ ...newEmployee, restDays: updatedRestDays });
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { name, jobTitle, workLocation, salaryType, paymentSource, restDays, salaryAmount } = newEmployee;
    const employeeToAdd: Employee = {
      id: Date.now(),
      name,
      jobTitle,
      workLocation,
      salaryType,
      paymentSource,
      restDays,
      salaryAmount: Number(salaryAmount),
    };
    setEmployees([...employees, employeeToAdd]);
    setNewEmployee({
      name: '',
      jobTitle: '',
      workLocation: '',
      salaryType: 'شهري',
      salaryAmount: '',
      paymentSource: '',
      restDays: [],
    });
    setShowForm(false);
  };

  const handleDelete = (id: number) => {
    setEmployees(employees.filter(emp => emp.id !== id));
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">إدارة الموظفين</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-300 shadow"
        >
          <PlusCircle size={20} className="ml-2" />
          {showForm ? 'إلغاء' : 'إضافة موظف جديد'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-8 rounded-lg shadow-md mb-6 animate-fade-in-down">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">اسم الموظف</label>
                <input type="text" name="name" id="name" value={newEmployee.name} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required />
              </div>
              <div>
                <label htmlFor="jobTitle" className="block text-sm font-medium text-gray-700 mb-1">الوظيفة</label>
                <input type="text" name="jobTitle" id="jobTitle" value={newEmployee.jobTitle} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required />
              </div>
              <div>
                <label htmlFor="workLocation" className="block text-sm font-medium text-gray-700 mb-1">موقع العمل</label>
                <input type="text" name="workLocation" id="workLocation" value={newEmployee.workLocation} onChange={handleInputChange} placeholder="مثال: الإدارة، الموقع الشمالي" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required />
              </div>
              <div>
                <label htmlFor="salaryType" className="block text-sm font-medium text-gray-700 mb-1">نوع الراتب</label>
                <select name="salaryType" id="salaryType" value={newEmployee.salaryType} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white">
                  <option value="شهري">شهري</option>
                  <option value="يومي">يومي</option>
                </select>
              </div>
              <div>
                <label htmlFor="salaryAmount" className="block text-sm font-medium text-gray-700 mb-1">الراتب / فئة اليوم</label>
                <input type="number" name="salaryAmount" id="salaryAmount" value={newEmployee.salaryAmount} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required />
              </div>
              <div>
                <label htmlFor="paymentSource" className="block text-sm font-medium text-gray-700 mb-1">جهة الصرف</label>
                <input type="text" name="paymentSource" id="paymentSource" value={newEmployee.paymentSource} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required />
              </div>
              <div className="md:col-span-2 lg:col-span-3">
                 <label className="block text-sm font-medium text-gray-700 mb-2">أيام الراحة الأسبوعية</label>
                 <div className="flex flex-wrap gap-4">
                    {weekDays.map(day => (
                        <label key={day} className="flex items-center space-x-2 space-x-reverse cursor-pointer">
                            <input type="checkbox" checked={newEmployee.restDays.includes(day)} onChange={() => handleRestDayChange(day)} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                            <span className="text-gray-700">{day}</span>
                        </label>
                    ))}
                 </div>
              </div>
            </div>
            <div className="mt-6 text-left">
                <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors duration-300 shadow">
                    حفظ الموظف
                </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold text-gray-700 mb-4">قائمة الموظفين</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-3 px-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الاسم</th>
                <th className="py-3 px-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الوظيفة</th>
                <th className="py-3 px-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">موقع العمل</th>
                <th className="py-3 px-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الراتب</th>
                <th className="py-3 px-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">أيام الراحة</th>
                <th className="py-3 px-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {employees.length > 0 ? employees.map(emp => (
                <tr key={emp.id} className="hover:bg-gray-50">
                  <td className="py-4 px-4 whitespace-nowrap font-medium text-gray-900">{emp.name}</td>
                  <td className="py-4 px-4 whitespace-nowrap text-gray-600">{emp.jobTitle}</td>
                  <td className="py-4 px-4 whitespace-nowrap text-gray-600">{emp.workLocation}</td>
                  <td className="py-4 px-4 whitespace-nowrap text-gray-600">{emp.salaryAmount} ({emp.salaryType})</td>
                  <td className="py-4 px-4 whitespace-nowrap text-gray-600">{emp.restDays.join('، ')}</td>
                  <td className="py-4 px-4 whitespace-nowrap">
                     <button onClick={() => handleDelete(emp.id)} className="text-red-600 hover:text-red-800 transition-colors">
                        <Trash2 size={20} />
                     </button>
                  </td>
                </tr>
              )) : (
                <tr>
                    <td colSpan={6} className="text-center py-10 text-gray-500">
                        لم يتم إضافة أي موظفين بعد.
                    </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Employees;