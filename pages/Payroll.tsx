// --- START OF FILE src/pages/Payroll.tsx (النسخة النهائية الكاملة والمصححة) ---

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Save, FileDown, DollarSign, Clock, PackagePlus, PackageMinus, Landmark, Trash2, Edit } from 'lucide-react';
import * as XLSX from 'xlsx';
import type { Employee, AttendanceRecords, HistoricalPayroll, PublicHoliday, BonusDeductionState, GeneralBonusesState, Loan } from '../App';
import { calculateAttendanceSummary, getPayrollDays, getYearsList, getMonthsList } from '../utils/attendanceCalculator';

interface CalculatedPayrollData { employee: Employee; basePay: number; totalWorkDays: number; totalOvertimeHours: number; totalOvertimePay: number; totalBonuses: number; totalAllowances: number; manualDeduction: number; generalBonus: number; loanInstallment: number; netSalary: number; }
interface PayrollProps { employees: Employee[]; attendanceRecords: AttendanceRecords; publicHolidays: PublicHoliday[]; historicalPayrolls: HistoricalPayroll[]; setHistoricalPayrolls: React.Dispatch<React.SetStateAction<HistoricalPayroll[]>>; bonuses: BonusDeductionState; setBonuses: React.Dispatch<React.SetStateAction<BonusDeductionState>>; deductions: BonusDeductionState; setDeductions: React.Dispatch<React.SetStateAction<BonusDeductionState>>; generalBonuses: GeneralBonusesState; setGeneralBonuses: React.Dispatch<React.SetStateAction<GeneralBonusesState>>; loans: Loan[]; setLoans: React.Dispatch<React.SetStateAction<Loan[]>>; }

const months = getMonthsList();
const years = getYearsList();

