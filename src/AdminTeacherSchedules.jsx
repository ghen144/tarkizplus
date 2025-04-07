import React, { useState, useEffect } from "react";
import { collection, getDocs, updateDoc, doc, deleteDoc } from "firebase/firestore";
import { db } from "./firebase";
import { Link } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";
import DaySchedule from "./DaySchedule";
import Select from "react-select";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const AdminTeacherSchedule = () => {
    const [schedules, setSchedules] = useState([]);
    const [teacherMap, setTeacherMap] = useState({});
    const [loading, setLoading] = useState(true);
    const [selectedDay, setSelectedDay] = useState("Monday");
    const [selectedLesson, setSelectedLesson] = useState(null);
    const [editForm, setEditForm] = useState({
        day_of_week: "",
        start_time: "",
        end_time: "",
        subject: "",
        class_type: "",
        active: "Yes"
    });
    const [studentNames, setStudentNames] = useState([]);
    const [allStudents, setAllStudents] = useState([]);
    const [editError, setEditError] = useState("");

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

    const fetchStudents = async () => {
        try {
            const snapshot = await getDocs(collection(db, "students"));
            const list = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data()
            }));
            setAllStudents(list);
        } catch (err) {
            console.error("Error fetching students:", err);
        }
    };

    useEffect(() => {
        fetchSchedules();
        fetchTeachers();
        fetchStudents();
    }, []);

    const lessonsByDay = {};
    DAYS.forEach(day => {
        lessonsByDay[day] = schedules.filter((lesson) => lesson.day_of_week === day);
    });

    const handleLessonClick = (lesson) => {
        const names = (lesson.student_ids || []).map(id =>
            allStudents.find(s => s.id === id)?.name || id
        );
        setSelectedLesson(lesson);
        setStudentNames(names);
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

    const handleUpdateLesson = async (e) => {
        e.preventDefault();
        setEditError("");

        const student_ids = studentNames.map(name => {
            const match = allStudents.find(s =>
                s.name.toLowerCase().trim() === name.toLowerCase().trim()
            );
            return match?.id;
        }).filter(Boolean); // remove any nulls

        try {
            await updateDoc(doc(db, "weekly_schedule", selectedLesson.id), {
                ...editForm,
                student_ids
            });
            await fetchSchedules();
            setSelectedLesson(null);
        } catch (err) {
            console.error("Error updating lesson:", err);
            setEditError("Failed to update lesson.");
        }
    };

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

                <DaySchedule
                    day={selectedDay}
                    lessons={lessonsByDay[selectedDay]}
                    teacherMap={teacherMap}
                    onLessonClick={handleLessonClick}
                />

                {selectedLesson && (
                    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                        <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
                            <h2 className="text-2xl font-bold mb-4">Edit Lesson</h2>
                            {editError && <p className="text-red-500 mb-2">{editError}</p>}
                            <form onSubmit={handleUpdateLesson} className="space-y-4">
                                <div>
                                    <label className="block font-medium">Day of Week</label>
                                    <select
                                        value={editForm.day_of_week}
                                        onChange={(e) => setEditForm({ ...editForm, day_of_week: e.target.value })}
                                        className="w-full border p-2 rounded"
                                    >
                                        {DAYS.map((day) => (
                                            <option key={day} value={day}>
                                                {day}
                                            </option>
                                        ))}
                                    </select>
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
                                    <select
                                        value={editForm.subject}
                                        onChange={(e) => setEditForm({ ...editForm, subject: e.target.value })}
                                        className="w-full border p-2 rounded"
                                    >
                                        {[...new Set(schedules.map((s) => s.subject))].map((subj) => (
                                            <option key={subj} value={subj}>
                                                {subj}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block font-medium">Class Type</label>
                                    <select
                                        value={editForm.class_type}
                                        onChange={(e) => setEditForm({ ...editForm, class_type: e.target.value })}
                                        className="w-full border p-2 rounded"
                                    >
                                        <option value="Group">Group</option>
                                        <option value="Private">Private</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block font-medium">Active</label>
                                    <select
                                        value={editForm.active}
                                        onChange={(e) => setEditForm({ ...editForm, active: e.target.value })}
                                        className="w-full border p-2 rounded"
                                    >
                                        <option value="Yes">Yes</option>
                                        <option value="No">No</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block font-medium">Students</label>
                                    <Select
                                        isMulti
                                        options={allStudents.map(student => ({
                                            value: student.name,
                                            label: student.name
                                        }))}
                                        value={studentNames.map(name => ({ value: name, label: name }))}
                                        onChange={(selectedOptions) =>
                                            setStudentNames(selectedOptions.map(opt => opt.value))
                                        }
                                    />

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
