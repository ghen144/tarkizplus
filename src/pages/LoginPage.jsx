import React, { useState } from 'react';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import Logo from "@/components/Logo.jsx";
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/firebase/firebase.jsx';
import { useTranslation } from 'react-i18next';

const LoginPage = () => {
  const { t, i18n } = useTranslation();

  const [loginType, setLoginType] = useState('teacher');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const auth = getAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (loginType === 'admin') {
        const q = query(collection(db, "admin"), where("email", "==", email));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          localStorage.setItem("userRole", "admin");
          navigate("/admin/home");
        } else {
          setError(t("errorNotAdmin"));
        }

      } else if (loginType === 'teacher') {
        const q = query(collection(db, "teachers"), where("email", "==", email));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          localStorage.setItem("userRole", "teacher");
          navigate("/homepage");
        } else {
          setError(t("errorNotTeacher"));
        }
      }
    } catch (err) {
      console.error(err);
      setError(t("loginFailed"));
    }
  };

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="w-full max-w-md bg-white p-8 rounded shadow">
          {/* Logo */}
          <div className="flex flex-col items-center mb-6">
            <Logo />
          </div>

          {/* Login Type Tabs */}
          <div className="flex justify-center mb-6">
            <button
                onClick={() => setLoginType('teacher')}
                className={`px-4 py-2 ${loginType === 'teacher' ? 'border-b-2 border-blue-500 font-semibold' : 'text-gray-500'}`}
            >
              {t("teacherLogin")}
            </button>
            <button
                onClick={() => setLoginType('admin')}
                className={`px-4 py-2 ml-4 ${loginType === 'admin' ? 'border-b-2 border-blue-500 font-semibold' : 'text-gray-500'}`}
            >
              {t("adminLogin")}
            </button>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin}>
            {error && <p className="text-red-500 mb-4">{error}</p>}
            <div className="mb-4">
              <label className="block text-gray-700 mb-1">{t("email")}</label>
              <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="mb-6">
              <label className="block text-gray-700 mb-1">{t("password")}</label>
              <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
                type="submit"
                className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
            >
              {t("login")}
            </button>
          </form>

          {/* Language Switcher */}
          <div className="mt-6 text-center">
            <p className="text-sm mb-2">{t("changeLanguage")}:</p>
            <div className="flex justify-center gap-2">
              <button onClick={() => changeLanguage('en')} className="border px-3 py-1 rounded text-sm">EN</button>
              <button onClick={() => changeLanguage('ar')} className="border px-3 py-1 rounded text-sm">ع</button>
              <button onClick={() => changeLanguage('he')} className="border px-3 py-1 rounded text-sm">ע</button>
            </div>
          </div>
        </div>
      </div>
  );
};

export default LoginPage;