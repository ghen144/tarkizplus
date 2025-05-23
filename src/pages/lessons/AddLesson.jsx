import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "@/firebase/firebase.jsx";
import {
  collection, doc, getDocs, setDoc, serverTimestamp, query, where
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { useTranslation } from "react-i18next";

function AddLesson() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const auth = getAuth();
  const user = auth.currentUser;

  const [teacherId, setTeacherId] = useState(null);
  const [assignedStudents, setAssignedStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  const [lessonDate, setLessonDate] = useState("");
  const [lessonTime, setLessonTime] = useState("");

  const [lessonRows, setLessonRows] = useState([
    { student_id: "", subject: "", duration: "", notes: "", progress: "" }
  ]);

  useEffect(() => {
    const fetchAssignedStudents = async () => {
      if (!user) return setLoading(false);

      setLoading(true);
      try {
        const qTeachers = query(collection(db, "teachers"), where("email", "==", user.email));
        const teacherSnap = await getDocs(qTeachers);
        if (teacherSnap.empty) return setLoading(false);

        const teacherDoc = teacherSnap.docs[0];
        setTeacherId(teacherDoc.id);

        const teacherData = teacherDoc.data();
        const assignedStudentIds = teacherData.assigned_students || [];

        const allStudentsSnap = await getDocs(collection(db, "students"));
        const studentList = allStudentsSnap.docs
          .filter((doc) => assignedStudentIds.includes(doc.id))
          .map((doc) => ({ id: doc.id, name: doc.data().name || t('unnamed_student') }));

        setAssignedStudents(studentList);
      } catch (error) {
        console.error("Error fetching teacher/students:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAssignedStudents();
  }, [user]);

  const handleAddRow = () => {
    setLessonRows((prev) => [...prev, { student_id: "", subject: "", duration: "", notes: "", progress: "" }]);
  };

  const handleRemoveRow = (index) => {
    setLessonRows((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRowChange = (index, field, value) => {
    setLessonRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!teacherId) return;

    try {
      let finalDate = null;
      if (lessonDate) {
        finalDate = lessonTime ? new Date(`${lessonDate}T${lessonTime}`) : new Date(lessonDate);
      }

      for (const row of lessonRows) {
        if (!row.student_id) continue;

        const newDocRef = doc(collection(db, "lessons"));
        await setDoc(newDocRef, {
          lesson_id: newDocRef.id,
          teacher_id: teacherId,
          student_id: row.student_id,
          subject: row.subject || "",
          lesson_date: finalDate || serverTimestamp(),
          start_time: lessonTime || "",
          duration_minutes: parseInt(row.duration, 10) || 0,
          lesson_notes: row.notes || "",
          progress_assessment: row.progress || "",
          student_num: lessonRows.length,
          created_at: serverTimestamp(),
        });
      }

      navigate("/lesson-log");
    } catch (error) {
      console.error("Error adding lessons:", error);
    }
  };

  if (loading) {
    return <p className="p-6">{t("loading_students")}</p>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h2 className="text-2xl font-bold mb-4">{t("add_multiple_lessons")}</h2>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow max-w-3xl">
        <div className="mb-6 p-4 bg-gray-50 rounded">
          <label className="block mb-2 font-semibold">{t("lesson_date")}</label>
          <input type="date" className="w-full p-2 mb-4 border rounded"
            value={lessonDate} onChange={(e) => setLessonDate(e.target.value)} />

          <label className="block mb-2 font-semibold">{t("begin_time")}</label>
          <input type="time" className="w-full p-2 mb-4 border rounded"
            value={lessonTime} onChange={(e) => setLessonTime(e.target.value)} />
        </div>

        {lessonRows.map((row, index) => (
          <div key={index} className="border rounded p-4 mb-4 bg-gray-50 relative">
            {lessonRows.length > 1 && (
              <button type="button" onClick={() => handleRemoveRow(index)}
                className="absolute top-2 right-2 text-red-500">
                {t("remove")}
              </button>
            )}

            <label className="block mb-2 font-semibold">{t("student")}</label>
            <select className="w-full p-2 mb-4 border rounded" value={row.student_id}
              onChange={(e) => handleRowChange(index, "student_id", e.target.value)} required>
              <option value="">{t("select_student")}</option>
              {assignedStudents.map((stu) => (
                <option key={stu.id} value={stu.id}>{stu.name}</option>
              ))}
            </select>

            <label className="block mb-2 font-semibold">{t("subject")}</label>
            <select className="w-full p-2 mb-4 border rounded" value={row.subject}
              onChange={(e) => handleRowChange(index, "subject", e.target.value)}>
              <option value="">{t("select_subject")}</option>
              <option value="Math">{t("math")}</option>
              <option value="Hebrew">{t("hebrew")}</option>
              <option value="Arabic">{t("arabic")}</option>
              <option value="English">{t("english")}</option>
            </select>

            <label className="block mb-2 font-semibold">{t("duration")}</label>
            <input type="number" className="w-full p-2 mb-4 border rounded" value={row.duration}
              onChange={(e) => handleRowChange(index, "duration", e.target.value)}
              placeholder="60" />

            <label className="block mb-2 font-semibold">{t("lesson_notes")}</label>
            <textarea className="w-full p-2 mb-4 border rounded" value={row.notes}
              onChange={(e) => handleRowChange(index, "notes", e.target.value)}
              placeholder={t("notes_placeholder")} />

            <label className="block mb-2 font-semibold">{t("progress_assessment")}</label>
            <input type="text" className="w-full p-2 mb-4 border rounded" value={row.progress}
              onChange={(e) => handleRowChange(index, "progress", e.target.value)}
              placeholder={t("progress_placeholder")} />
          </div>
        ))}

        <button type="button" onClick={handleAddRow}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 mr-4">
          + {t("add_row")}
        </button>

        <button type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
          {t("save_all_lessons")}
        </button>
      </form>
    </div>
  );
}

export default AddLesson;
