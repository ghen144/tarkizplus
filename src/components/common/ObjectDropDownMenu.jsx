import React, { useState, useRef } from "react";
import { ChevronDown } from "lucide-react";

const ObjectDropDownMenu = ({
                                label,
                                options = [],
                                selected = [],
                                onSelect,
                                multiSelect = false,
                                placeholder = "Select",
                                width = "min-w-[10rem] max-w-xs"
                            }) => {
    const [isOpen, setIsOpen] = useState(false);
    const closeTimeout = useRef(null);

    const toggleDropdown = () => {
        if (closeTimeout.current) {
            clearTimeout(closeTimeout.current);
        }
        setIsOpen((prev) => !prev);
    };

    const closeDropdown = () => {
        closeTimeout.current = setTimeout(() => {
            setIsOpen(false);
        }, 200);
    };

    const cancelClose = () => {
        clearTimeout(closeTimeout.current);
    };

    const handleSelect = (option) => {
        if (typeof onSelect !== "function") return;

        if (multiSelect) {
            const isAlreadySelected = selected.some((s) => s.value === option.value);
            const updated = isAlreadySelected
                ? selected.filter((s) => s.value !== option.value)
                : [...selected, option];
            onSelect(updated);
        } else {
            onSelect(option);
            setIsOpen(false);
        }
    };

    return (
        <div
            className="relative inline-block"
            onMouseLeave={closeDropdown}
            onMouseEnter={cancelClose}
        >
            <button
                onClick={toggleDropdown}
                className="bg-white border border-blue-200 rounded-md px-4 py-2 text-sm text-blue-700 hover:bg-blue-50 transition flex items-center justify-between gap-2 w-full"
            >
        <span>
          {selected.length > 0
              ? multiSelect
                  ? selected.map((s) => s.label).join(", ")
                  : selected.label
              : placeholder}
        </span>
                <ChevronDown
                    className={`h-4 w-4 transition-transform duration-200 ${
                        isOpen ? "rotate-180" : "rotate-0"
                    }`}
                />
            </button>

            <div
                className={`absolute right-0 z-50 mt-2 bg-white border border-blue-100 rounded-xl shadow-md p-2 max-h-60 overflow-y-auto transition-all duration-200 ease-in-out transform ${width} ${
                    isOpen ? "opacity-100 scale-100 visible" : "opacity-0 scale-95 invisible"
                }`}
            >
                {options.map((opt) => {
                    const isSelected = multiSelect
                        ? selected.some((s) => s.value === opt.value)
                        : selected?.value === opt.value;

                    const key = opt.value || opt.label;

                    return multiSelect ? (
                        <label
                            key={key}
                            className="flex items-center gap-2 px-3 py-2 text-sm rounded-full cursor-pointer hover:bg-blue-50 transition"
                        >
                            <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleSelect(opt)}
                                className="accent-blue-500"
                            />
                            <span className="text-blue-800">{opt.label}</span>
                        </label>
                    ) : (
                        <button
                            key={key}
                            onClick={() => handleSelect(opt)}
                            className={`block w-full text-left px-4 py-2 text-sm rounded-full transition ${
                                isSelected
                                    ? "bg-blue-100 text-blue-700 font-semibold"
                                    : "text-blue-800 hover:bg-blue-50"
                            }`}
                        >
                            {opt.label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default ObjectDropDownMenu;
