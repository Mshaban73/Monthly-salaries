// --- START OF FILE src/components/Sidebar.tsx ---

import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, CalendarDays, Wallet, History, Truck, ShieldCheck } from 'lucide-react';
import logo from '../assets/logo.png';

const navLinks = [
  { to: '/', text: 'لوحة التحكم', icon: LayoutDashboard },
  { to: '/employees', text: 'الموظفين', icon: Users },
  { to: '/attendance', text: 'الحضور', icon: CalendarDays },
  { to: '/payroll', text: 'الرواتب', icon: Wallet },
  { to: '/history', text: 'السجل', icon: History },
  { to: '/transport-costs', text: 'تكاليف النقل', icon: Truck },
  // --- تعديل: إضافة الرابط الجديد ---
  { to: '/permissions', text: 'الصلاحيات', icon: ShieldCheck },
];

function Sidebar() {
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
            <li key={link.to}>
              <NavLink
                to={link.to}
                end={link.to === '/'} // Use 'end' only for the dashboard link
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
          ))}
        </ul>
      </nav>
    </aside>
  );
}

export default Sidebar;