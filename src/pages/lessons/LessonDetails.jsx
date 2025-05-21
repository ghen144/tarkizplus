import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '@/firebase/firebase.jsx';
import { doc, getDoc } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';

const LessonDetails = () => {
  const { lessonId } = useParams();
  const { t } = useTranslation();

  const [lesson, setLesson] = useState(null);
  const [teacherName, setTeacherName] = useState('');
  const [studentName, setStudentName] = useState('');
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

        if (lessonData.student_id) {
          const studentRef = doc(db, 'students', lessonData.student_id);
          const studentSnap = await getDoc(studentRef);
          setStudentName(studentSnap.exists() ? studentSnap.data().name || t("unknownStudent") : t("unknownStudent"));
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
    formattedDate = lesson.lesson_date.toDate().toLocaleString();
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">{t("lessonDetails")}</h1>
      <div className="bg-white p-6 rounded shadow max-w-md">
        <p><strong>{t("date")}:</strong> {formattedDate || 'N/A'}</p>
        <p><strong>{t("teacher")}:</strong> {teacherName}</p>
        <p><strong>{t("student")}:</strong> {studentName}</p>
        <p><strong>{t("subject")}:</strong> {lesson.subject || 'N/A'}</p>
        <p><strong>{t("duration")}:</strong> {lesson.duration_minutes} {t("minutes")}</p>
        <p><strong>{t("lessonNotes")}:</strong> {lesson.lesson_notes || 'N/A'}</p>
        <p><strong>{t("progressAssessment")}:</strong> {lesson.progress_assessment || 'N/A'}</p>
        <p><strong>{t("studentNum")}:</strong> {lesson.student_num || 'N/A'}</p>
      </div>
      <div className="mt-4">
        <Link to="/admin/lessonlog" className="text-blue-500 hover:underline">
          {t("backToLessonLog")}
        </Link>
      </div>
    </div>
  );
};

export default LessonDetails;
