import React from "react";

const colorThemes = {
    red: {
        base: "bg-red-100 text-red-800 hover:bg-red-200",
    },
    yellow: {
        base: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
    },
    blue: {
        base: "bg-blue-100 text-blue-800 hover:bg-blue-200",
    },
    green: {
        base: "bg-green-100 text-green-800 hover:bg-green-200",
    },
    gray: {
        base: "bg-gray-100 text-gray-800 hover:bg-gray-200",
    },
};

const SoftActionButton = ({
                              label,
                              onClick,
                              color = "blue",
                              className = "",
                              type = "button",
                              children,
                          }) => {
    const theme = colorThemes[color]?.base || colorThemes.blue.base;

    return (
        <button
            type={type}
            onClick={onClick}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${theme} ${className}`}
        >
            {children || label}
        </button>
    );
};

export default SoftActionButton;
