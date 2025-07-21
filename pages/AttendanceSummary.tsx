// --- START OF FILE src/pages/AttendanceSummary.tsx ---

import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import * as XLSX from 'xlsx'; // --- خطوة 1: استيراد مكتبة Excel ---
import type { Employee, AttendanceRecords, PublicHoliday } from '../App';
import { 
    calculateAttendanceSummary, 
    getPayrollDays, 
    getYearsList, 
    getMonthsList,
    calculateLocationSummary,
    LocationSummary 
} from '../utils/attendanceCalculator';
import { Clock, MapPin, Search, FileDown } from 'lucide-react'; // --- خطوة 2: إضافة أيقونة التصدير ---
import { useAuth } from '../context/AuthContext';

interface AttendanceSummaryProps {
    employees: Employee[];
    attendanceRecords: AttendanceRecords;
    publicHolidays: PublicHoliday[];
}

const months = getMonthsList();
const years = getYearsList();

const formatOvertimeCell = (overtime: { rawHours: number, calculatedValue: number }) => { if (overtime.rawHours === 0) { return <span className="text-gray-400">-</span>; } return (<div className="flex flex-col items-center"><span className="font-bold text-lg">{overtime.calculatedValue.toFixed(1)}</span><span className="text-xs text-gray-500">({overtime.rawHours.toFixed(1)} س)</span></div>); };
const LocationDistribution = ({ summary }: { summary: LocationSummary }) => { const entries = Object.entries(summary); if (entries.length === 0) { return <span className="text-gray-400">-</span>; } return (<div className="flex flex-col items-start text-xs space-y-1">{entries.map(([location, days]) => (<div key={location} className="flex items-center gap-2 bg-gray-100 px-2 py-1 rounded"><MapPin size={12} className="text-gray-500" /><span className="font-semibold text-gray-800">{location}:</span><span className="text-blue-600 font-bold">{days} يوم</span></div>))}</div>); };


