import React from 'react';
import {Home, Users, BookOpenText, LogOut,Compass} from 'lucide-react';
import {useNavigate, Link, useLocation} from 'react-router-dom';
import {getAuth, signOut} from 'firebase/auth';
import Logo from './common/Logo.jsx';
import {useTranslation} from 'react-i18next';
import i18n from '@/localization/i18n.js';

const Sidebar = () => {
    const {t} = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const auth = getAuth();

    const handleSignOut = async () => {
        try {
            await signOut(auth);
            navigate('/');
        } catch (error) {
            console.error('Error signing out:', error);
        }
        localStorage.removeItem("userRole");
    };

    const menuItems = [
        {icon: Home, label: t('home'), path: '/homepage', active: location.pathname === '/homepage'},
        {icon: Users, label: t('students'), path: '/students', active: location.pathname === '/students'},
        {icon: BookOpenText, label: t('lesson_log'), path: '/lesson-log', active: location.pathname === '/lesson-log'},
        {icon: Compass, label: t('tarkiz_compass'), path: '/compass', active: location.pathname === '/compass'}

    ];

    return (
        <div className="w-64 bg-white border-r h-screen fixed left-0 top-0 flex flex-col justify-between">
            <div>
                <div className="p-6 border-b flex items-center">
                    <Logo/>
                </div>

                <nav className="p-4">
                    {menuItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center p-3 mb-2 rounded ${
                                item.active ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'
                            }`}
                        >
                            <item.icon className="mr-3" size={20}/>
                            {item.label}
                        </Link>
                    ))}
                </nav>
            </div>

            <div className="p-4 border-t">
                {/* Sign out button */}
                <button
                    onClick={handleSignOut}
                    className="w-full flex items-center justify-center p-3 bg-red-50 text-red-600 rounded hover:bg-red-100"
                >
                    <LogOut className="mr-2" size={20}/>
                    {t('sign_out')}
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
