// --- START OF FILE src/pages/EmployeeAttendance.tsx (كامل ومع التعديلات الصحيحة) ---

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Save, ChevronLeft, Loader, Zap } from 'lucide-react';
import { supabase } from '../supabaseClient.js';
import { getPayrollDays, getYearsList, getMonthsList, toYMDString } from '../utils/attendanceCalculator.ts';
import type { Employee, PublicHoliday } from '../types.ts';

const dayNameToIndex: { [key: string]: number } = { 'الأحد': 0, 'الإثنين': 1, 'الثلاثاء': 2, 'الأربعاء': 3, 'الخميس': 4, 'الجمعة': 5, 'السبت': 6 };
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

interface DailyRecord {
    hours: string;
    location: string;
}
interface DailyAttendanceState { [date: string]: DailyRecord; }

export default function EmployeeAttendance() {
    const { employeeId } = useParams<{ employeeId: string }>();
    const [employee, setEmployee] = useState<Employee | null>(null);
    const [publicHolidays, setPublicHolidays] = useState<PublicHoliday[]>([]);
    const [attendance, setAttendance] = useState<DailyAttendanceState>({});
    const [loading, setLoading] = useState(true);
    const [allLocations, setAllLocations] = useState<string[]>([]);
    const [selectedPeriod, setSelectedPeriod] = useState(getInitialPeriod);

    const payrollDays = useMemo(() => getPayrollDays(selectedPeriod.year, selectedPeriod.month), [selectedPeriod]);

    const fetchData = useCallback(async () => {
        if (!employeeId) return;
        setLoading(true);

        const { data: empData, error: empError } = await supabase.from('employees').select('*').eq('id', employeeId).single();
        if (empError) {
            console.error("Employee not found:", empError);
            setLoading(false);
            return;
        }
        setEmployee(empData);
        
        const startDate = toYMDString(payrollDays[0]);
        const endDate = toYMDString(payrollDays[payrollDays.length - 1]);

        const [attRes, holRes, locRes] = await Promise.all([
            supabase.from('attendance').select('*').eq('employee_id', employeeId).gte('date', startDate).lte('date', endDate),
            // --- بداية التعديل: طلب كل الحقول (*) بدلاً من حقول محددة ---
            supabase.from('public_holidays').select('*').gte('date', startDate).lte('date', endDate),
            // --- نهاية التعديل ---
            supabase.from('employees').select('work_location')
        ]);
        
        setPublicHolidays(holRes.data || []);
        const uniqueLocations = [...new Set((locRes.data || []).map((e: { work_location: string }) => e.work_location))].filter(Boolean);
        setAllLocations(uniqueLocations);
        
        const dailyData: DailyAttendanceState = {};
        payrollDays.forEach(day => {
          const dateStr = toYMDString(day);
          const record = (attRes.data || []).find(rec => rec.date === dateStr);
          dailyData[dateStr] = {
              hours: record?.hours?.toString() || '',
              location: record?.location || empData.work_location || ''
          };
        });
        setAttendance(dailyData);
        setLoading(false);
    }, [employeeId, payrollDays]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleDataChange = (date: string, field: 'hours' | 'location', value: string) => {
        setAttendance((prev: DailyAttendanceState) => ({ ...prev, [date]: { ...prev[date], [field]: value } }));
    };

    const handleSave = async () => {
        if (!employee) return;
        setLoading(true);
        
        const recordsToUpsert = Object.entries(attendance)
            .map(([date, details]) => {
                const hours = parseFloat(details.hours);
                // تعديل بسيط: التأكد من أن `details` موجود قبل الوصول إلى خصائصه
                if (details && ((!isNaN(hours) && hours >= 0) || (details.location && details.location !== employee.work_location))) {
                    return {
                        employee_id: employee.id,
                        date: date,
                        hours: isNaN(hours) ? null : hours,
                        location: details.location,
                        status: !isNaN(hours) && hours > 0 ? 'حاضر' : 'غائب'
                    };
                }
                return null;
            })
            .filter((record): record is NonNullable<typeof record> => record !== null); // تحسين النوع للحماية

        if (recordsToUpsert.length > 0) {
            const { error } = await supabase.from('attendance').upsert(recordsToUpsert, {
                onConflict: 'employee_id, date',
            });
            if (error) {
                alert('فشل حفظ البيانات.');
                console.error(error);
            } else {
                alert('تم الحفظ بنجاح!');
            }
        } else {
            alert('لا توجد تغييرات لحفظها.');
        }
        setLoading(false);
        fetchData();
    };
    
    const handleAutoFill = () => {
        if (!employee) return;

        if (window.confirm(`هل أنت متأكد؟ سيتم تعبئة ساعات العمل الافتراضية لأيام العمل.`)) {
            const newDailyData = { ...attendance };
            payrollDays.forEach(day => {
                const dateStr = toYMDString(day);
                const dayOfWeekJS = day.getUTCDay();
                const dayNameArabic = Object.keys(dayNameToIndex).find(key => dayNameToIndex[key] === dayOfWeekJS);
                const isRestDay = (employee.rest_days || []).includes(dayNameArabic || '');
                const isHoliday = publicHolidays.some(h => h.date === dateStr);

                if (!isRestDay && !isHoliday) {
                    const hoursToFill = (dayNameArabic === 'الخميس' && employee.is_head_office) ? '3' : employee.hours_per_day.toString();
                    newDailyData[dateStr] = {
                        hours: hoursToFill,
                        location: attendance[dateStr]?.location || employee.work_location || '',
                    };
                }
            });
            setAttendance(newDailyData);
            alert('تمت التعبئة التلقائية بنجاح!');
        }
    };

    if (loading) { return <div className="flex justify-center items-center h-screen"><Loader className="animate-spin text-blue-500" size={48} /></div>; }
    if (!employee) { return <div className="text-center py-10">لم يتم العثور على الموظف.</div>; }
    
    return (
        <div className="p-4 md:p-6" dir="rtl">
            <div className="flex justify-between items-center mb-6">
                <div>
                   <Link to="/attendance" className="flex items-center text-sm text-gray-600 hover:text-blue-600 mb-2"><ChevronLeft size={18} /> العودة للملخص</Link>
                   <h2 className="text-2xl font-semibold">سجل حضور: <span className="text-blue-700">{employee.name}</span></h2>
                   <p className="text-sm text-gray-500">الموقع الافتراضي: {employee.work_location} | ساعات العمل: {employee.hours_per_day}</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={handleAutoFill} className="flex items-center bg-blue-100 text-blue-800 px-4 py-2 rounded-lg hover:bg-blue-200 shadow-sm"><Zap size={18} className="ml-2" />تعبئة تلقائية</button>
                    <button onClick={handleSave} className="flex items-center bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 shadow"><Save size={20} className="mr-2" />حفظ التغييرات</button>
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md mb-6"><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><select value={selectedPeriod.month} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedPeriod({...selectedPeriod, month: Number(e.target.value)})} className="w-full bg-gray-50 px-3 py-2 border rounded-md">{months.map(m => <option key={m.value} value={m.value}>{m.name}</option>)}</select><select value={selectedPeriod.year} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedPeriod({...selectedPeriod, year: Number(e.target.value)})} className="w-full bg-gray-50 px-3 py-2 border rounded-md">{years.map(y => <option key={y} value={y}>{y}</option>)}</select></div></div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
                {payrollDays.map(day => {
                    const dateStr = toYMDString(day);
                    const dayData = attendance[dateStr] || { hours: '', location: employee.work_location };
                    const dayOfWeekJS = day.getUTCDay();
                    const dayNameArabic = Object.keys(dayNameToIndex).find(key => dayNameToIndex[key] === dayOfWeekJS);
                    const isRestDay = (employee.rest_days || []).includes(dayNameArabic || '');
                    const holiday = publicHolidays.find(h => h.date === dateStr);
                    
                    let dayClasses = `p-4 rounded-lg border flex flex-col transition-all ${dayData.hours ? 'bg-green-50' : 'bg-white'}`;
                    if(isRestDay && !holiday) dayClasses = "p-4 rounded-lg border flex flex-col bg-gray-100";
                    if(holiday) dayClasses = "p-4 rounded-lg border flex flex-col bg-yellow-100 border-yellow-300";
                    
                    return (
                        <div key={dateStr} className={dayClasses}>
                            <div className="flex justify-between items-baseline"><p className="font-bold text-gray-800">{day.toLocaleDateString('ar-EG-u-nu-latn', { day: 'numeric', month: 'short' })}</p><p className={`text-sm ${isRestDay || holiday ? 'font-semibold' : 'text-gray-500'}`}>{dayNameArabic}</p></div>
                            {holiday && <p className="text-xs text-center text-yellow-800 font-semibold mt-1" title={holiday.name}>{holiday.name}</p>}
                            
                            <div className="mt-3 space-y-2">
                                <input type="number" value={dayData.hours} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleDataChange(dateStr, 'hours', e.target.value)} placeholder="ساعات" className="block w-full text-center p-1 border rounded text-lg font-bold !text-blue-700 bg-white"/>
                                {!employee.is_head_office && (
                                    <select value={dayData.location} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleDataChange(dateStr, 'location', e.target.value)} className="p-1 border rounded w-full text-sm text-center">
                                        <option value={employee.work_location}>{employee.work_location} (افتراضي)</option>
                                        {allLocations.map(loc => loc !== employee.work_location && <option key={loc} value={loc}>{loc}</option>)}
                                    </select>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    );
}