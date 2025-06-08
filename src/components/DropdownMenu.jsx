// DropdownMenu.jsx
import React, { useState, useRef } from 'react';

const DropdownMenu = ({ trigger, children, className = "" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const timeoutRef = useRef(null);
  const containerRef = useRef(null);

  const handleMouseEnter = () => {
    clearTimeout(timeoutRef.current);
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => setIsOpen(false), 200);
  };

  const toggleOpen = (e) => {
    e.stopPropagation();
    clearTimeout(timeoutRef.current);
    setIsOpen((prev) => !prev);
  };

  return (
      <div
          ref={containerRef}
          className="relative inline-block"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
      >
        {React.isValidElement(trigger) ? (
            // clone your custom trigger (no extra wrapper)
            React.cloneElement(trigger, { onClick: toggleOpen })
        ) : (
            // fallback: wrap non-elements
            <button onClick={toggleOpen} className="bg-transparent border-none p-0">
              {trigger}
            </button>
        )}

        <div
            className={`
          absolute top-full mt-1 right-0 z-50 bg-white border border-gray-200
          rounded-lg shadow-lg w-48 transition-all duration-150
          ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
          ${className}
        `}
        >
          {children}
        </div>
      </div>
  );
};

export default DropdownMenu;
