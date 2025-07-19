// --- START OF FILE src/pages/ReportView.tsx ---

import { useParams, Link } from 'react-router-dom';
import type { HistoricalPayroll, Employee } from '../App';
import { ChevronLeft } from 'lucide-react';

// --- تعديل: تعريف الواجهة بشكل صحيح ---
interface ReportViewProps {
  historicalPayrolls: HistoricalPayroll[];
  employees: Employee[];
}

// --- تعديل: إضافة الدالة المساعدة هنا لفك تشفير البيانات القديمة إذا لزم الأمر ---
// هذه الدالة ستحاول العثور على اسم الموظف حتى لو تم حذفه
const getEmployeeName = (employeeId: number | string, allEmployees: Employee[], reportData: any): string => {
    const id = Number(employeeId);
    const currentEmployee = allEmployees.find(emp => emp.id === id);
    if (currentEmployee) {
        return currentEmployee.name;
    }
    // إذا لم نجد الموظف في القائمة الحالية، نحاول البحث عنه في بيانات التقرير نفسه
    const reportEmployee = reportData?.report?.find((r: any) => r.employee.id === id);
    if (reportEmployee) {
        return reportEmployee.employee.name;
    }
    return `موظف محذوف (ID: ${id})`;
};

function ReportView({ historicalPayrolls, employees }: ReportViewProps) {
  const { year, month } = useParams();

  const reportData = historicalPayrolls.find(
    (p) => p.year === Number(year) && p.month === Number(month)
  );

  if (!reportData || !reportData.report) {
    return (
      <div className="text-center py-10">
        <h2 className="text-2xl font-bold text-red-600">لم يتم العثور على التقرير</h2>
        <p className="text-gray-600 mt-2">
          قد يكون الرابط غير صحيح أو لم يتم حفظ تقرير لهذا الشهر بعد.
        </p>
        <Link to="/history" className="text-blue-500 hover:underline mt-4 inline-block">
          العودة إلى سجل التقارير
        </Link>
      </div>
    );
  }

  // --- تعديل: استخدام الدالة الجديدة لعرض اسم الموظف ---
  const report = reportData.report.map(r => ({
    ...r,
    employeeName: getEmployeeName(r.employee.id, employees, reportData)
  }));

  const totals = report.reduce(
    (acc, curr) => {
      acc.totalWorkDays += curr.totalWorkDays;
      acc.basePay += curr.basePay;
      acc.totalOvertimePay += curr.totalOvertimePay;
      acc.totalAllowances += curr.totalAllowances || 0;
      acc.totalBonuses += curr.totalBonuses;
      acc.generalBonus += curr.generalBonus;
      acc.loanInstallment += curr.loanInstallment || 0;
      acc.manualDeduction += curr.manualDeduction || 0;
      acc.netSalary += curr.netSalary;
      return acc;
    },
    { totalWorkDays: 0, basePay: 0, totalOvertimePay: 0, totalAllowances: 0, totalBonuses: 0, generalBonus: 0, loanInstallment: 0, manualDeduction: 0, netSalary: 0 }
  );

  return (
    <div className="p-6">
      <Link to="/history" className="flex items-center text-gray-600 hover:text-blue-600 mb-4">
        <ChevronLeft size={20} />
        العودة للسجل
      </Link>
      <h1 className="text-3xl font-bold mb-6">
        كشف رواتب شهر: {month}/{year}
      </h1>
      <div className="bg-white p-6 rounded-lg shadow-md overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="py-2 px-3 border">الاسم</th>
              <th className="py-2 px-3 border">أيام الحضور</th>
              <th className="py-2 px-3 border">الراتب الأساسي</th>
              <th className="py-2 px-3 border">قيمة الإضافي</th>
              <th className="py-2 px-3 border">البدلات</th>
              <th className="py-2 px-3 border">المكافآت</th>
              <th className="py-2 px-3 border">المنحة العامة</th>
              <th className="py-2 px-3 border">قسط السلفة</th>
              <th className="py-2 px-3 border">خصومات أخرى</th>
              <th className="py-2 px-3 border">صافي الراتب</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {report.map((item: any, index: number) => (
              <tr key={index} className="text-center">
                <td className="py-2 px-3 border font-medium">{item.employeeName}</td>
                <td className="py-2 px-3 border">{item.totalWorkDays}</td>
                <td className="py-2 px-3 border">{item.basePay?.toFixed(2)}</td>
                <td className="py-2 px-3 border">{item.totalOvertimePay?.toFixed(2)}</td>
                <td className="py-2 px-3 border">{(item.totalAllowances || 0).toFixed(2)}</td>
                <td className="py-2 px-3 border">{item.totalBonuses?.toFixed(2)}</td>
                <td className="py-2 px-3 border">{item.generalBonus?.toFixed(2)}</td>
                <td className="py-2 px-3 border">{(item.loanInstallment || 0).toFixed(2)}</td>
                <td className="py-2 px-3 border">{(item.manualDeduction || 0).toFixed(2)}</td>
                <td className="py-2 px-3 border font-bold text-green-700">{item.netSalary?.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-200 font-bold">
            <tr className="text-center">
              <td className="py-2 px-3 border">الإجمالي</td>
              <td className="py-2 px-3 border">{totals.totalWorkDays}</td>
              <td className="py-2 px-3 border">{totals.basePay.toFixed(2)}</td>
              <td className="py-2 px-3 border">{totals.totalOvertimePay.toFixed(2)}</td>
              <td className="py-2 px-3 border">{totals.totalAllowances.toFixed(2)}</td>
              <td className="py-2 px-3 border">{totals.totalBonuses.toFixed(2)}</td>
              <td className="py-2 px-3 border">{totals.generalBonus.toFixed(2)}</td>
              <td className="py-2 px-3 border">{totals.loanInstallment.toFixed(2)}</td>
              <td className="py-2 px-3 border">{totals.manualDeduction.toFixed(2)}</td>
              <td className="py-2 px-3 border text-green-800">{totals.netSalary.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

// --- تم حذف الأجزاء القديمة وغير المستخدمة من هنا ---

export default ReportView;