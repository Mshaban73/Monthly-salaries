import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Archive } from 'lucide-react';
import type { HistoricalPayroll } from '../App';

interface HistoryProps {
  historicalPayrolls: HistoricalPayroll[];
}

const months = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, name: new Date(0, i).toLocaleString('ar', { month: 'long' }) }));

function History({ historicalPayrolls }: HistoryProps) {
  const sortedPayrolls = [...historicalPayrolls].sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    return b.month - a.month;
  });

  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-800 mb-6">سجل الرواتب المعتمدة</h2>
      
      <div className="bg-white p-6 rounded-xl shadow-lg">
        {sortedPayrolls.length > 0 ? (
          <div className="space-y-4">
            {sortedPayrolls.map(({ year, month }) => (
              <Link
                key={`${year}-${month}`}
                to={`/history/${year}/${month}`}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-blue-100 hover:border-blue-400 transition-all duration-200 shadow-sm"
              >
                <div className="font-semibold text-lg text-gray-800">
                  كشف رواتب شهر {months.find(m => m.value === month)?.name} {year}
                </div>
                <ChevronLeft className="text-gray-500" />
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-gray-500">
            <Archive size={48} className="mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-semibold">لا توجد سجلات محفوظة</h3>
            <p className="mt-2">يمكنك حفظ كشوف الرواتب بعد حسابها من صفحة "الرواتب".</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default History;