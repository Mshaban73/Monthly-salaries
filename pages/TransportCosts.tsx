// --- START OF FILE src/pages/TransportCosts.tsx (النسخة النهائية الكاملة والمصححة) ---

import React, { useEffect, useState, useMemo } from "react";
import * as XLSX from "xlsx";
import { useNavigate } from 'react-router-dom';
import type { HistoricalPayroll } from '../App';
import { useAuth } from '../context/AuthContext';
import { Edit, Trash2, X, Save, DollarSign, PlusCircle } from 'lucide-react';

interface Driver { id: number; name: string; workLocation: string; paymentSource: string; dayCost: number; }
type DailyAttendance = { [date: string]: number };
type MonthlyAttendance = { [driverId: number]: DailyAttendance };
type AllAttendance = { [periodKey: string]: MonthlyAttendance };

interface FinancialItem { id: number; amount: number; note: string; }
type FinancialItemsState = { [driverId: number]: FinancialItem[] };
type AllFinancialItemsState = { [periodKey: string]: FinancialItemsState };

interface TransportCostsProps {
  historicalPayrolls: HistoricalPayroll[];
  setHistoricalPayrolls: React.Dispatch<React.SetStateAction<HistoricalPayroll[]>>;
}

const DRIVERS_STORAGE_KEY = "transportDrivers_v1";
const ATTENDANCE_STORAGE_KEY = "transportAttendance_v1";
const EXTRAS_STORAGE_KEY = "transportExtras_v2";
const DEDUCTIONS_STORAGE_KEY = "transportDeductions_v2";

const generateDateRangeForMonth = (year: number, month: number): string[] => { const dates: string[] = []; const startDate = new Date(year, month - 2, 26); const endDate = new Date(year, month - 1, 25); for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) { const yyyy = d.getFullYear(); const mm = String(d.getMonth() + 1).padStart(2, '0'); const dd = String(d.getDate()).padStart(2, '0'); dates.push(`${yyyy}-${mm}-${dd}`); } return dates; };