function Payroll({ employees, attendanceRecords, publicHolidays, historicalPayrolls, setHistoricalPayrolls, bonuses, setBonuses, deductions, setDeductions, generalBonuses, setGeneralBonuses, loans, setLoans }: PayrollProps) {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [excludedEmployees, setExcludedEmployees] = useState<Set<number>>(new Set());
  const [filterLocation, setFilterLocation] = useState<string>('all');
  const [filterSource, setFilterSource] = useState<string>('all');
  const [isLoanModalOpen, setIsLoanModalOpen] = useState(false);
  const navigate = useNavigate();

  const periodKey = `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}`;
  const generalBonusDays = generalBonuses[periodKey] || '0';
  const handleGeneralBonusChange = (value: string) => { setGeneralBonuses(prev => ({ ...prev, [periodKey]: value })); };

  const payrollDays = useMemo(() => getPayrollDays(selectedYear, selectedMonth), [selectedMonth, selectedYear]);
  const filteredEmployees = useMemo(() => employees.filter(emp => (filterLocation === 'all' || emp.workLocation === filterLocation) && (filterSource === 'all' || emp.paymentSource === filterSource)), [employees, filterLocation, filterSource]);

  const payrollData: CalculatedPayrollData[] = useMemo(() => {
    const bonusDays = Number(generalBonusDays) || 0;
    return filteredEmployees.map(emp => {
      const summary = calculateAttendanceSummary(emp, attendanceRecords, publicHolidays, payrollDays);
      const hourlyRate = emp.salaryType === 'شهري' ? (emp.salaryAmount / 30 / 8) : (emp.salaryAmount / 8);
      const basePay = emp.salaryType === 'شهري' ? emp.salaryAmount : summary.actualAttendanceDays * emp.salaryAmount;
      const totalCalculatedOvertimeHours = summary.totalOvertimeValue;
      const totalOvertimePay = totalCalculatedOvertimeHours * hourlyRate;
      const totalAllowances = (emp.transportAllowance || 0) + (emp.expatriationAllowance || 0) + (emp.mealAllowance || 0) + (emp.housingAllowance || 0);
      const manualBonus = bonuses[emp.id] || 0;
      const manualDeduction = deductions[emp.id] || 0;
      const generalBonusValue = excludedEmployees.has(emp.id) ? 0 : (emp.salaryType === 'يومي' ? bonusDays * emp.salaryAmount : bonusDays * (emp.salaryAmount / 30));
      let loanInstallment = 0;
      const activeLoan = loans.find(loan => { if (loan.employeeId !== emp.id) return false; const [startYear, startMonth] = loan.startDate.split('-').map(Number); const startDate = new Date(startYear, startMonth - 1); const endDate = new Date(startYear, startMonth - 1 + loan.installments); const currentPeriodDate = new Date(selectedYear, selectedMonth - 1); return currentPeriodDate >= startDate && currentPeriodDate < endDate; });
      if (activeLoan) { loanInstallment = activeLoan.totalAmount / activeLoan.installments; }
      const netSalary = basePay + totalOvertimePay + manualBonus + generalBonusValue + totalAllowances - manualDeduction - loanInstallment;
      return { employee: emp, basePay, totalWorkDays: summary.actualAttendanceDays, totalOvertimeHours: totalCalculatedOvertimeHours, totalOvertimePay, totalBonuses: manualBonus, totalAllowances, manualDeduction, generalBonus: generalBonusValue, loanInstallment, netSalary };
    });
  }, [filteredEmployees, attendanceRecords, publicHolidays, payrollDays, bonuses, deductions, generalBonusDays, excludedEmployees, loans, selectedMonth, selectedYear]);

  const payrollTotals = useMemo(() => payrollData.reduce((totals, data) => { totals.basePay += data.basePay; totals.totalOvertimePay += data.totalOvertimePay; totals.totalAllowances += data.totalAllowances; totals.totalBonuses += data.totalBonuses; totals.generalBonus += data.generalBonus; totals.manualDeduction += data.manualDeduction; totals.loanInstallment += data.loanInstallment; totals.netSalary += data.netSalary; return totals; }, { basePay: 0, totalOvertimePay: 0, totalAllowances: 0, totalBonuses: 0, generalBonus: 0, manualDeduction: 0, loanInstallment: 0, netSalary: 0 }), [payrollData]);
  
  const uniqueLocations = useMemo(() => [...new Set(employees.map(e => e.workLocation))], [employees]);
  const uniqueSources = useMemo(() => [...new Set(employees.map(e => e.paymentSource))], [employees]);
  const handleSaveBonusesAndDeductions = (empId: number, bonus: number, deduction: number) => { setBonuses(prev => ({ ...prev, [empId]: bonus })); setDeductions(prev => ({ ...prev, [empId]: deduction })); setSelectedEmployee(null); };
  const handleSaveAndArchive = () => { if (historicalPayrolls.some(p => p.year === selectedYear && p.month === selectedMonth)) { alert('خطأ: تم حفظ كشف رواتب هذا الشهر مسبقاً.'); return; } if (window.confirm(`هل أنت متأكد من حفظ وترحيل كشف رواتب شهر ${selectedMonth}/${selectedYear}؟`)) { const newReport: HistoricalPayroll = { year: selectedYear, month: selectedMonth, report: payrollData }; setHistoricalPayrolls(prev => [...prev, newReport]); alert('تم حفظ الكشف بنجاح!'); navigate(`/history/${selectedYear}/${selectedMonth}`); } };
  const handleExportToExcel = () => { if (payrollData.length === 0) { alert('لا توجد بيانات لتصديرها.'); return; } const dataForExport = payrollData.map(data => ({ 'الاسم': data.employee.name, 'أيام الحضور': data.totalWorkDays, 'الراتب الأساسي': data.basePay.toFixed(2), 'قيمة الإضافي': data.totalOvertimePay.toFixed(2), 'البدلات': data.totalAllowances.toFixed(2), 'المكافآت': data.totalBonuses.toFixed(2), 'المنحة العامة': data.generalBonus.toFixed(2), 'قسط السلفة': data.loanInstallment.toFixed(2), 'خصومات أخرى': data.manualDeduction.toFixed(2), 'صافي الراتب': data.netSalary.toFixed(2) })); const ws = XLSX.utils.json_to_sheet(dataForExport); const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "كشف الرواتب"); XLSX.writeFile(wb, `Payroll_${selectedYear}_${selectedMonth}.xlsx`); };
  
  return (
    <div className="space-y-6 p-4 md:p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800">إعداد كشف الرواتب</h1>
      <div className="bg-white p-6 rounded-lg shadow-md grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6"><div><label htmlFor="month">الشهر</label><select id="month" value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))} className="mt-1 block w-full pl-3 pr-10 py-2 border-gray-300 rounded-md">{months.map(m => <option key={m.value} value={m.value}>{m.name}</option>)}</select></div><div><label htmlFor="year">السنة</label><select id="year" value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className="mt-1 block w-full pl-3 pr-10 py-2 border-gray-300 rounded-md">{years.map(y => <option key={y} value={y}>{y}</option>)}</select></div><div><label htmlFor="generalBonusDays">أيام المنحة</label><input id="generalBonusDays" type="number" value={generalBonusDays} onChange={(e) => handleGeneralBonusChange(e.target.value)} className="mt-1 block w-full pl-3 pr-2 py-2 border-gray-300 rounded-md" /></div><div><label htmlFor="filterLocation">موقع العمل</label><select id="filterLocation" value={filterLocation} onChange={(e) => setFilterLocation(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 border-gray-300 rounded-md"><option value="all">الكل</option>{uniqueLocations.map(loc => <option key={loc} value={loc}>{loc}</option>)}</select></div><div><label htmlFor="filterSource">جهة الصرف</label><select id="filterSource" value={filterSource} onChange={(e) => setFilterSource(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 border-gray-300 rounded-md"><option value="all">الكل</option>{uniqueSources.map(src => <option key={src} value={src}>{src}</option>)}</select></div></div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4"><StatCard title="صافي الراتب" value={payrollTotals.netSalary.toLocaleString('ar-EG', {minimumFractionDigits: 2})} icon={<DollarSign/>} colorClass="text-green-600" /><StatCard title="إجمالي الخصومات" value={(payrollTotals.manualDeduction + payrollTotals.loanInstallment).toLocaleString('ar-EG', {minimumFractionDigits: 2})} icon={<PackageMinus/>} colorClass="text-red-600" /><StatCard title="إجمالي الإضافي" value={payrollTotals.totalOvertimePay.toLocaleString('ar-EG', {minimumFractionDigits: 2})} icon={<Clock/>} colorClass="text-blue-600" /><StatCard title="إجمالي المستحقات" value={(payrollTotals.totalAllowances + payrollTotals.totalBonuses + payrollTotals.generalBonus).toLocaleString('ar-EG', {minimumFractionDigits: 2})} icon={<PackagePlus/>} colorClass="text-yellow-600" /></div>
      <div className="bg-white p-6 rounded-lg shadow-md"><div className="flex justify-between items-center mb-4"><h2 className="text-xl font-bold">تفاصيل كشف الرواتب</h2><div className="flex gap-4"><button onClick={() => setIsLoanModalOpen(true)} className="flex items-center bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors shadow"><Landmark size={20} className="ml-2" />إدارة السلف</button><button onClick={handleExportToExcel} className="flex items-center bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors shadow"><FileDown size={20} className="ml-2" />تصدير Excel</button><button onClick={handleSaveAndArchive} className="flex items-center bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors shadow"><Save size={20} className="ml-2" />حفظ وترحيل</button></div></div><div className="overflow-x-auto"><table className="min-w-full table-auto border text-sm"><thead className="bg-gray-100 text-gray-600"><tr><th className="border px-3 py-2">الاسم</th> <th className="border px-3 py-2">أيام الحضور</th> <th className="border px-3 py-2">الراتب الأساسي</th> <th className="border px-3 py-2">قيمة الإضافي</th> <th className="border px-3 py-2">البدلات</th> <th className="border px-3 py-2">المكافآت</th> <th className="border px-3 py-2">المنحة العامة</th> <th className="border px-3 py-2">قسط السلفة</th> <th className="border px-3 py-2">خصومات أخرى</th> <th className="border px-3 py-2">صافي الراتب</th> <th className="border px-3 py-2">إدارة</th> <th className="border px-3 py-2">استثناء منحة</th></tr></thead><tbody className="divide-y divide-gray-200">{payrollData.map((data) => (<tr key={data.employee.id} className="text-center hover:bg-gray-50"><td className="border px-3 py-2 font-medium text-gray-800">{data.employee.name}</td><td className="border px-3 py-2 font-semibold">{data.totalWorkDays}</td><td className="border px-3 py-2">{data.basePay.toFixed(2)}</td><td className="border px-3 py-2 text-blue-600">{data.totalOvertimePay.toFixed(2)}</td><td className="border px-3 py-2">{data.totalAllowances.toFixed(2)}</td><td className="border px-3 py-2 bg-yellow-50">{data.totalBonuses.toFixed(2)}</td><td className="border px-3 py-2 bg-green-50">{data.generalBonus.toFixed(2)}</td><td className="border px-3 py-2 bg-purple-50">{data.loanInstallment.toFixed(2)}</td><td className="border px-3 py-2 bg-red-50">{data.manualDeduction.toFixed(2)}</td><td className="border px-3 py-2 font-bold text-lg text-green-700">{data.netSalary.toFixed(2)}</td><td className="border px-3 py-2"><button onClick={() => setSelectedEmployee(data.employee)} className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600 transition">إدارة</button></td><td className="border px-3 py-2"><input type="checkbox" checked={excludedEmployees.has(data.employee.id)} onChange={(e) => { const newExcluded = new Set(excludedEmployees); if (e.target.checked) newExcluded.add(data.employee.id); else newExcluded.delete(data.employee.id); setExcludedEmployees(newExcluded); }} className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" /></td></tr>))}</tbody></table></div></div>
      {selectedEmployee && (<ManagementModal employee={selectedEmployee} currentBonus={bonuses[selectedEmployee.id] || 0} currentDeduction={deductions[selectedEmployee.id] || 0} onSave={handleSaveBonusesAndDeductions} onClose={() => setSelectedEmployee(null)}/>)}
      {isLoanModalOpen && (<LoanManagementModal employees={employees} loans={loans} setLoans={setLoans} onClose={() => setIsLoanModalOpen(false)}/>)}
    </div>
  );
}

