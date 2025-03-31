import React from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout = ({ children }) => {
    const location = useLocation();
    const isLoginPage = location.pathname === '/login';

    if (isLoginPage) {
        return <>{children}</>;
    }

    return (
        <div className="flex min-h-screen bg-gray-50">
            <div className="w-64 bg-white border-r h-screen fixed left-0 top-0">
                <Sidebar />
            </div>
            <div className="flex-1 ml-64">
                <Header />
                <main className="p-6">{children}</main>
            </div>
        </div>
    );
};

export default Layout;
