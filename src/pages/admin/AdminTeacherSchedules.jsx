import React, { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import SoftActionButton from "@/components/common/IconButton.jsx";

const AdminTeacherSchedule = () => {
    const [schedules, setSchedules] = useState([]);
    const [selectedDay, setSelectedDay] = useState("Monday");
    const rooms = [...new Set(schedules.map(s => s.room))];
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"];
    const timeSlots = [
        "13:00", "14:00", "15:00", "16:00", "18:00","19:00"
    ];
    const [selectedLesson, setSelectedLesson] = useState(null);

    useEffect(() => {
        const fetchSchedules = async () => {
            const snapshot = await getDocs(collection(db, "weekly_schedule"));
            const data = snapshot.docs.map(doc => doc.data());
            setSchedules(data);
        };
        fetchSchedules();
    }, []);

    const filteredSchedules = schedules.filter(lesson => lesson.day === selectedDay);

    return (
        <div className="p-6">
            {/* Tab buttons */}
            <div className="flex gap-2 mb-4">
                {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"].map((day) => (
                    <button
                        key={day}
                        onClick={() => setSelectedDay(day)}
                        className={`px-4 py-2 rounded-full ${
                            selectedDay === day ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700"
                        }`}
                    >
                        {day}
                    </button>
                ))}
            </div>

            {/* Schedule Table */}
            <div className="p-4 overflow-auto">
                <div className={`grid`} style={{gridTemplateColumns: `120px repeat(${rooms.length}, 1fr)`}}>

                    {/* Header */}
                    <div className="bg-gray-100 font-bold p-3 border-r border-b">Time</div>
                    {rooms.map(room => (
                        <div key={room} className="bg-gray-100 font-bold p-3 border-b text-center">{room}</div>
                    ))}

                    {/* Time Rows */}
                    {timeSlots.map((slot, rowIndex) => (
                        <React.Fragment key={slot}>
                            {/* Time Label */}
                            <div className="p-3 border-r border-b bg-gray-50 font-medium">{slot}</div>

                            {/* Room Cells */}
                            {rooms.map(room => {
                                const lessonsInSlot = filteredSchedules.filter(s =>
                                    s.room === room &&
                                    s.start_time === slot // or use a smarter range match later
                                );

                                return (
                                    <div key={`${slot}-${room}`}
                                         className="border p-2 min-h-[80px] flex flex-col gap-2">
                                        {lessonsInSlot.map((lesson, idx) => (
                                            <>
                                                <div className="font-semibold">{lesson.sessionType}</div>
                                                <div>{lesson.teacher}</div>
                                                <div className="text-xs">{lesson.start_time} - {lesson.end_time}</div>
                                                <SoftActionButton
                                                    label="More..."
                                                    color="gray"
                                                    onClick={() => setSelectedLesson(lesson)}
                                                    className="text-xs"
                                                />
                                            </>

                                        ))}
                                    </div>
                                );
                            })}
                        </React.Fragment>
                    ))}
                </div>
            </div>
            {selectedLesson && (
                <LessonOverlay
                    lesson={selectedLesson}
                    onClose={() => setSelectedLesson(null)}
                    onSave={(updatedLesson) => {
                        // Update logic here
                        setSchedules(prev =>
                            prev.map(l => l.lesson_id === updatedLesson.lesson_id ? updatedLesson : l)
                        );
                        setSelectedLesson(null);
                    }}
                />
            )}

        </div>
    );
};
const LessonOverlay = ({ lesson, onClose, onSave }) => {
    const [start, setStart] = useState(lesson.start_time);
    const [end, setEnd] = useState(lesson.end_time);
    const [room, setRoom] = useState(lesson.room);

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg space-y-4 relative">

                <button onClick={onClose} className="absolute top-2 right-2 text-gray-500 hover:text-black">✕</button>

                <h2 className="text-xl font-semibold">Lesson Details</h2>

                <div className="space-y-2 text-sm">
                    <div><strong>Teacher:</strong> {lesson.teacher}</div>
                    <div><strong>Type:</strong> {lesson.sessionType}</div>
                    <div><strong>Day:</strong> {lesson.day}</div>

                    <label className="block">
                        <span className="text-sm text-gray-700">Room</span>
                        <input
                            type="text"
                            value={room}
                            onChange={(e) => setRoom(e.target.value)}
                            className="w-full border rounded p-2 mt-1"
                        />
                    </label>

                    <div className="flex gap-2">
                        <label className="flex-1">
                            <span className="text-sm text-gray-700">Start Time</span>
                            <input
                                type="time"
                                value={start}
                                onChange={(e) => setStart(e.target.value)}
                                className="w-full border rounded p-2 mt-1"
                            />
                        </label>
                        <label className="flex-1">
                            <span className="text-sm text-gray-700">End Time</span>
                            <input
                                type="time"
                                value={end}
                                onChange={(e) => setEnd(e.target.value)}
                                className="w-full border rounded p-2 mt-1"
                            />
                        </label>
                    </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                    <SoftActionButton label="Cancel" color="gray" onClick={onClose} />
                    <SoftActionButton
                        label="Save"
                        color="green"
                        onClick={() => {
                            const updated = { ...lesson, start_time: start, end_time: end, room };
                            onSave(updated);
                        }}
                    />
                </div>
            </div>
        </div>
    );
};

export default AdminTeacherSchedule;
