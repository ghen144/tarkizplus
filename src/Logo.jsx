// Logo.jsx
import React from 'react';

const Logo = () => (
    <div className="flex items-center space-x-2">
        <svg
            width="50"
            height="50"
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <circle cx="50" cy="50" r="45" stroke="#3B82F6" strokeWidth="5" />
            <text
                x="50%"
                y="55%"
                textAnchor="middle"
                fill="#3B82F6"
                fontSize="30"
                fontFamily="Arial"
                dy=".3em"
            >
                T+
            </text>
        </svg>
        <span className="text-2xl font-bold text-blue-500">TarkizPlus</span>
    </div>
);

export default Logo;
