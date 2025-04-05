import React, { useState, useEffect } from "react";
import { collection, addDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { db } from "./firebase";
import AdminSidebar from "./AdminSidebar";

export default function NewSchedule() {
    const [teacherId, setTeacherId] = useState("");
    const [dayOfWeek, setDayOfWeek] = useState("");
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");
    const [subject, setSubject] = useState("");
    const [classType, setClassType] = useState("");
    const [active, setActive] = useState("Yes");
    const [studentIds, setStudentIds] = useState("");
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        await addDoc(collection(db, "weekly_schedule"), {
            teacher_id: teacherId,
            day_of_week: dayOfWeek,
            start_time: startTime,
            end_time: endTime,
            subject,
            class_type: classType,
            active,
            student_ids: studentIds.split(",").map(s => s.trim())
        });
        navigate("/admin/schedule");
    };

    return (
        <div className="flex min-h-screen bg-gray-100">
            <AdminSidebar active="schedules" />
            <main className="flex-1 p-6">
                <h1 className="text-3xl mb-4">New Schedule</h1>
                <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow space-y-4">
                    <input value={teacherId} onChange={e=>setTeacherId(e.target.value)} placeholder="Teacher ID" className="w-full border p-2" />
                    <input value={dayOfWeek} onChange={e=>setDayOfWeek(e.target.value)} placeholder="Day of Week" className="w-full border p-2" />
                    <div className="flex gap-2">
                        <input type="time" value={startTime} onChange={e=>setStartTime(e.target.value)} className="flex-1 border p-2"/>
                        <input type="time" value={endTime} onChange={e=>setEndTime(e.target.value)} className="flex-1 border p-2"/>
                    </div>
                    <input value={subject} onChange={e=>setSubject(e.target.value)} placeholder="Subject" className="w-full border p-2" />
                    <input value={classType} onChange={e=>setClassType(e.target.value)} placeholder="Class Type" className="w-full border p-2" />
                    <select value={active} onChange={e=>setActive(e.target.value)} className="w-full border p-2">
                        <option>Yes</option><option>No</option>
                    </select>
                    <input value={studentIds} onChange={e=>setStudentIds(e.target.value)} placeholder="Student IDs comma-separated" className="w-full border p-2" />
                    <button className="bg-green-500 text-white px-4 py-2 rounded">Create</button>
                </form>
            </main>
        </div>
    );
}
