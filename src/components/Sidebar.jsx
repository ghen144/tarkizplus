import React from 'react';
import {Home, Users, BookOpenText, LogOut,Compass} from 'lucide-react';
import {useNavigate, Link, useLocation} from 'react-router-dom';
import {getAuth, signOut} from 'firebase/auth';
import Logo from './common/Logo.jsx';
import {useTranslation} from 'react-i18next';
import i18n from '@/localization/i18n.js';
import IconButton from "@/components/common/IconButton.jsx";

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
        <div className="w-64 h-screen fixed left-0 top-0 flex flex-col justify-between
  bg-white bg-[url('/assets/pattern-circles.svg')] bg-no-repeat bg-top bg-contain
  border-r border-blue-100 shadow-md z-50">


            <div>
                <div className="p-6 border-b flex items-center justify-center">
                    <Logo className="h-12"/>
                </div>


                <nav className="p-4">
                    {menuItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center gap-3 px-4 py-2 mb-2 rounded-full text-sm font-medium transition-all duration-200 
  ${
                                item.active
                                    ? 'bg-[#d6ebff] text-blue-800 shadow-inner ring-1 ring-inset ring-blue-200'
                                    : 'text-gray-700 hover:bg-[#eaf4ff] hover:text-blue-700 transition-transform hover:scale-[1.03]\n'
                            }
`}


                        >
                            <item.icon className="mr-3" size={20}/>
                            {item.label}
                        </Link>
                    ))}
                </nav>
            </div>

            <div className="p-4 border-t">
                {/* Sign out button */}
                <IconButton
                    onClick={handleSignOut}
                    color="red"
                    className="w-full flex items-center justify-center p-3 items-center"
                >
                    <LogOut className="mr-2" size={20}/>
                    {t('sign_out')}
                </IconButton>
            </div>
        </div>
    );
};

export default Sidebar;
