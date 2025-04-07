import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebase";
import AdminSidebar from "./AdminSidebar";
import { Users, User, BookOpen, ClipboardList, PlusCircle } from "lucide-react";

const AdminHomePage = () => {
    const [counts, setCounts] = useState({
        teachers: 0,
        students: 0,
        lessons: 0,
        exams: 0
    });
    const [recentActivity, setRecentActivity] = useState([]);
    const [loading, setLoading] = useState(true);

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

                const recentLessons = lSnap.docs
                    .sort((a, b) => b.data().lesson_date.toDate() - a.data().lesson_date.toDate())
                    .slice(0, 3)
                    .map(d => `📝 ${d.data().subject} lesson on ${d.data().lesson_date.toDate().toLocaleDateString()}`);

                const recentExams = eSnap.docs
                    .sort((a, b) => b.data().exam_date.toDate() - a.data().exam_date.toDate())
                    .slice(0, 2)
                    .map(d => `📅 Exam: ${d.data().subject} on ${d.data().exam_date.toDate().toLocaleDateString()}`);

                setRecentActivity([...recentLessons, ...recentExams]);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

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
                {/* Welcome Banner */}
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
                        <Link to="/admin/lessons/add" className="inline-flex items-center bg-orange-500 text-white px-4 py-2 rounded">
                            <PlusCircle className="mr-2" /> Schedule Lesson
                        </Link>
                        <Link to="/admin/exams/add" className="inline-flex items-center bg-purple-500 text-white px-4 py-2 rounded">
                            <PlusCircle className="mr-2" /> Log Exam
                        </Link>
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white p-6 rounded shadow">
                    <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
                    <ul className="list-disc list-inside text-sm space-y-2">
                        {recentActivity.map((act, i) => <li key={i}>{act}</li>)}
                    </ul>
                </div>
            </main>
        </div>
    );
};

export default AdminHomePage;
