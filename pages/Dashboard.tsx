// --- START OF FILE src/pages/Dashboard.tsx ---

import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, CalendarCheck, PlusCircle, LogIn, CalendarCog, Truck, Download, Upload
} from 'lucide-react';
import HolidaysModal from '../components/HolidaysModal';
import type { Employee, AttendanceRecords, PublicHoliday } from '../App';
import { PERMISSIONS_KEY } from '../App';
import { useAuth } from '../context/AuthContext'; // --- تعديل: استيراد useAuth ---
import logo from '../assets/logo.png';

interface DashboardProps {
  employees: Employee[];
  attendanceRecords: AttendanceRecords;
  publicHolidays: PublicHoliday[];
  setPublicHolidays: React.Dispatch<React.SetStateAction<PublicHoliday[]>>;
}

const APP_DATA_KEY = 'payrollAppData_v3';

function Dashboard({ employees, attendanceRecords, publicHolidays, setPublicHolidays }: DashboardProps) {
  const [isHolidaysModalOpen, setIsHolidaysModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { can } = useAuth(); // --- تعديل: الوصول إلى دالة التحقق من الصلاحيات ---

  const today = new Date().toISOString().split('T')[0];
  const attendanceTodayCount = attendanceRecords[today] ? Object.keys(attendanceRecords[today]).length : 0;
  const totalEmployees = employees.length;

  const handleBackup = () => {
    try {
      const appData = localStorage.getItem(APP_DATA_KEY);
      const permissionsData = localStorage.getItem(PERMISSIONS_KEY);
      const userData = localStorage.getItem('user');

      if (!appData && !permissionsData) {
        alert('لا توجد بيانات لحفظها!');
        return;
      }
      const backupData = {
        appData: appData ? JSON.parse(appData) : {},
        permissionsData: permissionsData ? JSON.parse(permissionsData) : [],
        userData: userData ? JSON.parse(userData) : null,
      };
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(backupData, null, 2))}`;
      const link = document.createElement("a");
      link.href = jsonString;
      const date = new Date();
      const dateString = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
      link.download = `payroll_backup_${dateString}.json`;
      link.click();
      alert('تم تنزيل النسخة الاحتياطية بنجاح!');
    } catch (error) {
      console.error("Failed to create backup:", error);
      alert('فشل إنشاء النسخة الاحتياطية. راجع الـ console لمزيد من التفاصيل.');
    }
  };

  const handleRestore = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') { throw new Error("File is not valid text."); }
        const backupData = JSON.parse(text);
        if (!backupData.appData && !backupData.permissionsData) { throw new Error("ملف النسخ الاحتياطي غير صالح أو فارغ."); }
        if (window.confirm("هل أنت متأكد من استعادة هذه النسخة؟ سيتم الكتابة فوق كل البيانات الحالية.")) {
          localStorage.setItem(APP_DATA_KEY, JSON.stringify(backupData.appData || {}));
          localStorage.setItem(PERMISSIONS_KEY, JSON.stringify(backupData.permissionsData || []));
          if (backupData.userData) {
            localStorage.setItem('user', JSON.stringify(backupData.userData));
          } else {
            localStorage.removeItem('user');
          }
          alert('تم استعادة البيانات بنجاح! سيتم تحديث الصفحة الآن.');
          window.location.reload();
        }
      } catch (error) {
        console.error("Failed to restore backup:", error);
        alert(`فشل استعادة النسخة الاحتياطية. تأكد من أن الملف صحيح. الخطأ: ${error}`);
      } finally {
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    };
    reader.readAsText(file);
  };
  
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="relative">
      <div className="absolute inset-0 flex items-center justify-center -z-10 opacity-5 pointer-events-none">
        <img src={logo} alt="Watermark Logo" className="w-1/2 max-w-lg" />
      </div>
      <div className="z-10">
        <h2 className="text-3xl font-bold text-gray-800 mb-6">لوحة التحكم الرئيسية</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-lg flex items-center justify-between"><div><p className="text-sm font-medium text-gray-500">إجمالي الموظفين</p><p className="text-3xl font-bold text-gray-900">{totalEmployees}</p></div><div className="bg-blue-100 p-3 rounded-full"><Users className="text-blue-600" size={28} /></div></div>
          <div className="bg-white p-6 rounded-xl shadow-lg flex items-center justify-between"><div><p className="text-sm font-medium text-gray-500">الحضور المسجل اليوم</p><p className="text-3xl font-bold text-gray-900">{attendanceTodayCount}</p></div><div className="bg-green-100 p-3 rounded-full"><CalendarCheck className="text-green-600" size={28} /></div></div>
          <div className="bg-white p-6 rounded-xl shadow-lg flex items-center justify-between"><div><p className="text-sm font-medium text-gray-500">العطلات الرسمية</p><p className="text-3xl font-bold text-gray-900">{publicHolidays.length}</p></div><div className="bg-yellow-100 p-3 rounded-full"><CalendarCog className="text-yellow-600" size={28} /></div></div>
        </div>

        <div>
          <h3 className="text-xl font-semibold text-gray-700 mb-4">إجراءات سريعة</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link to="/employees" className="flex items-center justify-center text-center bg-blue-600 text-white px-6 py-4 rounded-lg hover:bg-blue-700 transition-colors shadow-md text-lg font-semibold"><PlusCircle size={24} className="ml-3" />إضافة موظف</Link>
            <Link to="/attendance" className="flex items-center justify-center text-center bg-gray-700 text-white px-6 py-4 rounded-lg hover:bg-gray-800 transition-colors shadow-md text-lg font-semibold"><LogIn size={24} className="ml-3" />ملخص الحضور</Link>
            {/* --- تعديل: التحقق من صلاحية "edit" قبل عرض الزر --- */}
            {can('edit', 'Dashboard') && (
              <button onClick={() => setIsHolidaysModalOpen(true)} className="flex items-center justify-center text-center bg-yellow-500 text-white px-6 py-4 rounded-lg hover:bg-yellow-600 transition-colors shadow-md text-lg font-semibold"><CalendarCog size={24} className="ml-3" />إدارة العطلات الرسمية</button>
            )}
            <Link to="/transport-costs" className="flex items-center justify-center text-center bg-indigo-600 text-white px-6 py-4 rounded-lg hover:bg-indigo-700 transition-colors shadow-md text-lg font-semibold"><Truck size={24} className="ml-3" />تكلفة النقل</Link>
          </div>
        </div>

        <div className="mt-8 border-t pt-6">
          <h3 className="text-xl font-semibold text-gray-700 mb-4">إدارة بيانات النظام</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button onClick={handleBackup} className="flex items-center justify-center text-center bg-green-600 text-white px-6 py-4 rounded-lg hover:bg-green-700 transition-colors shadow-md text-lg font-semibold"><Download size={24} className="ml-3" />تنزيل نسخة احتياطية</button>
            <button onClick={triggerFileInput} className="flex items-center justify-center text-center bg-orange-500 text-white px-6 py-4 rounded-lg hover:bg-orange-600 transition-colors shadow-md text-lg font-semibold"><Upload size={24} className="ml-3" />استعادة من نسخة</button>
            <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleRestore} />
          </div>
        </div>
      </div>
      
      {/* --- تعديل: تمرير دالة الصلاحيات إلى النافذة --- */}
      <HolidaysModal 
        isOpen={isHolidaysModalOpen} 
        onClose={() => setIsHolidaysModalOpen(false)} 
        publicHolidays={publicHolidays} 
        setPublicHolidays={setPublicHolidays}
        canEdit={can('edit', 'Dashboard')}
      />
    </div>
  );
}

export default Dashboard;