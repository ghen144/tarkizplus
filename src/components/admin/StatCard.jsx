import React from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

const StatCard = ({ icon, value, label, link, color }) => (
    <Link
        to={link}
        className={`group ${color} p-5 rounded-2xl shadow-sm hover:shadow-md transition-all transform hover:-translate-y-1`}
    >
        <div className="flex items-center justify-between">
            <div className="p-3 rounded-lg bg-white shadow group-hover:rotate-3 group-hover:scale-105 transition-transform duration-300 ease-in-out">
                {React.cloneElement(icon, {
                    className: `${icon.props.className || ""} transition-transform duration-300 group-hover:scale-110`,
                })}
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400 group-hover:translate-x-1 transition-transform duration-200" />
        </div>
        <div className="mt-4">
            <p className="text-2xl font-semibold text-gray-800">{value}</p>
            <p className="text-sm text-gray-500">{label}</p>
        </div>
    </Link>
); export default StatCard;