import React from 'react';
import { Home, Users, LogOut, GraduationCap, BookOpen, ClipboardList, FileText } from 'lucide-react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { getAuth, signOut } from 'firebase/auth';
import Logo from './Logo';

const AdminSidebar = () => {
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
    };

    const menuItems = [
        { icon: Home, label: 'Home', path: '/admin/home' },
        { icon: Users, label: 'Students', path: '/admin/students' },
        { icon: GraduationCap, label: 'Teachers', path: '/admin/teachers' },
        { icon: BookOpen, label: 'Schedules', path: '/admin/schedule' },
        { icon: ClipboardList, label: 'Lesson Log', path: '/admin/lessonlog' },
        { icon: FileText, label: 'Exams', path: '/admin/exams' }
    ];

    return (
        <div className="w-64 bg-white border-r h-screen fixed left-0 top-0">
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

            {/* Sign Out */}
            <div className="p-4 border-t">
                <button
                    onClick={handleSignOut}
                    className="w-full flex items-center justify-center p-3 bg-red-50 text-red-600 rounded hover:bg-red-100"
                >
                    <LogOut className="mr-2" size={20} />
                    Sign Out
                </button>
            </div>
        </div>
    );
};

export default AdminSidebar;
