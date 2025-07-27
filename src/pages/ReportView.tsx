// --- START OF FILE src/pages/ReportView.tsx (الكامل والنهائي مع التصدير) ---

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { supabase } from '../supabaseClient.js';
import { useAuth } from '../context/AuthContext.tsx';
import { ChevronLeft, Loader, FileDown } from 'lucide-react';

export default function ReportView() {
  const { can } = useAuth();
  const { year, month } = useParams();
  const [reportData, setReportData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      if (!year || !month || !can('view', 'History')) {
        setLoading(false);
        return;
      }
      setLoading(true);

      const period = `${year}-${month.padStart(2, '0')}`;
      const { data, error } = await supabase
        .from('historical_payrolls')
        .select('report_data, transport_cost_data')
        .eq('period', period)
        .single();
      
      if (error || !data) {
        console.error("Report not found:", error);
        setReportData(null);
      } else {
        setReportData(data);
      }
      setLoading(false);
    };

    fetchReport();
  }, [year, month, can]);
  
  const payrollReport = reportData?.report_data?.report || [];
  const transportReport = reportData?.transport_cost_data?.report || [];

  const handleExport = () => {
    const wb = XLSX.utils.book_new();

    if (payrollReport.length > 0) {
      const payrollDataForExport = payrollReport.map(item => ({
        'الاسم': item.employee.name,
        'الموقع': item.employee.work_location,
        'جهة الصرف': item.employee.payment_source,
        'أيام الحضور': item.totalWorkDays,
        'الراتب الأساسي': item.basePay,
        'قيمة الإضافي': item.totalOvertimePay,
        'البدلات': item.totalAllowances,
        'المكافآت': item.totalBonuses,
        'المنحة العامة': item.generalBonus,
        'قسط السلفة': item.loanInstallment,
        'خصومات أخرى': item.manualDeduction,
        'صافي الراتب': item.netSalary,
      }));
      const payrollWs = XLSX.utils.json_to_sheet(payrollDataForExport);
      XLSX.utils.book_append_sheet(wb, payrollWs, "تقرير رواتب الموظفين");
    }

    if (transportReport.length > 0) {
      const transportDataForExport = transportReport.map(item => ({
        'اسم السائق': item.driver_name,
        'الموقع': item.work_location,
        'جهة الصرف': item.payment_source,
        'التكلفة الأساسية': item.baseCost,
        'المستحقات': item.extrasTotal,
        'الخصومات': item.deductionsTotal,
        'الإجمالي': item.totalCost,
      }));
      const transportWs = XLSX.utils.json_to_sheet(transportDataForExport);
      XLSX.utils.book_append_sheet(wb, transportWs, "تقرير تكاليف النقل");
    }

    XLSX.writeFile(wb, `Report_${year}_${month}.xlsx`);
  };

  const payrollTotals = payrollReport.reduce(
    (acc, curr) => {
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
    { basePay: 0, totalOvertimePay: 0, totalAllowances: 0, totalBonuses: 0, generalBonus: 0, loanInstallment: 0, manualDeduction: 0, netSalary: 0 }
  );
  
  const transportTotal = transportReport.reduce((sum, curr) => sum + curr.totalCost, 0);

  if (loading) { return <div className="flex justify-center items-center h-64"><Loader className="animate-spin" /></div>; }
  if (!reportData) { return ( <div className="text-center py-10" dir="rtl"><h2 className="text-2xl font-bold text-red-600">لم يتم العثور على التقرير</h2><Link to="/history" className="text-blue-500 hover:underline mt-4 inline-block">العودة للسجل</Link></div> ); }

  return (
    <div className="p-6" dir="rtl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <Link to="/history" className="flex items-center text-gray-600 hover:text-blue-600 mb-2">
            <ChevronLeft size={20} />
            العودة للسجل
          </Link>
          <h1 className="text-3xl font-bold">كشف رواتب شهر: {month}/{year}</h1>
        </div>
        <button onClick={handleExport} className="flex items-center bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700">
            <FileDown size={18} className="ml-2" />
            تصدير التقرير
        </button>
      </div>
      
      {payrollReport.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-md overflow-x-auto mb-8">
          <h2 className="text-xl font-bold mb-4">تقرير رواتب الموظفين</h2>
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-2 px-3 border">الاسم</th>
                <th className="py-2 px-3 border">الموقع</th>
                <th className="py-2 px-3 border">جهة الصرف</th>
                <th className="py-2 px-3 border">الأساسي</th>
                <th className="py-2 px-3 border">الإضافي</th>
                <th className="py-2 px-3 border">البدلات</th>
                <th className="py-2 px-3 border">المكافآت</th>
                <th className="py-2 px-3 border">المنحة</th>
                <th className="py-2 px-3 border">السلفة</th>
                <th className="py-2 px-3 border">الخصومات</th>
                <th className="py-2 px-3 border">الصافي</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {payrollReport.map((item: any, index: number) => (
                <tr key={index} className="text-center">
                  <td className="py-2 px-3 border font-medium">{item.employee.name}</td>
                  <td className="py-2 px-3 border">{item.employee.work_location}</td>
                  <td className="py-2 px-3 border">{item.employee.payment_source}</td>
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
                <td className="py-2 px-3 border" colSpan={3}>الإجمالي</td>
                <td className="py-2 px-3 border">{payrollTotals.basePay.toFixed(2)}</td>
                <td className="py-2 px-3 border">{payrollTotals.totalOvertimePay.toFixed(2)}</td>
                <td className="py-2 px-3 border">{payrollTotals.totalAllowances.toFixed(2)}</td>
                <td className="py-2 px-3 border">{payrollTotals.totalBonuses.toFixed(2)}</td>
                <td className="py-2 px-3 border">{payrollTotals.generalBonus.toFixed(2)}</td>
                <td className="py-2 px-3 border">{payrollTotals.loanInstallment.toFixed(2)}</td>
                <td className="py-2 px-3 border">{payrollTotals.manualDeduction.toFixed(2)}</td>
                <td className="py-2 px-3 border text-green-800">{payrollTotals.netSalary.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {transportReport.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-md overflow-x-auto">
            <h2 className="text-xl font-bold mb-4">تقرير تكاليف النقل</h2>
            <table className="min-w-full text-sm">
                <thead className="bg-gray-100">
                    <tr>
                        <th className="py-2 px-3 border">اسم السائق</th>
                        <th className="py-2 px-3 border">الموقع</th>
                        <th className="py-2 px-3 border">جهة الصرف</th>
                        <th className="py-2 px-3 border">التكلفة الأساسية</th>
                        <th className="py-2 px-3 border">المستحقات</th>
                        <th className="py-2 px-3 border">الخصومات</th>
                        <th className="py-2 px-3 border">الإجمالي</th>
                    </tr>
                </thead>
                <tbody className="divide-y">
                    {transportReport.map((item: any, index: number) => (
                        <tr key={index} className="text-center">
                            <td className="py-2 px-3 border font-medium">{item.driver_name}</td>
                            <td className="py-2 px-3 border">{item.work_location}</td>
                            <td className="py-2 px-3 border">{item.payment_source}</td>
                            <td className="py-2 px-3 border">{item.baseCost.toFixed(2)}</td>
                            <td className="py-2 px-3 border">{item.extrasTotal.toFixed(2)}</td>
                            <td className="py-2 px-3 border">{item.deductionsTotal.toFixed(2)}</td>
                            <td className="py-2 px-3 border font-bold">{item.totalCost.toFixed(2)}</td>
                        </tr>
                    ))}
                </tbody>
                <tfoot className="bg-gray-200 font-bold">
                    <tr className="text-center">
                        <td className="py-2 px-3 border" colSpan={3}>الإجمالي</td>
                        <td className="py-2 px-3 border">{transportReport.reduce((s,i)=>s+i.baseCost,0).toFixed(2)}</td>
                        <td className="py-2 px-3 border">{transportReport.reduce((s,i)=>s+i.extrasTotal,0).toFixed(2)}</td>
                        <td className="py-2 px-3 border">{transportReport.reduce((s,i)=>s+i.deductionsTotal,0).toFixed(2)}</td>
                        <td className="py-2 px-3 border text-blue-800">{transportTotal.toFixed(2)}</td>
                    </tr>
                </tfoot>
            </table>
        </div>
      )}
    </div>
  );
}