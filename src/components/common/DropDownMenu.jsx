import React, {useState, useRef} from "react";
import { ChevronDown } from "lucide-react";

const DropDownMenu = ({
                          label,
                          options = [],
                          selected = [],
                          onChange,
                          renderLabel = (v) =>
                              typeof v === "string" ? v : (typeof v === "object" && v.label ? v.label : ""),
                          multiSelect = true,
                          width = "min-w-[10rem] max-w-xs"
                      }) => {
    const [isOpen, setIsOpen] = useState(false);
    const closeTimeout = useRef(null);

    const toggleDropdown = () => {
        clearTimeout(closeTimeout.current);
        setIsOpen((prev) => !prev);
    };

    const closeDropdown = () => {
        closeTimeout.current = setTimeout(() => setIsOpen(false), 100); // fade delay
    };

    const cancelClose = () => {
        clearTimeout(closeTimeout.current);
    };

    const handleSelect = (value) => {
        if (multiSelect) {
            onChange(
                selected.includes(value)
                    ? selected.filter((v) => v !== value)
                    : [...selected, value]
            );
        } else {
            onChange([value]);
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
                <span>{label}</span>
                <ChevronDown
                    className={`h-4 w-4 transition-transform duration-200 ${isOpen ? "rotate-180" : "rotate-0"}`}
                />
            </button>

            {/* always rendered now, fades in/out */}
            <div
                className={`absolute right-0 z-50 mt-2 bg-white border border-blue-100 rounded-xl shadow-md p-2 max-h-60 overflow-y-auto transition-all duration-200 ease-in-out transform ${width} ${
                    isOpen ? "opacity-100 scale-100 visible" : "opacity-0 scale-95 invisible"
                }`}
            >
                {options.map((opt) => {
                    const isSelected = selected.includes(opt);

                    return multiSelect ? (
                        <label
                            key={opt}
                            className="flex items-center gap-2 px-3 py-2 text-sm rounded-full cursor-pointer hover:bg-blue-50 transition"
                        >
                            <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleSelect(opt)}
                                className="accent-blue-500"
                            />
                            <span className="text-blue-800">{renderLabel(opt)}</span>
                        </label>
                    ) : (
                        <button
                            key={opt}
                            onClick={() => handleSelect(opt)}
                            className={`block w-full text-left px-4 py-2 text-sm rounded-full transition ${
                                isSelected
                                    ? "bg-blue-100 text-blue-700 font-semibold"
                                    : "text-blue-800 hover:bg-blue-50"
                            }`}
                        >
                            {renderLabel(opt)}
                        </button>
                    );
                })}
            </div>
        </div>
    );

};

export default DropDownMenu;
