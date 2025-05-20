// React & Hooks
import React, { useState, useEffect } from "react";
import { db } from "./firebase";
import {
  collection,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";
import { useNavigate, useParams, useLocation, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import AdminSidebar from "./AdminSidebar";
import {
  Users,
  User,
  BookOpen,
  ClipboardList,
  PlusCircle,
} from "lucide-react";

const AdminHomePage = () => {
  const { t } = useTranslation();
  const [counts, setCounts] = useState({ teachers: 0, students: 0, lessons: 0, exams: 0 });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showExamModal, setShowExamModal] = useState(false);
  const [examForm, setExamForm] = useState({ student_id: "", subject: "", exam_date: "", material: "" });
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tSnap, sSnap, lSnap, eSnap] = await Promise.all([
          getDocs(collection(db, "teachers")),
          getDocs(collection(db, "students")),
          getDocs(collection(db, "lessons")),
          getDocs(collection(db, "exams"))
        ]);

        setStudents(sSnap.docs.map(doc => doc.data()));
        setTeachers(tSnap.docs.map(doc => doc.data()));

        setCounts({
          teachers: tSnap.size,
          students: sSnap.size,
          lessons: lSnap.size,
          exams: eSnap.size
        });

        const recentLessons = lSnap.docs
          .sort((a, b) => b.data().lesson_date.toDate() - a.data().lesson_date.toDate())
          .slice(0, 3)
          .map(d => `📝 ${t(d.data().subject)} ${t('lesson_on')} ${d.data().lesson_date.toDate().toLocaleDateString()}`);

        const recentExams = eSnap.docs
          .sort((a, b) => b.data().exam_date.toDate() - a.data().exam_date.toDate())
          .slice(0, 2)
          .map(d => `📅 ${t('exam')}: ${t(d.data().subject)} ${t('on_date')} ${d.data().exam_date.toDate().toLocaleDateString()}`);

        setRecentActivity([...recentLessons, ...recentExams]);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [t]);

  const subjectList = ["Math", "Arabic", "English", "Hebrew"];
  const studentSubjectCounts = subjectList.map(subject => ({
    subject: t(subject),
    count: students.filter(s => s.subjects?.includes(subject)).length
  }));
  const teacherSubjectCounts = subjectList.map(subject => ({
    subject: t(subject),
    count: teachers.filter(t => t.subject_specialties?.includes(subject)).length
  }));

  const handleAddExam = async (e) => {
    e.preventDefault();
    try {
      const newExam = {
        student_id: examForm.student_id,
        subject: examForm.subject,
        material: examForm.material,
        exam_date: new Date(examForm.exam_date)
      };
      await addDoc(collection(db, "exams"), newExam);
      await updateDoc(doc(db, "students", examForm.student_id), {
        exams: arrayUnion(newExam)
      });
      alert(t('exam_added'));
      setShowExamModal(false);
      setExamForm({ student_id: "", subject: "", exam_date: "", material: "" });
    } catch (err) {
      console.error("Error adding exam:", err);
      alert(t('exam_add_failed'));
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-100">
        <AdminSidebar active="home" />
        <main className="flex-1 p-6 flex items-center justify-center">
          <p>{t('loading_dashboard')}</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <AdminSidebar active="home" />
      <main className="flex-1 p-6 space-y-8">
        <div className="bg-white p-6 rounded shadow flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{t('welcome_admin')}</h1>
            <p className="text-gray-600">{t('dashboard_overview')}</p>
          </div>
          <p className="text-gray-500">{new Date().toLocaleDateString()}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link to="/admin/teachers" className="bg-white p-4 rounded shadow flex items-center">
            <Users className="h-8 w-8 text-blue-500 mr-3" />
            <div>
              <p className="text-2xl font-semibold">{counts.teachers}</p>
              <p className="text-gray-600">{t('teachers')}</p>
            </div>
          </Link>
          <Link to="/admin/students" className="bg-white p-4 rounded shadow flex items-center">
            <User className="h-8 w-8 text-green-500 mr-3" />
            <div>
              <p className="text-2xl font-semibold">{counts.students}</p>
              <p className="text-gray-600">{t('students')}</p>
            </div>
          </Link>
          <Link to="/admin/lessonlog" className="bg-white p-4 rounded shadow flex items-center">
            <BookOpen className="h-8 w-8 text-orange-500 mr-3" />
            <div>
              <p className="text-2xl font-semibold">{counts.lessons}</p>
              <p className="text-gray-600">{t('lessons')}</p>
            </div>
          </Link>
          <Link to="/admin/exams" className="bg-white p-4 rounded shadow flex items-center">
            <ClipboardList className="h-8 w-8 text-purple-500 mr-3" />
            <div>
              <p className="text-2xl font-semibold">{counts.exams}</p>
              <p className="text-gray-600">{t('exams')}</p>
            </div>
          </Link>
        </div>

        <div className="bg-white p-6 rounded shadow space-y-4">
          <h2 className="text-xl font-semibold">{t('quick_actions')}</h2>
          <div className="flex flex-wrap gap-4">
            <Link to="/add-teacher" className="inline-flex items-center bg-blue-500 text-white px-4 py-2 rounded">
              <PlusCircle className="mr-2" /> {t('add_teacher')}
            </Link>
            <Link to="/admin/students/add" className="inline-flex items-center bg-green-500 text-white px-4 py-2 rounded">
              <PlusCircle className="mr-2" /> {t('add_student')}
            </Link>
            <Link to="/admin/schedule/new" className="inline-flex items-center bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600">
              <PlusCircle className="mr-2" /> {t('schedule_lesson')}
            </Link>
            <button onClick={() => setShowExamModal(true)} className="inline-flex items-center bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600">
              <PlusCircle className="mr-2" /> {t('log_exam')}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded shadow">
            <h2 className="text-xl font-semibold mb-4">{t('students_by_subject')}</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={studentSubjectCounts}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="subject" />
                <YAxis allowDecimals={false} />
                <Tooltip formatter={(value) => [`${t("count")}: ${value}`, '']} />
                <Bar dataKey="count" fill="#60A5FA" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white p-6 rounded shadow">
            <h2 className="text-xl font-semibold mb-4">{t('teachers_by_subject')}</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={teacherSubjectCounts}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="subject" />
                <YAxis allowDecimals={false} />
                <Tooltip formatter={(value) => [`${t("count")}: ${value}`, '']} />
                <Bar dataKey="count" fill="#34D399" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-xl font-semibold mb-4">{t('recent_activity')}</h2>
          <ul className="list-disc list-inside text-sm space-y-2">
            {recentActivity.map((act, i) => <li key={i}>{act}</li>)}
          </ul>
        </div>

        {showExamModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
              <h2 className="text-xl font-semibold mb-4">{t('log_new_exam')}</h2>
              <form onSubmit={handleAddExam} className="space-y-4">
                <div>
                  <label className="block mb-1 font-medium">{t('student_id')}</label>
                  <input type="text" className="w-full border px-4 py-2 rounded" value={examForm.student_id} onChange={(e) => setExamForm({ ...examForm, student_id: e.target.value })} required />
                </div>
                <div>
                  <label className="block mb-1 font-medium">{t('subject')}</label>
                  <select className="w-full border px-4 py-2 rounded" value={examForm.subject} onChange={(e) => setExamForm({ ...examForm, subject: e.target.value })} required>
                    <option value="">{t('select_subject')}</option>
                    <option value="Math">{t('Math')}</option>
                    <option value="English">{t('English')}</option>
                    <option value="Hebrew">{t('Hebrew')}</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-1 font-medium">{t('exam_date')}</label>
                  <input type="date" className="w-full border px-4 py-2 rounded" value={examForm.exam_date} onChange={(e) => setExamForm({ ...examForm, exam_date: e.target.value })} required />
                </div>
                <div>
                  <label className="block mb-1 font-medium">{t('material')}</label>
                  <textarea className="w-full border px-4 py-2 rounded" value={examForm.material} onChange={(e) => setExamForm({ ...examForm, material: e.target.value })}></textarea>
                </div>
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setShowExamModal(false)} className="px-4 py-2 rounded border hover:bg-gray-100">{t('cancel')}</button>
                  <button type="submit" className="px-4 py-2 rounded bg-purple-500 text-white hover:bg-purple-600">{t('save')}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminHomePage;
