// HomePage.jsx - جدول أسبوعي فقط مع باقي الميزات
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
  Timestamp
} from "firebase/firestore";
import { useTranslation } from 'react-i18next';

const RAW_DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const HOURS_RANGE = [13, 14, 15, 16, 17, 18, 19, 20];

function parseHour(timeStr) {
  if (!timeStr) return 0;
  const [hourStr] = timeStr.split(":");
  return parseInt(hourStr, 10) || 0;
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
  const [absentStudentIds, setAbsentStudentIds] = useState([]);
  const [lessonNotes, setLessonNotes] = useState("");
  const [progressEvaluation, setProgressEvaluation] = useState("");
  const [showModal, setShowModal] = useState(false);

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

        // Fetch the WHOLE week always
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

  // فتح المودال فقط
  const handleOpenModal = (slot) => {
    const matched = allStudents.filter((stu) =>
        slot.students?.includes(stu.id)
    );
    setSelectedLessonStudents(matched);
    setSelectedSlot(slot);
    setAbsentStudentIds([]);
    setLessonNotes("");
    setProgressEvaluation("");
    setShowStudentList(false);
    setShowModal(true);
  };

  // عرض الطلاب فقط
  const handleShowStudents = (slot) => {
    const matched = allStudents.filter((stu) =>
        slot.students?.includes(stu.id)
    );
    setSelectedLessonStudents(matched);
    setSelectedSlot((prev) => (prev?.id === slot.id ? null : slot));
    setShowStudentList(true);
  };

  const handleSaveLesson = async () => {
    if (!selectedSlot || !teacherId) return;

    const allStudentsData = selectedLessonStudents.map((stu) => {
      if (absentStudentIds.includes(stu.id)) {
        return {
          student_id: stu.id,
          status: "absent"
        };
      } else {
        return {
          student_id: stu.id,
          status: "present",
          progress_evaluation: stu.progress_evaluation || "",
          student_notes: stu.student_notes || ""
        };
      }
    });

    try {
      await addDoc(collection(db, "lessons"), {
        teacher_id: teacherId,
        subject: selectedSlot.subject,
        class_type: selectedSlot.class_type,
        start_time: selectedSlot.start_time,
        end_time: selectedSlot.end_time,
        lesson_notes: lessonNotes,
        students: allStudentsData,
        present_count: allStudentsData.filter(s => s.status === "present").length,
        absent_count: allStudentsData.filter(s => s.status === "absent").length,
        lesson_date: selectedSlot.lesson_date ? new Date(selectedSlot.lesson_date) : new Date(),
        created_at: Timestamp.now()
      });
      setSelectedSlot(null);
      setLessonNotes("");
      setAbsentStudentIds([]);
      setSelectedLessonStudents([]);
      alert(t("lesson_saved"));
    } catch (err) {
      console.error("Error saving lesson:", err);
      alert(t("error_saving_lesson"));
    }
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
        {/* جدول الأسبوع فقط */}
        <div className="bg-white p-4 shadow rounded">
          <h2 className="text-xl font-bold text-blue-700 mb-2">{t('weekly_schedule')}</h2>
          <div className="overflow-auto">
            <table className="table-fixed w-full border-collapse text-sm">
              <thead>
              <tr>
                <th className="border px-2 py-1 bg-gray-200 w-16">{t("time_day")}</th>
                {RAW_DAYS_OF_WEEK.map(day => (
                    <th key={day} className="border px-2 py-1 bg-gray-200">{t(day)}</th>
                ))}
              </tr>
              </thead>
              <tbody>
              {HOURS_RANGE.map(hour => (
                  <tr key={hour}>
                    <td className="border px-2 py-1 font-semibold text-center align-middle h-12 w-16">
                      {hour}:00
                    </td>
                    {RAW_DAYS_OF_WEEK.map(day => {
                      const slot = weeklySchedules.find(sch => {
                        if (sch.day !== day) return false;
                        const start = parseHour(sch.start_time);
                        const end = parseHour(sch.end_time);
                        return hour >= start && hour < end;
                      });
                      return (
                          <td key={day} className="border px-2 py-1 text-center align-top h-12">
                            {slot ? (
                                <div
                                    className={`p-2 rounded cursor-pointer
    ${slot.sessionType === "Group" ? "bg-blue-100 text-blue-900" : ""}
    ${slot.sessionType === "Private" ? "bg-green-100 text-green-900" : ""}
    ${slot.sessionType === "Other" ? "bg-yellow-100 text-yellow-900" : ""}
  `}
                                    onClick={() => {
                                      const matched = allStudents.filter((stu) =>
                                          slot.students?.includes(stu.id)
                                      );
                                      setSelectedLessonStudents(matched);
                                      setSelectedSlot(slot);
                                      setShowStudentList(true);
                                    }}
                                >
                                  <div className="font-bold">{t(slot.subject)}</div>
                                  <div className="text-xs">{t(slot.sessionType)}</div>
                                </div>
                            ) : null}



                          </td>
                      );
                    })}
                  </tr>
              ))}
              </tbody>
            </table>
            {/* Lesson Details Modal */}
            {showStudentList && selectedSlot && (
                <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/30 backdrop-blur-sm">
                  <div className="bg-white p-8 rounded-xl shadow-xl w-full max-w-lg relative border border-blue-100">
                    {/* Close Button */}
                    <button
                        onClick={() => setShowStudentList(false)}
                        className="absolute top-3 right-4 text-gray-400 hover:text-gray-700 text-2xl font-bold"
                        aria-label="Close"
                    >
                      ×
                    </button>
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">📚</span>
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
                      <span>
          <strong>{t("Teacher")}:</strong>{" "}
                        <span>{selectedSlot.teacher || <span className="text-gray-400 italic">{t("N/A")}</span>}</span>
        </span>
                      <span>
          <strong>{t("Student count")}:</strong>{" "}
                        <span>{selectedLessonStudents.length}</span>
        </span>
                    </div>
                    {/* Student List */}
                    <div className="mt-4">
                      <strong className="block mb-1 text-gray-700">{t("Students in this lesson")}:</strong>
                      {selectedLessonStudents.length > 0 ? (
                          <ul className="pl-4 list-disc space-y-1 text-base text-gray-900">
                            {selectedLessonStudents.map(s => (
                                <li key={s.id}>
                                  <span className="font-medium">{s.name}</span>
                                  {/* If you have more info: */}
                                  {/* {s.email && <span className="ml-2 text-gray-400 text-xs">({s.email})</span>} */}
                                </li>
                            ))}
                          </ul>
                      ) : (
                          <p className="text-gray-400 italic">{t("No students assigned")}</p>
                      )}
                    </div>
                    {/* If you have notes, show here */}
                    {selectedSlot.notes && (
                        <div className="mt-4 bg-gray-50 border rounded p-2 text-sm">
                          <strong>{t("Lesson notes")}:</strong> {selectedSlot.notes}
                        </div>
                    )}
                    {/* Future: You can add buttons for attendance, editing, etc. */}
                  </div>
                </div>
            )}


          </div>
        </div>

        {/* modal تسجيل الدرس */}
        {showModal && selectedSlot && (

            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md space-y-4">
                <h2 className="text-xl font-bold text-blue-800">{t("add_lesson")}</h2>
                <p><strong>{t("subject")}:</strong> {t(selectedSlot.subject)}</p>
                <p><strong>{t("class_type")}:</strong> {t(selectedSlot.class_type)}</p>

                <div>
                  <label className="font-semibold block mb-1">{t("start_time")}</label>
                  <input
                      type="time"
                      value={selectedSlot.start_time}
                      onChange={(e) => setSelectedSlot({ ...selectedSlot, start_time: e.target.value })}
                      className="w-full border rounded p-2 text-sm"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1">{t("end_time")}</label>
                  <input
                      type="time"
                      value={selectedSlot.end_time}
                      onChange={(e) => setSelectedSlot({ ...selectedSlot, end_time: e.target.value })}
                      className="w-full border rounded p-2 text-sm"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">{t("lesson_date")}</label>
                  <input
                      type="date"
                      value={selectedSlot.lesson_date || new Date().toISOString().split('T')[0]}
                      onChange={(e) =>
                          setSelectedSlot({ ...selectedSlot, lesson_date: e.target.value })
                      }
                      className="w-full border rounded p-2 text-sm"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1">{t("mark_present_students")}</label>
                  <div className="space-y-2 max-h-40 overflow-y-auto border p-2 rounded bg-gray-50 text-sm">
                    {selectedLessonStudents.map(stu => (
                        <div key={stu.id} className="border-b pb-2">
                          <label className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={!absentStudentIds.includes(stu.id)}
                                onChange={() =>
                                    setAbsentStudentIds(prev =>
                                        prev.includes(stu.id)
                                            ? prev.filter(id => id !== stu.id)
                                            : [...prev, stu.id]
                                    )
                                }
                            />
                            {stu.name}
                          </label>
                          {/* فقط لما يكون الطالب حاضر، نعرض الحقلين */}
                          {!absentStudentIds.includes(stu.id) && (
                              <div className="mt-2 space-y-2">
                                <input
                                    type="number"
                                    min="1"
                                    max="10"
                                    step="1"
                                    placeholder={t("progress_placeholder")}
                                    className="w-full border rounded p-1 text-sm"
                                    value={stu.progress_evaluation || ""}
                                    onChange={(e) => {
                                      const val = parseInt(e.target.value, 10);
                                      const updated = selectedLessonStudents.map(s =>
                                          s.id === stu.id ? { ...s, progress_evaluation: isNaN(val) ? "" : val } : s
                                      );
                                      setSelectedLessonStudents(updated);
                                    }}
                                />
                                <input
                                    type="text"
                                    placeholder={t("student_notes_placeholder")}
                                    className="w-full border rounded p-1 text-sm"
                                    value={stu.student_notes || ""}
                                    onChange={(e) => {
                                      const updated = selectedLessonStudents.map(s =>
                                          s.id === stu.id ? { ...s, student_notes: e.target.value } : s
                                      );
                                      setSelectedLessonStudents(updated);
                                    }}
                                />
                              </div>
                          )}
                        </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="font-semibold block mb-1">{t("lesson_notes")}</label>
                  <textarea
                      value={lessonNotes}
                      onChange={(e) => setLessonNotes(e.target.value)}
                      placeholder={t("lesson_notes_placeholder")}
                      className="w-full border rounded p-2 text-sm"
                  />
                </div>

                <div className="flex justify-end gap-2 mt-4">
                  <button
                      onClick={() => {
                        setSelectedSlot(null);
                        setShowModal(false);
                      }}
                      className="bg-gray-200 text-gray-700 px-4 py-2 rounded"
                  >
                    {t("cancel")}
                  </button>
                  <button
                      onClick={handleSaveLesson}
                      className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                  >
                    {t("save_lesson")}
                  </button>
                </div>
              </div>
            </div>
        )}

        {/* ملاحظات المعلم */}
        <div className="w-1/3 mt-6">
          <div className="bg-white p-4 shadow rounded">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-blue-800">{t('keep_in_mind')}</h2>
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
                    <button onClick={handleAddNote} className="bg-blue-500 text-white px-3 py-2 rounded">
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
                    <p className="font-bold text-blue-800">{note.student_name || note.student_id || t('no_student_linked')}</p>
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