function TransportCosts({ historicalPayrolls, setHistoricalPayrolls }: TransportCostsProps) {
  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [allAttendance, setAllAttendance] = useState<AllAttendance>({});
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [allExtras, setAllExtras] = useState<AllFinancialItemsState>({});
  const [allDeductions, setAllDeductions] = useState<AllFinancialItemsState>({});
  const [managingDriver, setManagingDriver] = useState<Driver | null>(null);
  const navigate = useNavigate();
  const { can } = useAuth();

  const periodKey = `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}`;
  const days = useMemo(() => generateDateRangeForMonth(selectedYear, selectedMonth), [selectedYear, selectedMonth]);

  useEffect(() => {
    const savedDrivers = localStorage.getItem(DRIVERS_STORAGE_KEY);
    if (savedDrivers) setDrivers(JSON.parse(savedDrivers));
    const savedAttendance = localStorage.getItem(ATTENDANCE_STORAGE_KEY);
    if (savedAttendance) setAllAttendance(JSON.parse(savedAttendance));
    const savedExtras = localStorage.getItem(EXTRAS_STORAGE_KEY);
    if (savedExtras) setAllExtras(JSON.parse(savedExtras));
    const savedDeductions = localStorage.getItem(DEDUCTIONS_STORAGE_KEY);
    if (savedDeductions) setAllDeductions(JSON.parse(savedDeductions));
  }, []);

  const saveDrivers = (updatedDrivers: Driver[]) => { setDrivers(updatedDrivers); localStorage.setItem(DRIVERS_STORAGE_KEY, JSON.stringify(updatedDrivers)); };
  const saveAttendance = (updatedAttendance: AllAttendance) => { setAllAttendance(updatedAttendance); localStorage.setItem(ATTENDANCE_STORAGE_KEY, JSON.stringify(updatedAttendance)); };
  const saveExtras = (updatedExtras: AllFinancialItemsState) => { setAllExtras(updatedExtras); localStorage.setItem(EXTRAS_STORAGE_KEY, JSON.stringify(updatedExtras)); };
  const saveDeductions = (updatedDeductions: AllFinancialItemsState) => { setAllDeductions(updatedDeductions); localStorage.setItem(DEDUCTIONS_STORAGE_KEY, JSON.stringify(updatedDeductions)); };
  
  const addDriver = (driver: Driver) => { saveDrivers([...drivers, driver]); };
  const updateDriver = (updatedDriver: Driver) => { saveDrivers(drivers.map(d => d.id === updatedDriver.id ? updatedDriver : d)); setEditingDriver(null); };
  const deleteDriver = (driverId: number) => { if (window.confirm("هل أنت متأكد؟")) { saveDrivers(drivers.filter(d => d.id !== driverId)); } };

  const handleDayChange = (driverId: number, date: string, value: number) => { const newAllAttendance = { ...allAttendance }; if (!newAllAttendance[periodKey]) newAllAttendance[periodKey] = {}; if (!newAllAttendance[periodKey][driverId]) newAllAttendance[periodKey][driverId] = {}; if (value === 0 || isNaN(value)) { delete newAllAttendance[periodKey][driverId][date]; } else { newAllAttendance[periodKey][driverId][date] = value; } saveAttendance(newAllAttendance); };
  
  const currentMonthAttendance = allAttendance[periodKey] || {};
  const currentMonthExtras = allExtras[periodKey] || {};
  const currentMonthDeductions = allDeductions[periodKey] || {};

  const getDriverTotal = (driverId: number) => {
    const records = currentMonthAttendance[driverId] || {};
    const totalDays = Object.values(records).reduce((acc, val) => acc + Number(val || 0), 0);
    const driver = drivers.find((d) => d.id === driverId);
    const baseCost = totalDays * (driver?.dayCost || 0);
    const extrasTotal = (currentMonthExtras[driverId] || []).reduce((sum, item) => sum + item.amount, 0);
    const deductionsTotal = (currentMonthDeductions[driverId] || []).reduce((sum, item) => sum + item.amount, 0);
    return { totalDays, totalCost: baseCost + extrasTotal - deductionsTotal, extrasTotal, deductionsTotal };
  };
  
  const handleSaveExtras = (driverId: number, extras: FinancialItem[], deductions: FinancialItem[]) => {
    setAllExtras(prev => ({ ...prev, [periodKey]: { ...prev[periodKey], [driverId]: extras } }));
    setAllDeductions(prev => ({ ...prev, [periodKey]: { ...prev[periodKey], [driverId]: deductions } }));
    setManagingDriver(null);
  };
  
  const saveTransportCost = () => { const monthlyTotal = drivers.reduce((total, driver) => total + getDriverTotal(driver.id).totalCost, 0); setHistoricalPayrolls(prev => { const existingIndex = prev.findIndex(p => p.year === selectedYear && p.month === selectedMonth); const newPayrolls = [...prev]; if (existingIndex > -1) { newPayrolls[existingIndex] = { ...newPayrolls[existingIndex], transportCost: monthlyTotal }; } else { newPayrolls.push({ year: selectedYear, month: selectedMonth, transportCost: monthlyTotal }); } return newPayrolls; }); alert("تم حفظ تكلفة النقل بنجاح!"); navigate('/history'); };
  const handleExportExcel = () => { const exportData = drivers.map((driver) => { const { totalDays, totalCost, extrasTotal, deductionsTotal } = getDriverTotal(driver.id); return { "اسم السائق": driver.name, "موقع العمل": driver.workLocation, "جهة الصرف": driver.paymentSource, "قيمة اليوم": driver.dayCost, "عدد الأيام": totalDays, "مستحقات أخرى": extrasTotal, "خصومات": deductionsTotal, "إجمالي التكلفة": totalCost }; }); const ws = XLSX.utils.json_to_sheet(exportData); const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "تكلفة النقل"); XLSX.writeFile(wb, "transport-costs.xlsx"); };
  const handlePrint = () => { const printable = drivers.map((driver) => { const { totalDays, totalCost, extrasTotal, deductionsTotal } = getDriverTotal(driver.id); return `<tr><td>${driver.name}</td><td>${driver.dayCost}</td><td>${totalDays}</td><td>${extrasTotal}</td><td>${deductionsTotal}</td><td>${totalCost}</td></tr>`; }).join(""); const newWindow = window.open("", "_blank"); if (newWindow) { newWindow.document.write(`<html dir="rtl"><head><title>طباعة</title><style>table{border-collapse:collapse;width:100%;}td,th{border:1px solid #000;padding:8px;text-align:center;}</style></head><body><h2>ملخص تكلفة النقل</h2><table><thead><tr><th>اسم السائق</th><th>قيمة اليوم</th><th>عدد الأيام</th><th>مستحقات أخرى</th><th>خصومات</th><th>إجمالي التكلفة</th></tr></thead><tbody>${printable}</tbody></table></body></html>`); newWindow.document.close(); newWindow.print(); } };

  return (
    <div className="space-y-10 p-4">
      <div className="flex flex-wrap gap-4 items-center">
        <select className="border rounded px-2 py-1" value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))}>{Array.from({ length: 12 }, (_, i) => (<option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString("ar-EG", { month: "long" })}</option>))}</select>
        <select className="border rounded px-2 py-1" value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}>{[2024, 2025, 2026].map((y) => (<option key={y}>{y}</option>))}</select>
        {can('view', 'Transport') && <button onClick={handleExportExcel} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">تصدير Excel</button>}
        {can('view', 'Transport') && <button onClick={handlePrint} className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700">طباعة</button>}
        {can('add', 'Transport') && <button onClick={saveTransportCost} className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700">حفظ وترحيل التكلفة</button>}
      </div>
      
      {can('add', 'Transport') && (<div className="bg-white p-6 rounded-lg shadow"><h2 className="text-xl font-bold mb-4">{editingDriver ? "تعديل بيانات السائق" : "إضافة سائق / سيارة"}</h2><form className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" onSubmit={(e) => { e.preventDefault(); const form = e.target as HTMLFormElement; const driverData = { id: editingDriver ? editingDriver.id : Date.now(), name: (form.elements.namedItem('name') as HTMLInputElement).value, workLocation: (form.elements.namedItem('workLocation') as HTMLInputElement).value, paymentSource: (form.elements.namedItem('paymentSource') as HTMLInputElement).value, dayCost: Number((form.elements.namedItem('dayCost') as HTMLInputElement).value) }; if (editingDriver) { updateDriver(driverData); } else { addDriver(driverData); } form.reset(); setEditingDriver(null); }}><input required name="name" placeholder="اسم السائق" className="border p-2 rounded" defaultValue={editingDriver?.name || ""} /><input required name="workLocation" placeholder="موقع العمل" className="border p-2 rounded" defaultValue={editingDriver?.workLocation || ""} /><input required name="paymentSource" placeholder="جهة الصرف" className="border p-2 rounded" defaultValue={editingDriver?.paymentSource || ""} /><input required name="dayCost" type="number" placeholder="تكلفة اليوم" className="border p-2 rounded" defaultValue={editingDriver?.dayCost || ""} /><div className="col-span-full"><button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">{editingDriver ? "حفظ التعديل" : "إضافة السائق"}</button>{editingDriver && (<button type="button" onClick={() => setEditingDriver(null)} className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 ml-2">إلغاء</button>)}</div></form></div>)}
      
      <div className="bg-white p-4 rounded-lg shadow overflow-auto">
        <h2 className="text-xl font-bold mb-4">تسجيل الحضور وحساب التكلفة لشهر: {selectedMonth}/{selectedYear}</h2>
        <table className="min-w-max table-auto border">
          <thead className="bg-gray-100 text-sm text-gray-700">
            <tr>
              <th className="border px-2 py-1">الاسم</th><th className="border px-2 py-1">قيمة اليوم</th><th className="border px-2 py-1">عدد الأيام</th>
              <th className="border px-2 py-1">مستحقات أخرى</th><th className="border px-2 py-1">خصومات</th>
              <th className="border px-2 py-1">الإجمالي</th>
              {days.map((date) => (<th key={date} className="border px-2 py-1 whitespace-nowrap text-center"><div className="text-xs">{new Date(date + "T00:00:00").toLocaleDateString("ar-EG", { weekday: "short", timeZone: "UTC" })}</div><div className="text-xs text-gray-600">{date.slice(5)}</div></th>))}
              {can('edit', 'Transport') && <th className="border px-2 py-1">الإجراءات</th>}
            </tr>
          </thead>
          <tbody>
            {drivers.map((driver) => {
              const { totalDays, totalCost, extrasTotal, deductionsTotal } = getDriverTotal(driver.id);
              return (
                <tr key={driver.id} className="text-center">
                  <td className="border px-2 py-1">{driver.name}</td>
                  <td className="border px-2 py-1">{driver.dayCost}</td>
                  <td className="border px-2 py-1 font-bold text-blue-700">{totalDays}</td>
                  <td className="border px-2 py-1 text-green-600">{extrasTotal.toFixed(2)}</td>
                  <td className="border px-2 py-1 text-red-600">{deductionsTotal.toFixed(2)}</td>
                  <td className="border px-2 py-1 font-bold text-green-700">{totalCost.toFixed(2)}</td>
                  {days.map((date) => (
                    <td key={date} className="border px-1 py-1">
                      <input type="number" step="0.5" min="0" max="2" value={currentMonthAttendance[driver.id]?.[date] || ""} 
                       disabled={!can('edit', 'Transport')}
                       onChange={(e) => handleDayChange(driver.id, date, parseFloat(e.target.value || "0"))} 
                       className="w-14 text-center border rounded px-1 py-0.5 text-sm disabled:bg-gray-100 disabled:cursor-not-allowed" />
                    </td>
                  ))}
                  {can('edit', 'Transport') && (
                    <td className="border px-2 py-1">
                      <div className="flex justify-center items-center gap-2">
                        <button onClick={() => setManagingDriver(driver)} className="text-green-600 hover:text-green-800" title="إدارة مالية"><DollarSign size={18}/></button>
                        <button onClick={() => setEditingDriver(driver)} className="text-yellow-600 hover:text-yellow-800" title="تعديل بيانات"><Edit size={18}/></button>
                        {can('delete', 'Transport') && <button onClick={() => deleteDriver(driver.id)} className="text-red-600 hover:text-red-800" title="حذف"><Trash2 size={18}/></button>}
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {managingDriver && (
        <FinancialsModal
          driver={managingDriver}
          periodKey={periodKey}
          currentExtras={currentMonthExtras[managingDriver.id] || []}
          currentDeductions={currentMonthDeductions[managingDriver.id] || []}
          setAllExtras={saveExtras}
          setAllDeductions={saveDeductions}
          onClose={() => setManagingDriver(null)}
        />
      )}
    </div>
  );
}

interface FinancialsModalProps {
    driver: Driver;
    periodKey: string;
    currentExtras: FinancialItem[];
    currentDeductions: FinancialItem[];
    setAllExtras: (updater: (prev: AllFinancialItemsState) => AllFinancialItemsState) => void;
    setAllDeductions: (updater: (prev: AllFinancialItemsState) => AllFinancialItemsState) => void;
    onClose: () => void;
}
function FinancialsModal({ driver, periodKey, currentExtras, currentDeductions, setAllExtras, setAllDeductions, onClose }: FinancialsModalProps) {
    const [extras, setExtras] = useState<FinancialItem[]>(currentExtras);
    const [deductions, setDeductions] = useState<FinancialItem[]>(currentDeductions);

    const handleSave = () => {
        setAllExtras(prev => ({ ...prev, [periodKey]: { ...(prev[periodKey] || {}), [driver.id]: extras } }));
        setAllDeductions(prev => ({ ...prev, [periodKey]: { ...(prev[periodKey] || {}), [driver.id]: deductions } }));
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white p-6 rounded-lg shadow-2xl w-full max-w-4xl flex flex-col h-full max-h-[90vh]">
                <div className="flex-shrink-0 flex justify-between items-center mb-4 border-b pb-3"><h2 className="text-2xl font-bold text-gray-800">إدارة مالية للسائق: {driver.name}</h2><button onClick={onClose} className="text-gray-500 hover:text-gray-800"><X size={28} /></button></div>
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-hidden">
                    <FinancialSection title="مستحقات أخرى" items={extras} setItems={setExtras} color="green" />
                    <FinancialSection title="خصومات" items={deductions} setItems={setDeductions} color="red" />
                </div>
                <div className="flex-shrink-0 mt-6 text-left border-t pt-4"><button onClick={handleSave} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center"><Save className="mr-2"/>حفظ التغييرات</button></div>
            </div>
        </div>
    );
}

interface FinancialSectionProps { title: string; items: FinancialItem[]; setItems: React.Dispatch<React.SetStateAction<FinancialItem[]>>; color: 'green' | 'red'; }
function FinancialSection({ title, items, setItems, color }: FinancialSectionProps) {
    const [amount, setAmount] = useState('');
    const [note, setNote] = useState('');

    const handleAddItem = () => {
        if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) { alert('الرجاء إدخال مبلغ صحيح.'); return; }
        const newItem: FinancialItem = { id: Date.now(), amount: Number(amount), note };
        setItems(prev => [...prev, newItem]);
        setAmount(''); setNote('');
    };
    
    const handleDeleteItem = (id: number) => { setItems(prev => prev.filter(item => item.id !== id)); };
    const total = items.reduce((sum, item) => sum + item.amount, 0);

    return (
        <div className="flex flex-col min-h-0 border rounded-lg p-4 bg-gray-50">
            <h3 className={`text-xl font-semibold mb-4 text-${color}-600`}>{title}</h3>
            <div className="flex items-end gap-2 mb-4">
                <div className="flex-grow"><label className="text-xs">المبلغ</label><input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="w-full p-2 border rounded-md" /></div>
                <div className="flex-grow"><label className="text-xs">البيان</label><input type="text" value={note} onChange={e => setNote(e.target.value)} className="w-full p-2 border rounded-md" /></div>
                <button onClick={handleAddItem} className={`bg-${color}-500 text-white p-2 rounded-md hover:bg-${color}-600 shrink-0`}><PlusCircle/></button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 border-t pt-2">
                {items.map(item => (
                    <div key={item.id} className="flex items-center justify-between bg-white p-2 rounded shadow-sm">
                        <span className="flex-1 text-sm">{item.note || 'بدون بيان'}</span>
                        <span className="font-semibold mx-4">{item.amount.toLocaleString()}</span>
                        <button onClick={() => handleDeleteItem(item.id)} className="text-gray-400 hover:text-red-600"><Trash2 size={16}/></button>
                    </div>
                ))}
                {items.length === 0 && <p className="text-center text-gray-400 pt-4">لا توجد بنود.</p>}
            </div>
            <div className={`mt-4 pt-2 border-t font-bold text-lg text-right text-${color}-600`}>الإجمالي: {total.toLocaleString()}</div>
        </div>
    );
}

export default TransportCosts;