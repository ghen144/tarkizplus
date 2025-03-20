import React from 'react';
import { Link } from 'react-router-dom';
import { User, Settings } from 'lucide-react';

const DropdownMenu = ({ onClose }) => {
    return (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
            <div className="py-1">
                <Link
                    to="/profile"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={onClose}
                >
                    <User className="h-4 w-4 mr-2" />
                    <span>Profile</span>
                </Link>
                <Link
                    to="/settings"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={onClose}
                >
                    <Settings className="h-4 w-4 mr-2" />
                    <span>Settings</span>
                </Link>
            </div>
        </div>
    );
};

export default DropdownMenu;