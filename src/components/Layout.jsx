import React from 'react';
import { useLocation, Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.jsx'; // Teacher Sidebar
import AdminSidebar from './admin/AdminSidebar.jsx'; // Admin Sidebar
import Header from './Header.jsx';

const Layout = () => {
    const location = useLocation();
    const isLoginPage = location.pathname === '/';
    const userRole = localStorage.getItem('userRole'); // Temporary — replace with context later!

    if (isLoginPage) {
        return <Outlet />;
    }

    return (
        <div className="flex min-h-screen bg-gray-50">
            {/* Sidebar */}
            <div className="w-64 bg-white border-r h-screen fixed left-0 top-0 z-30">
                {userRole === 'admin' ? <AdminSidebar /> : <Sidebar />}
            </div>

            {/* Content area with offset */}
            <div className="flex-1 ml-64">
                <Header />
                <main className="p-6 pt-24">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default Layout;
