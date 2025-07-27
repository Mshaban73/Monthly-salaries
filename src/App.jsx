// --- START OF FILE App.jsx (النهائي بالكامل مع كل المسارات) ---

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.tsx';

import AppLayout from './components/AppLayout.jsx';
import Login from './components/Login.jsx';
import Employees from './pages/Employees.tsx';
import Dashboard from './pages/Dashboard.tsx';
import AttendanceSummary from './pages/AttendanceSummary.tsx';
import EmployeeAttendance from './pages/EmployeeAttendance.tsx';
import Payroll from './pages/Payroll.tsx';
import TransportCosts from './pages/TransportCosts.tsx';
import History from './pages/History.tsx';
import ReportView from './pages/ReportView.tsx';
import UserPermissionsPage from './pages/UserPermissionsPage.tsx'; // <-- تم الاستيراد

// الصفحات المتبقية
const PageNotFound = () => <h1>Page Not Found</h1>;

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function App() {
  const { user } = useAuth();

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate replace to="dashboard" />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="employees" element={<Employees />} />
          <Route path="attendance" element={<AttendanceSummary />} />
          <Route path="attendance/:employeeId" element={<EmployeeAttendance />} />
          <Route path="payroll" element={<Payroll />} />
          <Route path="transport" element={<TransportCosts />} />
          <Route path="history" element={<History />} />
          <Route path="history/:year/:month" element={<ReportView />} />
          
          {/* ▼▼▼ هذا هو المسار الذي تم تعديله ▼▼▼ */}
          <Route path="permissions" element={<UserPermissionsPage />} />
          {/* ▲▲▲ نهاية التعديل ▲▲▲ */}
        </Route>

        <Route 
          path="login" 
          element={user ? <Navigate to="/" replace /> : <Login />} 
        />
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;