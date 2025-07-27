// --- START OF FILE src/components/CostAnalysisModal.tsx (الكامل والنهائي) ---

import React, { useMemo } from 'react';
import { X, FileDown } from 'lucide-react';
import * as XLSX from 'xlsx';
import { calculateCostDistribution } from '../utils/fullAttendanceCalculator.ts';

export default function CostAnalysisModal({ employees, attendanceRecords, publicHolidays, payrollDays, onClose, bonuses, loans, payrollSettings, payrollData, periodKey }) {
  
  const analysisData = useMemo(() => {
    const data: { [empName: string]: { distribution: any, netSalary: number } } = {};
    const excludedEmployees = new Set(payrollSettings?.excluded_employee_ids || []);
    const generalBonusDays = payrollSettings?.general_bonus_days || 0;
    
    employees.forEach(emp => {
      const empPayrollData = payrollData.find(pd => pd.employee.id === emp.id);
      if (!empPayrollData) return;

      const distribution = calculateCostDistribution(
        emp, 
        attendanceRecords, 
        publicHolidays, 
        payrollDays, 
        bonuses, 
        loans, 
        periodKey, 
        excludedEmployees, 
        generalBonusDays,
        empPayrollData.totalOvertimePay,
        empPayrollData.loanInstallment
      );
      data[emp.name] = { distribution, netSalary: empPayrollData.netSalary };
    });
    return data;
  }, [employees, attendanceRecords, publicHolidays, payrollDays, bonuses, loans, payrollSettings, payrollData]);

  const grandTotals = useMemo(() => {
    return Object.values(analysisData).reduce((acc: any, { distribution }) => {
        Object.values(distribution).forEach((details: any) => {
            acc.baseCost += details.baseCost;
            acc.allowancesCost += details.allowancesCost;
            acc.otherAdditions += details.otherAdditions;
            acc.totalDeductions += details.totalDeductions;
            acc.netCost += details.netCost;
        });
        return acc;
    }, { baseCost: 0, allowancesCost: 0, otherAdditions: 0, totalDeductions: 0, netCost: 0 });
  }, [analysisData]);
  
  const handleExportAnalysis = () => { /* ... (منطق التصدير يمكن إضافته هنا) ... */ };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white p-6 rounded-lg shadow-2xl w-full max-w-7xl h-[95vh] flex flex-col" dir="rtl">
        <div className="flex-shrink-0 flex justify-between items-center mb-4 border-b pb-3">
          <h2 className="text-2xl font-bold">تقرير تحليل التكاليف</h2>
          <div className="flex gap-4">
            <button onClick={handleExportAnalysis} className="flex items-center bg-teal-600 text-white px-3 py-2 rounded-lg"><FileDown size={16} className="ml-2" />تصدير</button>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-800"><X size={28} /></button>
          </div>
        </div>
        <div className="flex-1 overflow-auto">
          <table className="w-full text-sm border-collapse">
            <thead className="bg-gray-100 sticky top-0 z-10">
              <tr>
                <th className="border p-2">الموظف</th>
                <th className="border p-2 bg-green-100">صافي الراتب</th>
                <th className="border p-2">الموقع</th>
                <th className="border p-2">أيام</th>
                <th className="border p-2">تكلفة الأساسي</th>
                <th className="border p-2">تكلفة البدلات</th>
                <th className="border p-2">تكلفة إضافي ومنح</th>
                <th className="border p-2 text-red-600">تكلفة الخصومات</th>
                <th className="border p-2 bg-blue-100">صافي تكلفة الموقع</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(analysisData).length === 0 && (
                <tr><td colSpan={9} className="text-center p-8 text-gray-500">لا توجد بيانات لعرضها.</td></tr>
              )}
              {Object.entries(analysisData).map(([empName, { distribution, netSalary }]) => {
                const distributionEntries = Object.entries(distribution);
                if (distributionEntries.length === 0) return null;
                return (
                  <React.Fragment key={empName}>
                    {distributionEntries.map(([locationName, details]: [string, any], index) => (
                      <tr key={`${empName}-${locationName}`} className="hover:bg-gray-50 border-b">
                        {index === 0 && <td className="border-l p-2 font-semibold align-middle" rowSpan={distributionEntries.length}>{empName}</td>}
                        {index === 0 && <td className="border-l p-2 text-center font-bold text-green-800 bg-green-50 align-middle" rowSpan={distributionEntries.length}>{netSalary.toFixed(2)}</td>}
                        <td className="border-l p-2">{locationName}</td>
                        <td className="border-l p-2 text-center font-mono">{details.days.toFixed(1)}</td>
                        <td className="border-l p-2 text-center">{details.baseCost.toFixed(2)}</td>
                        <td className="border-l p-2 text-center">{details.allowancesCost.toFixed(2)}</td>
                        <td className="border-l p-2 text-center text-green-700">{details.otherAdditions.toFixed(2)}</td>
                        <td className="border-l p-2 text-center text-red-700">{details.totalDeductions.toFixed(2)}</td>
                        <td className="border-x p-2 text-center bg-blue-50 font-bold">{details.netCost.toFixed(2)}</td>
                      </tr>
                    ))}
                  </React.Fragment>
                )
              })}
            </tbody>
            <tfoot className="bg-gray-200 font-bold">
              <tr>
                <td className="border p-2" colSpan={4}>الإجمالي الكلي</td>
                <td className="border p-2 text-center">{grandTotals.baseCost.toFixed(2)}</td>
                <td className="border p-2 text-center">{grandTotals.allowancesCost.toFixed(2)}</td>
                <td className="border p-2 text-center text-green-800">{grandTotals.otherAdditions.toFixed(2)}</td>
                <td className="border p-2 text-center text-red-800">{grandTotals.totalDeductions.toFixed(2)}</td>
                <td className="border p-2 text-center bg-blue-200 text-blue-800">{grandTotals.netCost.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}