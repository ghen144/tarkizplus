import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useMemo } from "react"; // already in react import

const MonthTimeline = ({ monthRange, visibleMonth, handleMonthClick }) => {
    const months = useMemo(() => monthRange() || [], [monthRange]);
    if (!Array.isArray(months)) return null;

    const [animatingIndex, setAnimatingIndex] = useState(null);

    const containerRef = useRef(null);
    const activeRef = useRef(null);
    const firstMonthRef = useRef(null);
    const lastMonthRef = useRef(null);
    const [lineStyle, setLineStyle] = useState({});

    // Scroll active month into view
    useEffect(() => {
        if (containerRef.current && activeRef.current) {
            const containerRect = containerRef.current.getBoundingClientRect();
            const activeRect = activeRef.current.getBoundingClientRect();
            const scrollAmount =
                activeRect.left -
                containerRect.left -
                containerRect.width / 2 +
                activeRect.width / 2;
            containerRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
        }
    }, [visibleMonth]);


    return (
        <div className="relative w-full border-b border-gray-200 overflow-x-auto bg-white shadow-sm z-10">


            <div
                ref={containerRef}
                className="flex w-full gap-6 px-6 py-4 relative z-10 whitespace-nowrap"
            >
                {months.map((monthDate, idx) => {
                    const label = `${monthDate.toLocaleString("default", {
                        month: "short",
                    })} ${monthDate.getFullYear().toString().slice(-2)}`;

                    const isActive =
                        visibleMonth.getMonth() === monthDate.getMonth() &&
                        visibleMonth.getFullYear() === monthDate.getFullYear();

                    const isFirst = idx === 0;
                    const isLast = idx === months.length - 1;

                    return (
                        <motion.button
                            layout
                            key={monthDate.toISOString()}
                            onClick={() => {
                                setAnimatingIndex(monthDate.getTime());
                                handleMonthClick(monthDate);
                            }}
                            ref={(el) => {
                                if (isFirst) firstMonthRef.current = el;
                                if (isLast) lastMonthRef.current = el;
                                if (isActive) activeRef.current = el;
                            }}
                            className={`relative text-sm font-medium px-4 py-1 rounded-full transition-colors duration-300
                ${isActive ? "text-blue-800" : "text-gray-500 hover:text-blue-600"}`}
                        >
                            <span className="relative z-10">{label}</span>
                            {isActive && (
                                <motion.div
                                    layoutId="month-pill"
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.8, opacity: 0 }}
                                    transition={{
                                        type: "spring",
                                        stiffness: 300,
                                        damping: 30,
                                        duration: 0.5,
                                    }}
                                    className="absolute inset-0 bg-blue-100 rounded-full z-0"
                                    style={{ transformOrigin: "center" }}
                                />
                            )}
                        </motion.button>
                    );
                })}
            </div>
        </div>
    );


};


export default MonthTimeline;
