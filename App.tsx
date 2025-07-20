// --- START OF FILE src/App.tsx ---

import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import EmployeeAttendance from './pages/EmployeeAttendance';
import Payroll from './pages/Payroll';
import History from './pages/History';
import ReportView from './pages/ReportView';
import TransportCosts from './pages/TransportCosts';
import AttendanceSummary from './pages/AttendanceSummary';
import UserPermissionsPage, { UserPermissions } from './pages/UserPermissionsPage';

export interface BonusDeductionState { [employeeId: number]: number; }
export interface GeneralBonusesState { [periodKey: string]: string; }
export interface Loan { id: number; employeeId: number; totalAmount: number; installments: number; startDate: string; description: string; }
export interface Employee { id: number; name: string; jobTitle: string; workLocation: string; salaryType: 'شهري' | 'يومي'; salaryAmount: number; paymentSource: string; restDays: string[]; hoursPerDay: number; isHeadOffice: boolean; transportAllowance?: number; expatriationAllowance?: number; mealAllowance?: number; housingAllowance?: number; }
export interface AttendanceRecordDetail { hours: number; location?: string; }
export interface AttendanceRecords { [date: string]: { [employeeId: number]: AttendanceRecordDetail; }; }
export interface PublicHoliday { date: string; name: string; }
export interface HistoricalPayroll { year: number; month: number; report?: any[]; transportCost?: number; }

const APP_DATA_KEY = 'payrollAppData_v3';
export const PERMISSIONS_KEY = 'user_permissions_v1';

function App() {
  const [employees, setEmployees] = useState<Employee[]>(() => { const savedData = localStorage.getItem(APP_DATA_KEY); if (savedData) { const data = JSON.parse(savedData); return (data.employees || []).map((emp: any) => ({ ...emp, hoursPerDay: emp.hoursPerDay || 8, isHeadOffice: emp.isHeadOffice || false, })); } return []; });
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecords>(() => { const savedData = localStorage.getItem(APP_DATA_KEY); if (savedData) { const data = JSON.parse(savedData); const oldRecords = data.attendanceRecords || {}; const newRecords: AttendanceRecords = {}; for (const date in oldRecords) { newRecords[date] = {}; for (const empId in oldRecords[date]) { const record = oldRecords[date][empId]; if (typeof record === 'number') { newRecords[date][empId] = { hours: record, location: '' }; } else { newRecords[date][empId] = record; } } } return newRecords; } return {}; });
  const [publicHolidays, setPublicHolidays] = useState<PublicHoliday[]>(() => { const savedData = localStorage.getItem(APP_DATA_KEY); if (savedData) { return JSON.parse(savedData).publicHolidays || []; } return []; });
  const [historicalPayrolls, setHistoricalPayrolls] = useState<HistoricalPayroll[]>(() => { const savedData = localStorage.getItem(APP_DATA_KEY); if (savedData) { return JSON.parse(savedData).historicalPayrolls || []; } return []; });
  const [bonuses, setBonuses] = useState<BonusDeductionState>(() => { const savedData = localStorage.getItem(APP_DATA_KEY); if (savedData) { return JSON.parse(savedData).bonuses || {}; } return {}; });
  const [deductions, setDeductions] = useState<BonusDeductionState>(() => { const savedData = localStorage.getItem(APP_DATA_KEY); if (savedData) { return JSON.parse(savedData).deductions || {}; } return {}; });
  const [generalBonuses, setGeneralBonuses] = useState<GeneralBonusesState>(() => { const savedData = localStorage.getItem(APP_DATA_KEY); if (savedData) { return JSON.parse(savedData).generalBonuses || {}; } return {}; });
  const [loans, setLoans] = useState<Loan[]>(() => { const savedData = localStorage.getItem(APP_DATA_KEY); if (savedData) { return JSON.parse(savedData).loans || []; } return []; });
  
  useEffect(() => {
    try {
      const appData = {
        employees, attendanceRecords, publicHolidays, historicalPayrolls,
        bonuses, deductions, generalBonuses, loans
      };
      localStorage.setItem(APP_DATA_KEY, JSON.stringify(appData));
    } catch (error) {
      console.error("Failed to save data to localStorage", error);
    }
  }, [employees, attendanceRecords, publicHolidays, historicalPayrolls, bonuses, deductions, generalBonuses, loans]);

  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute pageName="Dashboard"><Layout><Dashboard employees={employees} attendanceRecords={attendanceRecords} publicHolidays={publicHolidays} setPublicHolidays={setPublicHolidays} /></Layout></ProtectedRoute>}/>
          <Route path="/employees" element={<ProtectedRoute pageName="Employees"><Layout><Employees employees={employees} setEmployees={setEmployees} /></Layout></ProtectedRoute>}/>
          <Route path="/attendance" element={<ProtectedRoute pageName="Attendance"><Layout><AttendanceSummary employees={employees} attendanceRecords={attendanceRecords} publicHolidays={publicHolidays} /></Layout></ProtectedRoute>}/>
          <Route path="/attendance/:employeeId" element={<ProtectedRoute pageName="Attendance"><Layout><EmployeeAttendance employees={employees} attendanceRecords={attendanceRecords} setAttendanceRecords={setAttendanceRecords} publicHolidays={publicHolidays} /></Layout></ProtectedRoute>}/>
          <Route path="/payroll" element={<ProtectedRoute pageName="Payroll"><Layout><Payroll employees={employees} attendanceRecords={attendanceRecords} publicHolidays={publicHolidays} historicalPayrolls={historicalPayrolls} setHistoricalPayrolls={setHistoricalPayrolls} bonuses={bonuses} setBonuses={setBonuses} deductions={deductions} setDeductions={setDeductions} generalBonuses={generalBonuses} setGeneralBonuses={setGeneralBonuses} loans={loans} setLoans={setLoans} /></Layout></ProtectedRoute>}/>
          
          {/* --- تعديل: تمرير دالة التحديث إلى History --- */}
          <Route path="/history" element={<ProtectedRoute pageName="History"><Layout><History historicalPayrolls={historicalPayrolls} setHistoricalPayrolls={setHistoricalPayrolls} /></Layout></ProtectedRoute>}/>
          
          <Route path="/history/:year/:month" element={<ProtectedRoute pageName="History"><Layout><ReportView historicalPayrolls={historicalPayrolls} employees={employees} /></Layout></ProtectedRoute>}/>
          
          {/* --- تعديل: تمرير دالة التحديث إلى TransportCosts --- */}
          <Route path="/transport-costs" element={<ProtectedRoute pageName="Transport"><Layout><TransportCosts historicalPayrolls={historicalPayrolls} setHistoricalPayrolls={setHistoricalPayrolls} /></Layout></ProtectedRoute>}/>
          
          <Route path="/permissions" element={<ProtectedRoute pageName="Permissions"><Layout><UserPermissionsPage /></Layout></ProtectedRoute>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;