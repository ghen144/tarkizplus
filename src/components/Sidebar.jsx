import React from "react";
import {
    Home,
    Users,
    BookOpenText,
    LogOut,
    Compass,
} from "lucide-react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { getAuth, signOut } from "firebase/auth";
import { useTranslation } from "react-i18next";
import Logo from "./common/Logo.jsx";
import IconButton from "@/components/common/IconButton.jsx";

/**
 * Teacher sidebar – styled to match the AdminSidebar look & feel.
 * Keeps the teacher‑specific routes but adopts the cleaner white UI,
 * highlight‑on‑active behaviour, and spacing used in the admin layout.
 */
const Sidebar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const auth = getAuth();
    const { t } = useTranslation();

    const handleSignOut = async () => {
        try {
            await signOut(auth);
            navigate("/");
        } catch (error) {
            console.error("Error signing out:", error);
        }
        localStorage.removeItem("userRole");
    };

    /**
     * Route map – adjust path strings if your routing structure changes.
     */
    const menuItems = [
        { icon: Home, label: t("home"), path: "/homepage" },
        { icon: Users, label: t("students"), path: "/students" },
        { icon: BookOpenText, label: t("lesson_log"), path: "/lesson-log" },
        { icon: Compass, label: t("tarkiz_compass"), path: "/compass" },
    ];

    return (
        <aside
            className="w-64 h-screen fixed left-0 top-0 bg-white border-r shadow-sm z-20 flex flex-col justify-between"
        >
            {/* top – logo + navigation */}
            <div>
                <div className="p-6 border-b flex items-center gap-2 text-indigo-700 font-bold text-lg tracking-wide">
                    <Logo />
                </div>

                <nav className="p-4">
                    {menuItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`group flex items-center p-3 mb-2 rounded-lg transition-all duration-200 ${
                                    isActive
                                        ? "bg-indigo-100 text-indigo-700 font-semibold"
                                        : "hover:bg-gray-100 text-gray-700"
                                }`}
                            >
                                <item.icon
                                    className="mr-3 group-hover:scale-110 transition-transform duration-200"
                                    size={20}
                                />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>
            </div>

            {/* bottom – sign‑out button */}
            <div className="p-4 border-t">
                <IconButton
                    onClick={handleSignOut}
                    color="red"
                    className="w-full flex items-center justify-center p-3"
                >
                    <LogOut className="mr-2" size={20} />
                    {t("sign_out")}
                </IconButton>
            </div>
        </aside>
    );
};

export default Sidebar;
