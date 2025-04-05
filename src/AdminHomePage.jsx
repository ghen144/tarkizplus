// AdminHomePage.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { collection, getDocs, query, where, orderBy, limit } from "firebase/firestore";
import { db } from "./firebase";
import AdminSidebar from "./AdminSidebar";
import { Users, User, BookOpen, ClipboardList, PlusCircle } from "lucide-react";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";

const AdminHomePage = () => {
    const [counts, setCounts] = useState({
        teachers: 0,
        students: 0,
        lessons: 0,
        exams: 0
    });
    const [recentActivity, setRecentActivity] = useState([]);
    const [lessonTrends, setLessonTrends] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Summary counts
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

                // 2. Recent activity (mock: latest 5 lessons & exams)
                const recentLessons = lSnap.docs
                    .sort((a, b) => b.data().lesson_date.toDate() - a.data().lesson_date.toDate())
                    .slice(0, 3)
                    .map(d => `📝 ${d.data().subject} lesson on ${d.data().lesson_date.toDate().toLocaleDateString()}`);
                const recentExams = eSnap.docs
                    .sort((a, b) => b.data().exam_date.toDate() - a.data().exam_date.toDate())
                    .slice(0, 2)
                    .map(d => `📅 Exam: ${d.data().subject} on ${d.data().exam_date.toDate().toLocaleDateString()}`);
                setRecentActivity([...recentLessons, ...recentExams]);

                // 3. Lesson trends: count per day for past 7 days
                const today = new Date();
                const trend = [];
                for (let i = 6; i >= 0; i--) {
                    const day = new Date(today);
                    day.setDate(today.getDate() - i);
                    const label = day.toLocaleDateString('en-US', { weekday: 'short' });
                    const count = lSnap.docs.filter(doc => {
                        const d = doc.data().lesson_date.toDate();
                        return d.toDateString() === day.toDateString();
                    }).length;
                    trend.push({ day: label, count });
                }
                setLessonTrends(trend);

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
                {/* 1. Welcome Banner */}
                <div className="bg-white p-6 rounded shadow flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Welcome, Admin!</h1>
                        <p className="text-gray-600">Here’s an overview of your platform.</p>
                    </div>
                    <p className="text-gray-500">{new Date().toLocaleDateString()}</p>
                </div>

                {/* 2. Summary Cards */}
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
                    <Link to="/admin/lessons" className="bg-white p-4 rounded shadow flex items-center">
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

                {/* 3. Quick Actions */}
                <div className="bg-white p-6 rounded shadow space-y-4">
                    <h2 className="text-xl font-semibold">Quick Actions</h2>
                    <div className="flex flex-wrap gap-4">
                        <Link to="/admin/teachers/add" className="inline-flex items-center bg-blue-500 text-white px-4 py-2 rounded">
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

                {/* 4. Recent Activity */}
                <div className="bg-white p-6 rounded shadow">
                    <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
                    <ul className="list-disc list-inside text-sm space-y-2">
                        {recentActivity.map((act, i) => <li key={i}>{act}</li>)}
                    </ul>
                </div>

                {/* 5. Lessons per Week Chart */}
                <div className="bg-white p-6 rounded shadow">
                    <h2 className="text-xl font-semibold mb-4">Lessons This Week</h2>
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={lessonTrends}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="day" />
                            <YAxis allowDecimals={false} />
                            <Tooltip />
                            <Bar dataKey="count" fill="#8884d8" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </main>
        </div>
    );
};

export default AdminHomePage;
