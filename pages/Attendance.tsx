import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, User } from 'lucide-react';
import type { Employee } from '../App';

interface AttendanceProps {
  employees: Employee[];
}

function Attendance({ employees }: AttendanceProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredEmployees = employees.filter(employee =>
    employee.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">البحث عن موظف لتسجيل الحضور</h2>
      
      <div className="relative mb-8">
        <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="اكتب اسم الموظف..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold text-gray-700 mb-4">نتائج البحث</h3>
        {employees.length === 0 ? (
           <div className="text-center py-10 text-gray-500">
             <p className="text-xl">يرجى إضافة موظفين أولاً من صفحة "الموظفين".</p>
           </div>
        ) : filteredEmployees.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEmployees.map((employee) => (
              <Link
                key={employee.id}
                to={`/attendance/${employee.id}`}
                className="block p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-blue-100 hover:border-blue-400 transition-all duration-200 shadow-sm"
              >
                <div className="flex items-center">
                  <div className="bg-blue-200 p-3 rounded-full ml-4">
                      <User className="text-blue-700" size={24} />
                  </div>
                  <div>
                    <p className="font-bold text-gray-800 text-lg">{employee.name}</p>
                    <p className="text-sm text-gray-600">{employee.jobTitle}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 text-gray-500">
            <p>لم يتم العثور على موظفين بهذا الاسم.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Attendance;