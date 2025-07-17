import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, CalendarCheck, Wallet, History } from 'lucide-react';

const SidebarLink = ({ to, icon, children }) => (
  <NavLink
    to={to}
    end={to === "/"} // Use 'end' for the dashboard link to only match exactly
    className={({ isActive }) =>
      `flex items-center px-4 py-3 text-gray-200 hover:bg-gray-700 rounded-md transition-colors duration-200 ${
        isActive ? 'bg-gray-900 font-semibold' : ''
      }`
    }
  >
    {icon}
    <span className="mr-3">{children}</span>
  </NavLink>
);

function Layout({ children }) {
  return (
    <div className="bg-gray-100 min-h-screen flex" dir="rtl">
      <aside className="w-64 bg-gray-800 text-white flex-shrink-0 p-4 flex flex-col">
        <div className="flex items-center mb-8 px-2">
            <h1 className="text-xl font-bold text-white">إدارة الرواتب</h1>
        </div>
        <nav className="space-y-2">
          <SidebarLink to="/" icon={<LayoutDashboard size={20} />}>لوحة التحكم</SidebarLink>
          <SidebarLink to="/employees" icon={<Users size={20} />}>الموظفين</SidebarLink>
          <SidebarLink to="/attendance" icon={<CalendarCheck size={20} />}>الحضور</SidebarLink>
          <SidebarLink to="/payroll" icon={<Wallet size={20} />}>الرواتب</SidebarLink>
          <SidebarLink to="/history" icon={<History size={20} />}>سجل الرواتب</SidebarLink>
        </nav>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="bg-white shadow-sm">
          <div className="max-w-full mx-auto py-4 px-4 sm:px-6 lg:px-8">
            <h1 className="text-2xl font-bold text-gray-900">نظام إدارة الرواتب الذكي</h1>
          </div>
        </header>
        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

export default Layout;