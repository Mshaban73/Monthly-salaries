import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import Attendance from './pages/Attendance';
import EmployeeAttendance from './pages/EmployeeAttendance';
import Payroll from './pages/Payroll';
import History from './pages/History';
import ReportView from './pages/ReportView';
import type { PayrollReport } from './utils/payrollCalculator';


// Define types for shared state
export interface Employee {
  id: number;
  name: string;
  jobTitle: string;
  workLocation: string;
  salaryType: 'شهري' | 'يومي';
  salaryAmount: number;
  paymentSource: string;
  restDays: string[];
}

export interface AttendanceRecords {
  [date: string]: {
    [employeeId: string]: number;
  };
}

export interface PublicHoliday {
  date: string;
  name: string;
}

export interface HistoricalPayroll {
  year: number;
  month: number;
  report: PayrollReport[];
}


const APP_DATA_KEY = 'payrollAppData_v2';

function App() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecords>({});
  const [publicHolidays, setPublicHolidays] = useState<PublicHoliday[]>([]);
  const [historicalPayrolls, setHistoricalPayrolls] = useState<HistoricalPayroll[]>([]);

  // Load state from localStorage on initial render
  useEffect(() => {
    try {
      const savedData = localStorage.getItem(APP_DATA_KEY);
      if (savedData) {
        const { employees, attendanceRecords, publicHolidays, historicalPayrolls } = JSON.parse(savedData);
        if (employees) setEmployees(employees);
        if (attendanceRecords) setAttendanceRecords(attendanceRecords);
        if (publicHolidays) setPublicHolidays(publicHolidays);
        if (historicalPayrolls) setHistoricalPayrolls(historicalPayrolls);
      }
    } catch (error) {
      console.error("Failed to load data from localStorage", error);
    }
  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    try {
      const appData = JSON.stringify({ employees, attendanceRecords, publicHolidays, historicalPayrolls });
      localStorage.setItem(APP_DATA_KEY, appData);
    } catch (error) {
      console.error("Failed to save data to localStorage", error);
    }
  }, [employees, attendanceRecords, publicHolidays, historicalPayrolls]);


  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={
            <Dashboard 
              employees={employees} 
              attendanceRecords={attendanceRecords}
              publicHolidays={publicHolidays}
              setPublicHolidays={setPublicHolidays}
            />} 
          />
          <Route 
            path="/employees" 
            element={<Employees employees={employees} setEmployees={setEmployees} />} 
          />
          <Route 
            path="/attendance" 
            element={<Attendance employees={employees} />} 
          />
          <Route 
            path="/attendance/:employeeId" 
            element={
              <EmployeeAttendance 
                employees={employees} 
                attendanceRecords={attendanceRecords} 
                setAttendanceRecords={setAttendanceRecords}
                publicHolidays={publicHolidays}
              />}
          />
          <Route 
            path="/payroll" 
            element={
              <Payroll 
                employees={employees} 
                attendanceRecords={attendanceRecords}
                publicHolidays={publicHolidays}
                historicalPayrolls={historicalPayrolls}
                setHistoricalPayrolls={setHistoricalPayrolls}
              />} 
          />
          <Route 
            path="/history"
            element={<History historicalPayrolls={historicalPayrolls} />}
          />
           <Route 
            path="/history/:year/:month"
            element={<ReportView historicalPayrolls={historicalPayrolls} />}
          />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;