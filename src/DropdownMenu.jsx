// In DropdownMenu.jsx
import { Link } from 'react-router-dom';

const DropdownMenu = ({ onClose }) => {
    return (
        <div className="absolute right-0 mt-2 w-48 bg-white border rounded shadow-md z-10">
            <Link
                to="/profile"
                onClick={onClose}
                className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
            >
                Profile
            </Link>
            <Link
                to="/settings"
                onClick={onClose}
                className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
            >
                Settings
            </Link>
        </div>
    );
};

export default DropdownMenu;
