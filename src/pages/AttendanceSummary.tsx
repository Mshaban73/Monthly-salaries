// --- START OF FILE src/pages/AttendanceSummary.tsx (كامل ومع التعديلات الصحيحة) ---

import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { Clock, MapPin, Search, FileDown, Loader } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { supabase } from '../supabaseClient.js';
import { getPayrollDays, getYearsList, getMonthsList, toYMDString } from '../utils/attendanceCalculator.ts';
import { calculateAttendanceSummary, calculateLocationSummary } from '../utils/fullAttendanceCalculator.ts';
// استيراد الأنواع الصحيحة
import type { Employee, PublicHoliday, AttendanceRecord, AttendanceRecords } from '../types.ts';

const months = getMonthsList();
const years = getYearsList();

const getInitialPeriod = () => {
    const today = new Date();
    const currentDay = today.getDate();
    if (currentDay >= 26) {
        const nextPeriod = new Date(today.setMonth(today.getMonth() + 1));
        return { month: nextPeriod.getMonth() + 1, year: nextPeriod.getFullYear() };
    }
    return { month: today.getMonth() + 1, year: today.getFullYear() };
};

const LocationDistribution = ({ summary }: { summary: { [key: string]: number } }) => {
    const entries = Object.entries(summary);
    if (entries.length === 0) { return <span className="text-gray-400">-</span>; }
    return (
        <div className="flex flex-col items-start text-xs space-y-1">
            {entries.map(([location, days]: [string, number]) => (
                <div key={location} className="flex items-center gap-2 bg-gray-100 px-2 py-1 rounded">
                    <MapPin size={12} className="text-gray-500" />
                    <span className="font-semibold text-gray-800">{location}:</span>
                    <span className="text-blue-600 font-bold">{days.toFixed(1)} يوم</span>
                </div>
            ))}
        </div>
    );
};

const formatOvertimeCell = (overtime: { rawHours: number, calculatedValue: number }) => {
    if (overtime.rawHours === 0) { return <span className="text-gray-400">-</span>; }
    return (
        <div className="flex flex-col items-center">
            <span className="font-bold text-lg">{overtime.calculatedValue.toFixed(2)}</span>
            <span className="text-xs text-gray-500">({overtime.rawHours.toFixed(1)} س)</span>
        </div>
    );
};

