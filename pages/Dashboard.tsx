import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, CalendarCheck, PlusCircle, LogIn, CalendarCog } from 'lucide-react';
import HolidaysModal from '../components/HolidaysModal';
import type { Employee, AttendanceRecords, PublicHoliday } from '../App';

interface DashboardProps {
  employees: Employee[];
  attendanceRecords: AttendanceRecords;
  publicHolidays: PublicHoliday[];
  setPublicHolidays: React.Dispatch<React.SetStateAction<PublicHoliday[]>>;
}

function Dashboard({ employees, attendanceRecords, publicHolidays, setPublicHolidays }: DashboardProps) {
  const [isHolidaysModalOpen, setIsHolidaysModalOpen] = useState(false);
  
  const today = new Date().toISOString().split('T')[0];
  const attendanceTodayCount = attendanceRecords[today] ? Object.keys(attendanceRecords[today]).length : 0;
  const totalEmployees = employees.length;

  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-800 mb-6">لوحة التحكم الرئيسية</h2>
      
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-lg flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">إجمالي الموظفين</p>
            <p className="text-3xl font-bold text-gray-900">{totalEmployees}</p>
          </div>
          <div className="bg-blue-100 p-3 rounded-full">
            <Users className="text-blue-600" size={28} />
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-lg flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">الحضور المسجل اليوم</p>
            <p className="text-3xl font-bold text-gray-900">{attendanceTodayCount}</p>
          </div>
          <div className="bg-green-100 p-3 rounded-full">
            <CalendarCheck className="text-green-600" size={28} />
          </div>
        </div>
         <div className="bg-white p-6 rounded-xl shadow-lg flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">العطلات الرسمية</p>
            <p className="text-3xl font-bold text-gray-900">{publicHolidays.length}</p>
          </div>
          <div className="bg-yellow-100 p-3 rounded-full">
            <CalendarCog className="text-yellow-600" size={28} />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-xl font-semibold text-gray-700 mb-4">إجراءات سريعة</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link to="/employees" className="flex items-center justify-center text-center bg-blue-600 text-white px-6 py-4 rounded-lg hover:bg-blue-700 transition-colors duration-300 shadow-md text-lg font-semibold">
            <PlusCircle size={24} className="ml-3" />
            إضافة موظف جديد
          </Link>
          <Link to="/attendance" className="flex items-center justify-center text-center bg-gray-700 text-white px-6 py-4 rounded-lg hover:bg-gray-800 transition-colors duration-300 shadow-md text-lg font-semibold">
            <LogIn size={24} className="ml-3" />
            تسجيل الحضور
          </Link>
          <button onClick={() => setIsHolidaysModalOpen(true)} className="flex items-center justify-center text-center bg-yellow-500 text-white px-6 py-4 rounded-lg hover:bg-yellow-600 transition-colors duration-300 shadow-md text-lg font-semibold">
            <CalendarCog size={24} className="ml-3" />
            إدارة العطلات الرسمية
          </button>
        </div>
      </div>
      
      <HolidaysModal 
        isOpen={isHolidaysModalOpen}
        onClose={() => setIsHolidaysModalOpen(false)}
        publicHolidays={publicHolidays}
        setPublicHolidays={setPublicHolidays}
      />

    </div>
  );
}

export default Dashboard;