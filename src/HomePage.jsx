import React, { useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { db } from './firebase';
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

// Days and hours (1 PM -> 8 PM = 13–20)
const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const HOURS_RANGE = [13, 14, 15, 16, 17, 18, 19, 20];

// Helper to parse "HH:MM" => hour (number)
function parseHour(timeStr) {
    if (!timeStr) return 0;
    const [hourStr] = timeStr.split(":");
    return parseInt(hourStr, 10) || 0;
}

// Get current weekday name in "Monday" format
function getCurrentDay() {
    const options = { weekday: 'long' };
    return new Date().toLocaleString('en-US', options); // e.g. "Monday"
}

const HomePage = () => {
    const [teacherId, setTeacherId] = useState(null);
    const [weeklySchedules, setWeeklySchedules] = useState([]);
    const [isTodayView, setIsTodayView] = useState(true);

    // We already had notes-related states
    const [notes, setNotes] = useState([]);
    const [newNote, setNewNote] = useState("");
    const [noteDate, setNoteDate] = useState("");
    const [selectedStudent, setSelectedStudent] = useState("");

    // This used to store the teacher's assigned students
    const [students, setStudents] = useState([]);

    // NEW: We'll store **all** students here:
    const [allStudents, setAllStudents] = useState([]);

    // Toggle note form
    const [showNoteForm, setShowNoteForm] = useState(false);

    // For showing which students are in the clicked lesson
    const [selectedLessonStudents, setSelectedLessonStudents] = useState([]);
    const [showStudentList, setShowStudentList] = useState(false);

    const auth = getAuth();

    useEffect(() => {
        const fetchData = async (user) => {
            try {
                // 1) Grab teacher doc by email
                const teachersSnap = await getDocs(
                    query(collection(db, "teachers"), where("email", "==", user.email))
                );
                if (teachersSnap.empty) {
                    console.error("No teacher found for this email.");
                    return;
                }
                const teacherDoc = teachersSnap.docs[0];
                const teacherDocId = teacherDoc.id;
                setTeacherId(teacherDocId);

                // 2) Fetch weekly schedule (today vs full week)
                if (isTodayView) {
                    const today = getCurrentDay();
                    const scheduleQ = query(
                        collection(db, "weekly_schedule"),
                        where("teacher_id", "==", teacherDocId),
                        where("day_of_week", "==", today)
                    );
                    const scheduleSnap = await getDocs(scheduleQ);
                    const scheduleData = scheduleSnap.docs.map(d => ({ id: d.id, ...d.data() }));
                    setWeeklySchedules(scheduleData);
                } else {
                    const fullQ = query(
                        collection(db, "weekly_schedule"),
                        where("teacher_id", "==", teacherDocId)
                    );
                    const fullSnap = await getDocs(fullQ);
                    const fullData = fullSnap.docs.map(d => ({ id: d.id, ...d.data() }));
                    setWeeklySchedules(fullData);
                }

                // 3) Fetch notes
                const notesQ = query(collection(db, "notes"), where("teacher_id", "==", teacherDocId));
                const notesSnap = await getDocs(notesQ);
                const notesList = notesSnap.docs.map(n => ({ id: n.id, ...n.data() }));
                setNotes(notesList);

                // 4) Fetch all students from 'students' collection
                const allStudentsSnap = await getDocs(collection(db, "students"));
                // Store everything in allStudents
                const everyStudent = allStudentsSnap.docs.map(s => ({
                    id: s.id,
                    name: s.data().name,
                    // add more fields if needed
                }));
                setAllStudents(everyStudent);

                // If you still want the teacher's assigned subset:
                const teacherData = teacherDoc.data();
                const assignedStudentIds = teacherData.assigned_students || [];
                const assigned = everyStudent.filter((stu) =>
                    assignedStudentIds.includes(stu.id)
                );
                setStudents(assigned);

            } catch (error) {
                console.error("Error fetching teacher data:", error);
            }
        };

        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                fetchData(user);
            }
        });

        return () => unsubscribe();
    }, [auth, isTodayView]);

    /*
      Handler to show which students are in this lesson.
      Instead of filtering the teacher's 'students' list,
      we'll filter 'allStudents' so we see everyone in student_ids.
    */
    const handleLessonClick = (slot) => {
        if (!slot.student_ids || slot.student_ids.length === 0) {
            setSelectedLessonStudents([]);
            setShowStudentList(false);
            return;
        }
        const matchedStudents = allStudents.filter((stu) =>
            slot.student_ids.includes(stu.id)
        );

        setSelectedLessonStudents(matchedStudents);
        setShowStudentList(true);
    };

    // Add note
    const handleAddNote = async () => {
        if (!newNote.trim() || !noteDate || !teacherId) {
            console.error("Missing note text, date, or teacher ID.");
            return;
        }

        try {
            const newNoteObj = {
                content: newNote,
                date: noteDate,
                teacher_id: teacherId,
                created_at: Timestamp.now(),
            };
            if (selectedStudent) {
                // Use teacher's assigned if you prefer. This part's unchanged
                const studentMatch = students.find(s => s.id === selectedStudent);
                newNoteObj.student_id = selectedStudent;
                newNoteObj.student_name = studentMatch ? studentMatch.name : "";
            }
            const docRef = await addDoc(collection(db, "notes"), newNoteObj);
            setNotes(prev => [...prev, { id: docRef.id, ...newNoteObj }]);

            // Reset
            setNewNote("");
            setNoteDate("");
            setSelectedStudent("");
            setShowNoteForm(false);
        } catch (error) {
            console.error("Error adding note:", error);
        }
    };

    // Delete note
    const handleDeleteNote = async (noteId) => {
        try {
            await deleteDoc(doc(db, "notes", noteId));
            setNotes(prev => prev.filter(n => n.id !== noteId));
        } catch (error) {
            console.error("Error deleting note:", error);
        }
    };

    return (
        <div className="p-6">
            <div className="flex gap-4">
                {/* LEFT COLUMN: SCHEDULE */}
                <div className="flex-1">
                    {/* Toggle Buttons */}
                    <div className="flex space-x-3 mb-4">
                        <button
                            className={
                                isTodayView
                                    ? "bg-blue-500 text-white px-4 py-2 rounded"
                                    : "bg-gray-200 px-4 py-2 rounded"
                            }
                            onClick={() => setIsTodayView(true)}
                        >
                            Today's Schedule
                        </button>
                        <button
                            className={
                                !isTodayView
                                    ? "bg-blue-500 text-white px-4 py-2 rounded"
                                    : "bg-gray-200 px-4 py-2 rounded"
                            }
                            onClick={() => setIsTodayView(false)}
                        >
                            Full Week
                        </button>
                    </div>

                    {/* SCHEDULE CARD */}
                    <div className="bg-white p-4 shadow rounded">
                        {isTodayView ? (
                            <>
                                <h2 className="text-2xl font-extrabold mb-4 text-blue-700">Today's Schedule</h2>

                                {weeklySchedules.length === 0 ? (
                                    <p className="text-gray-600">No schedules found.</p>
                                ) : (
                                    weeklySchedules.map(slot => (
                                        <div
                                            key={slot.id}
                                            className="bg-blue-50 p-3 rounded-lg mb-2 shadow-sm cursor-pointer"
                                            onClick={() => handleLessonClick(slot)}
                                        >
                      <span className="text-black font-semibold">
                        {slot.subject}
                      </span>
                                            <span className="ml-2 text-black">
                        ({slot.start_time} - {slot.end_time})
                      </span>
                                            <span className="ml-2 text-black">
                        {slot.class_type}
                      </span>
                                        </div>
                                    ))
                                )}
                            </>
                        ) : (
                            // FULL WEEK GRID
                            <>
                                <h2 className="text-2xl font-bold mb-4 text-blue-800">Weekly Schedule</h2>
                                <div className="overflow-auto">
                                    <table className="table-fixed w-full border-collapse text-sm">
                                        <thead>
                                        <tr>
                                            <th className="border px-2 py-1 bg-gray-200 w-16">
                                                Time / Day
                                            </th>
                                            {DAYS_OF_WEEK.map(day => (
                                                <th
                                                    key={day}
                                                    className="border px-2 py-1 bg-gray-200"
                                                >
                                                    {day}
                                                </th>
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
                                                        <td
                                                            key={day}
                                                            className="border px-2 py-1 text-center align-top h-12"
                                                        >
                                                            {slot ? (
                                                                <div
                                                                    className="bg-blue-100 p-2 rounded cursor-pointer"
                                                                    onClick={() => handleLessonClick(slot)}
                                                                >
                                                                    <div className="font-bold">
                                                                        {slot.subject}
                                                                    </div>
                                                                    <div className="text-xs">
                                                                        {slot.class_type}
                                                                    </div>
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

                    {/* If showStudentList is true, display the students in that lesson */}
                    {showStudentList && (
                        <div className="mt-4 bg-white p-4 shadow rounded">
                            <h3 className="text-lg font-bold text-blue-700 mb-2">
                                Students in this Lesson:
                            </h3>
                            {selectedLessonStudents.length === 0 ? (
                                <p className="text-gray-600">No students found for this lesson.</p>
                            ) : (
                                <ul className="list-disc list-inside text-sm">
                                    {selectedLessonStudents.map((stu) => (
                                        <li key={stu.id}>
                                            {stu.name}
                                        </li>
                                    ))}
                                </ul>
                            )}
                            <button
                                onClick={() => setShowStudentList(false)}
                                className="mt-2 bg-gray-200 text-gray-700 px-3 py-1 rounded"
                            >
                                Close
                            </button>
                        </div>
                    )}
                </div>

                {/* RIGHT COLUMN: NOTES */}
                <div className="w-1/3">
                    <div className="bg-white p-4 shadow rounded">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-2xl font-bold text-blue-800">Keep in Mind</h2>
                            {!showNoteForm && (
                                <button
                                    onClick={() => setShowNoteForm(true)}
                                    className="text-xs bg-blue-500 text-white px-2 py-1 rounded"
                                >
                                    + Note
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
                                    <option value="">Select Student (optional)</option>
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
                                    placeholder="Write your note here..."
                                    value={newNote}
                                    onChange={(e) => setNewNote(e.target.value)}
                                    className="border border-gray-300 rounded px-3 py-2"
                                />

                                <div className="flex space-x-2">
                                    <button
                                        onClick={handleAddNote}
                                        className="bg-blue-500 text-white px-3 py-2 rounded"
                                    >
                                        Save
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
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Note List */}
                    <div className="mt-4 space-y-2">
                        {notes.map(note => (
                            <div
                                key={note.id}
                                className="bg-white p-2 shadow rounded flex justify-between items-center text-sm"
                            >
                                <div>
                                    <p className="font-bold text-blue-800">
                                        {note.student_name || note.student_id || "No Student Linked"}
                                    </p>
                                    <p className="text-gray-600">Date: {note.date}</p>
                                    <p>{note.content}</p>
                                </div>
                                <button
                                    onClick={() => handleDeleteNote(note.id)}
                                    className="text-red-500 ml-2"
                                >
                                    Delete
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HomePage;
