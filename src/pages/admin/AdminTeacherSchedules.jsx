import React, { useState, useEffect } from "react";
import { collection, getDocs, updateDoc, doc, deleteDoc } from "firebase/firestore";
import { db } from "@/firebase/firebase.jsx";
import { Link } from "react-router-dom";
import AdminSidebar from "@/components/admin/AdminSidebar.jsx";
import DaySchedule from "@/pages/schedules/DaySchedule.jsx";
import Select from "react-select";
import { useTranslation } from "react-i18next";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const AdminTeacherSchedule = () => {
    const { t } = useTranslation();
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
            const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
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
            const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
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
        const names = (lesson.student_ids || []).map(id => allStudents.find(s => s.id === id)?.name || id);
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
        const student_ids = studentNames.map(name => allStudents.find(s => s.name.toLowerCase().trim() === name.toLowerCase().trim())?.id).filter(Boolean);
        try {
            await updateDoc(doc(db, "weekly_schedule", selectedLesson.id), { ...editForm, student_ids });
            await fetchSchedules();
            setSelectedLesson(null);
        } catch (err) {
            console.error("Error updating lesson:", err);
            setEditError(t("error_update_lesson"));
        }
    };

    const handleDeleteLesson = async () => {
        if (!window.confirm(t("confirm_delete_lesson"))) return;
        try {
            await deleteDoc(doc(db, "weekly_schedule", selectedLesson.id));
            await fetchSchedules();
            setSelectedLesson(null);
        } catch (err) {
            console.error("Error deleting lesson:", err);
        }
    };

    if (loading) return <p>{t("loading_schedules")}</p>;

    return (
        <div className="flex min-h-screen bg-gray-100">
            <AdminSidebar active="schedules" />
            <main className="flex-1 p-6">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-3xl font-bold">{t("teacher_schedules")}</h1>
                    <Link to="/admin/schedule/new" className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
                        + {t("add_schedule")}
                    </Link>
                </div>

                <div className="mb-4 flex flex-wrap gap-2">
                    {DAYS.map(day => (
                        <button
                            key={day}
                            onClick={() => setSelectedDay(day)}
                            className={`px-4 py-1 rounded ${selectedDay === day ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700"}`}
                        >
                            {t(day.toLowerCase())}
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
                            <h2 className="text-2xl font-bold mb-4">{t("edit_lesson")}</h2>
                            {editError && <p className="text-red-500 mb-2">{editError}</p>}
                            <form onSubmit={handleUpdateLesson} className="space-y-4">
                                <div>
                                    <label className="block font-medium">{t("day_of_week")}</label>
                                    <select value={editForm.day_of_week} onChange={(e) => setEditForm({ ...editForm, day_of_week: e.target.value })} className="w-full border p-2 rounded">
                                        {DAYS.map(day => (
                                            <option key={day} value={day}>{t(day.toLowerCase())}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex gap-2">
                                    <div className="flex-1">
                                        <label className="block font-medium">{t("start_time")}</label>
                                        <input type="time" value={editForm.start_time} onChange={(e) => setEditForm({ ...editForm, start_time: e.target.value })} className="w-full border p-2 rounded" />
                                    </div>
                                    <div className="flex-1">
                                        <label className="block font-medium">{t("end_time")}</label>
                                        <input type="time" value={editForm.end_time} onChange={(e) => setEditForm({ ...editForm, end_time: e.target.value })} className="w-full border p-2 rounded" />
                                    </div>
                                </div>

                                <div>
                                    <label className="block font-medium">{t("subject")}</label>
                                    <select
                                        value={editForm.subject}
                                        onChange={(e) => setEditForm({ ...editForm, subject: e.target.value })}
                                        className="w-full border p-2 rounded"
                                    >
                                        {[...new Set(schedules.map((s) => s.subject))].map((subj) => (
                                            <option key={subj} value={subj}>
                                                {t(`subjects.${subj.toLowerCase()}`)}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block font-medium">{t("class_type")}</label>
                                    <select value={editForm.class_type} onChange={(e) => setEditForm({ ...editForm, class_type: e.target.value })} className="w-full border p-2 rounded">
                                        <option value="Group">{t("group")}</option>
                                        <option value="Private">{t("private")}</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block font-medium">{t("active")}</label>
                                    <select value={editForm.active} onChange={(e) => setEditForm({ ...editForm, active: e.target.value })} className="w-full border p-2 rounded">
                                        <option value="Yes">{t("yes")}</option>
                                        <option value="No">{t("no")}</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block font-medium">{t("students")}</label>
                                    <Select
                                        isMulti
                                        options={allStudents.map(student => ({ value: student.name, label: student.name }))}
                                        value={studentNames.map(name => ({ value: name, label: name }))}
                                        onChange={(selectedOptions) => setStudentNames(selectedOptions.map(opt => opt.value))}
                                    />
                                </div>

                                <div className="flex justify-end gap-2">
                                    <button type="button" onClick={() => setSelectedLesson(null)} className="px-4 py-2 rounded border text-gray-700 hover:bg-gray-100">
                                        {t("cancel")}
                                    </button>
                                    <button type="submit" className="px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600">
                                        {t("save")}
                                    </button>
                                    <button type="button" onClick={handleDeleteLesson} className="px-4 py-2 rounded bg-red-500 text-white hover:bg-red-600">
                                        {t("delete")}
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
