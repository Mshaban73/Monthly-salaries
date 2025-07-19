// --- START OF FILE src/components/ProtectedRoute.tsx ---

import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function ProtectedRoute() {
  const { user } = useAuth();

  // إذا لم يكن هناك مستخدم مسجل (user is null)، قم بإعادة التوجيه إلى صفحة تسجيل الدخول
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // إذا كان المستخدم مسجلاً، اسمح بعرض المحتوى (الصفحة المحمية)
  // <Outlet /> هو المكان الذي سيتم فيه عرض مكونات المسارات الفرعية (مثل Dashboard, Employees, etc.)
  return <Outlet />;
}

export default ProtectedRoute;