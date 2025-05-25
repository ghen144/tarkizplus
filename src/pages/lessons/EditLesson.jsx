import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  getDocs,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { db } from "@/firebase/firebase.jsx";
import { useTranslation } from "react-i18next";

const EditLesson = () => {
  const { t } = useTranslation();
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const auth = getAuth();

  const [lessonData, setLessonData] = useState(null);
  const [studentsInfo, setStudentsInfo] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isOldLesson, setIsOldLesson] = useState(false);

  useEffect(() => {
    const fetchLessonAndUserRole = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          navigate("/login");
          return;
        }

        const teacherQuery = query(
          collection(db, "teachers"),
          where("email", "==", user.email)
        );
        const teacherSnap = await getDocs(teacherQuery);
        const isTeacher = !teacherSnap.empty;
        const teacherDocId = isTeacher ? teacherSnap.docs[0].id : null;

        const adminQuery = query(
          collection(db, "admin"),
          where("email", "==", user.email)
        );
        const adminSnap = await getDocs(adminQuery);
        const isAdmin = !adminSnap.empty;

        if (!isTeacher && !isAdmin) {
          setError(t("notAuthorized"));
          setLoading(false);
          return;
        }

        const lessonRef = doc(db, "lessons", lessonId);
        const lessonSnap = await getDoc(lessonRef);

        if (!lessonSnap.exists()) {
          setError(t("lessonNotFound"));
          setLoading(false);
          return;
        }

        const data = lessonSnap.data();

        if (isTeacher && data.teacher_id !== teacherDocId) {
          setError(t("notAuthorized"));
          setLoading(false);
          return;
        }

        // detect if old format (single student)
        const isOld = !Array.isArray(data.students);
        setIsOldLesson(isOld);

        let formattedDate = data.lesson_date?.toDate()
          ? data.lesson_date.toDate().toISOString().slice(0, 10)
          : "";

        if (isOld) {
          const studentRef = doc(db, "students", data.student_id);
          const studentSnap = await getDoc(studentRef);
          const studentName = studentSnap.exists() ? studentSnap.data().name : "";
          setLessonData({
            ...data,
            lesson_date: formattedDate,
            duration_minutes: data.duration_minutes || "",
            student_name: studentName,
          });
        } else {
          const studentsWithInfo = await Promise.all(
            data.students.map(async (stu) => {
              const ref = doc(db, "students", stu.student_id);
              const snap = await getDoc(ref);
              return {
                ...stu,
                name: snap.exists() ? snap.data().name : "",
              };
            })
          );
          setStudentsInfo(studentsWithInfo);
          setLessonData({
            ...data,
            lesson_date: formattedDate,
            start_time: data.start_time || "",
            end_time: data.end_time || "",
            lesson_notes: data.lesson_notes || "",
          });
        }

        setLoading(false);
      } catch (err) {
        console.error("Error fetching lesson:", err);
        setError(t("errorFetchingLesson"));
        setLoading(false);
      }
    };

    fetchLessonAndUserRole();
  }, [lessonId, auth, navigate, t]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLessonData((prev) => ({ ...prev, [name]: value }));
  };

  const handleStudentChange = (index, field, value) => {
    const updated = [...studentsInfo];
    updated[index][field] = value;
    setStudentsInfo(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const ref = doc(db, "lessons", lessonId);
      const payload = {
        subject: lessonData.subject,
        lesson_date: Timestamp.fromDate(new Date(lessonData.lesson_date)),
        lesson_notes: lessonData.lesson_notes,
      };

      if (isOldLesson) {
        payload.progress_assessment = lessonData.progress_assessment || "";
        payload.duration_minutes = parseInt(lessonData.duration_minutes) || 0;
      } else {
        payload.start_time = lessonData.start_time;
        payload.end_time = lessonData.end_time;
        payload.students = studentsInfo.map((s) => ({
          student_id: s.student_id,
          status: s.status,
          progress_assessment: s.progress_assessment,
          student_notes: s.student_notes,
        }));
      }

      await updateDoc(ref, payload);
      navigate("/lesson-log");
    } catch (err) {
      console.error("Error updating:", err);
      setError(t("updateError"));
    }
  };

  if (loading) return <p>{t("loading")}...</p>;
  if (error) return <p className="text-red-600">{error}</p>;
  if (!lessonData) return null;

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold text-center mb-6">{t("editLesson")}</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label>{t("subject")}</label>
          <select
            name="subject"
            value={lessonData.subject}
            onChange={handleChange}
            className="border p-2 rounded w-full"
          >
            <option value="Math">{t("math")}</option>
            <option value="English">{t("english")}</option>
            <option value="Hebrew">{t("hebrew")}</option>
            <option value="Arabic">{t("arabic")}</option>
          </select>
        </div>

        <div>
          <label>{t("date")}</label>
          <input
            type="date"
            name="lesson_date"
            value={lessonData.lesson_date}
            onChange={handleChange}
            className="border p-2 rounded w-full"
          />
        </div>

        {isOldLesson ? (
          <>
            <p className="text-lg font-semibold text-purple-700">{lessonData.student_name}</p>
            <div>
              <label>{t("duration")}</label>
              <input
                type="number"
                name="duration_minutes"
                value={lessonData.duration_minutes}
                onChange={handleChange}
                className="border p-2 rounded w-full"
              />
            </div>
            <div>
              <label>{t("lessonNotes")}</label>
              <textarea
                name="lesson_notes"
                value={lessonData.lesson_notes}
                onChange={handleChange}
                className="border p-2 rounded w-full"
              />
            </div>
            <div>
              <label>{t("progressAssessment")}</label>
              <input
  type="number"
  name="progress_assessment"
  min="1"
  max="10"
  step="1"
  value={lessonData.progress_assessment || ""}
  onChange={handleChange}
  className="border p-2 rounded w-full"
  placeholder={t("progress_placeholder")}
/>

            </div>
          </>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label>{t("startTime")}</label>
                <input
                  type="time"
                  name="start_time"
                  value={lessonData.start_time}
                  onChange={handleChange}
                  className="border p-2 rounded w-full"
                />
              </div>
              <div>
                <label>{t("endTime")}</label>
                <input
                  type="time"
                  name="end_time"
                  value={lessonData.end_time}
                  onChange={handleChange}
                  className="border p-2 rounded w-full"
                />
              </div>
            </div>

            <div>
              <label>{t("lessonNotes")}</label>
              <textarea
                name="lesson_notes"
                value={lessonData.lesson_notes}
                onChange={handleChange}
                className="border p-2 rounded w-full"
              />
            </div>

            <h2 className="text-xl font-bold text-purple-600 mt-4">{t("students")}</h2>
            {studentsInfo.map((student, index) => (
              <div key={index} className="bg-gray-50 p-4 rounded shadow mt-2">
                <p className="font-medium mb-2">{student.name}</p>
                <div>
                  <label>{t("status")}</label>
                  <select
                    value={student.status}
                    onChange={(e) => handleStudentChange(index, "status", e.target.value)}
                    className="border p-2 rounded w-full"
                  >
                    <option value="present">{t("present")}</option>
                    <option value="absent">{t("absent")}</option>
                  </select>
                </div>
                <div>
                  <label>{t("progressAssessment")}</label>
                  <input
  type="number"
  min="1"
  max="10"
  step="1"
  value={student.progress_assessment || ""}
  onChange={(e) => handleStudentChange(index, "progress_assessment", e.target.value)}
  className="border p-2 rounded w-full"
  placeholder={t("progress_placeholder")}
/>

                </div>
                <div>
                  <label>{t("studentNotes")}</label>
                  <textarea
                    value={student.student_notes || ""}
                    onChange={(e) => handleStudentChange(index, "student_notes", e.target.value)}
                    className="border p-2 rounded w-full"
                  />
                </div>
              </div>
            ))}
          </>
        )}

        <button
          type="submit"
          className="w-full bg-green-500 text-white py-2 rounded mt-4 hover:bg-green-600"
        >
          {t("updateLesson")}
        </button>
      </form>
    </div>
  );
};

export default EditLesson;