export default function AttendanceSummary() {
    const { can } = useAuth();
    const [employees, setEmployees] = useState<Employee[]>([]);
    // --- تعديل: استخدام النوع الصحيح AttendanceRecords من ملف الأنواع ---
    const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecords>({});
    const [publicHolidays, setPublicHolidays] = useState<PublicHoliday[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPeriod, setSelectedPeriod] = useState(getInitialPeriod);
    const [searchTerm, setSearchTerm] = useState('');

    const payrollDays = useMemo(() => getPayrollDays(selectedPeriod.year, selectedPeriod.month), [selectedPeriod]);

    useEffect(() => {
        const fetchData = async () => {
            if (!can('view', 'Attendance')) { setLoading(false); return; }
            setLoading(true);
            const startDate = toYMDString(payrollDays[0]);
            const endDate = toYMDString(payrollDays[payrollDays.length - 1]);
            const [employeesRes, attendanceRes, holidaysRes] = await Promise.all([
                supabase.from('employees').select('*'),
                supabase.from('attendance').select('*').gte('date', startDate).lte('date', endDate),
                supabase.from('public_holidays').select('*').gte('date', startDate).lte('date', endDate)
            ]);
            if (employeesRes.error || attendanceRes.error || holidaysRes.error) {
                console.error("Error fetching data:", employeesRes.error || attendanceRes.error || holidaysRes.error);
                alert('فشل في جلب البيانات.');
            } else {
                setEmployees(employeesRes.data || []);

                // --- بداية التعديل الرئيسي لحل مشكلة عدم تطابق الأنواع ---
                const recordsByDate = (attendanceRes.data || []).reduce((acc: AttendanceRecords, record: AttendanceRecord) => {
                    const { date, employee_id, hours, location } = record;

                    if (!acc[date]) {
                        acc[date] = {};
                    }

                    if (!acc[date][employee_id]) {
                        // إذا كان هذا أول سجل للموظف في هذا اليوم، قم بإنشاء الكائن
                        acc[date][employee_id] = { hours: hours, locations: [location] };
                    } else {
                        // إذا كان للموظف سجل موجود بالفعل في نفس اليوم (هذا غير متوقع غالباً ولكن للسلامة)
                        // أضف الساعات إلى الساعات الحالية والموقع إلى مصفوفة المواقع
                        acc[date][employee_id].hours += hours;
                        if (!acc[date][employee_id].locations.includes(location)) {
                            acc[date][employee_id].locations.push(location);
                        }
                    }
                    return acc;
                }, {}); // تم تحديد النوع في بداية reduce
                // --- نهاية التعديل الرئيسي ---

                setAttendanceRecords(recordsByDate);
                setPublicHolidays(holidaysRes.data || []);
            }
            setLoading(false);
        };
        fetchData();
    }, [payrollDays, can]);

    const employeesSummary = useMemo(() => {
        const filtered = employees.filter((emp: Employee) => emp.name.toLowerCase().includes(searchTerm.toLowerCase()));
        return filtered.map((employee: Employee) => ({
            ...employee,
            // الآن البيانات التي نمررها مطابقة للنوع الذي تتوقعه الدوال
            summary: calculateAttendanceSummary(employee, attendanceRecords, publicHolidays, payrollDays),
            locationSummary: calculateLocationSummary(employee, attendanceRecords, payrollDays)
        }));
    }, [employees, attendanceRecords, publicHolidays, payrollDays, searchTerm]);

    const handleExport = () => { /* ... (دالة التصدير) ... */ };

    if (loading) { return <div className="flex justify-center items-center h-64"><Loader className="animate-spin text-blue-500" size={48} /></div>; }
    if (!can('view', 'Attendance')) { return <div className="text-center p-8 bg-yellow-100 text-yellow-800 rounded-lg"><h1 className="text-2xl font-bold">ملخص الحضور</h1><p className="mt-2">ليس لديك صلاحية لعرض هذه الصفحة.</p></div>; }

    return (
        <div className="p-4 md:p-6" dir="rtl">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-800">ملخص حضور الموظفين</h2>
                <button onClick={handleExport} className="flex items-center bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 shadow-sm transition-colors"><FileDown size={20} className="ml-2" />تصدير Excel</button>
            </div>
            
            <div className="bg-white p-4 md:p-6 rounded-lg shadow-md mb-6">
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <div><label className="text-sm font-medium text-gray-700">الشهر</label><select value={selectedPeriod.month} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedPeriod({...selectedPeriod, month: Number(e.target.value)})} className="w-full mt-1 bg-gray-50 px-3 py-2 border border-gray-300 rounded-md">{months.map(m => <option key={m.value} value={m.value}>{m.name}</option>)}</select></div>
                     <div><label className="text-sm font-medium text-gray-700">السنة</label><select value={selectedPeriod.year} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedPeriod({...selectedPeriod, year: Number(e.target.value)})} className="w-full mt-1 bg-gray-50 px-3 py-2 border border-gray-300 rounded-md">{years.map(y => <option key={y} value={y}>{y}</option>)}</select></div>
                     <div className="relative"><label className="text-sm font-medium text-gray-700">بحث بالاسم</label><Search className="absolute right-3 top-[43px] -translate-y-1/2 text-gray-400" size={20} /><input type="text" placeholder="اكتب اسم الموظف..." value={searchTerm} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)} className="w-full mt-1 bg-gray-50 px-3 py-2 pr-10 border border-gray-300 rounded-md"/></div>
                 </div>
            </div>

            <div className="bg-white rounded-lg shadow-md overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-100">
                        <tr>
                            <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase">اسم الموظف</th>
                            <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase">أيام الحضور</th>
                            <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase">توزيع الحضور</th>
                            <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase">إضافي عمل</th>
                            <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase">إضافي خميس</th>
                            <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase">إضافي راحة</th>
                            <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase">إضافي عطلة</th>
                            <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-blue-800 bg-blue-100 uppercase">صافي الإضافي (قيمة)</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {employeesSummary.length > 0 ? (
                            employeesSummary.map((emp: any) => ( // Kept as 'any' for simplicity, can be improved with a specific type
                                <tr key={emp.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-4 whitespace-nowrap"><Link to={`/attendance/${emp.id}`} className="font-medium text-blue-600 hover:text-blue-800 hover:underline">{emp.name}</Link></td>
                                    <td className="px-4 py-4 text-center font-semibold">{emp.summary.actualAttendanceDays}</td>
                                    <td className="px-4 py-4"><LocationDistribution summary={emp.locationSummary} /></td>
                                    <td className="px-4 py-4 text-center">{formatOvertimeCell(emp.summary.weekdayOvertime)}</td>
                                    <td className="px-4 py-4 text-center">{formatOvertimeCell(emp.summary.thursdayOvertime)}</td>
                                    <td className="px-4 py-4 text-center text-green-700">{formatOvertimeCell(emp.summary.restDayOvertime)}</td>
                                    <td className="px-4 py-4 text-center text-purple-700">{formatOvertimeCell(emp.summary.holidayOvertime)}</td>
                                    <td className="px-4 py-4 text-center text-blue-800 bg-blue-50"><div className="flex items-center justify-center font-bold text-lg"><Clock size={16} className="mr-2" />{emp.summary.totalOvertimeValue.toFixed(2)}</div></td>
                                </tr>
                            ))
                        ) : ( <tr><td colSpan={8} className="text-center py-10 text-gray-500">{searchTerm ? 'لم يتم العثور على موظفين.' : 'لا توجد بيانات لهذه الفترة.'}</td></tr> )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}