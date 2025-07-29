// --- START OF FILE src/pages/History.tsx (كامل ومع الأنواع الصحيحة) ---

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient.js';
import { useAuth } from '../context/AuthContext.tsx';
import { History as HistoryIcon, Eye, RotateCcw, Loader } from 'lucide-react';
import type { HistoricalPayroll } from '../types.ts';

export default function History() {
  const { can } = useAuth();
  const navigate = useNavigate();
  const [historicalPayrolls, setHistoricalPayrolls] = useState<Pick<HistoricalPayroll, 'period'>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!can('view', 'History')) {
        setLoading(false);
        return;
      }
      setLoading(true);
      const { data, error } = await supabase
        .from('historical_payrolls')
        .select('period')
        .order('period', { ascending: false });

      if (error) {
        alert('فشل في جلب سجل التقارير.');
        console.error(error);
      } else {
        setHistoricalPayrolls(data || []);
      }
      setLoading(false);
    };

    fetchHistory();
  }, [can]);

  const handleReopen = async (period: string) => {
    const [year, month] = period.split('-');
    if (window.confirm(`هل أنت متأكد من إلغاء ترحيل كشف رواتب شهر ${month}/${year}؟\nسيتم حذف هذا التقرير من السجل.`)) {
      const { error } = await supabase
        .from('historical_payrolls')
        .delete()
        .eq('period', period);
      
      if (error) {
        alert('فشل حذف التقرير.');
        console.error(error);
      } else {
        alert('تم إلغاء الترحيل بنجاح. سيتم توجيهك الآن لصفحة الرواتب.');
        navigate(`/payroll?year=${year}&month=${month}`);
      }
    }
  };

  if (loading) { return <div className="flex justify-center items-center h-64"><Loader className="animate-spin text-blue-500" /></div>; }
  if (!can('view', 'History')) { return <div className="p-6">ليس لديك صلاحية لعرض هذه الصفحة.</div>; }

  return (
    <div className="p-4 md:p-6" dir="rtl">
      <div className="flex items-center gap-4 mb-6">
        <HistoryIcon size={32} className="text-blue-600"/>
        <h2 className="text-3xl font-bold text-gray-800">سجل الرواتب المحفوظة</h2>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        {historicalPayrolls.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {historicalPayrolls.map(({ period }) => {
              const [year, month] = period.split('-');
              return (
                <div key={period} className="border p-4 rounded-lg shadow-sm bg-gray-50 flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">
                      شهر: {new Date(Number(year), Number(month) - 1).toLocaleString('ar', { month: 'long' })}
                    </h3>
                    <p className="text-md text-gray-600 mb-4">{year}</p>
                  </div>
                  <div className="flex flex-col space-y-2">
                    <Link
                      to={`/history/${year}/${month}`}
                      className="flex items-center justify-center w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                    >
                      <Eye size={18} className="ml-2" />
                      عرض التقرير
                    </Link>
                    {can('edit', 'History') && (
                      <button
                        onClick={() => handleReopen(period)}
                        className="flex items-center justify-center w-full bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition"
                      >
                        <RotateCcw size={18} className="ml-2" />
                        إلغاء الترحيل
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
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