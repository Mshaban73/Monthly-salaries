// --- START OF FILE src/pages/Login.tsx ---

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.png';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); // إعادة تعيين رسالة الخطأ عند كل محاولة

    // --- تعديل: استخدام دالة login الجديدة التي تتحقق من كلمة المرور ---
    // الدالة الآن تعيد true عند النجاح و false عند الفشل
    const loginSuccessful = login(username, password);
    
    if (loginSuccessful) {
      navigate('/'); // توجيه المستخدم إلى لوحة التحكم عند النجاح
    } else {
      setError('اسم المستخدم أو كلمة المرور غير صحيحة');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-lg">
        <div className="flex flex-col items-center">
          <img src={logo} alt="Company Logo" className="w-24 h-24 mb-4" />
          <h1 className="text-2xl font-bold text-center text-gray-800">
            ابتكار الحلول الهندسية
          </h1>
          <p className="text-sm text-gray-500">Think Solution Engineering LTD</p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label 
              htmlFor="username" 
              className="text-sm font-bold text-gray-600 block mb-2"
            >
              اسم المستخدم
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-3 text-gray-800 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label 
              htmlFor="password" 
              className="text-sm font-bold text-gray-600 block mb-2"
            >
              كلمة المرور
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 text-gray-800 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <div>
            <button 
              type="submit" 
              className="w-full p-3 text-lg font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              تسجيل الدخول
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Login;