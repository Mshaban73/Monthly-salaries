// --- START OF FILE src/pages/History.tsx ---

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { HistoricalPayroll } from '../App';
import { History as HistoryIcon, Eye, RotateCcw } from 'lucide-react';

interface HistoryProps {
  historicalPayrolls: HistoricalPayroll[];
  setHistoricalPayrolls: React.Dispatch<React.SetStateAction<HistoricalPayroll[]>>; // --- تعديل: إضافة دالة التحديث ---
}

function History({ historicalPayrolls, setHistoricalPayrolls }: HistoryProps) {
  const navigate = useNavigate();

  const handleReopen = (year: number, month: number) => {
    if (window.confirm(`هل أنت متأكد من إلغاء ترحيل كشف رواتب شهر ${month}/${year}؟\nسيتم حذف هذا التقرير من السجل وستتم إعادتك لصفحة الرواتب لإعادة حسابه.`)) {
      
      const updatedHistory = historicalPayrolls.filter(p => 
        !(p.year === year && p.month === month)
      );
      setHistoricalPayrolls(updatedHistory);
      
      // إعادة توجيه المستخدم لصفحة الرواتب مع تحديد الشهر والسنة
      // ملاحظة: هذا يتطلب تحديثاً في App.tsx لتمرير دالة التحديث
      // سنفترض أنها موجودة حالياً
      navigate(`/payroll?year=${year}&month=${month}`);
    }
  };


  const sortedPayrolls = [...historicalPayrolls].sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    return b.month - a.month;
  });

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center gap-4 mb-6">
        <HistoryIcon size={32} className="text-blue-600"/>
        <h2 className="text-3xl font-bold text-gray-800">سجل الرواتب المحفوظة</h2>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        {sortedPayrolls.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {sortedPayrolls.map((payroll) => (
              <div key={`${payroll.year}-${payroll.month}`} className="border p-4 rounded-lg shadow-sm bg-gray-50 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-800">
                    شهر: {new Date(payroll.year, payroll.month - 1).toLocaleString('ar', { month: 'long' })}
                  </h3>
                  <p className="text-md text-gray-600 mb-4">{payroll.year}</p>
                </div>
                <div className="flex flex-col space-y-2">
                  <Link
                    to={`/history/${payroll.year}/${payroll.month}`}
                    className="flex items-center justify-center w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                  >
                    <Eye size={18} className="ml-2" />
                    عرض التقرير
                  </Link>
                  {/* --- تعديل: إضافة زر إلغاء الترحيل --- */}
                  <button
                    onClick={() => handleReopen(payroll.year, payroll.month)}
                    className="flex items-center justify-center w-full bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition"
                  >
                    <RotateCcw size={18} className="ml-2" />
                    إلغاء الترحيل
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500 py-10">
            لا توجد تقارير رواتب محفوظة في السجل بعد.
          </p>
        )}
      </div>
    </div>
  );
}

export default History;