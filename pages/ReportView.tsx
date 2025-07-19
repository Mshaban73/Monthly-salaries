import React, { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { HistoricalPayroll } from '../App';
import { ChevronLeft, Download, AlertTriangle } from 'lucide-react';

interface ReportViewProps {
  historicalPayrolls: HistoricalPayroll[];
}

const months = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, name: new Date(0, i).toLocaleString('ar', { month: 'long' }) }));

function ReportView({ historicalPayrolls }: ReportViewProps) {
  const { year, month } = useParams();
  
  const reportData = useMemo(() => {
    if (!year || !month) return null;
    return historicalPayrolls.find(p => p.year === Number(year) && p.month === Number(month));
  }, [historicalPayrolls, year, month]);

  const handleDownloadCSV = () => {
    if (!reportData || !reportData.report) return;

    const headers = [
      "اسم الموظف", "الوظيفة", "موقع العمل", "نوع الراتب",
      "الراتب الأساسي", "إجمالي أجر الإضافي", "المكافآت", "الخصومات", "صافي الراتب"
    ];
    
    const rows = reportData.report.map(rep => [
      `"${rep.employee.name}"`,
      `"${rep.employee.jobTitle}"`,
      `"${rep.employee.workLocation}"`,
      `"${rep.employee.salaryType}"`,
      rep.basePay.toFixed(2),
      rep.totalOvertimePay.toFixed(2),
      rep.bonus.toFixed(2),
      rep.deduction.toFixed(2),
      rep.netSalary.toFixed(2)
    ].join(','));
    
    const csvContent = "\uFEFF" + [headers.join(','), ...rows].join('\r\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `payroll_report_${year}_${month}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generateDateRangeForMonth = (year: number, month: number): string[] => {
    let startDate = new Date(year, month - 2, 26); // من 26 الشهر السابق
    let endDate = new Date(year, month - 1, 25);   // إلى 25 الشهر الحالي
    const dates: string[] = [];
    let current = new Date(startDate);

    while (current <= endDate) {
      dates.push(current.toISOString().split("T")[0]);
      current.setDate(current.getDate() + 1);
    }

    return dates;
  };

  const days = generateDateRangeForMonth(Number(year), Number(month));

  if (!reportData) {
    return (
      <div className="text-center py-10 bg-white rounded-lg shadow-md">
        <AlertTriangle size={40} className="mx-auto text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-red-600">خطأ</h2>
        <p className="text-gray-600 mt-2">لم يتم العثور على التقرير المطلوب.</p>
        <Link to="/history" className="text-blue-600 hover:underline mt-4 inline-block">العودة إلى سجل الرواتب</Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <Link to="/history" className="flex items-center text-sm text-gray-600 hover:text-blue-600 mb-2">
            <ChevronLeft size={18} />
            العودة لسجل الرواتب
          </Link>
          <h2 className="text-3xl font-bold text-gray-800">
            كشف رواتب شهر {months.find(m => m.value === Number(month))?.name} {year}
          </h2>
        </div>
        {reportData.report && (
          <button onClick={handleDownloadCSV} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors duration-300 shadow flex items-center">
            <Download size={20} className="ml-2" />
            تحميل التقرير (CSV)
          </button>
        )}
      </div>
      
      <div className="bg-white p-6 rounded-xl shadow-lg overflow-x-auto">
        {reportData.report && (
          <table className="min-w-full bg-white mb-6">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-3 px-2 text-right text-xs font-medium text-gray-500 uppercase">الموظف</th>
                <th className="py-3 px-2 text-right text-xs font-medium text-gray-500 uppercase">الوظيفة</th>
                <th className="py-3 px-2 text-right text-xs font-medium text-gray-500 uppercase">موقع العمل</th>
                <th className="py-3 px-2 text-right text-xs font-medium text-gray-500 uppercase">نوع الراتب</th>
                <th className="py-3 px-2 text-right text-xs font-medium text-gray-500 uppercase">الراتب الأساسي</th>
                <th className="py-3 px-2 text-right text-xs font-medium text-gray-500 uppercase">إجمالي الإضافي</th>
                <th className="py-3 px-2 text-right text-xs font-medium text-gray-500 uppercase">المكافآت</th>
                <th className="py-3 px-2 text-right text-xs font-medium text-gray-500 uppercase">الخصومات</th>
                <th className="py-3 px-2 text-right text-xs font-bold text-blue-600 uppercase">صافي الراتب</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {reportData.report.map(rep => (
                <tr key={rep.employee.id}>
                  <td className="py-4 px-2 whitespace-nowrap font-medium text-gray-900">{rep.employee.name}</td>
                  <td className="py-4 px-2 whitespace-nowrap text-gray-600">{rep.employee.jobTitle}</td>
                  <td className="py-4 px-2 whitespace-nowrap text-gray-600">{rep.employee.workLocation}</td>
                  <td className="py-4 px-2 whitespace-nowrap text-gray-600">{rep.employee.salaryType}</td>
                  <td className="py-4 px-2 whitespace-nowrap text-gray-600">{rep.basePay.toFixed(2)}</td>
                  <td className="py-4 px-2 whitespace-nowrap text-gray-600">{rep.totalOvertimePay.toFixed(2)}</td>
                  <td className="py-4 px-2 whitespace-nowrap text-green-600">{rep.bonus.toFixed(2)}</td>
                  <td className="py-4 px-2 whitespace-nowrap text-red-600">{rep.deduction.toFixed(2)}</td>
                  <td className="py-4 px-2 whitespace-nowrap font-bold text-lg text-blue-700">{rep.netSalary.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {reportData.transportCost !== undefined && (
          <div className="mt-6">
            <h3 className="text-xl font-semibold text-green-700 mb-2">تفاصيل تكلفة النقل</h3>
            <table className="min-w-max table-auto border">
              <thead className="bg-gray-100 text-sm text-gray-700">
                <tr>
                  <th className="border px-2 py-1">الاسم</th>
                  <th className="border px-2 py-1">موقع العمل</th>
                  <th className="border px-2 py-1">جهة الصرف</th>
                  <th className="border px-2 py-1">قيمة اليوم</th>
                  <th className="border px-2 py-1">عدد الأيام</th>
                  <th className="border px-2 py-1">الإجمالي</th>
                  {days.map((date) => (
                    <th key={date} className="border px-2 py-1 whitespace-nowrap text-center">
                      <div className="text-xs">{new Date(date).toLocaleDateString("ar-EG", { weekday: "short" })}</div>
                      <div className="text-xs text-gray-600">{date.slice(5)}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '{}').drivers?.map((driver: Driver) => {
                  const records = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '{}').attendance?.[driver.id] || {};
                  const totalDays = Object.entries(records)
                    .filter(([date]) => days.includes(date))
                    .reduce((acc, [, val]) => acc + Number(val || 0), 0);
                  const totalCost = totalDays * driver.dayCost;
                  return (
                    <tr key={driver.id} className="text-center">
                      <td className="border px-2 py-1">{driver.name}</td>
                      <td className="border px-2 py-1">{driver.workLocation}</td>
                      <td className="border px-2 py-1">{driver.paymentSource}</td>
                      <td className="border px-2 py-1">{driver.dayCost}</td>
                      <td className="border px-2 py-1 font-bold text-blue-700">{totalDays}</td>
                      <td className="border px-2 py-1 font-bold text-green-700">{totalCost}</td>
                      {days.map((date) => (
                        <td key={date} className="border px-1 py-1">
                          {records[date] || ""}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {!reportData.report && !reportData.transportCost && (
          <div className="text-center py-10">
            <AlertTriangle size={40} className="mx-auto text-yellow-500 mb-4" />
            <p className="text-gray-600 mt-2">لا توجد بيانات مراتب أو تكاليف نقل لهذا الشهر.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ReportView;