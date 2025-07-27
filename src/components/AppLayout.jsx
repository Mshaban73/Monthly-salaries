import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function AppLayout() {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* القائمة الجانبية */}
      <Sidebar />
      
      {/* مساحة المحتوى الرئيسية */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          {/* هنا حيث سيعرض React Router الصفحة الحالية */}
          <Outlet />
        </div>
      </main>
    </div>
  );
}