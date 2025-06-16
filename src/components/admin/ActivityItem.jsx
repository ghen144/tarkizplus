import React from "react";
import { BookOpen, ClipboardList, Info } from "lucide-react";

const getIcon = (text) => {
    const lower = text.toLowerCase();
    if (lower.includes("lesson"))
        return (
            <BookOpen className="h-5 w-5 text-blue-600 group-hover:scale-110 transition-transform duration-200" />
        );
    if (lower.includes("exam"))
        return (
            <ClipboardList className="h-5 w-5 text-purple-600 group-hover:rotate-6 transition-transform duration-200" />
        );
    return (
        <Info className="h-5 w-5 text-gray-500 group-hover:scale-105 transition-transform duration-200" />
    );
};

export const ActivityItem = ({ activity }) => (
    <div className="group flex items-center space-x-3 rounded-lg bg-white p-3 shadow-sm hover:shadow-md transition">
        <div className="flex-shrink-0">{getIcon(activity)}</div>
        <div>
            <p className="text-sm text-gray-800 font-medium">{activity}</p>
            <p className="text-xs text-gray-400 mt-0.5">Today</p>
        </div>
    </div>
);

export default ActivityItem;