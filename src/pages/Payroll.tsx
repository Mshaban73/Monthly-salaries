// --- START OF FILE src/pages/Payroll.tsx (الكامل والنهائي والمصحح) ---

import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { X, Save, FileDown, DollarSign, PackagePlus, PackageMinus, Landmark, Edit, MapPin, BarChart2, Search, Loader, CheckCircle, XCircle, FileUp } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useAuth } from '../context/AuthContext.tsx';
import { supabase } from '../supabaseClient.js';
import { getPayrollDays, getYearsList, getMonthsList, toYMDString } from '../utils/attendanceCalculator.ts';
import { calculateAttendanceSummary, calculateLocationSummary, calculateCostDistribution } from '../utils/fullAttendanceCalculator.ts';
import ManagementModal from '../components/ManagementModal.tsx';
import LoanManagementModal from '../components/LoanManagementModal.tsx';
import LocationCostSummaryModal from '../components/LocationCostSummaryModal.tsx';
import CostAnalysisModal from '../components/CostAnalysisModal.tsx';
import type { Employee, PublicHoliday, BonusDeduction, Loan, PayrollReportItem, AttendanceRecords } from '../types';

const months = getMonthsList();
const years = getYearsList();

const getInitialPeriod = () => {
    const today = new Date();
    const currentDay = today.getDate();
    if (currentDay >= 26) {
        const nextPeriod = new Date(today.setMonth(today.getMonth() + 1));
        return { month: nextPeriod.getMonth() + 1, year: nextPeriod.getFullYear() };
    }
    return { month: today.getMonth() + 1, year: today.getFullYear() };
};

function StatCard({ title, value, icon, colorClass }: { title: string; value: string; icon: React.ReactNode; colorClass: string; }) { 
    return (
        <div className="bg-white p-4 rounded-lg shadow-md flex items-center">
            <div className={`p-3 rounded-full bg-opacity-20 ${colorClass.replace('text-', 'bg-')}`}>
                {React.cloneElement(icon as React.ReactElement, { className: `h-6 w-6 ${colorClass}` })}
            </div>
            <div className="ml-4 mr-4">
                <p className="text-sm font-medium text-gray-500">{title}</p>
                <p className="text-2xl font-bold text-gray-800">{value}</p>
            </div>
        </div>
    ); 
}