function StatCard({ title, value, icon, colorClass }: { title: string; value: string; icon: React.ReactNode; colorClass: string; }) { return (<div className="bg-white p-4 rounded-lg shadow-md flex items-center"><div className={`p-3 rounded-full bg-opacity-20 ${colorClass.replace('text-', 'bg-')}`}>{React.cloneElement(icon as React.ReactElement, { className: `h-6 w-6 ${colorClass}` })}</div><div className="ml-4 mr-4"><p className="text-sm font-medium text-gray-500">{title}</p><p className="text-2xl font-bold text-gray-800">{value}</p></div></div>); }
function ManagementModal({ employee, currentBonus, currentDeduction, onSave, onClose }: { employee: Employee; currentBonus: number; currentDeduction: number; onSave: (empId: number, bonus: number, deduction: number) => void; onClose: () => void; }) { const [bonus, setBonus] = useState(currentBonus.toString()); const [deduction, setDeduction] = useState(currentDeduction.toString()); const handleSave = () => { onSave(employee.id, Number(bonus) || 0, Number(deduction) || 0); }; return (<div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"><div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-md animate-fade-in-down"><div className="flex justify-between items-center mb-6"><h2 className="text-2xl font-bold text-gray-800">إدارة مستحقات وخصومات</h2><button onClick={onClose} className="text-gray-500 hover:text-gray-800"><X size={28} /></button></div><p className="text-lg mb-6">الموظف: <span className="font-semibold text-blue-700">{employee.name}</span></p><div className="space-y-6"><div><label htmlFor="bonus" className="block text-sm font-medium text-gray-700 mb-1">المكافآت (مبلغ)</label><input id="bonus" type="number" value={bonus} onChange={(e) => setBonus(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md" /></div><div><label htmlFor="deduction" className="block text-sm font-medium text-gray-700 mb-1">الخصومات (مبلغ)</label><input id="deduction" type="number" value={deduction} onChange={(e) => setDeduction(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md" /></div></div><div className="mt-8 text-left"><button onClick={handleSave} className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition">حفظ</button></div></div></div>); }

interface LoanModalProps { employees: Employee[]; loans: Loan[]; setLoans: React.Dispatch<React.SetStateAction<Loan[]>>; onClose: () => void; }
const initialLoanFormState = { employeeId: '', totalAmount: '', installments: '', startDate: '', description: '' };
function LoanManagementModal({ employees, loans, setLoans, onClose }: LoanModalProps) {
  const [loanData, setLoanData] = useState(initialLoanFormState);
  const [editingLoanId, setEditingLoanId] = useState<number | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => { setLoanData(prev => ({ ...prev, [e.target.name]: e.target.value })); };
  const handleEditClick = (loan: Loan) => { setEditingLoanId(loan.id); setLoanData({ employeeId: loan.employeeId.toString(), totalAmount: loan.totalAmount.toString(), installments: loan.installments.toString(), startDate: loan.startDate, description: loan.description }); };
  const handleCancelEdit = () => { setEditingLoanId(null); setLoanData(initialLoanFormState); };
  const handleSaveLoan = (e: React.FormEvent) => { e.preventDefault(); if (!loanData.employeeId || !loanData.totalAmount || !loanData.installments || !loanData.startDate) { alert('الرجاء إدخال جميع الحقول الإلزامية.'); return; } const loanPayload = { employeeId: Number(loanData.employeeId), totalAmount: Number(loanData.totalAmount), installments: Number(loanData.installments), startDate: loanData.startDate, description: loanData.description }; if (editingLoanId) { setLoans(prev => prev.map(l => l.id === editingLoanId ? { ...l, ...loanPayload } : l)); } else { setLoans(prev => [...prev, { id: Date.now(), ...loanPayload }].sort((a,b) => a.startDate.localeCompare(b.startDate))); } handleCancelEdit(); };
  const handleDeleteLoan = (loanId: number) => { if (window.confirm('هل أنت متأكد من حذف هذه السلفة؟')) { setLoans(prev => prev.filter(loan => loan.id !== loanId)); } };
  const getEndDate = (start: string, months: number): string => { if (!start || !months) return '-'; const [year, month] = start.split('-').map(Number); const endDate = new Date(year, month - 1 + months - 1); return `${endDate.getFullYear()}-${(endDate.getMonth() + 1).toString().padStart(2, '0')}`; };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white p-6 rounded-lg shadow-2xl w-full max-w-5xl flex flex-col h-full max-h-[95vh] animate-fade-in-down">
        <div className="flex-shrink-0 flex justify-between items-center mb-4 border-b pb-3">
          <h2 className="text-2xl font-bold text-gray-800">إدارة السلف</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800"><X size={28} /></button>
        </div>
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-hidden">
          <div className="flex flex-col p-2 overflow-y-auto">
            <h3 className="text-xl font-semibold mb-4 text-gray-700 sticky top-0 bg-white pb-2">{editingLoanId ? 'تعديل السلفة' : 'إضافة سلفة جديدة'}</h3>
            <form onSubmit={handleSaveLoan} className="space-y-4">
              <div><label htmlFor="employeeId" className="block text-sm font-medium text-gray-700 mb-1">الموظف</label><select id="employeeId" name="employeeId" value={loanData.employeeId} onChange={handleInputChange} required className="w-full px-3 py-2 border border-gray-300 rounded-md"><option value="">اختر موظف...</option>{employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}</select></div>
              <div><label htmlFor="totalAmount" className="block text-sm font-medium text-gray-700 mb-1">إجمالي مبلغ السلفة</label><input id="totalAmount" name="totalAmount" type="number" value={loanData.totalAmount} onChange={handleInputChange} required className="w-full px-3 py-2 border border-gray-300 rounded-md" /></div>
              <div><label htmlFor="installments" className="block text-sm font-medium text-gray-700 mb-1">عدد أشهر السداد</label><input id="installments" name="installments" type="number" value={loanData.installments} onChange={handleInputChange} required className="w-full px-3 py-2 border border-gray-300 rounded-md" /></div>
              <div><label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">تاريخ بداية السداد</label><input id="startDate" name="startDate" type="month" value={loanData.startDate} onChange={handleInputChange} required className="w-full px-3 py-2 border border-gray-300 rounded-md" /></div>
              <div><label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">وصف / ملاحظات</label><textarea id="description" name="description" value={loanData.description} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md" rows={2}/></div>
              <div className="flex gap-4 pt-2"><button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition">{editingLoanId ? 'حفظ التعديلات' : 'إضافة السلفة'}</button>{editingLoanId && (<button type="button" onClick={handleCancelEdit} className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition">إلغاء التعديل</button>)}</div>
            </form>
          </div>
          <div className="flex flex-col min-h-0">
            <h3 className="text-xl font-semibold mb-4 text-gray-700">قائمة السلف الحالية</h3>
            <div className="flex-1 overflow-y-auto border rounded-md">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 sticky top-0 z-10"><tr><th className="p-2 text-right">الموظف</th><th className="p-2">المبلغ</th><th className="p-2">القسط</th><th className="p-2">البداية</th><th className="p-2">النهاية</th><th className="p-2">إجراءات</th></tr></thead>
                <tbody>{loans.map(loan => { const empName = employees.find(e => e.id === loan.employeeId)?.name || 'غير معروف'; return (<tr key={loan.id} className="border-b hover:bg-gray-50"><td className="p-2 font-medium">{empName}</td><td className="p-2 text-center">{loan.totalAmount.toLocaleString()}</td><td className="p-2 text-center">{(loan.totalAmount / loan.installments).toFixed(2)}</td><td className="p-2 text-center">{loan.startDate}</td><td className="p-2 text-center">{getEndDate(loan.startDate, loan.installments)}</td><td className="p-2 text-center flex justify-center gap-3"><button onClick={() => handleEditClick(loan)} className="text-blue-500 hover:text-blue-700" title="تعديل"><Edit size={16} /></button><button onClick={() => handleDeleteLoan(loan.id)} className="text-red-500 hover:text-red-700" title="حذف"><Trash2 size={16} /></button></td></tr>);})}</tbody>
              </table>
              {loans.length === 0 && <p className="text-center text-gray-500 mt-8">لا توجد سلف مسجلة حالياً.</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Payroll;