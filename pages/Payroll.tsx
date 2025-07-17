import React, { useState, useMemo } from 'react';
import type { Employee, AttendanceRecords, PublicHoliday, HistoricalPayroll } from '../App';
import { calculatePayroll, PayrollReport } from '../utils/payrollCalculator';
import { DollarSign, Percent, Calculator, CheckCircle, AlertTriangle } from 'lucide-react';

interface PayrollProps {
  employees: Employee[];
  attendanceRecords: AttendanceRecords;
  publicHolidays: PublicHoliday[];
  historicalPayrolls: HistoricalPayroll[];
  setHistoricalPayrolls: React.Dispatch<React.SetStateAction<HistoricalPayroll[]>>;
}

function Payroll({ employees, attendanceRecords, publicHolidays, historicalPayrolls, setHistoricalPayrolls }: PayrollProps) {
  const [selectedPeriod, setSelectedPeriod] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  });
  const [monthlyVariables, setMonthlyVariables] = useState<{ [key: string]: { bonus: number, deduction: number } }>({});
  const [payrollReport, setPayrollReport] = useState<PayrollReport[] | null>(null);

  const handleVariableChange = (employeeId: number, type: 'bonus' | 'deduction', value: string) => {
    const numericValue = Number(value);
    if (!isNaN(numericValue)) {
      setMonthlyVariables(prev => ({
        ...prev,
        [employeeId]: {
          ...prev[employeeId] || { bonus: 0, deduction: 0 },
          [type]: numericValue,
        }
      }));
    }
  };
  
  const handleCalculatePayroll = () => {
    const report = calculatePayroll(employees, attendanceRecords, selectedPeriod.month, selectedPeriod.year, monthlyVariables, publicHolidays);
    setPayrollReport(report);
  };
  
  const handleSavePayroll = () => {
    if(!payrollReport) return;
    const newHistoricalRecord: HistoricalPayroll = {
        year: selectedPeriod.year,
        month: selectedPeriod.month,
        report: payrollReport,
    };
    setHistoricalPayrolls([...historicalPayrolls, newHistoricalRecord]);
    alert("تم حفظ واعتماد كشف الرواتب بنجاح!");
    setPayrollReport(null); // Clear the current report after saving
  };

  const isReportAlreadySaved = useMemo(() => {
    return historicalPayrolls.some(p => p.year === selectedPeriod.year && p.month === selectedPeriod.month);
  }, [historicalPayrolls, selectedPeriod]);

  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);
  const months = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, name: new Date(0, i).toLocaleString('ar', { month: 'long' }) }));

  const canCalculate = employees.length > 0;

  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-800 mb-6">حساب الرواتب</h2>
      
      {/* Step 1: Period Selection */}
      <div className="bg-white p-6 rounded-xl shadow-lg mb-8">
        <h3 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-2 flex items-center"><span className="bg-blue-600 text-white rounded-full h-8 w-8 flex items-center justify-center ml-3">1</span>اختر فترة حساب الراتب</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-1">السنة</label>
            <select id="year" value={selectedPeriod.year} onChange={e => {setSelectedPeriod({...selectedPeriod, year: Number(e.target.value)}); setPayrollReport(null);}} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white">
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="month" className="block text-sm font-medium text-gray-700 mb-1">الشهر</label>
            <select id="month" value={selectedPeriod.month} onChange={e => {setSelectedPeriod({...selectedPeriod, month: Number(e.target.value)}); setPayrollReport(null);}} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white">
              {months.map(m => <option key={m.value} value={m.value}>{m.name}</option>)}
            </select>
          </div>
        </div>
         {isReportAlreadySaved && (
             <div className="mt-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded-md flex items-center">
                 <AlertTriangle className="ml-3" />
                <p>تم حفظ واعتماد كشف الرواتب لهذه الفترة مسبقًا. يمكنك مراجعته من صفحة "سجل الرواتب".</p>
             </div>
         )}
      </div>

      {canCalculate && !isReportAlreadySaved && (
        <>
          {/* Step 2: Monthly Variables */}
          <div className="bg-white p-6 rounded-xl shadow-lg mb-8">
            <h3 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-2 flex items-center"><span className="bg-blue-600 text-white rounded-full h-8 w-8 flex items-center justify-center ml-3">2</span>أدخل المتغيرات الشهرية</h3>
            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
              {employees.map(emp => (
                <div key={emp.id} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center border p-3 rounded-lg">
                  <div className="font-semibold text-gray-800">{emp.name}</div>
                  <div className="flex items-center">
                     <DollarSign size={18} className="text-green-500 ml-2" />
                    <input type="number" placeholder="المكافآت والحوافز" onChange={e => handleVariableChange(emp.id, 'bonus', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
                  </div>
                  <div className="flex items-center">
                    <Percent size={18} className="text-red-500 ml-2"/>
                    <input type="number" placeholder="السلف والخصومات" onChange={e => handleVariableChange(emp.id, 'deduction', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Step 3: Calculation */}
          <div className="text-center mb-8">
            <button onClick={handleCalculatePayroll} className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition-colors duration-300 shadow-lg text-lg font-semibold flex items-center justify-center mx-auto">
              <Calculator size={22} className="ml-2" />
              حساب كشف الرواتب
            </button>
          </div>
        </>
      )}

      {!canCalculate && (
        <div className="text-center py-10 text-gray-500 bg-white rounded-lg shadow-md">
            <p className="text-xl">يرجى إضافة موظفين أولاً من صفحة "الموظفين".</p>
        </div>
      )}

      {/* Step 4: Report */}
      {payrollReport && (
        <div className="bg-white p-6 rounded-xl shadow-lg overflow-x-auto animate-fade-in-down">
          <h3 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-2">كشف رواتب شهر {months.find(m => m.value === selectedPeriod.month)?.name} {selectedPeriod.year}</h3>
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
              {payrollReport.map(rep => (
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
          <div className="mt-6 text-center">
             <button onClick={handleSavePayroll} className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-300 shadow-lg text-lg font-semibold flex items-center justify-center mx-auto">
                <CheckCircle size={22} className="ml-2"/>
                حفظ واعتماد الكشف
             </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Payroll;