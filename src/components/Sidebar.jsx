import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';

// قائمة بأسماء الصفحات كما هي في قاعدة البيانات، مع مساراتها والأيقونات
const pages = [
  { name: 'Dashboard', path: '/', icon: '🏠' },
  { name: 'Employees', path: '/employees', icon: '👥' },
  { name: 'Attendance', path: '/attendance', icon: '📅' },
  { name: 'Payroll', path: '/payroll', icon: '💰' },
  { name: 'Transport', path: '/transport', icon: '🚌' },
  { name: 'History', path: '/history', icon: '📜' },
  { name: 'Permissions', path: '/permissions', icon: '🔒' },
];

export default function Sidebar() {
  const { can, logout } = useAuth();

  return (
    <div className="flex flex-col w-64 h-screen px-4 py-8 bg-white border-l"> {/* تغيير border-r إلى border-l */}
      <h2 className="text-3xl font-semibold text-center text-gray-800">
        نظام الرواتب
      </h2>

      <div className="flex flex-col justify-between flex-1 mt-6">
        <nav>
          <ul>
            {pages.map((page) =>
              // اعرض الرابط فقط إذا كان للمستخدم صلاحية عرض الصفحة
              can('view', page.name) && (
                <li key={page.name}>
                  <NavLink
                    to={page.path}
                    className={({ isActive }) =>
                      `flex items-center px-4 py-2 my-1 text-gray-700 transition-colors duration-300 transform rounded-md hover:bg-gray-200 ${
                        isActive ? 'bg-gray-200' : ''
                      }`
                    }
                  >
                    <span className="text-lg">{page.icon}</span>
                    <span className="mx-4 font-medium">{page.name}</span>
                  </NavLink>
                </li>
              )
            )}
          </ul>
        </nav>

        <div className="mt-6">
          <button
            onClick={logout}
            className="w-full flex items-center px-4 py-2 text-gray-600 transition-colors duration-300 transform rounded-md hover:bg-red-100 hover:text-red-700"
          >
            <span className="text-lg">🚪</span>
            <span className="mx-4 font-medium">تسجيل الخروج</span>
          </button>
        </div>
      </div>
    </div>
  );
}