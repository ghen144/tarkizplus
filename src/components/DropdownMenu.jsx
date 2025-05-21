import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const DropdownMenu = ({ onClose }) => {
    const { t } = useTranslation();

    return (
        <div className="absolute right-0 mt-2 w-48 bg-white border rounded shadow-md z-10">
            <Link
                to="/profile"
                onClick={onClose}
                className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
            >
                {t('profile')}
            </Link>
            <Link
                to="/settings"
                onClick={onClose}
                className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
            >
                {t('settings')}
            </Link>
        </div>
    );
};

export default DropdownMenu;
