// --- START OF FILE src/pages/TransportCosts.tsx (كامل ومُعدَّل لدعم القراءة أوفلاين) ---

import React, { useEffect, useState, useMemo } from "react";
import * as XLSX from "xlsx";
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import { supabase } from '../supabaseClient.js';
import { getPayrollDays, getYearsList, getMonthsList, toYMDString } from '../utils/attendanceCalculator.ts';
import FinancialsModal from '../components/FinancialsModal.tsx';
import { Edit, Trash2, Save, DollarSign, Loader, FileDown, Search } from 'lucide-react';
import { Driver, PublicHoliday, FinancialItem } from '../types.ts';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db.ts';

const months = getMonthsList();
const years = getYearsList();

const getInitialPeriod = () => {
    const today = new Date();
    if (today.getDate() >= 26) {
        today.setMonth(today.getMonth() + 1);
    }
    return { month: today.getMonth() + 1, year: today.getFullYear() };
};

// --- دالة المزامنة الجديدة ---
const syncTransportData = async (periodKey: string, dayStrings: string[]) => {
  try {
    console.log(`Syncing transport data for period ${periodKey}...`);
    const [driversRes, attRes, finRes] = await Promise.all([
      supabase.from('drivers').select('*').order('name'),
      supabase.from('transport_attendance').select('*').in('date', dayStrings),
      supabase.from('transport_financials').select('*').eq('period', periodKey),
    ]);

    if (driversRes.error || attRes.error || finRes.error) throw driversRes.error || attRes.error || finRes.error;
    
    // استخدام transaction لضمان أن كل العمليات تنجح معاً
    await db.transaction('rw', db.drivers, db.transportAttendance, db.transportFinancials, async () => {
        await db.drivers.bulkPut(driversRes.data || []);
        await db.transportAttendance.bulkPut(attRes.data || []);
        await db.transportFinancials.bulkPut(finRes.data || []);
    });

    console.log('Transport data sync successful!');
    return { success: true };
  } catch (error) {
    console.error('Transport data sync failed, app is likely offline.', error);
    return { success: false };
  }
};


