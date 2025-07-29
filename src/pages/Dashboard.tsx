// --- START OF FILE src/pages/Dashboard.tsx (النسخة النهائية المصححة تماماً) ---

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, CalendarCheck, CalendarCog, Loader, Truck } from 'lucide-react'; // أضفت Truck
import { useAuth } from '../context/AuthContext.tsx';
import { supabase } from '../supabaseClient.js';
import logo from '/logo.png';
import HolidaysModal from '../components/HolidaysModal.tsx';
import { Employee, PublicHoliday } from '../types.ts'; // استيراد Employee
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db.ts';

// --- دالة المزامنة ---
const syncDashboardData = async () => {
  try {
    console.log('Attempting to sync dashboard data from Supabase...');
    
    // --- تزامن الموظفين (مهم جداً للخطوة التالية) ---
    const { data: employeesData, error: empError } = await supabase
      .from('employees')
      .select('*')
      .eq('is_active', true);

    const { data: holidaysData, error: holidaysError } = await supabase
      .from('public_holidays')
      .select('*')
      .order('date', { ascending: true });

    if (empError || holidaysError) {
      throw empError || holidaysError;
    }

    // حفظ البيانات في قاعدة البيانات المحلية (Dexie)
    await db.employees.bulkPut(employeesData || []);
    await db.publicHolidays.bulkPut(holidaysData || []);
    
    console.log('Sync successful!');
    return { success: true };
    
  } catch (error) {
    console.error('Sync failed, app is likely offline.', error);
    return { success: false };
  }
};


export default function Dashboard() {
  const { can } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isHolidaysModalOpen, setIsHolidaysModalOpen] = useState(false);
  const [initialSyncDone, setInitialSyncDone] = useState(false);

  // --- بداية التعديل 1: إصلاح استعلام Dexie ---
  // سنقوم بجلب كل الموظفين ثم فلترتهم في الكود. Dexie أحياناً لا يحب الفهرسة على boolean.
  // أو الطريقة الأفضل هي حساب العدد مباشرة
  const totalEmployees = useLiveQuery(() => 
    db.employees.where('is_active').equals(1).count()
  , []); // ملاحظة: هذا يتطلب أن تكون قيمة is_active في قاعدة البيانات رقم (1 أو 0)
  // حل بديل وأكثر أماناً:
  const activeEmployees = useLiveQuery(() => 
    db.employees.filter(emp => emp.is_active === true).toArray()
  , []);
  // --- نهاية التعديل 1 ---

  const localPublicHolidays = useLiveQuery(() => db.publicHolidays.toArray(), []);
  
  React.useEffect(() => {
    const runSync = async () => {
      await syncDashboardData();
      setLoading(false);
      setInitialSyncDone(true);
    };
    runSync();
  }, []);

  // --- بداية التعديل 2: هذه الدالة صحيحة ولكننا نمررها للمكون الذي تم تعديله ---
  const handleSetPublicHolidays = (updatedHolidays: PublicHoliday[]) => {
    db.publicHolidays.bulkPut(updatedHolidays);
  };
  // --- نهاية التعديل 2 ---

  if (loading || !initialSyncDone) {
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
          <div className="bg-white p-6 rounded-xl shadow-lg flex items-center justify-between"><div><p className="text-sm font-medium text-gray-500">إجمالي الموظفين النشطين</p><p className="text-3xl font-bold text-gray-900">{activeEmployees?.length ?? '...'}</p></div><div className="bg-blue-100 p-3 rounded-full"><Users className="text-blue-600" size={28} /></div></div>
          <div className="bg-white p-6 rounded-xl shadow-lg flex items-center justify-between"><div><p className="text-sm font-medium text-gray-500">الحضور المسجل اليوم</p><p className="text-3xl font-bold text-gray-900">0</p></div><div className="bg-green-100 p-3 rounded-full"><CalendarCheck className="text-green-600" size={28} /></div></div>
          <div className="bg-white p-6 rounded-xl shadow-lg flex items-center justify-between"><div><p className="text-sm font-medium text-gray-500">العطلات الرسمية</p><p className="text-3xl font-bold text-gray-900">{localPublicHolidays?.length ?? '...'}</p></div><div className="bg-yellow-100 p-3 rounded-full"><CalendarCog className="text-yellow-600" size={28} /></div></div>
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
        publicHolidays={localPublicHolidays || []} 
        setPublicHolidays={handleSetPublicHolidays}
        canEdit={can('edit', 'Dashboard')}
      />
    </div>
  );
}