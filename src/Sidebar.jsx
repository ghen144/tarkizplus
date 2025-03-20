import React from 'react';
import { Home, Users, BookOpenText, LogOut } from 'lucide-react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { getAuth, signOut } from 'firebase/auth';

const Sidebar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const auth = getAuth();

    const handleSignOut = async () => {
        try {
            await signOut(auth);
            navigate('/login');
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    const menuItems = [
        { icon: Home, label: 'Home', path: '/', active: location.pathname === '/' },
        { icon: Users, label: 'Students', path: '/students', active: location.pathname === '/students' },
        { icon: BookOpenText, label: 'Lesson Log', path: '/lesson-log', active: location.pathname === '/lesson-log' }
    ];

    return (
        <div className="w-64 bg-white border-r h-screen fixed left-0 top-0">
            <div className="p-6 border-b">
                <h2 className="text-xl font-bold">TarkizPlus</h2>
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
                        <item.icon className="mr-3" size={20} />
                        {item.label}
                    </Link>
                ))}
            </nav>

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

export default Sidebar;
