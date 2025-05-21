import React from 'react';
import { Home, Users, LogOut, GraduationCap, BookOpen, ClipboardList, FileText } from 'lucide-react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { getAuth, signOut } from 'firebase/auth';
import { useTranslation } from 'react-i18next';
import Logo from './Logo.jsx';

const AdminSidebar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const auth = getAuth();
    const { t, i18n } = useTranslation();

    const handleSignOut = async () => {
        try {
            await signOut(auth);
            navigate('/');
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    const handleLanguageChange = (lng) => {
        i18n.changeLanguage(lng);
    };

    const menuItems = [
        { icon: Home, label: t('home'), path: '/admin/home' },
        { icon: Users, label: t('students'), path: '/admin/students' },
        { icon: GraduationCap, label: t('teachers'), path: '/admin/teachers' },
        { icon: BookOpen, label: t('schedules'), path: '/admin/schedule' },
        { icon: ClipboardList, label: t('lesson_log'), path: '/admin/lessonlog' },
        { icon: FileText, label: t('exams'), path: '/admin/exams' }
    ];

    return (
        <div className="w-64 bg-white border-r h-screen fixed left-0 top-0 flex flex-col justify-between">
            <div>
                {/* Logo/Header */}
                <div className="p-6 border-b flex items-center">
                    <Logo />
                </div>

                {/* Navigation */}
                <nav className="p-4">
                    {menuItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center p-3 mb-2 rounded transition-colors ${
                                location.pathname === item.path
                                    ? 'bg-blue-100 text-blue-600 font-semibold'
                                    : 'hover:bg-gray-100 text-gray-800'
                            }`}
                        >
                            <item.icon className="mr-3" size={20} />
                            {item.label}
                        </Link>
                    ))}
                </nav>
            </div>

            {/* Bottom Section: Language Switcher + Sign Out */}
            <div className="p-4 border-t space-y-4">
                {/* Language Switcher */}
                <div>
                    <p className="text-sm font-medium mb-2">{t('change_language')}</p>
                    <div className="flex gap-2">
                        <button onClick={() => handleLanguageChange('en')} className="px-3 py-1 border rounded text-sm">EN</button>
                        <button onClick={() => handleLanguageChange('ar')} className="px-3 py-1 border rounded text-sm">ع</button>
                        <button onClick={() => handleLanguageChange('he')} className="px-3 py-1 border rounded text-sm">ע</button>
                    </div>
                </div>

                {/* Sign Out */}
                <button
                    onClick={handleSignOut}
                    className="w-full flex items-center justify-center p-3 bg-red-50 text-red-600 rounded hover:bg-red-100"
                >
                    <LogOut className="mr-2" size={20} />
                    {t('sign_out')}
                </button>
            </div>
        </div>
    );
};

export default AdminSidebar;
