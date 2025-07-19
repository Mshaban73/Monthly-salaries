// --- START OF FILE src/components/Layout.tsx ---

import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header'; // استيراد الشريط العلوي الجديد

interface LayoutProps {
  children: React.ReactNode;
}

function Layout({ children }: LayoutProps) {
  return (
    <div className="flex h-screen bg-gray-100" dir="rtl">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-200">
          <div className="container mx-auto px-6 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export default Layout;