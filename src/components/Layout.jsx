import React from 'react';
import { useLocation, Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.jsx'; // Teacher Sidebar
import AdminSidebar from './admin/AdminSidebar.jsx'; // Admin Sidebar
import Header from './Header.jsx';

const Layout = () => {
    const location = useLocation();
    const isLoginPage = location.pathname === '/';
    const userRole = localStorage.getItem('userRole'); // Check the role of the user

    if (isLoginPage) {
        return <Outlet />; // Return the outlet for the login page
    }

    // Make sure that the sidebar is consistent with the role
    return (
        <div className="flex min-h-screen bg-gray-50">
            {/* Conditionally render Sidebar based on userRole */}
            <div className="w-64 bg-white border-r h-screen fixed left-0 top-0">
                {userRole === 'admin' ? <AdminSidebar /> : <Sidebar />}
            </div>

            <div className="flex-1 ml-64">
                <Header />
                <main className="p-6">
                    <Outlet /> {/* This renders the matched route component */}
                </main>
            </div>
        </div>
    );
};

export default Layout;
