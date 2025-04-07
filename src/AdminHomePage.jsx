import React, { useState, useEffect } from "react";
import { collection, getDocs, addDoc, doc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "./firebase";
import { Link } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";
import { Users, User, BookOpen, ClipboardList, PlusCircle } from "lucide-react";

const AdminHomePage = () => {
  const [counts, setCounts] = useState({ teachers: 0, students: 0, lessons: 0, exams: 0 });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showExamModal, setShowExamModal] = useState(false);
  const [examForm, setExamForm] = useState({
    student_id: "",
    subject: "",
    exam_date: "",
    material: ""
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tSnap, sSnap, lSnap, eSnap] = await Promise.all([
          getDocs(collection(db, "teachers")),
          getDocs(collection(db, "students")),
          getDocs(collection(db, "lessons")),
          getDocs(collection(db, "exams"))
        ]);

        setCounts({
          teachers: tSnap.size,
          students: sSnap.size,
          lessons: lSnap.size,
          exams: eSnap.size
        });

        // تصحيح الأخطاء في النصوص
        const recentLessons = lSnap.docs
          .sort((a, b) => b.data().lesson_date.toDate() - a.data().lesson_date.toDate())
          .slice(0, 3)
          .map(d => `📝 ${d.data().subject} lesson on ${d.data().lesson_date.toDate().toLocaleDateString()}`);  // تم إضافة backticks هنا

        const recentExams = eSnap.docs
          .sort((a, b) => b.data().exam_date.toDate() - a.data().exam_date.toDate())
          .slice(0, 2)
          .map(d => `📅 Exam: ${d.data().subject} on ${d.data().exam_date.toDate().toLocaleDateString()}`);  // تم إضافة backticks هنا

        setRecentActivity([...recentLessons, ...recentExams]);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleAddExam = async (e) => {
    e.preventDefault();
    try {
      const newExam = {
        student_id: examForm.student_id,
        subject: examForm.subject,
        material: examForm.material,
        exam_date: new Date(examForm.exam_date)
      };

      // أضف الامتحان في Collection exams
      await addDoc(collection(db, "exams"), newExam);

      // أضف الامتحان إلى الطالب
      const studentRef = doc(db, "students", examForm.student_id);
      await updateDoc(studentRef, {
        exams: arrayUnion(newExam)
      });

      alert("Exam added and linked to student successfully!");
      setShowExamModal(false);
      setExamForm({ student_id: "", subject: "", exam_date: "", material: "" });
    } catch (err) {
      console.error("Error adding exam:", err);
      alert("Failed to add exam.");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-100">
        <AdminSidebar active="home" />
        <main className="flex-1 p-6 flex items-center justify-center">
          <p>Loading dashboard…</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <AdminSidebar active="home" />
      <main className="flex-1 p-6 space-y-8">
        {/* Banner */}
        <div className="bg-white p-6 rounded shadow flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Welcome, Admin!</h1>
            <p className="text-gray-600">Here’s an overview of your platform.</p>
          </div>
          <p className="text-gray-500">{new Date().toLocaleDateString()}</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link to="/admin/teachers" className="bg-white p-4 rounded shadow flex items-center">
            <Users className="h-8 w-8 text-blue-500 mr-3" />
            <div>
              <p className="text-2xl font-semibold">{counts.teachers}</p>
              <p className="text-gray-600">Teachers</p>
            </div>
          </Link>
          <Link to="/admin/students" className="bg-white p-4 rounded shadow flex items-center">
            <User className="h-8 w-8 text-green-500 mr-3" />
            <div>
              <p className="text-2xl font-semibold">{counts.students}</p>
              <p className="text-gray-600">Students</p>
            </div>
          </Link>
          <Link to="/admin/lessonlog" className="bg-white p-4 rounded shadow flex items-center">
            <BookOpen className="h-8 w-8 text-orange-500 mr-3" />
            <div>
              <p className="text-2xl font-semibold">{counts.lessons}</p>
              <p className="text-gray-600">Lessons</p>
            </div>
          </Link>
          <Link to="/admin/exams" className="bg-white p-4 rounded shadow flex items-center">
            <ClipboardList className="h-8 w-8 text-purple-500 mr-3" />
            <div>
              <p className="text-2xl font-semibold">{counts.exams}</p>
              <p className="text-gray-600">Exams</p>
            </div>
          </Link>
        </div>

        {/* Quick Actions */}
        <div className="bg-white p-6 rounded shadow space-y-4">
          <h2 className="text-xl font-semibold">Quick Actions</h2>
          <div className="flex flex-wrap gap-4">
            <Link to="/add-teacher" className="inline-flex items-center bg-blue-500 text-white px-4 py-2 rounded">
              <PlusCircle className="mr-2" /> Add Teacher
            </Link>
            <Link to="/admin/students/add" className="inline-flex items-center bg-green-500 text-white px-4 py-2 rounded">
              <PlusCircle className="mr-2" /> Add Student
            </Link>
            <Link to="/admin/schedule/new" className="inline-flex items-center bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600">
              <PlusCircle className="mr-2" /> Schedule Lesson
            </Link>
            <button onClick={() => setShowExamModal(true)} className="inline-flex items-center bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600">
              <PlusCircle className="mr-2" /> Log Exam
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
          <ul className="list-disc list-inside text-sm space-y-2">
            {recentActivity.map((act, i) => <li key={i}>{act}</li>)}
          </ul>
        </div>

        {/* Modal */}
        {showExamModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
              <h2 className="text-xl font-semibold mb-4">Log New Exam</h2>
              <form onSubmit={handleAddExam} className="space-y-4">
                <div>
                  <label className="block mb-1 font-medium">Student ID</label>
                  <input
                    type="text"
                    placeholder="e.g. S018"
                    className="w-full border px-4 py-2 rounded"
                    value={examForm.student_id}
                    onChange={(e) => setExamForm({ ...examForm, student_id: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1 font-medium">Subject</label>
                  <select
                    className="w-full border px-4 py-2 rounded"
                    value={examForm.subject}
                    onChange={(e) => setExamForm({ ...examForm, subject: e.target.value })}
                    required
                  >
                    <option value="">Select a subject</option>
                    <option value="Math">Math</option>
                    <option value="English">English</option>
                    <option value="Hebrew">Hebrew</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-1 font-medium">Exam Date</label>
                  <input
                    type="date"
                    className="w-full border px-4 py-2 rounded"
                    value={examForm.exam_date}
                    onChange={(e) => setExamForm({ ...examForm, exam_date: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1 font-medium">Material / Notes</label>
                  <textarea
                    placeholder="Material"
                    className="w-full border px-4 py-2 rounded"
                    value={examForm.material}
                    onChange={(e) => setExamForm({ ...examForm, material: e.target.value })}
                  ></textarea>
                </div>
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setShowExamModal(false)} className="px-4 py-2 rounded border hover:bg-gray-100">
                    Cancel
                  </button>
                  <button type="submit" className="px-4 py-2 rounded bg-purple-500 text-white hover:bg-purple-600">
                    Save
                  </button>
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
