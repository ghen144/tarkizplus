// DaySchedule.jsx
import React from "react";

// Hours to display (e.g. 13 means 1:00 PM)
const HOURS_RANGE = [13, 14, 15, 16, 17, 18, 19, 20];

// Helper to parse the hour from "HH:MM"
function parseHour(timeStr) {
    if (!timeStr) return 0;
    const [hourStr] = timeStr.split(":");
    return parseInt(hourStr, 10) || 0;
}

/**
 * Given a list of lessons for a specific day, assign them to lanes so that overlapping lessons
 * get their own lane.
 *
 * Returns an array of lanes; each lane is an array of length HOURS_RANGE.length.
 * For each lane, if a lesson starts at index i, store an object { lesson, rowSpan } at index i,
 * and mark subsequent indices with a marker ("occupied").
 */
export function assignLessonsToLanes(lessons) {
    // Initialize lanes as empty arrays (each lane: an array of length = HOURS_RANGE.length, filled with null)
    const lanes = [];
    // Sort lessons by start time
    const sorted = [...lessons].sort((a, b) => parseHour(a.start_time) - parseHour(b.start_time));

    sorted.forEach(lesson => {
        const startIndex = HOURS_RANGE.indexOf(parseHour(lesson.start_time));
        const endIndex = HOURS_RANGE.indexOf(parseHour(lesson.end_time));
        if (startIndex === -1 || endIndex === -1) return; // skip if not found
        const duration = endIndex - startIndex;
        // Try to assign this lesson to an existing lane
        let assigned = false;
        for (let lane of lanes) {
            // Check if lane from startIndex to endIndex-1 is free (null)
            let free = true;
            for (let i = startIndex; i < endIndex; i++) {
                if (lane[i] !== null) {
                    free = false;
                    break;
                }
            }
            if (free) {
                lane[startIndex] = { lesson, rowSpan: duration };
                for (let i = startIndex + 1; i < endIndex; i++) {
                    lane[i] = "occupied";
                }
                assigned = true;
                break;
            }
        }
        if (!assigned) {
            // Create a new lane
            const newLane = Array(HOURS_RANGE.length).fill(null);
            newLane[startIndex] = { lesson, rowSpan: duration };
            for (let i = startIndex + 1; i < endIndex; i++) {
                newLane[i] = "occupied";
            }
            lanes.push(newLane);
        }
    });

    return lanes;
}

const DaySchedule = ({ day, lessons, teacherMap, onLessonClick }) => {
    // Get lanes for this day
    const lanes = assignLessonsToLanes(lessons);

    return (
        <div className="bg-white rounded shadow p-4 m-2">
            <h2 className="text-xl font-bold mb-2 text-center">{day}</h2>
            <table className="w-full border-collapse text-sm">
                <thead>
                <tr>
                    <th className="border p-1 bg-gray-200">Time</th>
                    {/* Create one column per lane */}
                    {lanes.map((_, laneIndex) => (
                        <th key={laneIndex} className="border p-1 bg-gray-200">Lane {laneIndex+1}</th>
                    ))}
                </tr>
                </thead>
                <tbody>
                {HOURS_RANGE.map((hour, rowIndex) => (
                    <tr key={hour}>
                        <td className="border p-1 text-center">{hour}:00</td>
                        {lanes.map((lane, laneIndex) => {
                            const cell = lane[rowIndex];
                            if (cell === "occupied") return null; // already spanned
                            if (cell && cell.lesson) {
                                const { lesson, rowSpan } = cell;
                                const colorClass = subjectColors[lesson.subject] || "bg-gray-200";
                                const teacherName = teacherMap[lesson.teacher_id] || lesson.teacher_id;
                                return (
                                    <td
                                        key={laneIndex}
                                        rowSpan={rowSpan}
                                        className={`border p-1 ${colorClass} cursor-pointer`}
                                        onClick={() => onLessonClick(lesson)}
                                    >
                                        <p className="text-sm font-bold">{lesson.subject}</p>
                                        <p className="text-xs">{lesson.class_type}</p>
                                        <p className="text-xs italic">{teacherName}</p>
                                        <p className="text-xxs">{lesson.start_time} - {lesson.end_time}</p>
                                    </td>
                                );
                            }
                            return (
                                <td key={laneIndex} className="border p-1"></td>
                            );
                        })}
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
};

export default DaySchedule;

// Define subjectColors here so DaySchedule can use them:
export const subjectColors = {
    Math: "bg-green-200",
    English: "bg-blue-200",
    Hebrew: "bg-yellow-200",
    Arabic: "bg-pink-200",
    // Add more as needed
};
