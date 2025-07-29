// --- START OF FILE src/components/CostAnalysisModal.tsx (النسخة النهائية الصحيحة) ---

import React, { useMemo } from 'react';
import { X, FileDown } from 'lucide-react';
import * as XLSX from 'xlsx';
import { calculateCostDistribution } from '../utils/fullAttendanceCalculator.ts';
import type { Employee, Loan, BonusDeduction, PayrollReportItem, AttendanceRecords, PublicHoliday } from '../types.ts';

// --- بداية التعديل 1: إزالة props غير مستخدمة من الواجهة ---
interface CostAnalysisModalProps {
  employees: Employee[];
  attendanceRecords: AttendanceRecords;
  payrollDays: Date[];
  onClose: () => void;
  bonuses: BonusDeduction[];
  payrollSettings: any;
  payrollData: PayrollReportItem[];
  periodKey: string;
  // تم حذف publicHolidays و loans من هنا
}
// --- نهاية التعديل 1 ---

// --- بداية التعديل 2: إزالة props غير مستخدمة من تعريف المكون ---
export default function CostAnalysisModal({ employees, attendanceRecords, payrollDays, onClose, bonuses, payrollSettings, payrollData, periodKey }: CostAnalysisModalProps) {
// --- نهاية التعديل 2 ---
  
  const analysisData = useMemo(() => {
    const data: { [empName: string]: { distribution: any, netSalary: number } } = {};
    const excludedEmployees = new Set<number>(payrollSettings?.excluded_employee_ids || []);
    const generalBonusDays = payrollSettings?.general_bonus_days || 0;
    
    employees.forEach((emp: Employee) => {
      const empPayrollData = payrollData.find((pd: PayrollReportItem) => pd.employee.id === emp.id);
      if (!empPayrollData) return;

      const distribution = calculateCostDistribution(
        emp, 
        attendanceRecords, 
        payrollDays, 
        bonuses, 
        excludedEmployees, 
        generalBonusDays,
        empPayrollData.totalOvertimePay,
        empPayrollData.loanInstallment
      );
      
      data[emp.name] = { distribution, netSalary: empPayrollData.netSalary };
    });
    return data;
  // --- بداية التعديل 3: إزالة props غير مستخدمة من مصفوفة الاعتماديات ---
  }, [employees, attendanceRecords, payrollDays, bonuses, payrollSettings, payrollData]);
  // --- نهاية التعديل 3 ---

  const grandTotals = useMemo(() => {
    return Object.values(analysisData).reduce((acc: any, { distribution }) => {
        if (!distribution) return acc; // حماية إضافية
        Object.values(distribution).forEach((details: any) => {
            acc.baseCost = (acc.baseCost || 0) + details.baseCost;
            acc.allowancesCost = (acc.allowancesCost || 0) + details.allowancesCost;
            acc.otherAdditions = (acc.otherAdditions || 0) + details.otherAdditions;
            acc.totalDeductions = (acc.totalDeductions || 0) + details.totalDeductions;
            acc.netCost = (acc.netCost || 0) + details.netCost;
        });
        return acc;
    }, { baseCost: 0, allowancesCost: 0, otherAdditions: 0, totalDeductions: 0, netCost: 0 });
  }, [analysisData]);
  
  const handleExportAnalysis = () => {
    const dataForExport: (string | number)[][] = [['الموظف', 'صافي الراتب', 'الموقع', 'أيام', 'تكلفة الأساسي', 'تكلفة البدلات', 'تكلفة إضافي ومنح', 'تكلفة الخصومات', 'صافي تكلفة الموقع']];
    Object.entries(analysisData).forEach(([empName, { distribution, netSalary }]: [string, any]) => {
      if (!distribution) return; // حماية إضافية
      Object.entries(distribution).forEach(([locationName, details]: [string, any], index: number) => {
        dataForExport.push([
            index === 0 ? empName : '',
            index === 0 ? netSalary.toFixed(2) : '',
            locationName, details.days.toFixed(1), details.baseCost.toFixed(2),
            details.allowancesCost.toFixed(2), details.otherAdditions.toFixed(2),
            details.totalDeductions.toFixed(2), details.netCost.toFixed(2)
        ]);
      });
    });
    dataForExport.push(['الإجمالي', '', '', '', grandTotals.baseCost.toFixed(2), grandTotals.allowancesCost.toFixed(2), grandTotals.otherAdditions.toFixed(2), grandTotals.totalDeductions.toFixed(2), grandTotals.netCost.toFixed(2)]);
    const ws = XLSX.utils.aoa_to_sheet(dataForExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "تحليل التكاليف");
    XLSX.writeFile(wb, `CostAnalysis_${periodKey}.xlsx`);
  };

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
          {/* باقي الكود لم يتغير */}
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
              {Object.entries(analysisData).map(([empName, { distribution, netSalary }]: [string, any]) => {
                if (!distribution) return null; // حماية إضافية
                const distributionEntries = Object.entries(distribution);
                if (distributionEntries.length === 0) return null;
                return (
                  <React.Fragment key={empName}>
                    {distributionEntries.map(([locationName, details]: [string, any], index: number) => (
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