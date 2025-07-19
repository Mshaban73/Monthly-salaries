// --- START OF FILE src/pages/AttendanceSummary.tsx ---

import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import type { Employee, AttendanceRecords, PublicHoliday } from '../App';
// --- تعديل: استيراد الدوال الموحدة الجديدة ---
import { 
    calculateAttendanceSummary, 
    getPayrollDays, 
    getYearsList, 
    getMonthsList 
} from '../utils/attendanceCalculator';
import { Clock } from 'lucide-react';

interface AttendanceSummaryProps {
    employees: Employee[];
    attendanceRecords: AttendanceRecords;
    publicHolidays: PublicHoliday[];
}

// --- تعديل: استخدام الدوال الموحدة لإنشاء القوائم ---
const months = getMonthsList();
const years = getYearsList();

// دالة مساعدة لتنسيق عرض خلايا الإضافي
const formatOvertimeCell = (overtime: { rawHours: number, calculatedValue: number }) => {
    if (overtime.rawHours === 0) {
        return <span className="text-gray-400">-</span>;
    }
    return (
        <div className="flex flex-col items-center">
            <span className="font-bold text-lg">{overtime.calculatedValue.toFixed(1)}</span>
            <span className="text-xs text-gray-500">({overtime.rawHours.toFixed(1)} س)</span>
        </div>
    );
};

function AttendanceSummary({ employees, attendanceRecords, publicHolidays }: AttendanceSummaryProps) {
    const [selectedPeriod, setSelectedPeriod] = useState({
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
    });

    // --- تعديل: استخدام الدالة الموحدة لحساب أيام كشف الراتب ---
    const payrollDays = useMemo(() => {
        return getPayrollDays(selectedPeriod.year, selectedPeriod.month);
    }, [selectedPeriod]);

    const employeesSummary = useMemo(() => {
        return employees.map(employee => {
            const summary = calculateAttendanceSummary(employee, attendanceRecords, publicHolidays, payrollDays);
            return { ...employee, summary };
        });
    }, [employees, attendanceRecords, publicHolidays, payrollDays]);

    return (
        <div className="p-4 md:p-6">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6">ملخص حضور الموظفين</h2>
            
            <div className="bg-white p-4 md:p-6 rounded-lg shadow-md mb-6">
                 <h3 className="text-lg font-semibold text-gray-700 mb-4">اختر فترة العرض</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <select 
                         value={selectedPeriod.month} 
                         onChange={e => setSelectedPeriod({...selectedPeriod, month: Number(e.target.value)})} 
                         className="w-full bg-gray-50 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                     >
                         {months.map(m => <option key={m.value} value={m.value}>{m.name}</option>)}
                     </select>
                     <select 
                         value={selectedPeriod.year} 
                         onChange={e => setSelectedPeriod({...selectedPeriod, year: Number(e.target.value)})} 
                         className="w-full bg-gray-50 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                     >
                         {years.map(y => <option key={y} value={y}>{y}</option>)}
                     </select>
                 </div>
            </div>

            <div className="bg-white rounded-lg shadow-md overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-100">
                        <tr>
                            <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">اسم الموظف</th>
                            <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">نوع الراتب</th>
                            <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">أيام الحضور</th>
                            <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">إضافي عمل (مُحتسب)</th>
                            <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">إضافي خميس (مُحتسب)</th>
                            <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">إضافي راحة (مُحتسب)</th>
                            <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">إضافي عطلة (مُحتسب)</th>
                            <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-blue-800 bg-blue-100 uppercase tracking-wider">إجمالي الساعات المحتسبة</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {employeesSummary.map(emp => (
                            <tr key={emp.id} className="hover:bg-gray-50 transition-colors duration-150">
                                <td className="px-4 py-4 whitespace-nowrap">
                                    <Link to={`/attendance/${emp.id}`} className="font-medium text-blue-600 hover:text-blue-800 hover:underline">
                                        {emp.name}
                                    </Link>
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-center">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${emp.salaryType === 'شهري' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                        {emp.salaryType}
                                    </span>
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-center text-gray-800 font-semibold">{emp.summary.actualAttendanceDays}</td>
                                <td className="px-4 py-4 whitespace-nowrap text-center">{formatOvertimeCell(emp.summary.weekdayOvertime)}</td>
                                <td className="px-4 py-4 whitespace-nowrap text-center">{formatOvertimeCell(emp.summary.thursdayOvertime)}</td>
                                <td className="px-4 py-4 whitespace-nowrap text-center text-green-700">{formatOvertimeCell(emp.summary.restDayOvertime)}</td>
                                <td className="px-4 py-4 whitespace-nowrap text-center text-purple-700">{formatOvertimeCell(emp.summary.holidayOvertime)}</td>
                                <td className="px-4 py-4 whitespace-nowrap text-center text-blue-800 bg-blue-50">
                                    <div className="flex items-center justify-center font-bold text-lg">
                                        <Clock size={16} className="mr-2" />
                                        {emp.summary.totalOvertimeValue.toFixed(1)}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default AttendanceSummary;