import React from 'react';
import {
    Home,
    Users,
    LogOut,
    GraduationCap,
    BookOpen,
    ClipboardList,
    FileText,
} from 'lucide-react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { getAuth, signOut } from 'firebase/auth';
import { useTranslation } from 'react-i18next';
import Logo from '../common/Logo.jsx';

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
        { icon: ClipboardList, label: t('lesson_log'), path: '/admin/lesson-log' },
        { icon: FileText, label: t('exams'), path: '/admin/exams' },
    ];

    return (
        <aside className="w-64 h-screen fixed left-0 top-0 bg-white border-r shadow-sm z-20 flex flex-col justify-between">
            <div>
                {/* Logo Section */}
                <div className="p-6 border-b flex items-center gap-2 text-indigo-700 font-bold text-lg tracking-wide">
                    <Logo />
                </div>

                {/* Navigation */}
                <nav className="p-4">
                    {menuItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`group flex items-center p-3 mb-2 rounded-lg transition-all ${
                                location.pathname === item.path
                                    ? 'bg-indigo-100 text-indigo-700 font-semibold'
                                    : 'hover:bg-gray-100 text-gray-700'
                            }`}
                        >
                            <item.icon
                                className="mr-3 group-hover:scale-110 transition-transform duration-200"
                                size={20}
                            />
                            {item.label}
                        </Link>
                    ))}
                </nav>
            </div>

            {/* Bottom: Logout */}
            <div className="p-4 border-t space-y-4">

                <button
                    onClick={handleSignOut}
                    className="w-full flex items-center justify-center p-3 bg-red-50 text-red-600 rounded hover:bg-red-100 transition"
                >
                    <LogOut className="mr-2" size={20} />
                    {t('sign_out')}
                </button>
            </div>
        </aside>
    );
};

export default AdminSidebar;