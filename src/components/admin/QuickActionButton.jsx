import { Link } from "react-router-dom";
import { PlusCircle } from "lucide-react";

const QuickActionButton = ({ icon, label, to, onClick, color = "bg-gray-50" }) => {
    const baseClass =
        "flex items-center space-x-3 px-4 py-3 rounded-xl shadow-sm transition-all group";
    const iconWrapper =
        "p-2 rounded-full bg-white shadow group-hover:scale-105 transition-transform";

    const content = (
        <div className={`${baseClass} ${color} hover:shadow-md`}>
            <div className={iconWrapper}>
                {icon || <PlusCircle className="h-5 w-5 text-gray-600" />}
            </div>
            <span className="text-sm font-medium text-gray-700">{label}</span>
        </div>
    );

    return to ? (
        <Link to={to}>
            {content}
        </Link>
    ) : (
        <button onClick={onClick} type="button">
            {content}
        </button>
    );
}; export default QuickActionButton