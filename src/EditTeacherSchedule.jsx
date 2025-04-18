import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "./firebase";
import AdminSidebar from "./AdminSidebar";

const EditTeacherSchedule = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [schedule, setSchedule] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Form state
    const [dayOfWeek, setDayOfWeek] = useState("");
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");
    const [subject, setSubject] = useState("");
    const [classType, setClassType] = useState("");
    const [active, setActive] = useState("");
    const [studentIds, setStudentIds] = useState([]);

    useEffect(() => {
        const fetchSchedule = async () => {
            try {
                const docRef = doc(db, "weekly_schedule", id);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setSchedule(data);
                    setDayOfWeek(data.day_of_week || "");
                    setStartTime(data.start_time || "");
                    setEndTime(data.end_time || "");
                    setSubject(data.subject || "");
                    setClassType(data.class_type || "");
                    setActive(data.active || "");
                    setStudentIds(data.student_ids || []);
                } else {
                    setError("Schedule not found");
                }
            } catch (err) {
                console.error("Error fetching schedule:", err);
                setError("Error loading schedule");
            } finally {
                setLoading(false);
            }
        };

        fetchSchedule();
    }, [id]);

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            const docRef = doc(db, "weekly_schedule", id);
            await updateDoc(docRef, {
                day_of_week: dayOfWeek,
                start_time: startTime,
                end_time: endTime,
                subject,
                class_type: classType,
                active,
                student_ids: studentIds,
            });
            navigate("/admin/schedule");
        } catch (err) {
            console.error("Error updating schedule:", err);
            setError("Failed to update schedule");
        }
    };

    if (loading) {
        return (
            <div className="p-6">
                <p>Loading schedule...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6">
                <p className="text-red-500">{error}</p>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-gray-100">
            <AdminSidebar active="teachers" />
            <main className="flex-1 p-6">
                <h1 className="text-3xl font-bold mb-6">Edit Schedule</h1>
                <form onSubmit={handleUpdate} className="space-y-4 bg-white p-6 rounded shadow">
                    <div>
                        <label className="block font-medium mb-1">Day of Week</label>
                        <input
                            type="text"
                            value={dayOfWeek}
                            onChange={(e) => setDayOfWeek(e.target.value)}
                            className="w-full border rounded p-2"
                            placeholder="Monday, Tuesday, etc."
                        />
                    </div>
                    <div>
                        <label className="block font-medium mb-1">Start Time</label>
                        <input
                            type="time"
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            className="w-full border rounded p-2"
                        />
                    </div>
                    <div>
                        <label className="block font-medium mb-1">End Time</label>
                        <input
                            type="time"
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                            className="w-full border rounded p-2"
                        />
                    </div>
                    <div>
                        <label className="block font-medium mb-1">Subject</label>
                        <input
                            type="text"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            className="w-full border rounded p-2"
                            placeholder="Math, English, etc."
                        />
                    </div>
                    <div>
                        <label className="block font-medium mb-1">Class Type</label>
                        <input
                            type="text"
                            value={classType}
                            onChange={(e) => setClassType(e.target.value)}
                            className="w-full border rounded p-2"
                            placeholder="Group or Private"
                        />
                    </div>
                    <div>
                        <label className="block font-medium mb-1">Active</label>
                        <select
                            value={active}
                            onChange={(e) => setActive(e.target.value)}
                            className="w-full border rounded p-2"
                        >
                            <option value="">Select</option>
                            <option value="Yes">Yes</option>
                            <option value="No">No</option>
                        </select>
                    </div>
                    <div>
                        <label className="block font-medium mb-1">Student IDs (comma-separated)</label>
                        <textarea
                            value={studentIds.join(", ")}
                            onChange={(e) =>
                                setStudentIds(e.target.value.split(",").map(id => id.trim()))
                            }
                            className="w-full border rounded p-2"
                            rows={3}
                            placeholder="S001, S002, S003"
                        />
                    </div>
                    <button
                        type="submit"
                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                    >
                        Save Changes
                    </button>
                </form>
            </main>
        </div>
    );
};

export default EditTeacherSchedule;