export default function Payroll() {
  const { can } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecords>({});
  const [publicHolidays, setPublicHolidays] = useState<PublicHoliday[]>([]);
  const [bonusesDeductions, setBonusesDeductions] = useState<BonusDeduction[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [payrollSettings, setPayrollSettings] = useState<any>(null);

  const [selectedPeriod, setSelectedPeriod] = useState(() => {
    const urlYear = searchParams.get('year');
    const urlMonth = searchParams.get('month');
    if (urlYear && urlMonth) {
      return { year: Number(urlYear), month: Number(urlMonth) };
    }
    return getInitialPeriod();
  });
  
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [excludedEmployees, setExcludedEmployees] = useState<Set<number>>(new Set());
  const [filterLocation, setFilterLocation] = useState<string>('all');
  const [filterSource, setFilterSource] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isLoanModalOpen, setIsLoanModalOpen] = useState(false);
  const [locationCostModalData, setLocationCostModalData] = useState<any | null>(null);
  const [isCostAnalysisModalOpen, setIsCostAnalysisModalOpen] = useState(false);

  const periodKey = `${selectedPeriod.year}-${selectedPeriod.month.toString().padStart(2, '0')}`;
  const payrollDays = useMemo(() => getPayrollDays(selectedPeriod.year, selectedPeriod.month), [selectedPeriod]);
  const generalBonusDays = payrollSettings?.general_bonus_days || 0;
  
  const uniqueLocations = useMemo(() => [...new Set(employees.map(e => e.work_location))].filter(Boolean), [employees]);
  const uniqueSources = useMemo(() => [...new Set(employees.map(e => e.payment_source))].filter(Boolean), [employees]);

  useEffect(() => {
    setSearchParams({ year: selectedPeriod.year.toString(), month: selectedPeriod.month.toString() }, { replace: true });
    fetchData();
  }, [payrollDays]);

  useEffect(() => {
    setExcludedEmployees(new Set(payrollSettings?.excluded_employee_ids || []));
  }, [payrollSettings]);

  const fetchData = async () => {
    if (!can('view', 'Payroll')) { setLoading(false); return; }
    setLoading(true);
    const startDate = toYMDString(payrollDays[0]);
    const endDate = toYMDString(payrollDays[payrollDays.length - 1]);
    const [empRes, attRes, holRes, bdRes, loanRes, settingsRes] = await Promise.all([
        supabase.from('employees').select('*').eq('is_active', true),
        supabase.from('attendance').select('*').gte('date', startDate).lte('date', endDate),
        supabase.from('public_holidays').select('*'),
        supabase.from('bonuses_deductions').select('*').eq('period', periodKey),
        supabase.from('loans').select('*'),
        supabase.from('payroll_settings').select('*').eq('period', periodKey).single(),
    ]);
    
    setEmployees(empRes.data || []);
    const recordsByDate = (attRes.data || []).reduce((acc: any, rec: any) => {
        if (!acc[rec.date]) { acc[rec.date] = {}; }
        if (!acc[rec.date][rec.employee_id]) { acc[rec.date][rec.employee_id] = { hours: 0, locations: [] }; }
        acc[rec.date][rec.employee_id].hours += rec.hours;
        if (rec.location) { acc[rec.date][rec.employee_id].locations.push(rec.location); }
        return acc;
    }, {});
    setAttendanceRecords(recordsByDate);
    setPublicHolidays(holRes.data || []);
    setBonusesDeductions(bdRes.data || []);
    setLoans(loanRes.data || []);
    setPayrollSettings(settingsRes.data);
    setLoading(false);
  };
  
  const handleGeneralBonusChange = async (value: string) => {
    const days = Number(value) >= 0 ? Number(value) : 0;
    const newSettings = { ...(payrollSettings || { period: periodKey }), general_bonus_days: days };
    const { data } = await supabase.from('payroll_settings').upsert(newSettings, { onConflict: 'period' }).select().single();
    setPayrollSettings(data);
  };
  
  const handleExcludeEmployee = async (empId: number, shouldExclude: boolean) => {
    const currentExcluded = new Set(payrollSettings?.excluded_employee_ids || []);
    if (shouldExclude) { currentExcluded.add(empId); } else { currentExcluded.delete(empId); }
    const newExcludedIds = Array.from(currentExcluded);
    const newSettings = { ...(payrollSettings || { period: periodKey }), excluded_employee_ids: newExcludedIds };
    const { data } = await supabase.from('payroll_settings').upsert(newSettings, { onConflict: 'period' }).select().single();
    setPayrollSettings(data);
  };

  const filteredEmployees = useMemo(() => employees.filter(emp => (filterLocation === 'all' || emp.work_location === filterLocation) && (filterSource === 'all' || emp.payment_source === filterSource) && (emp.name.toLowerCase().includes(searchTerm.toLowerCase()))), [employees, filterLocation, filterSource, searchTerm]);
  
  const payrollData: PayrollReportItem[] = useMemo(() => {
    const bonusDays = Number(generalBonusDays) || 0;
    return filteredEmployees.map(emp => {
      const summary = calculateAttendanceSummary(emp, attendanceRecords, publicHolidays, payrollDays);
      const bdRecord = bonusesDeductions.find(r => r.employee_id === emp.id);
      const dailyRate = emp.salary_type === 'شهري' ? (emp.salary_amount / 30) : emp.salary_amount;
      const basePay = emp.salary_type === 'يومي' ? (summary.actualAttendanceDays * dailyRate) : emp.salary_amount;
      const totalOvertimePay = summary.totalOvertimeValue;
      const totalAllowances = [emp.transport_allowance, emp.expatriation_allowance, emp.meal_allowance, emp.housing_allowance]
        .reduce((acc, allowance) => {
          if (!allowance) return acc;
          const amount = (allowance.type === 'يومي' ? allowance.amount * summary.actualAttendanceDays : allowance.amount);
          return acc + amount;
        }, 0);
      const manualBonus = bdRecord?.bonus_amount || 0;
      const manualDeduction = bdRecord?.deduction_amount || 0;
      const generalBonusValue = excludedEmployees.has(emp.id) ? 0 : (bonusDays * dailyRate);
      
      const activeLoan = loans.find(l => {
        if (l.employee_id !== emp.id) return false;
        const [startYear, startMonth] = l.start_date.split('-').map(Number);
        const loanStartDate = new Date(Date.UTC(startYear, startMonth - 1, 1));
        const lastInstallmentDate = new Date(loanStartDate);
        lastInstallmentDate.setUTCMonth(loanStartDate.getUTCMonth() + l.installments - 1);
        const periodDate = new Date(Date.UTC(selectedPeriod.year, selectedPeriod.month - 1, 1));
        return periodDate >= loanStartDate && periodDate <= lastInstallmentDate;
      });
      
      const loanInstallment = activeLoan ? (activeLoan.total_amount / activeLoan.installments) : 0;
      const netSalary = basePay + totalOvertimePay + totalAllowances + manualBonus + generalBonusValue - manualDeduction - loanInstallment;
      
      return { 
        employee: {
          id: emp.id,
          name: emp.name,
          work_location: emp.work_location,
          payment_source: emp.payment_source
        },
        basePay, 
        totalWorkDays: summary.actualAttendanceDays, 
        totalOvertimePay, 
        totalBonuses: manualBonus, 
        totalAllowances, 
        manualDeduction, 
        generalBonus: generalBonusValue, 
        loanInstallment, 
        netSalary 
      };
    });
  }, [filteredEmployees, attendanceRecords, publicHolidays, payrollDays, bonusesDeductions, generalBonusDays, excludedEmployees, loans, selectedPeriod]);

  const payrollTotals = useMemo(() => { return payrollData.reduce((totals, data) => { const grossSalary = data.basePay + data.totalOvertimePay + data.totalAllowances; totals.grossSalary += grossSalary; totals.netSalary += data.netSalary; totals.totalDeductions += data.manualDeduction + data.loanInstallment; totals.totalAdditions += data.totalBonuses + data.generalBonus; return totals; }, { grossSalary: 0, netSalary: 0, totalDeductions: 0, totalAdditions: 0 }); }, [payrollData]);

  const handleSaveBonusesSuccess = (newRecord: BonusDeduction) => {
    setBonusesDeductions(prev => {
        const existingIndex = prev.findIndex(r => r.employee_id === newRecord.employee_id && r.period === newRecord.period);
        if (existingIndex > -1) {
            const updated = [...prev];
            updated[existingIndex] = newRecord;
            return updated;
        }
        return [...prev, newRecord];
    });
  };

  const handleSaveAndArchive = async () => {
    if (window.confirm(`هل أنت متأكد من حفظ وترحيل كشف رواتب شهر ${selectedPeriod.month}/${selectedPeriod.year}؟`)) {
        const reportPayload = { period: periodKey, report_data: { report: payrollData } };
        const { error } = await supabase.from('historical_payrolls').upsert(reportPayload, { onConflict: 'period' });
        if (error) { alert('فشل حفظ الكشف.'); console.error(error); }
        else { alert('تم حفظ الكشف بنجاح!'); navigate(`/history`); }
    }
  };

  const handleExportToExcel = () => { if (payrollData.length === 0) { alert('لا توجد بيانات لتصديرها.'); return; } const dataForExport = payrollData.map(data => ({ 'الاسم': data.employee.name, 'الموقع الأساسي': data.employee.work_location, 'جهة الصرف': data.employee.payment_source, 'أيام الحضور': data.totalWorkDays, 'الراتب الأساسي': data.basePay.toFixed(2), 'قيمة الإضافي': data.totalOvertimePay.toFixed(2), 'البدلات': data.totalAllowances.toFixed(2), 'المكافآت': data.totalBonuses.toFixed(2), 'المنحة العامة': data.generalBonus.toFixed(2), 'قسط السلفة': data.loanInstallment.toFixed(2), 'خصومات أخرى': data.manualDeduction.toFixed(2), 'صافي الراتب': data.netSalary.toFixed(2) })); const ws = XLSX.utils.json_to_sheet(dataForExport); const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "كشف الرواتب"); XLSX.writeFile(wb, `Payroll_${selectedPeriod.year}_${selectedPeriod.month}.xlsx`); };
  
  if (loading) { return <div className="flex justify-center items-center h-screen"><Loader className="animate-spin text-blue-500" size={48} /></div>; }
  
  return (
    <div className="space-y-6 p-4 md:p-6 bg-gray-50 min-h-screen" dir="rtl">
      <h1 className="text-3xl font-bold text-gray-800">إعداد كشف الرواتب</h1>
      <div className="bg-white p-6 rounded-lg shadow-md grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div><label htmlFor="month">الشهر</label><select id="month" value={selectedPeriod.month} onChange={(e) => setSelectedPeriod({...selectedPeriod, month: Number(e.target.value)})} className="mt-1 block w-full pl-3 pr-10 py-2 border-gray-300 rounded-md">{months.map(m => <option key={m.value} value={m.value}>{m.name}</option>)}</select></div>
        <div><label htmlFor="year">السنة</label><select id="year" value={selectedPeriod.year} onChange={(e) => setSelectedPeriod({...selectedPeriod, year: Number(e.target.value)})} className="mt-1 block w-full pl-3 pr-10 py-2 border-gray-300 rounded-md">{years.map(y => <option key={y} value={y}>{y}</option>)}</select></div>
        <div><label htmlFor="generalBonusDays">أيام المنحة</label><input id="generalBonusDays" type="number" value={generalBonusDays} onChange={(e) => handleGeneralBonusChange(e.target.value)} disabled={!can('edit', 'Payroll')} className="mt-1 block w-full pl-3 pr-2 py-2 border-gray-300 rounded-md disabled:bg-gray-200" /></div>
        <div><label htmlFor="filterLocation">موقع العمل</label><select id="filterLocation" value={filterLocation} onChange={(e) => setFilterLocation(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 border-gray-300 rounded-md"><option value="all">الكل</option>{uniqueLocations.map(loc => <option key={loc} value={loc}>{loc}</option>)}</select></div>
        <div><label htmlFor="filterSource">جهة الصرف</label><select id="filterSource" value={filterSource} onChange={(e) => setFilterSource(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 border-gray-300 rounded-md"><option value="all">الكل</option>{uniqueSources.map(src => <option key={src} value={src}>{src}</option>)}</select></div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard title="إجمالي الرواتب (المعروض)" value={payrollTotals.grossSalary.toLocaleString('ar-EG', {minimumFractionDigits: 2})} icon={<DollarSign/>} colorClass="text-gray-600" />
          <StatCard title="إجمالي الإضافات (المعروض)" value={payrollTotals.totalAdditions.toLocaleString('ar-EG', {minimumFractionDigits: 2})} icon={<PackagePlus/>} colorClass="text-yellow-600" />
          <StatCard title="إجمالي الخصومات (المعروض)" value={payrollTotals.totalDeductions.toLocaleString('ar-EG', {minimumFractionDigits: 2})} icon={<PackageMinus/>} colorClass="text-red-600" />
          <StatCard title="صافي الرواتب (المعروض)" value={payrollTotals.netSalary.toLocaleString('ar-EG', {minimumFractionDigits: 2})} icon={<DollarSign/>} colorClass="text-green-600" />
      </div>
      <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
              <h2 className="text-xl font-bold">تفاصيل كشف الرواتب</h2>
              <div className="relative w-full md:w-auto"><Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} /><input type="text" placeholder="ابحث بالاسم..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full md:w-64 px-4 py-2 pr-10 border rounded-lg" /></div>
          </div>
          <div className="flex justify-end items-center mb-4 gap-4">
              <button onClick={() => setIsCostAnalysisModalOpen(true)} className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg"><BarChart2 className="ml-2"/>تحليل التكاليف</button>
              <button onClick={() => setIsLoanModalOpen(true)} className="flex items-center bg-purple-600 text-white px-4 py-2 rounded-lg"><Landmark className="ml-2"/>إدارة السلف</button>
              <button onClick={handleExportToExcel} className="flex items-center bg-teal-600 text-white px-4 py-2 rounded-lg"><FileDown className="ml-2"/>تصدير Excel</button>
              <button onClick={handleSaveAndArchive} className="flex items-center bg-green-600 text-white px-4 py-2 rounded-lg"><Save className="ml-2"/>حفظ وترحيل</button>
          </div>
          <div className="overflow-x-auto">
              <table className="min-w-full table-auto border text-sm">
                  <thead className="bg-gray-100"><tr className="text-xs text-gray-600 uppercase"><th className="border p-2">الاسم</th><th className="border p-2">الموقع</th><th className="border p-2">جهة الصرف</th><th className="border p-2">أيام الحضور</th><th className="border p-2">الراتب الأساسي</th><th className="border p-2">قيمة الإضافي</th><th className="border p-2">البدلات</th><th className="border p-2">المكافآت</th><th className="border p-2">المنحة</th><th className="border p-2">قسط السلفة</th><th className="border p-2">خصومات</th><th className="border p-2">صافي الراتب</th><th className="border p-2">إدارة</th><th className="border p-2">استثناء</th></tr></thead>
                  <tbody>
                      {payrollData.map((data) => (
                          <tr key={data.employee.id} className="text-center hover:bg-gray-50">
                              <td className="border px-3 py-2 font-medium">{data.employee.name}</td><td>{data.employee.work_location}</td><td>{data.employee.payment_source}</td>
                              <td>{data.totalWorkDays}</td><td>{data.basePay.toFixed(2)}</td>
                              <td>{data.totalOvertimePay.toFixed(2)}</td><td>{data.totalAllowances.toFixed(2)}</td>
                              <td>{data.totalBonuses.toFixed(2)}</td><td>{data.generalBonus.toFixed(2)}</td>
                              <td>{data.loanInstallment.toFixed(2)}</td><td>{data.manualDeduction.toFixed(2)}</td>
                              <td className="font-bold text-lg text-green-700">{data.netSalary.toFixed(2)}</td>
                              {/* --- بداية التعديل --- */}
                              <td><button onClick={() => setSelectedEmployee(employees.find(e => e.id === data.employee.id) || null)} className="text-blue-600"><Edit size={16}/></button></td>
                              {/* --- نهاية التعديل --- */}
                              <td><input type="checkbox" checked={excludedEmployees.has(data.employee.id)} onChange={(e) => handleExcludeEmployee(data.employee.id, e.target.checked)} className="h-5 w-5 rounded"/></td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      </div>
      {selectedEmployee && (<ManagementModal employee={selectedEmployee} periodKey={periodKey} existingRecord={bonusesDeductions.find(r => r.employee_id === selectedEmployee.id)} onClose={() => setSelectedEmployee(null)} onSaveSuccess={handleSaveBonusesSuccess} />)}
      {isLoanModalOpen && (<LoanManagementModal employees={employees} loans={loans} setLoans={setLoans} onClose={() => setIsLoanModalOpen(false)} />)}
      {locationCostModalData && (<LocationCostSummaryModal data={locationCostModalData} onClose={() => setLocationCostModalData(null)} />)}
      {isCostAnalysisModalOpen && (
        <CostAnalysisModal 
          onClose={() => setIsCostAnalysisModalOpen(false)} 
          employees={filteredEmployees} 
          attendanceRecords={attendanceRecords} 
          payrollDays={payrollDays} 
          periodKey={periodKey} 
          bonuses={bonusesDeductions} 
          payrollSettings={payrollSettings} 
          payrollData={payrollData} 
        />
      )}
    </div>
  );
}