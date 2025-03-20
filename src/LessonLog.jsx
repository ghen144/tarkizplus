import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { db } from "./firebase"; // Ensure correct path to Firebase config
import { collection, getDocs, query, orderBy, where, limit } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const LessonLog = () => {
    const auth = getAuth();
    const [lessons, setLessons] = useState([]);
    const [teachers, setTeachers] = useState({});
    const [students, setStudents] = useState({});
    const [assignedStudentIds, setAssignedStudentIds] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLessonsForTeacher = async () => {
            try {
                const user = auth.currentUser;
                if (!user) {
                    console.error("No authenticated user found.");
                    setLoading(false);
                    return;
                }

                // 🔹 Find the teacher's document based on email
                const teachersSnapshot = await getDocs(query(collection(db, "teachers"), where("email", "==", user.email)));

                if (teachersSnapshot.empty) {
                    console.error("No teacher found with this email.");
                    setLoading(false);
                    return;
                }

                const teacherData = teachersSnapshot.docs[0].data();
                const assignedStudents = teacherData.assigned_students || [];
                setAssignedStudentIds(assignedStudents);

                if (assignedStudents.length === 0) {
                    console.error("No assigned students found for this teacher.");
                    setLoading(false);
                    return;
                }

                // 🔹 Fetch the 10 most recent lessons for assigned students
                const lessonsQuery = query(
                    collection(db, "lessons"),
                    where("student_id", "in", assignedStudents), // Filter lessons only for assigned students
                    orderBy("lesson_date", "desc"),
                    limit(10)
                );

                const lessonsSnapshot = await getDocs(lessonsQuery);
                const lessonsList = lessonsSnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }));

                setLessons(lessonsList);
            } catch (error) {
                console.error("Error fetching lessons:", error);
            } finally {
                setLoading(false);
            }
        };

        const fetchTeachers = async () => {
            try {
                const teachersSnapshot = await getDocs(collection(db, "teachers"));
                const teachersMap = {};
                teachersSnapshot.docs.forEach((doc) => {
                    teachersMap[doc.id] = doc.data().name; // ✅ Ensure correct field name
                });
                setTeachers(teachersMap);
            } catch (error) {
                console.error("Error fetching teachers:", error);
            }
        };

        const fetchStudents = async () => {
            try {
                const studentsSnapshot = await getDocs(collection(db, "students"));
                const studentsMap = {};
                studentsSnapshot.docs.forEach((doc) => {
                    studentsMap[doc.id] = doc.data().name; // ✅ Ensure correct field name
                });
                setStudents(studentsMap);
            } catch (error) {
                console.error("Error fetching students:", error);
            }
        };

        Promise.all([fetchLessonsForTeacher(), fetchTeachers(), fetchStudents()])
            .catch(() => setLoading(false));

    }, []);

    return (
        <div className="p-6">
            <h2 className="text-xl font-bold mb-4">Recent Lessons</h2>

            {/* Add & Edit Icons */}
            <div className="flex gap-4 mb-4">
                <Link to="/lesson-log/add" className="text-blue-500 hover:underline flex items-center gap-1">
                    ➕ <span>add</span>
                </Link>
                <button className="text-gray-500 flex items-center">✏️ edit</button>
            </div>

            {/* Lessons Table */}
            <div className="bg-gray-100 p-4 rounded-lg shadow-md">
                {loading ? (
                    <p>Loading lessons...</p>
                ) : (
                    <table className="w-full border-collapse">
                        <thead>
                        <tr className="border-b">
                            <th className="text-left p-2">Date</th>
                            <th className="text-left p-2">Subject</th>
                            <th className="text-left p-2">Teacher</th>
                            <th className="text-left p-2">Student(s)</th>
                        </tr>
                        </thead>
                        <tbody>
                        {lessons.length > 0 ? (
                            lessons.map((lesson) => (
                                <tr key={lesson.id} className="border-b">
                                    <td className="p-2">{lesson.lesson_date.toDate().toLocaleDateString("en-GB")}</td>
                                    <td className="p-2">{lesson.subject}</td>
                                    <td className="p-2">{teachers[lesson.teacher_id] || "Unknown Teacher"}</td>
                                    <td className="p-2 flex justify-between">
                                        <span>{students[lesson.student_id] || "Unknown Student"}</span>
                                        <span className="text-blue-500 cursor-pointer">show more</span>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="4" className="p-4 text-center">
                                    No lessons available.
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default LessonLog;