export default function TransportCosts() {
  const { can } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  const [selectedPeriod, setSelectedPeriod] = useState(getInitialPeriod);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [managingDriver, setManagingDriver] = useState<Driver | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [isDriverActive, setIsDriverActive] = useState(true);
  
  const periodKey = `${selectedPeriod.year}-${selectedPeriod.month.toString().padStart(2, '0')}`;
  const days = useMemo(() => getPayrollDays(selectedPeriod.year, selectedPeriod.month), [selectedPeriod]);
  const dayStrings = useMemo(() => days.map(d => toYMDString(d)), [days]);

  // --- القراءة من Dexie باستخدام useLiveQuery ---
  const drivers = useLiveQuery(() => db.drivers.toArray(), []);
  const attendanceRecords = useLiveQuery(() => db.transportAttendance.where('date').anyOf(dayStrings).toArray(), [dayStrings]);
  const financials = useLiveQuery(() => db.transportFinancials.where({ period: periodKey }).toArray(), [periodKey]);
  const publicHolidays = useLiveQuery(() => db.publicHolidays.toArray(), []); // نفترض أنها تمت مزامنتها في صفحات أخرى

  // إعادة حساب كائن الحضور عند تغير السجلات
  const attendance = useMemo(() => {
    return (attendanceRecords || []).reduce((acc: { [driverId: number]: { [date: string]: number } }, rec) => {
      if (!acc[rec.driver_id]) acc[rec.driver_id] = {};
      acc[rec.driver_id][rec.date] = rec.trips;
      return acc;
    }, {});
  }, [attendanceRecords]);

  useEffect(() => {
    const runSync = async () => {
        if (!can('view', 'Transport')) { setLoading(false); return; }
        setLoading(true);
        await syncTransportData(periodKey, dayStrings);
        setLoading(false);
    }
    runSync();
  }, [periodKey, dayStrings, can]);


  const handleEditClick = (driver: Driver) => {
    setEditingDriver(driver);
    setIsDriverActive(driver.is_active);
  };

  const handleCancelEdit = () => {
    setEditingDriver(null);
    setIsDriverActive(true);
  };

  const handleDriverSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const driverData = { 
        name: (form.elements.namedItem('name') as HTMLInputElement).value, 
        work_location: (form.elements.namedItem('workLocation') as HTMLInputElement).value, 
        payment_source: (form.elements.namedItem('paymentSource') as HTMLInputElement).value, 
        daily_rate: Number((form.elements.namedItem('dayCost') as HTMLInputElement).value),
        is_active: isDriverActive
    };
    if (editingDriver) {
      const { data, error } = await supabase.from('drivers').update(driverData).eq('id', editingDriver.id).select().single();
      if (error) { alert("فشل تحديث السائق"); } else if (data) { await db.drivers.put(data); }
    } else {
      const { data, error } = await supabase.from('drivers').insert({ ...driverData, is_active: true }).select().single();
      if (error) { alert("فشل إضافة السائق"); } else if (data) { await db.drivers.put(data); }
    }
    handleCancelEdit();
    form.reset();
  };

  const deleteDriver = async (driverId: number) => {
    if (window.confirm("هل أنت متأكد؟")) {
      const { error } = await supabase.from('drivers').delete().eq('id', driverId);
      if (error) { alert("فشل حذف السائق"); } else { await db.drivers.delete(driverId); }
    }
  };
  
  const handleDayChange = async (driverId: number, date: string, value: number) => {
    const trips = isNaN(value) || value < 0 ? 0 : value;
    const record = { driver_id: driverId, date: date, trips: trips };
    const { data, error } = await supabase.from('transport_attendance').upsert(record, { onConflict: 'driver_id, date' }).select().single();
    if (error) {
      console.error("Failed to save attendance:", error);
      alert("فشل الحفظ، قد تكون غير متصل بالإنترنت.");
    } else if (data) {
      await db.transportAttendance.put(data);
    }
  };

  const getDriverTotal = (driverId: number) => {
    const driverRecords = attendance[driverId] || {};
    const totalDays = Object.values(driverRecords).reduce((acc: number, val: number) => acc + Number(val || 0), 0);
    const driver = (drivers || []).find((d) => d.id === driverId);
    const baseCost = totalDays * (driver?.daily_rate || 0);
    const driverFinancials = (financials || []).filter(f => f.driver_id === driverId);
    const extrasTotal = driverFinancials.filter(f => f.type === 'extra').reduce((sum, item) => sum + item.amount, 0);
    const deductionsTotal = driverFinancials.filter(f => f.type === 'deduction').reduce((sum, item) => sum + item.amount, 0);
    return { totalDays, totalCost: baseCost + extrasTotal - deductionsTotal, extrasTotal, deductionsTotal, baseCost };
  };

  const handleSaveToHistory = async () => {
      const reportData = (drivers || []).map(driver => {
          const totals = getDriverTotal(driver.id);
          return {
              driver_id: driver.id,
              driver_name: driver.name,
              work_location: driver.work_location,
              payment_source: driver.payment_source,
              day_cost: driver.daily_rate,
              ...totals
          };
      });
      if (window.confirm(`هل أنت متأكد من حفظ وترحيل تكلفة النقل لشهر ${periodKey}؟`)) {
          const { error } = await supabase.from('historical_payrolls').upsert({ period: periodKey, transport_cost_data: { report: reportData } }, { onConflict: 'period' });
          if (error) { alert('فشل حفظ التقرير.'); console.error(error); } 
          else { alert('تم حفظ وترحيل التقرير بنجاح!'); navigate('/history'); }
      }
  };

  const handleExportExcel = () => {
      const exportData = filteredDrivers.map((driver) => {
          const { totalDays, totalCost, extrasTotal, deductionsTotal, baseCost } = getDriverTotal(driver.id);
          return { "اسم السائق": driver.name, "موقع العمل": driver.work_location, "جهة الصرف": driver.payment_source, "قيمة اليوم": driver.daily_rate, "عدد الأيام": totalDays, "التكلفة الأساسية": baseCost, "مستحقات أخرى": extrasTotal, "خصومات": deductionsTotal, "إجمالي التكلفة": totalCost, };
      });
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, `تكلفة النقل ${periodKey}`);
      XLSX.writeFile(wb, `TransportCosts_${periodKey}.xlsx`);
  };
  
  const filteredDrivers = useMemo(() => 
    (drivers || []).filter(driver => {
      const isActive = driver.is_active;
      const matchesSearch = driver.name.toLowerCase().includes(searchTerm.toLowerCase());
      if (showInactive) {
        return matchesSearch;
      }
      return isActive && matchesSearch;
    })
  , [drivers, searchTerm, showInactive]);

  if (loading && !drivers) { return <div className="flex justify-center items-center h-screen"><Loader className="animate-spin text-blue-500" /></div>; }
  
  return (
    <div className="space-y-6 p-4 md:p-6" dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-3xl font-bold">تكاليف النقل</h1>
          <div className="flex items-center gap-2">
            <select className="border rounded px-2 py-1" value={selectedPeriod.month} onChange={(e) => setSelectedPeriod({...selectedPeriod, month: Number(e.target.value)})}>{months.map(m => <option key={m.value} value={m.value}>{m.name}</option>)}</select>
            <select className="border rounded px-2 py-1" value={selectedPeriod.year} onChange={(e) => setSelectedPeriod({...selectedPeriod, year: Number(e.target.value)})}>{years.map(y => <option key={y}>{y}</option>)}</select>
          </div>
      </div>
      
      {can('add', 'Transport') && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">{editingDriver ? "تعديل بيانات" : "إضافة سائق / سيارة"}</h2>
          <form className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end" onSubmit={handleDriverSubmit}>
            <input required name="name" placeholder="الاسم" className="border p-2 rounded" defaultValue={editingDriver?.name || ""} />
            <input required name="workLocation" placeholder="موقع العمل" className="border p-2 rounded" defaultValue={editingDriver?.work_location || ""} />
            <input required name="paymentSource" placeholder="جهة الصرف" className="border p-2 rounded" defaultValue={editingDriver?.payment_source || ""} />
            <input required name="dayCost" type="number" placeholder="تكلفة اليوم" className="border p-2 rounded" defaultValue={editingDriver?.daily_rate || ""} />
            {editingDriver && (
              <div className="flex items-center justify-center h-full">
                <label className="flex items-center gap-2 cursor-pointer bg-gray-100 p-2 rounded-lg">
                  <input type="checkbox" checked={isDriverActive} onChange={e => setIsDriverActive(e.target.checked)} className="h-5 w-5 rounded" />
                  <span>نشط</span>
                </label>
              </div>
            )}
            <div className={`flex gap-2 ${editingDriver ? 'col-span-full' : 'lg:col-span-1'}`}>
              <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded flex-1">{editingDriver ? "حفظ التعديلات" : "إضافة"}</button>
              {editingDriver && (<button type="button" onClick={handleCancelEdit} className="bg-gray-500 text-white px-4 py-2 rounded">إلغاء</button>)}
            </div>
          </form>
        </div>
      )}
      
      <div className="bg-white p-4 rounded-lg shadow overflow-x-auto">
        <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-4">
                <div className="relative"><Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} /><input type="text" placeholder="بحث بالاسم..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full md:w-64 px-4 py-2 pr-10 border rounded-lg" /></div>
                <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={showInactive} onChange={e => setShowInactive(e.target.checked)} className="h-5 w-5 rounded" /><span>إظهار غير النشطين</span></label>
            </div>
            <div className="flex gap-2">
                <button onClick={handleExportExcel} className="flex items-center bg-teal-600 text-white px-3 py-2 rounded-lg text-sm"><FileDown size={16} className="ml-2" />تصدير</button>
                <button onClick={handleSaveToHistory} className="flex items-center bg-purple-600 text-white px-3 py-2 rounded-lg text-sm"><Save size={16} className="ml-2" />حفظ وترحيل</button>
            </div>
        </div>
        <table className="min-w-full table-auto border">
          <thead className="bg-gray-100 text-sm text-gray-700">
            <tr>
              <th className="border px-2 py-1">الاسم</th><th className="border px-2 py-1">قيمة اليوم</th><th className="border px-2 py-1">عدد الأيام</th>
              <th className="border px-2 py-1">مستحقات</th><th className="border px-2 py-1">خصومات</th>
              <th className="border px-2 py-1">الإجمالي</th>
              {days.map((day, index) => {
                  const dayOfWeek = day.getUTCDay();
                  const isFriday = dayOfWeek === 5;
                  const isHoliday = (publicHolidays || []).some(h => h.date === toYMDString(day));
                  let headerClass = "border px-2 py-1 whitespace-nowrap text-center";
                  if (isFriday) headerClass += " bg-gray-200";
                  if (isHoliday) headerClass += " bg-yellow-200";
                  return (<th key={index} className={headerClass}><div className="text-xs">{day.toLocaleDateString("ar-EG", { weekday: "short" })}</div><div>{toYMDString(day).slice(8)}</div></th>)
              })}
              {can('edit', 'Transport') && <th className="border px-2 py-1">إجراءات</th>}
            </tr>
          </thead>
          <tbody>
            {filteredDrivers.map((driver) => {
              const { totalDays, totalCost, extrasTotal, deductionsTotal } = getDriverTotal(driver.id);
              return (
                <tr key={driver.id} className={`text-center text-sm ${!driver.is_active ? 'bg-gray-200 text-gray-500 italic' : 'hover:bg-gray-50'}`}>
                  <td className="border px-2 py-1">{driver.name}</td><td>{driver.daily_rate}</td>
                  <td className="font-bold">{totalDays}</td><td>{extrasTotal}</td><td>{deductionsTotal}</td>
                  <td className="font-bold">{totalCost}</td>
                  {dayStrings.map((date, index) => (
                    <td key={index} className="border p-1">
                      <input type="number" step="0.5" min="0" max="2" defaultValue={attendance[driver.id]?.[date] || ""} 
                       disabled={!can('edit', 'Transport')}
                       onBlur={(e) => handleDayChange(driver.id, date, parseFloat(e.target.value || "0"))} 
                       className="w-14 text-center border rounded"/>
                    </td>
                  ))}
                  {can('edit', 'Transport') && (
                    <td className="border px-2 py-1">
                      <div className="flex justify-center items-center gap-2">
                        <button onClick={() => setManagingDriver(driver)} title="إدارة مالية"><DollarSign size={18}/></button>
                        <button onClick={() => handleEditClick(driver)} title="تعديل بيانات"><Edit size={18}/></button>
                        {can('delete', 'Transport') && <button onClick={() => deleteDriver(driver.id)} title="حذف"><Trash2 size={18}/></button>}
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {managingDriver && (
        <FinancialsModal
          driver={managingDriver}
          periodKey={periodKey}
          existingFinancials={financials || []}
          onClose={() => setManagingDriver(null)}
          onSaveSuccess={async () => { await syncTransportData(periodKey, dayStrings); }}
        />
      )}
    </div>
  );
}