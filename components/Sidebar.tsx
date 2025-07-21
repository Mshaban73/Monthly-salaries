// --- START OF FILE src/components/Sidebar.tsx (النسخة النهائية والمصححة) ---

import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, CalendarDays, Wallet, History, Truck, ShieldCheck, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext'; // <-- استيراد useAuth
import logo from '../assets/logo.png';

const navLinks = [
  { to: '/', text: 'لوحة التحكم', icon: LayoutDashboard, page: 'Dashboard' },
  { to: '/employees', text: 'الموظفين', icon: Users, page: 'Employees' },
  { to: '/attendance', text: 'ملخص الحضور', icon: CalendarDays, page: 'AttendanceSummary' }, // تم تعديل الاسم ليتوافق مع App.tsx
  { to: '/payroll', text: 'الرواتب', icon: Wallet, page: 'Payroll' },
  { to: '/history', text: 'السجل', icon: History, page: 'History' },
  { to: '/transport-costs', text: 'تكاليف النقل', icon: Truck, page: 'Transport' },
  { to: '/permissions', text: 'الصلاحيات', icon: ShieldCheck, page: 'Permissions' },
];

function Sidebar() {
  const { can } = useAuth(); // <-- استخدام useAuth للحصول على دالة الصلاحيات

  return (
    <aside className="w-64 bg-gray-800 text-white flex flex-col">
      <div className="flex flex-col items-center p-6 border-b border-gray-700">
        <img src={logo} alt="Company Logo" className="w-20 h-20 mb-3" />
        <h1 className="text-lg font-bold text-center text-white">
          ابتكار الحلول الهندسية
        </h1>
        <p className="text-xs text-gray-400">Think Solution Engineering LTD</p>
      </div>
      <nav className="flex-1 px-4 py-6">
        <ul>
          {navLinks.map((link) => (
            // التحقق من الصلاحية قبل عرض الرابط
            can('view', link.page) && (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  end={link.to === '/'}
                  className={({ isActive }) =>
                    `flex items-center px-4 py-3 my-1 rounded-lg transition-colors duration-200 ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`
                  }
                >
                  <link.icon size={20} className="ml-4" />
                  <span className="font-medium">{link.text}</span>
                </NavLink>
              </li>
            )
          ))}
        </ul>
      </nav>
    </aside>
  );
}

export default Sidebar;