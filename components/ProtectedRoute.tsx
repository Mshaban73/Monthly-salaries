// --- START OF FILE src/components/ProtectedRoute.tsx (النسخة النهائية الكاملة والمصححة) ---

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// المكون الآن يستقبل اسم الصفحة كـ prop بالإضافة إلى children
interface ProtectedRouteProps {
  pageName: string;
  children: React.ReactNode;
}

function ProtectedRoute({ pageName, children }: ProtectedRouteProps) {
  const { user, can } = useAuth();

  // 1. هل المستخدم مسجل دخوله أصلاً؟
  if (!user) {
    // إذا لا، أعد توجيهه لصفحة تسجيل الدخول
    return <Navigate to="/login" replace />;
  }

  // 2. هل لدى المستخدم صلاحية "view" لهذه الصفحة؟
  if (!can('view', pageName)) {
    // إذا لا، أظهر له رسالة "غير مصرح لك" وأعد توجيهه للصفحة الرئيسية
    // يمكنك لاحقاً إنشاء صفحة مخصصة لـ "Access Denied"
    // ملاحظة: تأكد أن كل المستخدمين لديهم صلاحية view للصفحة الرئيسية /
    // لتجنب حلقة لا نهائية إذا كانت الصفحة الرئيسية هي نفسها التي يُمنع منها.
    alert(`ليس لديك الصلاحية للوصول إلى صفحة ${pageName}`);
    return <Navigate to="/" replace />;
  }

  // 3. إذا كان كل شيء سليماً، اعرض الصفحة المطلوبة (children)
  return <>{children}</>;
}

export default ProtectedRoute;