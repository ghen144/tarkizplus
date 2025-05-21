import React, { useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { db } from '@/firebase/firebase.jsx';
import {
    collection,
    getDocs,
    query,
    where,
    addDoc,
    deleteDoc,
    doc,
    Timestamp
} from "firebase/firestore";

import { useTranslation } from 'react-i18next';

const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const HOURS_RANGE = [13, 14, 15, 16, 17, 18, 19, 20];

function parseHour(timeStr) {
    if (!timeStr) return 0;
    const [hourStr] = timeStr.split(":");
    return parseInt(hourStr, 10) || 0;
}

function getCurrentDay() {
    const options = { weekday: 'long' };
    return new Date().toLocaleString('en-US', options);
}

const HomePage = () => {
    const { t } = useTranslation();

    const [teacherId, setTeacherId] = useState(null);
    const [weeklySchedules, setWeeklySchedules] = useState([]);
    const [isTodayView, setIsTodayView] = useState(true);
    const [notes, setNotes] = useState([]);
    const [newNote, setNewNote] = useState("");
    const [noteDate, setNoteDate] = useState("");
    const [selectedStudent, setSelectedStudent] = useState("");
    const [students, setStudents] = useState([]);
    const [allStudents, setAllStudents] = useState([]);
    const [showNoteForm, setShowNoteForm] = useState(false);
    const [selectedLessonStudents, setSelectedLessonStudents] = useState([]);
    const [showStudentList, setShowStudentList] = useState(false);

    const auth = getAuth();

    useEffect(() => {
        const fetchData = async (user) => {
            try {
                const teachersSnap = await getDocs(
                    query(collection(db, "teachers"), where("email", "==", user.email))
                );
                if (teachersSnap.empty) return;
                const teacherDoc = teachersSnap.docs[0];
                const teacherDocId = teacherDoc.id;
                setTeacherId(teacherDocId);

                const scheduleQuery = isTodayView
                    ? query(
                          collection(db, "weekly_schedule"),
                          where("teacher_id", "==", teacherDocId),
                          where("day_of_week", "==", getCurrentDay())
                      )
                    : query(
                          collection(db, "weekly_schedule"),
                          where("teacher_id", "==", teacherDocId)
                      );

                const scheduleSnap = await getDocs(scheduleQuery);
                const scheduleData = scheduleSnap.docs.map(d => ({ id: d.id, ...d.data() }));
                setWeeklySchedules(scheduleData);

                const notesSnap = await getDocs(
                    query(collection(db, "notes"), where("teacher_id", "==", teacherDocId))
                );
                setNotes(notesSnap.docs.map(n => ({ id: n.id, ...n.data() })));

                const allStudentsSnap = await getDocs(collection(db, "students"));
                const everyStudent = allStudentsSnap.docs.map(s => ({
                    id: s.id,
                    name: s.data().name,
                }));
                setAllStudents(everyStudent);

                const assignedIds = teacherDoc.data().assigned_students || [];
                setStudents(everyStudent.filter(s => assignedIds.includes(s.id)));

            } catch (err) {
                console.error("Fetch error:", err);
            }
        };

        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) fetchData(user);
        });
        return () => unsubscribe();
    }, [auth, isTodayView]);

    const handleLessonClick = (slot) => {
        const matched = allStudents.filter((stu) =>
            slot.student_ids?.includes(stu.id)
        );
        setSelectedLessonStudents(matched);
        setShowStudentList(true);
    };

    const handleAddNote = async () => {
        if (!newNote.trim() || !noteDate || !teacherId) return;

        const note = {
            content: newNote,
            date: noteDate,
            teacher_id: teacherId,
            created_at: Timestamp.now(),
        };
        if (selectedStudent) {
            const match = students.find(s => s.id === selectedStudent);
            note.student_id = selectedStudent;
            note.student_name = match?.name || "";
        }
        const docRef = await addDoc(collection(db, "notes"), note);
        setNotes(prev => [...prev, { id: docRef.id, ...note }]);
        setNewNote("");
        setNoteDate("");
        setSelectedStudent("");
        setShowNoteForm(false);
    };

    const handleDeleteNote = async (noteId) => {
        await deleteDoc(doc(db, "notes", noteId));
        setNotes(prev => prev.filter(n => n.id !== noteId));
    };

    return (
        <div className="p-6">
            
            <div className="flex space-x-3 mb-4">
                <button
                    className={isTodayView ? "bg-blue-500 text-white px-4 py-2 rounded" : "bg-gray-200 px-4 py-2 rounded"}
                    onClick={() => setIsTodayView(true)}
                >
                    {t('today_schedule')}
                </button>
                <button
                    className={!isTodayView ? "bg-blue-500 text-white px-4 py-2 rounded" : "bg-gray-200 px-4 py-2 rounded"}
                    onClick={() => setIsTodayView(false)}
                >
                    {t('full_week')}
                </button>
            </div>

            <div className="bg-white p-4 shadow rounded">
                {isTodayView ? (
                    <>
                        <h2 className="text-2xl font-extrabold mb-4 text-blue-700">{t('today_schedule')}</h2>
                        {weeklySchedules.length === 0 ? (
                            <p className="text-gray-600">{t('no_schedules')}</p>
                        ) : (
                            weeklySchedules.map(slot => (
                                <div
                                    key={slot.id}
                                    className="bg-blue-50 p-3 rounded-lg mb-2 shadow-sm cursor-pointer"
                                    onClick={() => handleLessonClick(slot)}
                                >
                                    <span className="text-black font-semibold">{slot.subject}</span>
                                    <span className="ml-2 text-black">({slot.start_time} - {slot.end_time})</span>
                                    <span className="ml-2 text-black">{slot.class_type}</span>
                                </div>
                            ))
                        )}
                    </>
                ) : (
                    <>
                        <h2 className="text-2xl font-bold mb-4 text-blue-800">{t('weekly_schedule')}</h2>
                        <div className="overflow-auto">
                            <table className="table-fixed w-full border-collapse text-sm">
                                <thead>
                                    <tr>
                                        <th className="border px-2 py-1 bg-gray-200 w-16">Time / Day</th>
                                        {DAYS_OF_WEEK.map(day => (
                                            <th key={day} className="border px-2 py-1 bg-gray-200">{day}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {HOURS_RANGE.map(hour => (
                                        <tr key={hour}>
                                            <td className="border px-2 py-1 font-semibold text-center align-middle h-12 w-16">
                                                {hour}:00
                                            </td>
                                            {DAYS_OF_WEEK.map(day => {
                                                const slot = weeklySchedules.find(sch => {
                                                    if (sch.day_of_week !== day) return false;
                                                    const start = parseHour(sch.start_time);
                                                    const end = parseHour(sch.end_time);
                                                    return hour >= start && hour < end;
                                                });
                                                return (
                                                    <td key={day} className="border px-2 py-1 text-center align-top h-12">
                                                        {slot ? (
                                                            <div
                                                                className="bg-blue-100 p-2 rounded cursor-pointer"
                                                                onClick={() => handleLessonClick(slot)}
                                                            >
                                                                <div className="font-bold">{slot.subject}</div>
                                                                <div className="text-xs">{slot.class_type}</div>
                                                            </div>
                                                        ) : null}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>

            {showStudentList && (
                <div className="mt-4 bg-white p-4 shadow rounded">
                    <h3 className="text-lg font-bold text-blue-700 mb-2">{t('students_in_lesson')}</h3>
                    {selectedLessonStudents.length === 0 ? (
                        <p className="text-gray-600">{t('no_students_found')}</p>
                    ) : (
                        <ul className="list-disc list-inside text-sm">
                            {selectedLessonStudents.map((stu) => (
                                <li key={stu.id}>{stu.name}</li>
                            ))}
                        </ul>
                    )}
                    <button
                        onClick={() => setShowStudentList(false)}
                        className="mt-2 bg-gray-200 text-gray-700 px-3 py-1 rounded"
                    >
                        {t('close')}
                    </button>
                </div>
            )}

            {/* Notes Section */}
            <div className="w-1/3 mt-6">
                <div className="bg-white p-4 shadow rounded">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl font-bold text-blue-800">{t('keep_in_mind')}</h2>
                        {!showNoteForm && (
                            <button
                                onClick={() => setShowNoteForm(true)}
                                className="text-xs bg-blue-500 text-white px-2 py-1 rounded"
                            >
                                + {t('note')}
                            </button>
                        )}
                    </div>

                    {showNoteForm && (
                        <div className="flex flex-col space-y-3 mb-4 text-sm">
                            <select
                                value={selectedStudent}
                                onChange={(e) => setSelectedStudent(e.target.value)}
                                className="border border-gray-300 rounded px-3 py-2"
                            >
                                <option value="">{t('select_student_optional')}</option>
                                {students.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.name}
                                    </option>
                                ))}
                            </select>

                            <input
                                type="date"
                                value={noteDate}
                                onChange={(e) => setNoteDate(e.target.value)}
                                className="border border-gray-300 rounded px-3 py-2"
                            />

                            <input
                                type="text"
                                placeholder={t('write_note')}
                                value={newNote}
                                onChange={(e) => setNewNote(e.target.value)}
                                className="border border-gray-300 rounded px-3 py-2"
                            />

                            <div className="flex space-x-2">
                                <button
                                    onClick={handleAddNote}
                                    className="bg-blue-500 text-white px-3 py-2 rounded"
                                >
                                    {t('save')}
                                </button>
                                <button
                                    onClick={() => {
                                        setNewNote("");
                                        setNoteDate("");
                                        setSelectedStudent("");
                                        setShowNoteForm(false);
                                    }}
                                    className="bg-gray-200 text-gray-700 px-3 py-2 rounded"
                                >
                                    {t('cancel')}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="mt-4 space-y-2">
                    {notes.map(note => (
                        <div
                            key={note.id}
                            className="bg-white p-2 shadow rounded flex justify-between items-center text-sm"
                        >
                            <div>
                                <p className="font-bold text-blue-800">
                                    {note.student_name || note.student_id || t('no_student_linked')}
                                </p>
                                <p className="text-gray-600">{t('date')}: {note.date}</p>
                                <p>{note.content}</p>
                            </div>
                            <button
                                onClick={() => handleDeleteNote(note.id)}
                                className="text-red-500 ml-2"
                            >
                                {t('delete')}
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default HomePage;
