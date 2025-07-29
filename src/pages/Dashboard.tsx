// --- START OF FILE src/pages/Dashboard.tsx (كامل ومع الأنواع الصحيحة) ---

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, CalendarCheck, CalendarCog, Truck, Loader } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { supabase } from '../supabaseClient.js';
import logo from '/logo.png'; // المسار الصحيح للصور في مجلد public
import HolidaysModal from '../components/HolidaysModal.tsx';
import type { PublicHoliday } from '../types.ts';

export default function Dashboard() {
  const { can } = useAuth();
  const [stats, setStats] = useState({ totalEmployees: 0, attendanceToday: 0 });
  const [publicHolidays, setPublicHolidays] = useState<PublicHoliday[]>([]);
  const [loading, setLoading] = useState(true);
  const [isHolidaysModalOpen, setIsHolidaysModalOpen] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      
      // جلب عدد الموظفين النشطين فقط
      const { count: employeeCount, error: empError } = await supabase
        .from('employees')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      const { data: holidaysData, error: holidaysError } = await supabase
        .from('public_holidays')
        .select('*')
        .order('date', { ascending: true });

      if (empError || holidaysError) {
        console.error('Error fetching dashboard data:', empError || holidaysError);
        alert('فشل في جلب بيانات لوحة التحكم.');
      } else {
        setStats({ totalEmployees: employeeCount ?? 0, attendanceToday: 0 }); // الحضور سيتم حسابه لاحقاً
        setPublicHolidays(holidaysData || []);
      }

      setLoading(false);
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return <div className="flex justify-center items-center h-64"><Loader className="animate-spin text-blue-500" size={48} /></div>;
  }

  return (
    <div className="relative" dir="rtl">
      <div className="absolute inset-0 flex items-center justify-center -z-10 opacity-5 pointer-events-none">
        <img src={logo} alt="Watermark Logo" className="w-1/2 max-w-lg" />
      </div>
      <div className="z-10">
        <h2 className="text-3xl font-bold text-gray-800 mb-6">لوحة التحكم الرئيسية</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-lg flex items-center justify-between"><div><p className="text-sm font-medium text-gray-500">إجمالي الموظفين النشطين</p><p className="text-3xl font-bold text-gray-900">{stats.totalEmployees}</p></div><div className="bg-blue-100 p-3 rounded-full"><Users className="text-blue-600" size={28} /></div></div>
          <div className="bg-white p-6 rounded-xl shadow-lg flex items-center justify-between"><div><p className="text-sm font-medium text-gray-500">الحضور المسجل اليوم</p><p className="text-3xl font-bold text-gray-900">{stats.attendanceToday}</p></div><div className="bg-green-100 p-3 rounded-full"><CalendarCheck className="text-green-600" size={28} /></div></div>
          <div className="bg-white p-6 rounded-xl shadow-lg flex items-center justify-between"><div><p className="text-sm font-medium text-gray-500">العطلات الرسمية</p><p className="text-3xl font-bold text-gray-900">{publicHolidays.length}</p></div><div className="bg-yellow-100 p-3 rounded-full"><CalendarCog className="text-yellow-600" size={28} /></div></div>
        </div>

        <div>
          <h3 className="text-xl font-semibold text-gray-700 mb-4">إجراءات سريعة</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {can('view', 'Employees') && <Link to="/employees" className="flex items-center justify-center text-center bg-blue-600 text-white px-6 py-4 rounded-lg hover:bg-blue-700 shadow-md text-lg font-semibold">إدارة الموظفين</Link>}
            {can('view', 'Attendance') && <Link to="/attendance" className="flex items-center justify-center text-center bg-gray-700 text-white px-6 py-4 rounded-lg hover:bg-gray-800 shadow-md text-lg font-semibold">ملخص الحضور</Link>}
            {can('edit', 'Dashboard') && <button onClick={() => setIsHolidaysModalOpen(true)} className="flex items-center justify-center text-center bg-yellow-500 text-white px-6 py-4 rounded-lg hover:bg-yellow-600 shadow-md text-lg font-semibold">إدارة العطلات الرسمية</button>}
            {can('view', 'Transport') && <Link to="/transport" className="flex items-center justify-center text-center bg-indigo-600 text-white px-6 py-4 rounded-lg hover:bg-indigo-700 shadow-md text-lg font-semibold">تكلفة النقل</Link>}
          </div>
        </div>
      </div>
      
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