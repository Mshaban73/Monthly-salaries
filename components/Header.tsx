// --- START OF FILE src/components/Header.tsx ---

import React, { useState, useEffect } from 'react';
import { LogOut, UserCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // تحديث الوقت كل ثانية
    const timerId = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timerId);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-white shadow-md p-4 flex justify-between items-center">
      {/* اسم المستخدم */}
      <div className="flex items-center">
        <UserCircle size={28} className="text-gray-600 mr-2" />
        <span className="text-lg font-semibold text-gray-700">
          مرحباً، {user}
        </span>
      </div>
      
      {/* الوقت والتاريخ وتسجيل الخروج */}
      <div className="flex items-center gap-6">
        <div className="text-center">
          <p className="text-sm font-medium text-gray-800">
            {currentTime.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
          </p>
          <p className="text-xs text-gray-500">
            {currentTime.toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <button 
          onClick={handleLogout}
          className="flex items-center text-red-600 hover:text-red-800 transition-colors"
          title="تسجيل الخروج"
        >
          <LogOut size={22} />
          <span className="mr-2 hidden md:block">خروج</span>
        </button>
      </div>
    </header>
  );
}

export default Header;