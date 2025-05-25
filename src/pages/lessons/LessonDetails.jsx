import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '@/firebase/firebase.jsx';
import { doc, getDoc } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import { Calendar, User, BookOpen, StickyNote, Clock } from 'lucide-react';

const LessonDetails = () => {
  const { lessonId } = useParams();
  const { t } = useTranslation();

  const [lesson, setLesson] = useState(null);
  const [teacherName, setTeacherName] = useState('');
  const [studentsInfo, setStudentsInfo] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchLesson = async () => {
      try {
        const lessonRef = doc(db, 'lessons', lessonId);
        const lessonSnap = await getDoc(lessonRef);
        if (!lessonSnap.exists()) {
          setError(t("lessonNotFound"));
          setLoading(false);
          return;
        }

        const lessonData = lessonSnap.data();
        setLesson(lessonData);

        if (lessonData.teacher_id) {
          const teacherRef = doc(db, 'teachers', lessonData.teacher_id);
          const teacherSnap = await getDoc(teacherRef);
          setTeacherName(teacherSnap.exists() ? teacherSnap.data().name || t("unknownTeacher") : t("unknownTeacher"));
        }

        if (lessonData.students && Array.isArray(lessonData.students)) {
          const studentsWithNames = await Promise.all(
            lessonData.students.map(async (student) => {
              const studentRef = doc(db, 'students', student.student_id);
              const studentSnap = await getDoc(studentRef);
              const studentName = studentSnap.exists() ? studentSnap.data().name : t("unknownStudent");
              return {
  name: studentName,
  student_notes: student.student_notes || "",
  progress: student.progress_assessment || "",
  status: student.status
};

            })
          );
          setStudentsInfo(studentsWithNames);
        } else if (lessonData.student_id) {
          const studentRef = doc(db, 'students', lessonData.student_id);
          const studentSnap = await getDoc(studentRef);
          const studentName = studentSnap.exists() ? studentSnap.data().name : t("unknownStudent");
          setStudentsInfo([{
            name: studentName,
            note: lessonData.lesson_notes || "",
            progress: lessonData.progress_assessment || "",
            status: "present"
          }]);
        }

      } catch (err) {
        console.error('Error fetching lesson details:', err);
        setError(t("errorFetchingLesson"));
      } finally {
        setLoading(false);
      }
    };

    fetchLesson();
  }, [lessonId, t]);

  if (loading) return <p className="p-6">{t("loading")}</p>;
  if (error) return <p className="p-6 text-red-600">{error}</p>;
  if (!lesson) return null;

  let formattedDate = '';
  if (lesson.lesson_date && lesson.lesson_date.toDate) {
    const d = lesson.lesson_date.toDate();
    formattedDate = d.toLocaleDateString("en-GB");
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">{t("lessonDetails")}</h1>

      <div className="bg-white p-6 rounded-xl shadow space-y-4">
        <div className="flex items-center gap-2">
          <Calendar className="text-blue-600" />
          <p><strong>{t("date")}:</strong> {formattedDate}</p>
        </div>

        <div className="flex items-center gap-2">
          <User className="text-blue-600" />
          <p><strong>{t("teacher")}:</strong> {teacherName}</p>
        </div>

        <div className="flex items-center gap-2">
          <BookOpen className="text-blue-600" />
          <p><strong>{t("subject")}:</strong> {t(lesson.subject)}</p>
        </div>

        {(lesson.duration_minutes || lesson.start_time || lesson.end_time) && (
          <div className="flex items-center gap-2">
            <Clock className="text-blue-600" />
            <p>
              <strong>{t("duration")}:</strong>{' '}
              {lesson.duration_minutes ? `${lesson.duration_minutes} ${t("minutes")}` : `${lesson.start_time || '?'} - ${lesson.end_time || '?'}`}
            </p>
          </div>
        )}

        {lesson.lesson_notes && (
          <div className="flex items-center gap-2">
            <StickyNote className="text-yellow-600" />
            <p><strong>{t("lessonNotes")}</strong>: {lesson.lesson_notes}</p>
          </div>
        )}

        <hr />

        <h2 className="text-xl font-semibold mt-4">{t("students")}</h2>
        <div className="space-y-4 mt-2">
          {studentsInfo.map((student, index) => (
            <div key={index} className="bg-gray-50 p-4 rounded shadow">
              <p className="font-medium">{student.name}</p>
              {student.status === "absent" ? (
<p className="text-red-600">{t("Absent from the lesson")}</p>
              ) : (
                <>
                  <p><strong>{t("progressAssessment")}</strong>: {student.progress || t("no_progress")}</p>
                  <p><strong>{t("lessonNotes")}</strong>: {student.student_notes || t("no_notes")}</p>

                </>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6">
<Link to="/lesson-log" className="text-blue-500 hover:underline">

          ← {t("backToLessonLog")}
        </Link>
      </div>
    </div>
  );
};

export default LessonDetails;
