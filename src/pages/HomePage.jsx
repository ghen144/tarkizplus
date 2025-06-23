import React, { useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { db } from '@/firebase/firebase.jsx';
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  query,
  where,
  Timestamp,
  updateDoc,
  getDoc,
} from "firebase/firestore";
import { useTranslation } from 'react-i18next';

const RAW_DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const HOURS_RANGE = [13, 14, 15, 16, 17, 18, 19, 20];

const SESSION_ICONS = {
  Group: "👥",
  Private: "👤",
};

function parseHour(timeStr) {
  if (!timeStr) return 0;
  const [hourStr] = timeStr.split(":");
  return parseInt(hourStr, 10) || 0;
}

function getTodayIndex() {
  // Returns 0-6, Sunday-Saturday (matching your array)
  return new Date().getDay();
}

function NotesPanel({
                      notes,
                      setNotes,
                      students,
                      t,
                      handleAddNote,
                      handleDeleteNote,
                      showNoteForm,
                      setShowNoteForm,
                      selectedStudent,
                      setSelectedStudent,
                      noteDate,
                      setNoteDate,
                      newNote,
                      setNewNote,
                      collapsed,
                      setCollapsed,
                    }) {
  const sortedNotes = [...notes].sort((a, b) => (b.pinned || 0) - (a.pinned || 0));
  const handlePinNote = async (noteId) => {
    const noteRef = doc(db, "notes", noteId);
    const noteDoc = await getDoc(noteRef);
    if (!noteDoc.exists()) return;
    await updateDoc(noteRef, { pinned: !noteDoc.data().pinned });
    setNotes((notes) =>
        notes.map((n) => (n.id === noteId ? { ...n, pinned: !n.pinned } : n))
    );
  };

  return (
      <div
          className={`
        relative transition-all duration-300 shadow-2xl rounded-2xl
        ${collapsed
              ? "w-14 min-w-[56px] px-0 py-4 bg-gradient-to-b from-blue-200 to-blue-50"
              : "w-80 px-6 py-6 bg-blue-100"}
        h-[560px] flex flex-col
      `}
          style={{ minHeight: collapsed ? "56px" : "560px" }}
      >
        {/* Expand/collapse button & fab */}
        {collapsed ? (
            <button
                onClick={() => setCollapsed(false)}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group focus:outline-none"
                title={t("Expand Notes")}
            >
              <span className="text-2xl text-blue-600 font-extrabold group-hover:scale-125 transition">{'»'}</span>
              <span className="mt-2 text-[16px] font-bold text-blue-700 tracking-wide group-hover:scale-110 transition">your notes</span>
              <span className="sr-only">{t("Expand Notes")}</span>
            </button>
        ) : (
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-extrabold text-blue-800 drop-shadow-sm">{t("keep_in_mind")}</h2>
              <div className="flex items-center gap-2">
                {!showNoteForm && (
                    <button
                        onClick={() => setShowNoteForm(true)}
                        className="text-xs rounded-full w-9 h-9 bg-blue-500 text-white flex items-center justify-center font-bold shadow hover:scale-105 hover:bg-blue-600 transition"
                        title={t("Add note")}
                    >
                      +
                    </button>
                )}
                <button
                    onClick={() => setCollapsed(true)}
                    className="text-blue-500 hover:text-blue-700 text-2xl font-bold ml-2"
                    title={t("Collapse Notes")}
                >
                  {'«'}
                </button>
              </div>
            </div>
        )}
        {/* Notes form and list */}
        {!collapsed && (
            <>
              {showNoteForm && (
                  <div className="flex flex-col space-y-3 mb-4 text-sm animate-fadeIn">
                    <select
                        value={selectedStudent}
                        onChange={(e) => setSelectedStudent(e.target.value)}
                        className="border border-gray-300 rounded px-3 py-2"
                    >
                      <option value="">{t('select_student_optional')}</option>
                      {students.map((s) => (
                          <option key={s.id} value={s.id}>{s.name}</option>
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
                      <button onClick={handleAddNote} className="bg-blue-500 text-white px-3 py-2 rounded shadow hover:bg-blue-600 transition">
                        {t('save')}
                      </button>
                      <button
                          onClick={() => {
                            setNewNote("");
                            setNoteDate("");
                            setSelectedStudent("");
                            setShowNoteForm(false);
                          }}
                          className="bg-gray-200 text-gray-700 px-3 py-2 rounded hover:bg-gray-300 transition"
                      >
                        {t('cancel')}
                      </button>
                    </div>
                  </div>
              )}
              <div className="space-y-2 overflow-auto flex-1 pr-1">
                {sortedNotes.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 mt-8 animate-fadeIn">
                      <span className="text-4xl mb-2">📝</span>
                      <span>{t("no_notes")}</span>
                    </div>
                )}
                {sortedNotes.map(note => (
                    <div
                        key={note.id}
                        className={`relative bg-white p-3 shadow rounded-2xl flex justify-between items-center text-sm border-l-4
                  transition hover:scale-[1.02] hover:shadow-lg
                  ${note.pinned ? "border-yellow-400 bg-yellow-50" : "border-transparent"}
                `}
                        style={{ minHeight: "64px" }}
                    >
                      <div>
                        <p className="font-bold text-blue-800 flex items-center gap-2">
                          {note.student_name || t("no_student_linked")}
                          {note.pinned && (
                              <span title="Pinned" className="text-yellow-400 text-xl animate-bounce">📌</span>
                          )}
                        </p>
                        <p className="text-gray-600">{t("date")}: {note.date}</p>
                        <p className="text-[15px]">{note.content}</p>
                      </div>
                      <div className="flex flex-col gap-2 items-end">
                        <button
                            onClick={() => handlePinNote(note.id)}
                            className={`text-yellow-400 hover:text-yellow-600 text-lg mb-1 transition ${note.pinned ? "font-bold" : ""}`}
                            title={note.pinned ? t("Unpin") : t("Pin")}
                        >
                          📌
                        </button>
                        <button
                            onClick={() => handleDeleteNote(note.id)}
                            className="text-red-500 hover:text-red-700 transition"
                        >
                          {t('delete')}
                        </button>
                      </div>
                    </div>
                ))}
              </div>
            </>
        )}
      </div>
  );
}

const HomePage = () => {
  const { t } = useTranslation();
  const [teacherId, setTeacherId] = useState(null);
  const [weeklySchedules, setWeeklySchedules] = useState([]);
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState("");
  const [noteDate, setNoteDate] = useState("");
  const [selectedStudent, setSelectedStudent] = useState("");
  const [students, setStudents] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [selectedLessonStudents, setSelectedLessonStudents] = useState([]);
  const [showStudentList, setShowStudentList] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [notesCollapsed, setNotesCollapsed] = useState(false);

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
        const teacherDocName = teacherDoc.data().name;
        setTeacherId(teacherDocId);

        const scheduleQuery = query(
            collection(db, "weekly_schedule"),
            where("teacher", "==", teacherDocName)
        );
        const scheduleSnap = await getDocs(scheduleQuery);
        setWeeklySchedules(scheduleSnap.docs.map(d => ({ id: d.id, ...d.data() })));

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
  }, [auth]);

  const handleShowStudents = (slot) => {
    const matched = allStudents.filter((stu) =>
        slot.students?.includes(stu.id)
    );
    setSelectedLessonStudents(matched);
    setSelectedSlot(slot);
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

  // Highlight today's column
  const todayIndex = getTodayIndex();

  return (
      <div className="flex flex-row w-full min-h-screen bg-gradient-to-tr from-blue-50 via-white to-blue-100 p-8 gap-6 font-sans">
        {/* Main schedule area */}
        <div className={`flex-1 transition-all duration-300 ${notesCollapsed ? "mr-24" : "mr-0"}`}>
          {/* Legend */}
          <div className="flex items-center gap-6 mb-4 ml-2">
            <div className="flex items-center gap-1 text-blue-900">
              <span className="text-xl">{SESSION_ICONS.Group}</span>
              <span className="bg-blue-100 px-3 py-1 rounded-lg text-sm font-semibold drop-shadow-sm">Group</span>
            </div>
            <div className="flex items-center gap-1 text-green-900">
              <span className="text-xl">{SESSION_ICONS.Private}</span>
              <span className="bg-green-100 px-3 py-1 rounded-lg text-sm font-semibold drop-shadow-sm">Private</span>
            </div>
          </div>
          {/* Schedule */}
          <div className="bg-white p-6 shadow-2xl rounded-2xl border border-blue-100">
            <h2 className="text-2xl font-bold text-blue-700 mb-4 drop-shadow-sm">🗓️ {t('weekly_schedule')}</h2>
            <div className="overflow-auto">
              <table className="table-fixed w-full border-collapse text-base">
                <thead>
                <tr>
                  <th className="border px-2 py-1 bg-gray-100 w-16 font-bold text-blue-800">{t("time_day")}</th>
                  {RAW_DAYS_OF_WEEK.map((day, i) => (
                      <th
                          key={day}
                          className={`border px-2 py-1 font-bold ${i === todayIndex ? "bg-blue-50 text-blue-900" : "bg-gray-100"} transition`}
                      >
                        {t(day)}
                      </th>
                  ))}
                </tr>
                </thead>
                <tbody>
                {HOURS_RANGE.map(hour => (
                    <tr key={hour}>
                      <td className="border px-2 py-1 font-semibold text-center align-middle h-14 w-16 bg-gray-50">
                        {hour}:00
                      </td>
                      {RAW_DAYS_OF_WEEK.map((day, i) => {
                        const slot = weeklySchedules.find(sch => {
                          if (sch.day !== day) return false;
                          const start = parseHour(sch.start_time);
                          const end = parseHour(sch.end_time);
                          return hour >= start && hour < end;
                        });
                        return (
                            <td
                                key={day}
                                className={`border px-2 py-1 text-center align-top h-14 transition
                            ${i === todayIndex ? "bg-blue-50" : ""}
                          `}
                            >
                              {slot ? (
                                  <div
                                      className={`
                                flex items-center justify-center gap-2 p-2 rounded-xl cursor-pointer
                                font-semibold shadow hover:shadow-lg hover:scale-105 transition
                                ${slot.sessionType === "Group" ? "bg-blue-100 text-blue-900 hover:bg-blue-200" : ""}
                                ${slot.sessionType === "Private" ? "bg-green-100 text-green-900 hover:bg-green-200" : ""}
                              `}
                                      onClick={() => handleShowStudents(slot)}
                                      title={
                                          t(slot.subject) +
                                          "\n" +
                                          t(slot.sessionType) +
                                          "\n" +
                                          (slot.students && slot.students.length > 0
                                              ? slot.students
                                                  .map(id => allStudents.find(s => s.id === id)?.name || "")
                                                  .join(", ")
                                              : t("No students assigned"))
                                      }
                                  >
                                    <span className="text-lg">{SESSION_ICONS[slot.sessionType] || "📚"}</span>
                                    <div>
                                      <div className="font-bold">{t(slot.subject)}</div>
                                      <div className="text-xs">{t(slot.sessionType)}</div>
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

              {/* Student Details Modal */}
              {showStudentList && selectedSlot && (
                  <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/30 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-lg relative border border-blue-100 animate-slideIn">
                      <button
                          onClick={() => setShowStudentList(false)}
                          className="absolute top-3 right-4 text-gray-400 hover:text-gray-700 text-2xl font-bold"
                          aria-label="Close"
                      >
                        ×
                      </button>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">{SESSION_ICONS[selectedSlot.sessionType] || "📚"}</span>
                        <span className="text-lg font-bold">{t(selectedSlot.subject)}</span>
                        <span className="text-base font-medium text-blue-600 ml-1">({t(selectedSlot.sessionType)})</span>
                      </div>
                      <div className="flex flex-col gap-1 mb-2">
                    <span>
                      <strong>{t("Time")}:</strong>{" "}
                      <span className="font-mono">{selectedSlot.start_time} - {selectedSlot.end_time}</span>
                    </span>
                        <span>
                      <strong>{t("Room")}:</strong>{" "}
                          <span>{selectedSlot.room || <span className="text-gray-400 italic">{t("N/A")}</span>}</span>
                    </span>
                    {/*    <span>*/}
                    {/*  <strong>{t("Teacher")}:</strong>{" "}*/}
                    {/*      <span>{selectedSlot.teacher || <span className="text-gray-400 italic">{t("N/A")}</span>}</span>*/}
                    {/*</span>*/}
                        <span>
                      <strong>{t("Student count")}:</strong>{" "}
                          <span>{selectedLessonStudents.length}</span>
                    </span>
                      </div>
                      <div className="mt-4">
                        <strong className="block mb-1 text-gray-700">{t("Students in this lesson")}:</strong>
                        {selectedLessonStudents.length > 0 ? (
                            <ul className="pl-4 list-disc space-y-1 text-base text-gray-900">
                              {selectedLessonStudents.map(s => (
                                  <li key={s.id}>
                                    <span className="font-medium">{s.name}</span>
                                  </li>
                              ))}
                            </ul>
                        ) : (
                            <p className="text-gray-400 italic">{t("No students assigned")}</p>
                        )}
                      </div>
                    </div>
                  </div>
              )}
            </div>
          </div>
        </div>
        {/* Notes panel, always at the right side, collapsible */}
        <div className="flex flex-col items-end">
          <NotesPanel
              notes={notes}
              setNotes={setNotes}
              students={students}
              t={t}
              handleAddNote={handleAddNote}
              handleDeleteNote={handleDeleteNote}
              showNoteForm={showNoteForm}
              setShowNoteForm={setShowNoteForm}
              selectedStudent={selectedStudent}
              setSelectedStudent={setSelectedStudent}
              noteDate={noteDate}
              setNoteDate={setNoteDate}
              newNote={newNote}
              setNewNote={setNewNote}
              collapsed={notesCollapsed}
              setCollapsed={setNotesCollapsed}
          />
        </div>
      </div>
  );
};

export default HomePage;
