// --- START OF FILE src/pages/EmployeeAttendance.tsx (النسخة النهائية والمصححة) ---

import React, { useState, useMemo, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Save, ChevronLeft, Zap } from 'lucide-react';
import type { Employee, AttendanceRecords, PublicHoliday, AttendanceRecordDetail } from '../App';
import { getPayrollDays, getYearsList, getMonthsList, toYMDString } from '../utils/attendanceCalculator';

const dayNameToIndex: { [key: string]: number } = { 'الأحد': 0, 'الاثنين': 1, 'الثلاثاء': 2, 'الأربعاء': 3, 'الخميس': 4, 'الجمعة': 5, 'السبت': 6 };

interface EmployeeAttendanceProps {
    employees: Employee[];
    attendanceRecords: AttendanceRecords;
    setAttendanceRecords: React.Dispatch<React.SetStateAction<AttendanceRecords>>;
    publicHolidays: PublicHoliday[];
}

const months = getMonthsList();
const years = getYearsList();

interface DailyAttendanceState {
    [date: string]: {
        hours: string;
        location: string;
    };
}

function EmployeeAttendance({ employees, attendanceRecords, setAttendanceRecords, publicHolidays }: EmployeeAttendanceProps) {
    const { employeeId } = useParams<{ employeeId: string }>();
    const [selectedPeriod, setSelectedPeriod] = useState({ month: new Date().getMonth() + 1, year: new Date().getFullYear() });
    const [dailyData, setDailyData] = useState<DailyAttendanceState>({});

    const employee = useMemo(() => employees.find(e => e.id.toString() === employeeId), [employees, employeeId]);
    
    const workLocations = useMemo(() => {
        const allLocations = employees.map(e => e.workLocation);
        return [...new Set(allLocations)].filter(loc => loc && loc.trim() !== '');
    }, [employees]);
    
    const payrollDays = useMemo(() => getPayrollDays(selectedPeriod.year, selectedPeriod.month), [selectedPeriod]);
    
    useEffect(() => {
        if (!employee) return;
        const newDailyData: DailyAttendanceState = {};
        payrollDays.forEach(day => {
            const dateStr = toYMDString(day);
            const record = attendanceRecords[dateStr]?.[employee.id];
            newDailyData[dateStr] = {
                hours: record?.hours?.toString() || '',
                location: record?.location || employee.workLocation || '',
            };
        });
        setDailyData(newDailyData);
    }, [employee, payrollDays, attendanceRecords]);

    const handleDataChange = (date: string, field: 'hours' | 'location', value: string) => {
        setDailyData(prev => ({
            ...prev,
            [date]: {
                ...prev[date],
                [field]: value,
            },
        }));
    };
    
    const handleSave = () => {
        if (!employee) return;
        const newAttendanceRecords = { ...attendanceRecords };

        Object.entries(dailyData).forEach(([dateStr, { hours: hoursStr, location }]) => {
            const hours = parseFloat(hoursStr);
            if (!isNaN(hours) && hours > 0) {
                 if (!newAttendanceRecords[dateStr]) {
                    newAttendanceRecords[dateStr] = {};
                 }
                 const record: AttendanceRecordDetail = { hours };
                 if (!employee.isHeadOffice && location) {
                    record.location = location;
                 }
                 newAttendanceRecords[dateStr][employee.id] = record;
            } else {
                 if (newAttendanceRecords[dateStr]) {
                    delete newAttendanceRecords[dateStr][employee.id];
                    if(Object.keys(newAttendanceRecords[dateStr]).length === 0){
                        delete newAttendanceRecords[dateStr];
                    }
                 }
            }
        });

        setAttendanceRecords(newAttendanceRecords);
        alert('تم حفظ سجل الحضور بنجاح!');
    };
    
    // --- START: تم تصحيح هذه الدالة بالكامل ---
    const handleAutoFill = () => {
        if (!employee) return;

        if (window.confirm(`هل أنت متأكد؟ سيتم تعبئة ساعات العمل الافتراضية لجميع أيام العمل، مع مراعاة يوم الخميس. سيتم الكتابة فوق أي بيانات موجودة.`)) {
            const newDailyData = { ...dailyData };

            payrollDays.forEach(day => {
                const dateStr = toYMDString(day);
                const dayOfWeekJS = day.getUTCDay();
                const dayNameArabic = Object.keys(dayNameToIndex).find(key => dayNameToIndex[key] === dayOfWeekJS);
                const isRestDay = employee.restDays.includes(dayNameArabic || '');
                const isHoliday = publicHolidays.some(h => h.date === dateStr);

                // قم بالتعبئة فقط إذا كان يوم عمل
                if (!isRestDay && !isHoliday) {
                    let hoursToFill: string;

                    // --- تعديل: إضافة منطق خاص بيوم الخميس ---
                    if (dayNameArabic === 'الخميس') {
                        hoursToFill = employee.isHeadOffice ? '3' : '4';
                    } else {
                        hoursToFill = employee.hoursPerDay.toString();
                    }

                    newDailyData[dateStr] = {
                        hours: hoursToFill,
                        location: dailyData[dateStr]?.location || employee.workLocation || '',
                    };
                }
            });

            setDailyData(newDailyData);
            alert('تمت التعبئة التلقائية بنجاح!');
        }
    };
    // --- END: نهاية الدالة المصححة ---

    if (!employee) { return ( <div className="text-center py-10 text-red-500"><h2 className="text-2xl font-bold">خطأ</h2><p>لم يتم العثور على الموظف.</p><Link to="/attendance" className="text-blue-600 hover:underline mt-4 inline-block">العودة لصفحة الملخص</Link></div> ); }
    
    return (
        <div className="p-4 md:p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                   <Link to="/attendance" className="flex items-center text-sm text-gray-600 hover:text-blue-600 mb-2"><ChevronLeft size={18} />العودة لصفحة الملخص</Link>
                   <h2 className="text-2xl font-semibold text-gray-800">سجل حضور الموظف: <span className="text-blue-700">{employee.name}</span></h2>
                   <p className="text-sm text-gray-500">الموقع الافتراضي: {employee.workLocation} | ساعات العمل الافتراضية: {employee.hoursPerDay}</p>
                </div>
                <button onClick={handleSave} className="flex items-center bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 shadow"><Save size={20} className="mr-2" />حفظ التغييرات</button>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                 <h3 className="text-lg font-semibold text-gray-700 mb-4">اختر فترة العرض وقم بالإجراءات</h3>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <select value={selectedPeriod.month} onChange={e => setSelectedPeriod({...selectedPeriod, month: Number(e.target.value)})} className="w-full bg-gray-50 px-3 py-2 border rounded-md">{months.map(m => <option key={m.value} value={m.value}>{m.name}</option>)}</select>
                     <select value={selectedPeriod.year} onChange={e => setSelectedPeriod({...selectedPeriod, year: Number(e.target.value)})} className="w-full bg-gray-50 px-3 py-2 border rounded-md">{years.map(y => <option key={y} value={y}>{y}</option>)}</select>
                     <button
                        onClick={handleAutoFill}
                        className="flex items-center justify-center bg-blue-100 text-blue-800 px-4 py-2 rounded-lg hover:bg-blue-200 shadow-sm transition-colors"
                     >
                        <Zap size={18} className="ml-2" />
                        تعبئة تلقائية لأيام العمل
                     </button>
                 </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {payrollDays.map(day => {
                        const dateStr = toYMDString(day);
                        const dayData = dailyData[dateStr] || { hours: '', location: '' };
                        const dayOfWeekJS = day.getUTCDay();
                        const dayNameArabic = Object.keys(dayNameToIndex).find(key => dayNameToIndex[key] === dayOfWeekJS);
                        const isRestDay = employee.restDays.includes(dayNameArabic || '');
                        const holiday = publicHolidays.find(h => h.date === dateStr);

                        let dayClasses = "p-4 rounded-lg border flex flex-col justify-between transition-all";
                        if(isRestDay && !holiday) dayClasses += " bg-gray-100";
                        if(holiday) dayClasses += " bg-yellow-100 border-yellow-300";
                        
                        return (
                            <div key={dateStr} className={dayClasses}>
                                <div>
                                    <div className="flex justify-between items-baseline"><p className="font-bold text-gray-800">{day.toLocaleDateString('ar-EG-u-nu-latn', { day: 'numeric', month: 'short', timeZone: 'UTC' })}</p><p className={`text-sm ${isRestDay || holiday ? 'font-semibold' : 'text-gray-500'}`}>{dayNameArabic}</p></div>
                                    {holiday && <p className="text-xs text-center text-yellow-800 font-semibold mt-1 truncate" title={holiday.name}>{holiday.name}</p>}
                                </div>
                                <div className="mt-3 space-y-2">
                                   <input id={`hours-${dateStr}`} type="number" value={dayData.hours} onChange={e => handleDataChange(dateStr, 'hours', e.target.value)} placeholder="ساعات" className="w-full text-center px-2 py-1.5 border rounded-md" min="0" step="0.5" />
                                   {!employee.isHeadOffice && (
                                    <select id={`location-${dateStr}`} value={dayData.location} onChange={e => handleDataChange(dateStr, 'location', e.target.value)} className="w-full text-center px-2 py-1.5 border rounded-md bg-white text-sm">
                                        <option value={employee.workLocation}>-- {employee.workLocation} (افتراضي) --</option>
                                        {workLocations.filter(loc => loc !== employee.workLocation).map(loc => (
                                            <option key={loc} value={loc}>{loc}</option>
                                        ))}
                                    </select>
                                   )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

export default EmployeeAttendance;