import React, { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
    collection,
    getDocs,
    addDoc,
    doc,
    updateDoc,
    deleteDoc
} from "firebase/firestore";
import { db } from "@/firebase/firebase";
import SoftActionButton from "@/components/common/IconButton.jsx";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const SLOTS = ["13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"];
const ROOMS = ["Room 1", "Room 2", "Room 3", "Room 4"];
const SESSION_COLORS = {
    Group: "bg-gradient-to-br from-blue-100 via-blue-50 to-blue-200 text-blue-800",
    Private: "bg-gradient-to-br from-green-100 via-green-50 to-green-200 text-green-800"
};

export default function AdminTeacherSchedule() {
    const [schedules, setSchedules] = useState([]);
    const [teachersList, setTeachersList] = useState([]);
    const [studentsList, setStudentsList] = useState([]);
    const [day, setDay] = useState("Monday");
    const [active, setActive] = useState(null);
    const [adding, setAdding] = useState(false);
    const [notification, setNotification] = useState("");

    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        if (!notification) return;
        const timer = setTimeout(() => setNotification(""), 3000);
        return () => clearTimeout(timer);
    }, [notification]);

    useEffect(() => {
        getDocs(collection(db, "weekly_schedule"))
            .then(q => setSchedules(q.docs.map(d => ({ id: d.id, ...d.data() }))));
        getDocs(collection(db, "teachers"))
            .then(q => setTeachersList(q.docs.map(d => ({ id: d.id, ...d.data() }))));
        getDocs(collection(db, "students"))
            .then(q => setStudentsList(q.docs.map(d => ({ id: d.id, ...d.data() }))));
    }, []);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        if (params.get("add") === "true") {
            setAdding(true);
        }
    }, [location.search]);

    const teacherColors = useMemo(() => {
        const names = [...new Set(schedules.map(s => s.teacher))];
        return names.reduce((m, t, i) => {
            m[t] = `hsl(${Math.round((360 * i) / names.length)},55%,89%)`;
            return m;
        }, {});
    }, [schedules]);

    const conflictIds = useMemo(() => {
        const conflicts = new Set();
        const toMin = t => {
            const [h, m] = t.split(":").map(Number);
            return h * 60 + m;
        };
        for (let i = 0; i < schedules.length; i++) {
            for (let j = i + 1; j < schedules.length; j++) {
                const a = schedules[i];
                const b = schedules[j];
                const overlap =
                    a.day === b.day &&
                    (
                        a.room === b.room ||
                        a.teacher === b.teacher ||
                        a.students.some(id => b.students.includes(id))
                    ) &&
                    Math.max(toMin(a.start_time), toMin(b.start_time)) <
                    Math.min(toMin(a.end_time), toMin(b.end_time));
                if (overlap) {
                    conflicts.add(a.id);
                    conflicts.add(b.id);
                }
            }
        }
        return conflicts;
    }, [schedules]);

    const todays = schedules.filter(s => s.day === day);

    const handleDeleteAll = async () => {
        if (!window.confirm("Are you sure you want to DELETE ALL schedules?")) return;
        await Promise.all(schedules.map(s => deleteDoc(doc(db, "weekly_schedule", s.id))));
        setSchedules([]);
        setActive(null);
        setNotification("All schedules deleted successfully");
    };

    const dayIdx = DAYS.indexOf(day);

    return (
        <div className="p-8 bg-gradient-to-tr from-blue-50 to-purple-50 min-h-screen font-sans">
            <div className={`fixed top-8 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${notification ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"}`}>
                {notification && (
                    <div className="p-3 px-7 bg-green-200/90 border border-green-400 rounded-full shadow-xl font-medium text-green-800 drop-shadow-md animate-fadeIn">
                        {notification}
                    </div>
                )}
            </div>

            <div className="flex justify-between items-center mb-6">
                <div className="flex gap-2 relative">
                    {DAYS.map((d, i) => (
                        <button
                            key={d}
                            onClick={() => setDay(d)}
                            className={`relative px-5 py-2 rounded-xl font-semibold transition-all duration-150 ${day === d ? "bg-gradient-to-tr from-blue-400 to-blue-500 text-white shadow-lg scale-105" : "bg-gray-200 text-gray-700 hover:bg-blue-100 hover:text-blue-800"}`}
                            style={{ zIndex: day === d ? 2 : 1 }}
                        >
                            {d}
                            {day === d && (
                                <span className="absolute left-2 right-2 -bottom-2 h-1 rounded-full bg-blue-300 animate-pulse"></span>
                            )}
                        </button>
                    ))}
                    <span
                        className="absolute bottom-0 left-0 w-full h-2 pointer-events-none transition-all"
                        style={{ transform: `translateX(${dayIdx * 116}px)`, opacity: 0.18 }}
                    ></span>
                </div>
                <div className="flex gap-2">
                    <SoftActionButton label="Add Schedule" color="green" onClick={() => setAdding(true)} />
                    <SoftActionButton
                        label="Delete All"
                        color="red"
                        disabled={schedules.length === 0}
                        onClick={handleDeleteAll}
                    />
                </div>
            </div>

            <div className="overflow-auto rounded-3xl bg-white/80 shadow-2xl backdrop-blur-2xl border border-blue-100/40 p-3">
                <table className="min-w-full table-fixed border-collapse text-base">
                    <thead>
                    <tr>
                        <th className="w-28 border p-2 font-bold text-blue-800 bg-blue-50">Time</th>
                        {ROOMS.map(r => (
                            <th key={r} className="border p-2 text-center bg-blue-50 font-semibold">{r}</th>
                        ))}
                    </tr>
                    </thead>
                    <tbody>
                    {SLOTS.map((slot, rowIdx) => (
                        <tr key={slot}>
                            <td className="border p-2 font-semibold text-blue-800 bg-blue-50">{slot}</td>
                            {ROOMS.map(room => {
                                const lesson = todays.find(l => l.room === room && l.start_time === slot);
                                let rowSpan = 1;
                                if (lesson) {
                                    const si = SLOTS.indexOf(lesson.start_time);
                                    const ei = SLOTS.indexOf(lesson.end_time);
                                    rowSpan = Math.max(ei - si, 1);
                                }
                                const covered = todays.some(l =>
                                    l.room === room &&
                                    SLOTS.indexOf(l.start_time) < rowIdx &&
                                    SLOTS.indexOf(l.end_time) > rowIdx
                                );
                                if (covered && !lesson) return null;

                                if (lesson) {
                                    const conflict = conflictIds.has(lesson.id);
                                    return (
                                        <td
                                            key={room}
                                            rowSpan={rowSpan}
                                            onClick={() => setActive(lesson)}
                                            className={`border p-2 align-top cursor-pointer rounded-xl group transition-all hover:shadow-2xl hover:scale-[1.025] duration-150 ${conflict ? "ring-2 ring-red-400 animate-pulse" : ""}`}
                                            style={{
                                                background: teacherColors[lesson.teacher],
                                                borderColor: conflict ? "#f87171" : "#bfdbfe"
                                            }}
                                            title={conflict ? "⚠️ Conflict!" : ""}
                                        >
                                            <div className={`mb-1 inline-block rounded-full px-3 py-1 text-xs font-bold ${SESSION_COLORS[lesson.sessionType]}`}>
                                                {lesson.sessionType}
                                            </div>
                                            <div className="font-bold text-blue-900">{lesson.teacher}</div>
                                            <div className="text-xs text-gray-500">{lesson.start_time} - {lesson.end_time}</div>
                                        </td>
                                    );
                                }
                                return <td key={room} className="border p-2"></td>;
                            })}
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            {active && (
                <EditModal
                    slot={active}
                    teachers={teachersList}
                    students={studentsList}
                    existingSchedules={schedules}
                    onClose={() => setActive(null)}
                    onSave={async updated => {
                        const { id, ...data } = updated;
                        await updateDoc(doc(db, "weekly_schedule", id), data);
                        setSchedules(s => s.map(x => (x.id === id ? updated : x)));
                        setActive(null);
                        setNotification("Schedule updated successfully");
                    }}
                    onDelete={async id => {
                        if (!window.confirm("Are you sure you want to delete this schedule slot?")) return;
                        await deleteDoc(doc(db, "weekly_schedule", id));
                        setSchedules(s => s.filter(x => x.id !== id));
                        setActive(null);
                        setNotification("Schedule deleted successfully");
                    }}
                />
            )}

            {adding && (
                <AddModal
                    defaultDay={day}
                    teachers={teachersList}
                    students={studentsList}
                    existingSchedules={schedules}
                    onClose={() => {
                        setAdding(false);
                        const params = new URLSearchParams(location.search);
                        if (params.has("add")) {
                            params.delete("add");
                            navigate({ search: params.toString() }, { replace: true });
                        }
                    }}
                    onSave={async slot => {
                        const ref = await addDoc(collection(db, "weekly_schedule"), slot);
                        setSchedules(s => [...s, { ...slot, id: ref.id }]);
                        setAdding(false);
                        setNotification("Schedule added successfully");
                    }}
                />
            )}
        </div>
    );
}

export function AddModal({ defaultDay, teachers, students, existingSchedules, onClose, onSave }) {
    const [slot, setSlot] = useState({
        day: defaultDay,
        room: ROOMS[0],
        sessionType: "Group",
        start_time: "",
        end_time: "",
        teacher: "",
        students: []
    });
    const [error, setError] = useState("");

    const eligibleTeachers = useMemo(() => {
        if (slot.students.length === 0) return teachers;
        // eslint-disable-next-line react/prop-types
        return teachers.filter(t =>
            slot.students.every(id => (t.assigned_students || []).includes(id))
        );
    }, [slot.students, teachers]);

    const eligibleStudents = useMemo(() => {
        const teacher = teachers.find(t => t.name === slot.teacher);
        if (!teacher) return students;
        const ids = teacher.assigned_students || [];
        return students.filter(st => ids.includes(st.id));
    }, [slot.teacher, teachers, students]);

    useEffect(() => {
        if (!slot.teacher) return;
        const allowed = new Set(eligibleStudents.map(s => s.id));
        setSlot(s => ({ ...s, students: s.students.filter(id => allowed.has(id)) }));
    }, [slot.teacher, eligibleStudents]);

    useEffect(() => {
        if (!slot.teacher) return;
        const teacher = eligibleTeachers.find(t => t.name === slot.teacher);
        if (!teacher) setSlot(s => ({ ...s, teacher: "" }));
    }, [eligibleTeachers, slot.teacher]);

    useEffect(() => {
        setSlot(s => ({ ...s, sessionType: s.students.length > 1 ? "Group" : "Private" }));
    }, [slot.students]);

    const isValid = Boolean(
        slot.teacher &&
        slot.room &&
        slot.start_time &&
        slot.end_time &&
        slot.students.length > 0
    );

    const toMin = t => {
        const [h, m] = t.split(":").map(Number);
        return h * 60 + m;
    };

    const overlaps = newSlot =>
        existingSchedules.some(s =>
            s.day === newSlot.day &&
            (
                s.room === newSlot.room ||
                s.teacher === newSlot.teacher ||
                s.students.some(id => newSlot.students.includes(id))
            ) &&
            Math.max(toMin(s.start_time), toMin(newSlot.start_time)) <
            Math.min(toMin(s.end_time), toMin(newSlot.end_time))
        );

    const handlePick = e => {
        const id = e.target.value;
        if (!id) return;
        setSlot(s => ({
            ...s,
            students: s.students.includes(id) ? s.students : [...s.students, id]
        }));
        e.target.value = "";
        if (error) setError("");
    };

    const removeStudent = id => {
        setSlot(s => ({
            ...s,
            students: s.students.filter(x => x !== id)
        }));
        if (error) setError("");
    };

    const handleSave = () => {
        if (!isValid) {
            setError("All fields are required, and at least one student must be added.");
            return;
        }
        if (overlaps(slot)) {
            setError("This schedule conflicts with an existing slot.");
            return;
            setError("");
        }
        onSave(slot);
    };

    return (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
            <div className="bg-white rounded-2xl p-7 w-full max-w-lg space-y-5 relative shadow-2xl border border-blue-200 animate-slideIn">
                <button
                    onClick={onClose}
                    className="absolute top-2 right-2 text-gray-400 hover:text-blue-700 text-2xl font-bold"
                >
                    ✕
                </button>
                <h2 className="text-xl font-semibold mb-3">Add Schedule Slot</h2>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <label>Day
                        <select
                            value={slot.day}
                            onChange={e => {
                                setSlot(s => ({ ...s, day: e.target.value }));
                                if (error) setError("");
                            }}
                            className="mt-1 border rounded p-2 w-full bg-white"
                        >
                            {DAYS.map(d => (
                                <option key={d} value={d}>{d}</option>
                            ))}
                        </select>
                    </label>
                    <label>Teacher
                        <select
                            value={slot.teacher}
                            onChange={e => {
                                setSlot(s => ({ ...s, teacher: e.target.value }));
                                if (error) setError("");
                            }}
                            className="mt-1 border rounded p-2 w-full bg-white"
                        >
                            <option value="">— select —</option>
                            {eligibleTeachers.map(t => (
                                <option key={t.id} value={t.name}>{t.name}</option>
                            ))}
                        </select>
                    </label>
                    <label>Room
                        <select
                            value={slot.room}
                            onChange={e => {
                                setSlot(s => ({ ...s, room: e.target.value }));
                                if (error) setError("");
                            }}
                            className="mt-1 border rounded p-2 w-full bg-white"
                        >
                            {ROOMS.map(r => (
                                <option key={r} value={r}>{r}</option>
                            ))}
                        </select>
                    </label>
                    <label>Start
                        <input
                            type="time"
                            value={slot.start_time}
                            onChange={e => {
                                setSlot(s => ({ ...s, start_time: e.target.value }));
                                if (error) setError("");
                            }}
                            className="mt-1 border rounded p-2 w-full"
                        />
                    </label>
                    <label>End
                        <input
                            type="time"
                            value={slot.end_time}
                            onChange={e => {
                                setSlot(s => ({ ...s, end_time: e.target.value }));
                                if (error) setError("");
                            }}
                            className="mt-1 border rounded p-2 w-full"
                        />
                    </label>
                </div>
                <div className="text-sm mt-1">
                    <span className="font-medium">Session Type:</span>{" "}
                    <span className={`inline-block px-2 py-1 rounded-full font-bold ${SESSION_COLORS[slot.sessionType]}`}>
                        {slot.sessionType}
                    </span>
                </div>
                <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                        {slot.students.map(id => {
                            const st = students.find(x => x.id === id);
                            return (
                                <span
                                    key={id}
                                    className="flex items-center bg-blue-100 px-3 py-1 rounded-full text-xs font-semibold shadow group"
                                >
                                    <span className="mr-1">{st?.name || id}</span>
                                    <button
                                        onClick={() => removeStudent(id)}
                                        className="ml-2 text-blue-400 hover:text-red-600 font-bold opacity-60 hover:opacity-100"
                                        title="Remove"
                                    >
                                        ×
                                    </button>
                                </span>
                            );
                        })}
                    </div>
                    <label className="block text-sm">
                        Pick Students
                        <select
                            onChange={handlePick}
                            className="mt-1 border rounded p-2 w-full bg-white"
                        >
                            <option value="">— select —</option>
                            {eligibleStudents.map(st => (
                                <option key={st.id} value={st.id}>{st.name}</option>
                            ))}
                        </select>
                    </label>
                </div>
                {error && (
                    <div className="text-red-600 text-sm font-medium bg-red-50 border border-red-200 rounded p-2">
                        {error}
                    </div>
                )}
                <div className="flex justify-end gap-2 mt-1">
                    <SoftActionButton label="Cancel" color="gray" onClick={onClose} />
                    <SoftActionButton label="Save" color="green" onClick={handleSave} />
                </div>
            </div>
        </div>
    );
}

export function EditModal({ slot, teachers, students, existingSchedules, onClose, onSave, onDelete }) {
    const [s, setS] = useState({ ...slot });
    const [error, setError] = useState("");

    const eligibleTeachers = useMemo(() => {
        if (s.students.length === 0) return teachers;
        return teachers.filter(t =>
            s.students.every(id => (t.assigned_students || []).includes(id))
        );
    }, [s.students, teachers]);

    const eligibleStudents = useMemo(() => {
        const teacher = teachers.find(t => t.name === s.teacher);
        if (!teacher) return students;
        const ids = teacher.assigned_students || [];
        return students.filter(st => ids.includes(st.id));
    }, [s.teacher, teachers, students]);

    useEffect(() => {
        if (!s.teacher) return;
        const allowed = new Set(eligibleStudents.map(st => st.id));
        setS(curr => ({ ...curr, students: curr.students.filter(id => allowed.has(id)) }));
    }, [s.teacher, eligibleStudents]);

    useEffect(() => {
        if (!s.teacher) return;
        const teacher = eligibleTeachers.find(t => t.name === s.teacher);
        if (!teacher) setS(curr => ({ ...curr, teacher: "" }));
    }, [eligibleTeachers, s.teacher]);

    useEffect(() => {
        setS(prev => ({ ...prev, sessionType: prev.students.length > 1 ? "Group" : "Private" }));
    }, [s.students]);

    const isValid = Boolean(
        s.teacher &&
        s.room &&
        s.start_time &&
        s.end_time &&
        s.students.length > 0
    );

    const toMin = t => {
        const [h, m] = t.split(":").map(Number);
        return h * 60 + m;
    };

    const overlaps = newSlot =>
        existingSchedules.some(x =>
            x.id !== newSlot.id &&
            x.day === newSlot.day &&
            (
                x.room === newSlot.room ||
                x.teacher === newSlot.teacher ||
                x.students.some(id => newSlot.students.includes(id))
            ) &&
            Math.max(toMin(x.start_time), toMin(newSlot.start_time)) <
            Math.min(toMin(x.end_time), toMin(newSlot.end_time))
        );

    const handleSave = () => {
        if (!isValid) {
            setError("All fields are required, and at least one student must be added.");
            return;
        }
        if (overlaps(s)) {
            setError("This schedule conflicts with an existing slot.");
            return;
        }
        onSave(s);
    };

    const updateField = updater => {
        setS(curr => (typeof updater === "function" ? updater(curr) : updater));
        if (error) setError("");
    };

    const handlePick = e => {
        const id = e.target.value;
        if (!id) return;
        updateField(x => ({
            ...x,
            students: x.students.includes(id) ? x.students : [...x.students, id]
        }));
        e.target.value = "";
    };

    const removeStudent = id =>
        updateField(x => ({ ...x, students: x.students.filter(y => y !== id) }));

    return (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
            <div className="bg-white rounded-2xl p-7 w-full max-w-lg space-y-5 relative shadow-2xl border border-blue-200 animate-slideIn">
                <button
                    onClick={onClose}
                    className="absolute top-2 right-2 text-gray-400 hover:text-blue-700 text-2xl font-bold"
                >
                    ✕
                </button>
                <h2 className="text-xl font-semibold mb-3">Edit Schedule Slot</h2>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <label>Teacher
                        <select
                            value={s.teacher}
                            onChange={e => updateField({ ...s, teacher: e.target.value })}
                            className="mt-1 border rounded p-2 w-full bg-white"
                        >
                            <option value="">— select —</option>
                            {eligibleTeachers.map(t => (
                                <option key={t.id} value={t.name}>{t.name}</option>
                            ))}
                        </select>
                    </label>
                    <label>Room
                        <select
                            value={s.room}
                            onChange={e => updateField({ ...s, room: e.target.value })}
                            className="mt-1 border rounded p-2 w-full bg-white"
                        >
                            {ROOMS.map(r => (
                                <option key={r} value={r}>{r}</option>
                            ))}
                        </select>
                    </label>
                    <label>Start
                        <input
                            type="time"
                            value={s.start_time}
                            onChange={e => updateField({ ...s, start_time: e.target.value })}
                            className="mt-1 border rounded p-2 w-full"
                        />
                    </label>
                    <label>End
                        <input
                            type="time"
                            value={s.end_time}
                            onChange={e => updateField({ ...s, end_time: e.target.value })}
                            className="mt-1 border rounded p-2 w-full"
                        />
                    </label>
                    <label>Day
                        <select
                            value={s.day}
                            onChange={e => updateField({ ...s, day: e.target.value })}
                            className="mt-1 border rounded p-2 w-full bg-white"
                        >
                            {DAYS.map(d => (
                                <option key={d} value={d}>{d}</option>
                            ))}
                        </select>
                    </label>
                </div>
                <div className="text-sm mt-1">
                    <span className="font-medium">Session Type:</span>{" "}
                    <span className={`inline-block px-2 py-1 rounded-full font-bold ${SESSION_COLORS[s.sessionType]}`}>
                        {s.sessionType}
                    </span>
                </div>
                <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                        {s.students.map(id => {
                            const st = students.find(x => x.id === id);
                            return (
                                <span
                                    key={id}
                                    className="flex items-center bg-blue-100 px-3 py-1 rounded-full text-xs font-semibold shadow group"
                                >
                                    <span className="mr-1">{st?.name || id}</span>
                                    <button
                                        onClick={() => removeStudent(id)}
                                        className="ml-2 text-blue-400 hover:text-red-600 font-bold opacity-60 hover:opacity-100"
                                        title="Remove"
                                    >
                                        ×
                                    </button>
                                </span>
                            );
                        })}
                    </div>
                    <label className="block text-sm">
                        Pick Students
                        <select
                            onChange={handlePick}
                            className="mt-1 border rounded p-2 w-full bg-white"
                        >
                            <option value="">— select —</option>
                            {eligibleStudents.map(stu => (
                                <option key={stu.id} value={stu.id}>{stu.name}</option>
                            ))}
                        </select>
                    </label>
                </div>
                {error && (
                    <div className="text-red-600 text-sm font-medium bg-red-50 border border-red-200 rounded p-2">
                        {error}
                    </div>
                )}
                <div className="flex justify-between pt-4">
                    <SoftActionButton label="Delete" color="red" onClick={() => onDelete(s.id)} />
                    <div className="flex gap-2">
                        <SoftActionButton label="Cancel" color="gray" onClick={onClose} />
                        <SoftActionButton label="Save" color="green" onClick={handleSave} />
                    </div>
                </div>
            </div>
        </div>
    );
}
