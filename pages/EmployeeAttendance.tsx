import React, { useState, useMemo, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Save, ChevronLeft } from 'lucide-react';
import type { Employee, AttendanceRecords, PublicHoliday } from '../App';
import { dayNameToIndex } from '../utils/payrollCalculator';


interface EmployeeAttendanceProps {
    employees: Employee[];
    attendanceRecords: AttendanceRecords;
    setAttendanceRecords: React.Dispatch<React.SetStateAction<AttendanceRecords>>;
    publicHolidays: PublicHoliday[];
}

const months = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, name: new Date(0, i).toLocaleString('ar', { month: 'long' }) }));
const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);


function EmployeeAttendance({ employees, attendanceRecords, setAttendanceRecords, publicHolidays }: EmployeeAttendanceProps) {
    const { employeeId } = useParams();
    const [selectedPeriod, setSelectedPeriod] = useState({
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
    });
    const [dailyHours, setDailyHours] = useState<{ [date: string]: string }>({});

    const employee = useMemo(() => employees.find(e => e.id.toString() === employeeId), [employees, employeeId]);

    const payrollDays = useMemo(() => {
        const days = [];
        const { month, year } = selectedPeriod;
        // Start from the 26th of the previous month
        const startDate = new Date(year, month - 2, 26);
        // End on the 25th of the selected month
        const endDate = new Date(year, month - 1, 25);

        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            days.push(new Date(d));
        }
        return days;
    }, [selectedPeriod]);
    
    useEffect(() => {
        if (!employee) return;
        const newDailyHours: { [date: string]: string } = {};
        payrollDays.forEach(day => {
            const dateStr = day.toISOString().split('T')[0];
            const hours = attendanceRecords[dateStr]?.[employee.id] ?? '';
            newDailyHours[dateStr] = hours.toString();
        });
        setDailyHours(newDailyHours);
    }, [employee, payrollDays, attendanceRecords]);


    const handleHourChange = (date: string, value: string) => {
        setDailyHours(prev => ({
            ...prev,
            [date]: value,
        }));
    };
    
    const handleSave = () => {
        if (!employee) return;
        const newAttendanceRecords = { ...attendanceRecords };

        Object.entries(dailyHours).forEach(([dateStr, hoursStr]) => {
            const hours = parseFloat(hoursStr);
            if (!isNaN(hours) && hours > 0) {
                 if (!newAttendanceRecords[dateStr]) {
                    newAttendanceRecords[dateStr] = {};
                 }
                 newAttendanceRecords[dateStr][employee.id] = hours;
            } else {
                 // If the input is empty or invalid, remove the record
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


    if (!employee) {
        return (
            <div className="text-center py-10 text-red-500">
                <h2 className="text-2xl font-bold">خطأ</h2>
                <p>لم يتم العثور على الموظف. قد يكون الرابط غير صحيح.</p>
                <Link to="/attendance" className="text-blue-600 hover:underline mt-4 inline-block">العودة إلى صفحة الحضور</Link>
            </div>
        );
    }
    
    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                   <Link to="/attendance" className="flex items-center text-sm text-gray-600 hover:text-blue-600 mb-2">
                     <ChevronLeft size={18} />
                     العودة للبحث
                   </Link>
                   <h2 className="text-2xl font-semibold text-gray-800">
                       سجل حضور الموظف: <span className="text-blue-700">{employee.name}</span>
                   </h2>
                </div>
                <button
                    onClick={handleSave}
                    className="flex items-center bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors duration-300 shadow"
                >
                    <Save size={20} className="ml-2" />
                    حفظ التغييرات
                </button>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                 <h3 className="text-lg font-semibold text-gray-700 mb-4">اختر فترة العرض</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <select value={selectedPeriod.month} onChange={e => setSelectedPeriod({...selectedPeriod, month: Number(e.target.value)})} className="w-full bg-white px-3 py-2 border border-gray-300 rounded-md">
                         {months.map(m => <option key={m.value} value={m.value}>{m.name}</option>)}
                     </select>
                     <select value={selectedPeriod.year} onChange={e => setSelectedPeriod({...selectedPeriod, year: Number(e.target.value)})} className="w-full bg-white px-3 py-2 border border-gray-300 rounded-md">
                         {years.map(y => <option key={y} value={y}>{y}</option>)}
                     </select>
                 </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {payrollDays.map(day => {
                        const dateStr = day.toISOString().split('T')[0];
                        const dayOfWeekJS = day.getDay(); // Sunday: 0 -> Friday: 5, Saturday: 6
                        const dayNameArabic = Object.keys(dayNameToIndex).find(key => dayNameToIndex[key] === dayOfWeekJS);
                        const isRestDay = employee.restDays.includes(dayNameArabic || '');
                        const holiday = publicHolidays.find(h => h.date === dateStr);

                        let dayClasses = "p-4 rounded-lg border flex flex-col justify-between";
                        if(isRestDay && !holiday) dayClasses += " bg-gray-100";
                        if(holiday) dayClasses += " bg-yellow-100 border-yellow-300";
                        
                        return (
                            <div key={dateStr} className={dayClasses}>
                                <div>
                                    <div className="flex justify-between items-baseline">
                                        <p className="font-bold text-gray-800">{day.toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' })}</p>
                                        <p className={`text-sm ${isRestDay || holiday ? 'font-semibold' : 'text-gray-500'}`}>{dayNameArabic}</p>
                                    </div>
                                    {holiday && <p className="text-xs text-center text-yellow-800 font-semibold mt-1 truncate" title={holiday.name}>{holiday.name}</p>}
                                </div>
                                <div className="mt-3">
                                   <label htmlFor={`hours-${dateStr}`} className="sr-only">ساعات العمل</label>
                                   <input
                                      id={`hours-${dateStr}`}
                                      type="number"
                                      value={dailyHours[dateStr] || ''}
                                      onChange={e => handleHourChange(dateStr, e.target.value)}
                                      placeholder="ساعات العمل"
                                      className="w-full text-center px-2 py-1.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                      min="0"
                                      step="0.5"
                                   />
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