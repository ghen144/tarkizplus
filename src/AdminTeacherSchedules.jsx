import React, { useState, useEffect } from "react";
import { collection, getDocs, updateDoc, doc, deleteDoc } from "firebase/firestore";
import { db } from "./firebase";
import { Link } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";
import DaySchedule, { subjectColors } from "./DaySchedule";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const AdminTeacherSchedule = () => {
    const [schedules, setSchedules] = useState([]);
    const [teacherMap, setTeacherMap] = useState({});
    const [loading, setLoading] = useState(true);
    const [selectedDay, setSelectedDay] = useState("Monday"); // default day selection
    const [selectedLesson, setSelectedLesson] = useState(null);
    const [editForm, setEditForm] = useState({
        day_of_week: "",
        start_time: "",
        end_time: "",
        subject: "",
        class_type: "",
        active: "Yes"
    });
    const [editError, setEditError] = useState("");

    // Fetch schedules from Firestore
    const fetchSchedules = async () => {
        try {
            const snapshot = await getDocs(collection(db, "weekly_schedule"));
            const data = snapshot.docs.map((doc) => ({
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

    // Fetch teacher data to build teacherMap
    const fetchTeachers = async () => {
        try {
            const snapshot = await getDocs(collection(db, "teachers"));
            const map = {};
            snapshot.docs.forEach((doc) => {
                const d = doc.data();
                map[doc.id] = d.name;
            });
            setTeacherMap(map);
        } catch (err) {
            console.error("Error fetching teacher data:", err);
        }
    };

    useEffect(() => {
        fetchSchedules();
        fetchTeachers();
    }, []);

    // Group lessons by day
    const lessonsByDay = {};
    DAYS.forEach(day => {
        lessonsByDay[day] = schedules.filter((lesson) => lesson.day_of_week === day);
    });

    // Handler when a lesson is clicked (open edit modal)
    const handleLessonClick = (lesson) => {
        setSelectedLesson(lesson);
        setEditError("");
        setEditForm({
            day_of_week: lesson.day_of_week,
            start_time: lesson.start_time,
            end_time: lesson.end_time,
            subject: lesson.subject,
            class_type: lesson.class_type,
            active: lesson.active || "Yes"
        });
    };

    // Update the selected lesson in Firestore
    const handleUpdateLesson = async (e) => {
        e.preventDefault();
        setEditError("");
        // (Optional: add conflict check here)
        try {
            await updateDoc(doc(db, "weekly_schedule", selectedLesson.id), { ...editForm });
            await fetchSchedules();
            setSelectedLesson(null);
        } catch (err) {
            console.error("Error updating lesson:", err);
            setEditError("Failed to update lesson.");
        }
    };

    // Delete the selected lesson
    const handleDeleteLesson = async () => {
        if (!window.confirm("Are you sure you want to delete this lesson?")) return;
        try {
            await deleteDoc(doc(db, "weekly_schedule", selectedLesson.id));
            await fetchSchedules();
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
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-3xl font-bold">Teacher Schedules</h1>
                    <Link
                        to="/admin/schedule/new"
                        className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                    >
                        + Add Schedule
                    </Link>
                </div>

                {/* Day Selector */}
                <div className="mb-4 flex flex-wrap gap-2">
                    {DAYS.map(day => (
                        <button
                            key={day}
                            onClick={() => setSelectedDay(day)}
                            className={`px-4 py-1 rounded ${
                                selectedDay === day ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700"
                            }`}
                        >
                            {day}
                        </button>
                    ))}
                </div>

                {/* Render schedule for the selected day */}
                <DaySchedule
                    day={selectedDay}
                    lessons={lessonsByDay[selectedDay]}
                    teacherMap={teacherMap}
                    onLessonClick={handleLessonClick}
                />

                {/* Edit Modal */}
                {selectedLesson && (
                    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                        <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
                            <h2 className="text-2xl font-bold mb-4">Edit Lesson</h2>
                            {editError && <p className="text-red-500 mb-2">{editError}</p>}
                            <form onSubmit={handleUpdateLesson} className="space-y-4">
                                <div>
                                    <label className="block font-medium">Day of Week</label>
                                    <input
                                        type="text"
                                        value={editForm.day_of_week}
                                        onChange={(e) =>
                                            setEditForm({ ...editForm, day_of_week: e.target.value })
                                        }
                                        className="w-full border p-2 rounded"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <div className="flex-1">
                                        <label className="block font-medium">Start Time</label>
                                        <input
                                            type="time"
                                            value={editForm.start_time}
                                            onChange={(e) =>
                                                setEditForm({ ...editForm, start_time: e.target.value })
                                            }
                                            className="w-full border p-2 rounded"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <label className="block font-medium">End Time</label>
                                        <input
                                            type="time"
                                            value={editForm.end_time}
                                            onChange={(e) =>
                                                setEditForm({ ...editForm, end_time: e.target.value })
                                            }
                                            className="w-full border p-2 rounded"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block font-medium">Subject</label>
                                    <input
                                        type="text"
                                        value={editForm.subject}
                                        onChange={(e) =>
                                            setEditForm({ ...editForm, subject: e.target.value })
                                        }
                                        className="w-full border p-2 rounded"
                                    />
                                </div>
                                <div>
                                    <label className="block font-medium">Class Type</label>
                                    <input
                                        type="text"
                                        value={editForm.class_type}
                                        onChange={(e) =>
                                            setEditForm({ ...editForm, class_type: e.target.value })
                                        }
                                        className="w-full border p-2 rounded"
                                    />
                                </div>
                                <div>
                                    <label className="block font-medium">Active</label>
                                    <select
                                        value={editForm.active}
                                        onChange={(e) =>
                                            setEditForm({ ...editForm, active: e.target.value })
                                        }
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
