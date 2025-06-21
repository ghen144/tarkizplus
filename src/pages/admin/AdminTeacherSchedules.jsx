import React, { useState, useEffect, useMemo } from "react";
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

// ————— Constants —————————
const DAYS  = ["Sunday","Monday","Tuesday","Wednesday","Thursday", "Friday", "Saturday"];
const SLOTS = ["13:00","14:00","15:00","16:00","17:00","18:00","19:00"];
const ROOMS = ["Room 1","Room 2","Room 3","Room 4"];

export default function AdminTeacherSchedule() {
    // — state —
    const [schedules,    setSchedules]    = useState([]);
    const [teachersList, setTeachersList] = useState([]);
    const [studentsList, setStudentsList] = useState([]);

    const [day,    setDay]    = useState("Monday");
    const [active, setActive] = useState(null);
    const [adding, setAdding] = useState(false);

    // notification banner
    const [notification, setNotification] = useState("");
    useEffect(() => {
        if (!notification) return;
        const timer = setTimeout(() => setNotification(""), 3000);
        return () => clearTimeout(timer);
    }, [notification]);

    // — fetch once on mount —
    useEffect(() => {
        getDocs(collection(db,"weekly_schedule"))
            .then(q => setSchedules(q.docs.map(d => ({ id:d.id, ...d.data() }))));
        getDocs(collection(db,"teachers"))
            .then(q => setTeachersList(q.docs.map(d => ({ id:d.id, ...d.data() }))));
        getDocs(collection(db,"students"))
            .then(q => setStudentsList(q.docs.map(d => ({ id:d.id, ...d.data() }))));
    }, []);

    // — colors per teacher —
    const teacherColors = useMemo(() => {
        const names = [...new Set(schedules.map(s=>s.teacher))];
        return names.reduce((m,t,i) => {
            m[t] = `hsl(${Math.round(360*i/names.length)},60%,80%)`;
            return m;
        }, {});
    }, [schedules]);

    // — conflict detection —
    const conflictIds = useMemo(() => {
        const S = new Set();
        const toMin = t => {
            const [h,m] = t.split(":").map(Number);
            return h*60 + m;
        };
        schedules.forEach(a =>
            schedules.forEach(b => {
                if (
                    a.id!==b.id &&
                    a.day===b.day &&
                    a.room===b.room &&
                    Math.max(toMin(a.start_time), toMin(b.start_time)) <
                    Math.min(toMin(a.end_time),   toMin(b.end_time))
                ) {
                    S.add(a.id);
                    S.add(b.id);
                }
            })
        );
        return S;
    }, [schedules]);

    // — filter for this day —
    const todays = schedules.filter(s => s.day===day);

    // — Delete All with confirmation —
    const handleDeleteAll = async () => {
        if (!window.confirm("Are you sure you want to DELETE ALL schedules?")) return;
        await Promise.all(
            schedules.map(s => deleteDoc(doc(db,"weekly_schedule", s.id)))
        );
        setSchedules([]);
        setActive(null);
        setNotification("All schedules deleted successfully");
    };

    return (
        <div className="p-6">
            {/* notification banner */}
            {notification && (
                <div className="mb-4 p-2 bg-green-200 text-green-800 rounded">
                    {notification}
                </div>
            )}

            {/* — Day tabs & header buttons — */}
            <div className="flex justify-between items-center mb-4">
                <div className="flex gap-2">
                    {DAYS.map(d => (
                        <button
                            key={d}
                            onClick={() => setDay(d)}
                            className={`px-4 py-2 rounded-full ${
                                day===d ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700"
                            }`}
                        >
                            {d}
                        </button>
                    ))}
                </div>
                <div className="flex gap-2">
                    <SoftActionButton
                        label="Add Schedule"
                        color="green"
                        onClick={() => setAdding(true)}
                    />
                    <SoftActionButton
                        label="Delete All"
                        color="red"
                        disabled={schedules.length === 0}
                        onClick={handleDeleteAll}
                    />
                </div>
            </div>

            {/* — The schedule grid — */}
            <div className="overflow-auto">
                <table className="min-w-full table-fixed border-collapse">
                    <thead>
                    <tr>
                        <th className="w-24 border p-2">Time</th>
                        {ROOMS.map(r => (
                            <th key={r} className="border p-2 text-center">{r}</th>
                        ))}
                    </tr>
                    </thead>
                    <tbody>
                    {SLOTS.map((slot, rowIdx) => (
                        <tr key={slot}>
                            <td className="border p-2">{slot}</td>
                            {ROOMS.map(room => {
                                // lesson starting here?
                                const lesson = todays.find(l => l.room===room && l.start_time===slot);
                                // rowspan for multi-slot
                                let rowSpan = 1;
                                if (lesson) {
                                    const si = SLOTS.indexOf(lesson.start_time);
                                    const ei = SLOTS.indexOf(lesson.end_time);
                                    rowSpan = Math.max(ei - si, 1);
                                }
                                // covered by earlier rowspan?
                                const covered = todays.some(l =>
                                    l.room===room &&
                                    SLOTS.indexOf(l.start_time) < rowIdx &&
                                    SLOTS.indexOf(l.end_time)   > rowIdx
                                );
                                if (covered && !lesson) return null;

                                if (lesson) {
                                    const conflict = conflictIds.has(lesson.id);
                                    return (
                                        <td
                                            key={room}
                                            rowSpan={rowSpan}
                                            onClick={() => setActive(lesson)}
                                            className={`border p-2 align-top cursor-pointer ${
                                                conflict ? "ring-2 ring-red-600" : ""
                                            }`}
                                            style={{ background: teacherColors[lesson.teacher] }}
                                        >
                                            <div className="font-semibold">{lesson.sessionType}</div>
                                            <div>{lesson.teacher}</div>
                                            <div className="text-xs">
                                                {lesson.start_time} - {lesson.end_time}
                                            </div>
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

            {/* — Edit Modal — */}
            {active && (
                <EditModal
                    slot={active}
                    teachers={teachersList}
                    students={studentsList}
                    onClose={() => setActive(null)}
                    onSave={async updated => {
                        const ref = doc(db,"weekly_schedule",updated.id);
                        await updateDoc(ref, updated);
                        setSchedules(s => s.map(x => x.id===updated.id ? updated : x));
                        setActive(null);
                        setNotification("Schedule updated successfully");
                    }}
                    onDelete={async id => {
                        if (!window.confirm("Are you sure you want to delete this schedule slot?")) return;
                        await deleteDoc(doc(db,"weekly_schedule",id));
                        setSchedules(s => s.filter(x => x.id!==id));
                        setActive(null);
                        setNotification("Schedule deleted successfully");
                    }}
                />
            )}

            {/* — Add Modal — */}
            {adding && (
                <AddModal
                    defaultDay={day}
                    teachers={teachersList}
                    students={studentsList}
                    onClose={() => setAdding(false)}
                    onSave={async slot => {
                        const ref = await addDoc(collection(db,"weekly_schedule"), slot);
                        setSchedules(s => [...s, { ...slot, id: ref.id }]);
                        setAdding(false);
                        setNotification("Schedule added successfully");
                    }}
                />
            )}
        </div>
    );
}




// ——— AddModal — chip-picker + post-click validation ————————————

export function AddModal({ defaultDay, teachers, students, onClose, onSave }) {
    const [slot, setSlot] = useState({
        day: defaultDay,
        room: ROOMS[0],
        sessionType: "Group",          // will be overwritten by effect
        start_time: "",
        end_time: "",
        teacher: "",
        students: []
    });

    // flag to decide when to show the red banner
    const [showError, setShowError] = useState(false);

    // ── derive sessionType from # students ─────────────────────────────
    useEffect(() => {
        setSlot(s => ({
            ...s,
            sessionType: s.students.length > 1 ? "Group" : "Private"
        }));
    }, [slot.students]);

    // ── helpers ────────────────────────────────────────────────────────
    const isValid = Boolean(
        slot.teacher &&
        slot.room &&
        slot.start_time &&
        slot.end_time &&
        slot.students.length > 0
    );

    const handlePick = e => {
        const id = e.target.value;
        if (!id) return;
        setSlot(s => ({
            ...s,
            students: s.students.includes(id) ? s.students : [...s.students, id]
        }));
        e.target.value = "";
        // if user just fixed the form, hide banner
        if (showError) setShowError(false);
    };

    const removeStudent = id => {
        setSlot(s => ({
            ...s,
            students: s.students.filter(x => x !== id)
        }));
        if (showError) setShowError(false);
    };

    const handleSave = () => {
        if (!isValid) {
            setShowError(true);
            return;
        }
        onSave(slot);
    };

    // ── ui ─────────────────────────────────────────────────────────────
    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-lg space-y-4 relative shadow-lg">
                {/* close */}
                <button
                    onClick={onClose}
                    className="absolute top-2 right-2 text-gray-500 hover:text-black"
                >
                    ✕
                </button>

                <h2 className="text-xl font-semibold">Add Schedule Slot</h2>

                {/* grid of inputs */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                    {/* Day */}
                    <label>
                        Day
                        <select
                            value={slot.day}
                            onChange={e => setSlot(s => ({ ...s, day: e.target.value }))}
                            className="mt-1 border rounded p-2 w-full bg-white"
                        >
                            {DAYS.map(d => (
                                <option key={d} value={d}>{d}</option>
                            ))}
                        </select>
                    </label>

                    {/* Teacher */}
                    <label>
                        Teacher
                        <select
                            value={slot.teacher}
                            onChange={e => setSlot(s => ({ ...s, teacher: e.target.value }))}
                            className="mt-1 border rounded p-2 w-full bg-white"
                        >
                            <option value="">— select —</option>
                            {teachers.map(t => (
                                <option key={t.id} value={t.name}>{t.name}</option>
                            ))}
                        </select>
                    </label>

                    {/* Room */}
                    <label>
                        Room
                        <select
                            value={slot.room}
                            onChange={e => setSlot(s => ({ ...s, room: e.target.value }))}
                            className="mt-1 border rounded p-2 w-full bg-white"
                        >
                            {ROOMS.map(r => (
                                <option key={r} value={r}>{r}</option>
                            ))}
                        </select>
                    </label>

                    {/* Start & End */}
                    <label>
                        Start
                        <input
                            type="time"
                            value={slot.start_time}
                            onChange={e => setSlot(s => ({ ...s, start_time: e.target.value }))}
                            className="mt-1 border rounded p-2 w-full"
                        />
                    </label>
                    <label>
                        End
                        <input
                            type="time"
                            value={slot.end_time}
                            onChange={e => setSlot(s => ({ ...s, end_time: e.target.value }))}
                            className="mt-1 border rounded p-2 w-full"
                        />
                    </label>
                </div>

                {/* computed session type */}
                <div className="text-sm">
                    <span className="font-medium">Session Type:</span> {slot.sessionType}
                </div>

                {/* students chips + picker */}
                <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                        {slot.students.map(id => {
                            const st = students.find(x => x.id === id);
                            return (
                                <span
                                    key={id}
                                    className="flex items-center bg-gray-200 px-2 py-1 rounded-full text-xs"
                                >
                  {st?.name || id}
                                    <button
                                        onClick={() => removeStudent(id)}
                                        className="ml-1 text-gray-500 hover:text-black"
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
                            {students.map(st => (
                                <option key={st.id} value={st.id}>{st.name}</option>
                            ))}
                        </select>
                    </label>
                </div>

                {/* validation banner (only after failed attempt) */}
                {showError && (
                    <div className="text-red-600 text-sm">
                        All fields are required, and at least one student must be added.
                    </div>
                )}

                {/* actions */}
                <div className="flex justify-end gap-2">
                    <SoftActionButton label="Cancel" color="gray" onClick={onClose} />
                    <SoftActionButton
                        label="Save"
                        color="green"
                        onClick={handleSave}
                    />
                </div>
            </div>
        </div>
    );
}

// ——— EditModal — post-click validation banner ———————————————

export function EditModal({ slot, teachers, students, onClose, onSave, onDelete }) {
    const [s, setS] = useState({ ...slot });
    const [showError, setShowError] = useState(false);   // banner flag

    /* 1. Re-compute sessionType whenever the student list changes */
    useEffect(() => {
        setS(prev => ({
            ...prev,
            sessionType: prev.students.length > 1 ? "Group" : "Private"
        }));
    }, [s.students]);

    /* 2. Helper: true when form is complete */
    const isValid = Boolean(
        s.teacher &&
        s.room &&
        s.start_time &&
        s.end_time &&
        s.students.length > 0
    );

    /* 3. Called when user clicks Save */
    const handleSave = () => {
        if (!isValid) {
            setShowError(true);
            return;
        }
        onSave(s);
    };

    /* 4. When user edits anything, hide banner if form is now valid */
    const updateField = updater => {
        setS(curr => {
            const next = typeof updater === "function" ? updater(curr) : updater;
            if (showError && isValid) setShowError(false);
            return next;
        });
    };

    /* 5. Student picker & chip helpers */
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

    // ──────────────────────────────────────────────────────────────────
    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-lg space-y-4 relative shadow-lg">
                {/* ── Header ── */}
                <button
                    onClick={onClose}
                    className="absolute top-2 right-2 text-gray-500 hover:text-black"
                >
                    ✕
                </button>
                <h2 className="text-xl font-semibold">Edit Schedule Slot</h2>

                {/* ── Form grid ── */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                    {/* Teacher */}
                    <label>
                        Teacher
                        <select
                            value={s.teacher}
                            onChange={e => updateField({ ...s, teacher: e.target.value })}
                            className="mt-1 border rounded p-2 w-full bg-white"
                        >
                            <option value="">— select —</option>
                            {teachers.map(t => (
                                <option key={t.id} value={t.name}>{t.name}</option>
                            ))}
                        </select>
                    </label>

                    {/* Room */}
                    <label>
                        Room
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

                    {/* Start */}
                    <label>
                        Start
                        <input
                            type="time"
                            value={s.start_time}
                            onChange={e => updateField({ ...s, start_time: e.target.value })}
                            className="mt-1 border rounded p-2 w-full"
                        />
                    </label>

                    {/* End */}
                    <label>
                        End
                        <input
                            type="time"
                            value={s.end_time}
                            onChange={e => updateField({ ...s, end_time: e.target.value })}
                            className="mt-1 border rounded p-2 w-full"
                        />
                    </label>

                    {/* Day */}
                    <label>
                        Day
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

                {/* ── Derived session type ── */}
                <div className="text-sm">
                    <span className="font-medium">Session Type:</span> {s.sessionType}
                </div>

                {/* ── Student chips + picker ── */}
                <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                        {s.students.map(id => {
                            const st = students.find(x => x.id === id);
                            return (
                                <span
                                    key={id}
                                    className="flex items-center bg-gray-200 px-2 py-1 rounded-full text-xs"
                                >
                  {st?.name || id}
                                    <button
                                        onClick={() => removeStudent(id)}
                                        className="ml-1 text-gray-500 hover:text-black"
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
                            {students.map(stu => (
                                <option key={stu.id} value={stu.id}>{stu.name}</option>
                            ))}
                        </select>
                    </label>
                </div>

                {/* ── Validation banner (after failed save) ── */}
                {showError && (
                    <div className="text-red-600 text-sm">
                        All fields are required, and at least one student must be added.
                    </div>
                )}

                {/* ── Actions ── */}
                <div className="flex justify-between pt-4">
                    <SoftActionButton
                        label="Delete"
                        color="red"
                        onClick={() => onDelete(s.id)}
                    />
                    <div className="flex gap-2">
                        <SoftActionButton label="Cancel" color="gray" onClick={onClose} />
                        <SoftActionButton
                            label="Save"
                            color="green"
                            onClick={handleSave}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