function AttendanceSummary({ employees, attendanceRecords, publicHolidays }: AttendanceSummaryProps) {
    const [selectedPeriod, setSelectedPeriod] = useState({ month: new Date().getMonth() + 1, year: new Date().getFullYear(), });
    const [searchTerm, setSearchTerm] = useState('');
    const { can } = useAuth();

    const payrollDays = useMemo(() => getPayrollDays(selectedPeriod.year, selectedPeriod.month), [selectedPeriod]);

    const employeesSummary = useMemo(() => {
        const filteredEmployees = employees.filter(emp => 
            emp.name.toLowerCase().includes(searchTerm.toLowerCase())
        );

        return filteredEmployees.map(employee => {
            const summary = calculateAttendanceSummary(employee, attendanceRecords, publicHolidays, payrollDays);
            const locationSummary = calculateLocationSummary(employee, attendanceRecords, payrollDays);
            return { ...employee, summary, locationSummary };
        });
    }, [employees, attendanceRecords, publicHolidays, payrollDays, searchTerm]);

    // --- خطوة 3: إنشاء دالة التصدير ---
    const handleExport = () => {
        if (employeesSummary.length === 0) {
            alert("لا توجد بيانات لتصديرها.");
            return;
        }

        const dataForExport = employeesSummary.map(emp => ({
            'اسم الموظف': emp.name,
            'أيام الحضور': emp.summary.actualAttendanceDays,
            'توزيع الحضور بالموقع': Object.entries(emp.locationSummary).map(([loc, days]) => `${loc}: ${days} يوم`).join('\n'),
            'ساعات إضافي عمل (فعلية)': emp.summary.weekdayOvertime.rawHours.toFixed(1),
            'قيمة إضافي عمل (محتسبة)': emp.summary.weekdayOvertime.calculatedValue.toFixed(1),
            'ساعات إضافي خميس (فعلية)': emp.summary.thursdayOvertime.rawHours.toFixed(1),
            'قيمة إضافي خميس (محتسبة)': emp.summary.thursdayOvertime.calculatedValue.toFixed(1),
            'ساعات إضافي راحة (فعلية)': emp.summary.restDayOvertime.rawHours.toFixed(1),
            'قيمة إضافي راحة (محتسبة)': emp.summary.restDayOvertime.calculatedValue.toFixed(1),
            'ساعات إضافي عطلة (فعلية)': emp.summary.holidayOvertime.rawHours.toFixed(1),
            'قيمة إضافي عطلة (محتسبة)': emp.summary.holidayOvertime.calculatedValue.toFixed(1),
            'إجمالي الساعات المحتسبة': emp.summary.totalOvertimeValue.toFixed(1),
        }));

        const ws = XLSX.utils.json_to_sheet(dataForExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, `ملخص حضور ${selectedPeriod.month}-${selectedPeriod.year}`);
        
        // تعديل عرض الأعمدة ليكون مناسباً
        ws['!cols'] = [
            { wch: 25 }, // اسم الموظف
            { wch: 12 }, // أيام الحضور
            { wch: 30 }, // توزيع الحضور
            { wch: 20 }, { wch: 20 }, // إضافي عمل
            { wch: 20 }, { wch: 20 }, // إضافي خميس
            { wch: 20 }, { wch: 20 }, // إضافي راحة
            { wch: 20 }, { wch: 20 }, // إضافي عطلة
            { wch: 20 }, // الإجمالي
        ];

        XLSX.writeFile(wb, `AttendanceSummary_${selectedPeriod.year}_${selectedPeriod.month}.xlsx`);
    };

    return (
        <div className="p-4 md:p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-800">ملخص حضور الموظفين</h2>
                {/* --- خطوة 4: إضافة زر التصدير --- */}
                <button 
                    onClick={handleExport}
                    className="flex items-center bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 shadow-sm transition-colors"
                >
                    <FileDown size={20} className="ml-2" />
                    تصدير Excel
                </button>
            </div>
            
            <div className="bg-white p-4 md:p-6 rounded-lg shadow-md mb-6">
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <div>
                        <label className="text-sm font-medium text-gray-700">الشهر</label>
                        <select value={selectedPeriod.month} onChange={e => setSelectedPeriod({...selectedPeriod, month: Number(e.target.value)})} className="w-full mt-1 bg-gray-50 px-3 py-2 border border-gray-300 rounded-md">{months.map(m => <option key={m.value} value={m.value}>{m.name}</option>)}</select>
                     </div>
                     <div>
                        <label className="text-sm font-medium text-gray-700">السنة</label>
                        <select value={selectedPeriod.year} onChange={e => setSelectedPeriod({...selectedPeriod, year: Number(e.target.value)})} className="w-full mt-1 bg-gray-50 px-3 py-2 border border-gray-300 rounded-md">{years.map(y => <option key={y} value={y}>{y}</option>)}</select>
                     </div>
                     <div className="relative">
                        <label className="text-sm font-medium text-gray-700">بحث بالاسم</label>
                        <Search className="absolute right-3 top-[43px] -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="اكتب اسم الموظف..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full mt-1 bg-gray-50 px-3 py-2 pr-10 border border-gray-300 rounded-md"
                        />
                     </div>
                 </div>
            </div>

            <div className="bg-white rounded-lg shadow-md overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-100">
                        <tr>
                            <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">اسم الموظف</th>
                            <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">أيام الحضور</th>
                            <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">توزيع الحضور بالموقع</th>
                            <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">إضافي عمل</th>
                            <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">إضافي خميس</th>
                            <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">إضافي راحة</th>
                            <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">إضافي عطلة</th>
                            <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-blue-800 bg-blue-100 uppercase tracking-wider">إجمالي الساعات المحتسبة</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {employeesSummary.length === 0 ? (
                           <tr>
                                <td colSpan={8} className="text-center py-10 text-gray-500">
                                    {searchTerm ? 'لم يتم العثور على موظفين بهذا الاسم.' : 'لا توجد بيانات حضور لهذه الفترة.'}
                                </td>
                           </tr>
                        ) : (
                            employeesSummary.map(emp => (
                                <tr key={emp.id} className="hover:bg-gray-50 transition-colors duration-150">
                                    <td className="px-4 py-4 whitespace-nowrap">
                                        {can('edit', 'Attendance') ? (
                                            <Link to={`/attendance/${emp.id}`} className="font-medium text-blue-600 hover:text-blue-800 hover:underline">
                                                {emp.name}
                                            </Link>
                                        ) : (
                                            <span className="font-medium text-gray-800">{emp.name}</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-center text-gray-800 font-semibold">{emp.summary.actualAttendanceDays}</td>
                                    <td className="px-4 py-4 whitespace-nowrap"><LocationDistribution summary={emp.locationSummary} /></td>
                                    <td className="px-4 py-4 whitespace-nowrap text-center">{formatOvertimeCell(emp.summary.weekdayOvertime)}</td>
                                    <td className="px-4 py-4 whitespace-nowrap text-center">{formatOvertimeCell(emp.summary.thursdayOvertime)}</td>
                                    <td className="px-4 py-4 whitespace-nowrap text-center text-green-700">{formatOvertimeCell(emp.summary.restDayOvertime)}</td>
                                    <td className="px-4 py-4 whitespace-nowrap text-center text-purple-700">{formatOvertimeCell(emp.summary.holidayOvertime)}</td>
                                    <td className="px-4 py-4 whitespace-nowrap text-center text-blue-800 bg-blue-50"><div className="flex items-center justify-center font-bold text-lg"><Clock size={16} className="mr-2" />{emp.summary.totalOvertimeValue.toFixed(1)}</div></td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default AttendanceSummary;