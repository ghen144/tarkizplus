import React, { useState, useEffect } from "react";
import { collection, getDocs, updateDoc, doc, deleteDoc } from "firebase/firestore";
import { db } from "./firebase";
import AdminSidebar from "./AdminSidebar";

// Define the days and hour range (using 24-hour format, e.g. 13 = 1 PM, etc.)
const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const HOURS_RANGE = [13, 14, 15, 16, 17, 18, 19, 20];

// Helper to parse hour from "HH:MM"
function parseHour(timeStr) {
    if (!timeStr) return 0;
    const [hourStr] = timeStr.split(":");
    return parseInt(hourStr, 10) || 0;
}

const AdminTeacherSchedule = () => {
    const [schedules, setSchedules] = useState([]);
    const [loading, setLoading] = useState(true);
    // For editing a lesson in a modal
    const [selectedLesson, setSelectedLesson] = useState(null);
    const [editForm, setEditForm] = useState({
        day_of_week: "",
        start_time: "",
        end_time: "",
        subject: "",
        class_type: "",
        active: ""
    });

    // Fetch all schedules from the "weekly_schedule" collection
    useEffect(() => {
        const fetchSchedules = async () => {
            try {
                const snapshot = await getDocs(collection(db, "weekly_schedule"));
                const data = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setSchedules(data);
            } catch (err) {
                console.error("Error fetching schedules:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchSchedules();
    }, []);

    // Handler when a lesson is clicked (opens edit modal)
    const handleLessonClick = (lesson) => {
        setSelectedLesson(lesson);
        setEditForm({
            day_of_week: lesson.day_of_week,
            start_time: lesson.start_time,
            end_time: lesson.end_time,
            subject: lesson.subject,
            class_type: lesson.class_type,
            active: lesson.active
        });
    };

    // Update the selected lesson in Firestore
    const handleUpdateLesson = async (e) => {
        e.preventDefault();
        try {
            const lessonRef = doc(db, "weekly_schedule", selectedLesson.id);
            await updateDoc(lessonRef, {
                ...editForm
            });
            // Update local state:
            setSchedules(prev =>
                prev.map(sch =>
                    sch.id === selectedLesson.id ? { ...sch, ...editForm } : sch
                )
            );
            setSelectedLesson(null);
        } catch (err) {
            console.error("Error updating lesson:", err);
        }
    };

    // Delete the selected lesson
    const handleDeleteLesson = async () => {
        if (!window.confirm("Are you sure you want to delete this lesson?")) return;
        try {
            await deleteDoc(doc(db, "weekly_schedule", selectedLesson.id));
            setSchedules(prev => prev.filter(sch => sch.id !== selectedLesson.id));
            setSelectedLesson(null);
        } catch (err) {
            console.error("Error deleting lesson:", err);
        }
    };

    if (loading) return <p>Loading schedules...</p>;

    return (
        <div className="flex min-h-screen bg-gray-100">
            <AdminSidebar active="schedules" />
            <main className="flex-1 p-6">
                <h1 className="text-3xl font-bold mb-6">Teacher Schedules</h1>
                <div className="overflow-auto">
                    <table className="w-full border-collapse">
                        <thead>
                        <tr>
                            <th className="border p-2 bg-gray-200">Time / Day</th>
                            {DAYS_OF_WEEK.map(day => (
                                <th key={day} className="border p-2 bg-gray-200">{day}</th>
                            ))}
                        </tr>
                        </thead>
                        <tbody>
                        {HOURS_RANGE.map(hour => (
                            <tr key={hour}>
                                <td className="border p-2 text-center">{hour}:00</td>
                                {DAYS_OF_WEEK.map(day => {
                                    // Filter schedules that fall in this day and hour.
                                    const cellLessons = schedules.filter(lesson => {
                                        if (lesson.day_of_week !== day) return false;
                                        // We check if the hour falls within the lesson's time span.
                                        const lessonStart = parseHour(lesson.start_time);
                                        const lessonEnd = parseHour(lesson.end_time);
                                        return hour >= lessonStart && hour < lessonEnd;
                                    });
                                    return (
                                        <td key={day} className="border p-2">
                                            {cellLessons.map(lesson => (
                                                <div
                                                    key={lesson.id}
                                                    className="bg-blue-50 p-1 mb-1 rounded cursor-pointer hover:bg-blue-100"
                                                    onClick={() => handleLessonClick(lesson)}
                                                >
                                                    <p className="text-sm font-bold">{lesson.subject}</p>
                                                    <p className="text-xs">{lesson.class_type}</p>
                                                </div>
                                            ))}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>

                {/* Edit Modal (Simple Inline Modal) */}
                {selectedLesson && (
                    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                        <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
                            <h2 className="text-2xl font-bold mb-4">Edit Lesson</h2>
                            <form onSubmit={handleUpdateLesson} className="space-y-4">
                                <div>
                                    <label className="block font-medium">Day of Week</label>
                                    <input
                                        type="text"
                                        value={editForm.day_of_week}
                                        onChange={e => setEditForm({...editForm, day_of_week: e.target.value})}
                                        className="w-full border p-2 rounded"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <div className="flex-1">
                                        <label className="block font-medium">Start Time</label>
                                        <input
                                            type="time"
                                            value={editForm.start_time}
                                            onChange={e => setEditForm({...editForm, start_time: e.target.value})}
                                            className="w-full border p-2 rounded"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <label className="block font-medium">End Time</label>
                                        <input
                                            type="time"
                                            value={editForm.end_time}
                                            onChange={e => setEditForm({...editForm, end_time: e.target.value})}
                                            className="w-full border p-2 rounded"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block font-medium">Subject</label>
                                    <input
                                        type="text"
                                        value={editForm.subject}
                                        onChange={e => setEditForm({...editForm, subject: e.target.value})}
                                        className="w-full border p-2 rounded"
                                    />
                                </div>
                                <div>
                                    <label className="block font-medium">Class Type</label>
                                    <input
                                        type="text"
                                        value={editForm.class_type}
                                        onChange={e => setEditForm({...editForm, class_type: e.target.value})}
                                        className="w-full border p-2 rounded"
                                    />
                                </div>
                                <div>
                                    <label className="block font-medium">Active</label>
                                    <select
                                        value={editForm.active}
                                        onChange={e => setEditForm({...editForm, active: e.target.value})}
                                        className="w-full border p-2 rounded"
                                    >
                                        <option value="Yes">Yes</option>
                                        <option value="No">No</option>
                                    </select>
                                </div>
                                <div className="flex justify-end gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedLesson(null)}
                                        className="px-4 py-2 rounded border text-gray-700 hover:bg-gray-100"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600"
                                    >
                                        Save
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleDeleteLesson}
                                        className="px-4 py-2 rounded bg-red-500 text-white hover:bg-red-600"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default AdminTeacherSchedule;
