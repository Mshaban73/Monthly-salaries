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
    if (!reportData) return;

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
                كشف رواتب شهر {months.find(m => m.value === reportData.month)?.name} {reportData.year}
            </h2>
          </div>
           <button onClick={handleDownloadCSV} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors duration-300 shadow flex items-center">
            <Download size={20} className="ml-2" />
            تحميل التقرير (CSV)
           </button>
      </div>
      
       <div className="bg-white p-6 rounded-xl shadow-lg overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-3 px-2 text-right text-xs font-medium text-gray-500 uppercase">الموظف</th>
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
                  <td className="py-4 px-2 whitespace-nowrap text-gray-600">{rep.basePay.toFixed(2)}</td>
                  <td className="py-4 px-2 whitespace-nowrap text-gray-600">{rep.totalOvertimePay.toFixed(2)}</td>
                  <td className="py-4 px-2 whitespace-nowrap text-green-600">{rep.bonus.toFixed(2)}</td>
                  <td className="py-4 px-2 whitespace-nowrap text-red-600">{rep.deduction.toFixed(2)}</td>
                  <td className="py-4 px-2 whitespace-nowrap font-bold text-lg text-blue-700">{rep.netSalary.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
    </div>
  );
}

export default ReportView;