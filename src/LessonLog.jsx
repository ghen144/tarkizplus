import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { db } from "./firebase";
import {
    collection,
    getDocs,
    query,
    orderBy,
    where,
    limit,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";

const LessonLog = () => {
    const auth = getAuth();
    const [lessons, setLessons] = useState([]);
    const [teachers, setTeachers] = useState({});
    const [students, setStudents] = useState({});
    const [assignedStudentIds, setAssignedStudentIds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [teacherDocId, setTeacherDocId] = useState(""); // Logged-in teacher's doc ID

    useEffect(() => {
        const fetchData = async () => {
            try {
                const user = auth.currentUser;
                if (!user) {
                    console.error("No authenticated user found.");
                    setLoading(false);
                    return;
                }

                // 1. Find the teacher's document based on the logged-in user's email
                const teachersSnapshot = await getDocs(
                    query(collection(db, "teachers"), where("email", "==", user.email))
                );
                if (teachersSnapshot.empty) {
                    console.error("No teacher found with this email.");
                    setLoading(false);
                    return;
                }

                const teacherDoc = teachersSnapshot.docs[0];
                setTeacherDocId(teacherDoc.id); // e.g. "T001"

                const teacherData = teacherDoc.data();
                const assignedStudents = teacherData.assigned_students || [];
                setAssignedStudentIds(assignedStudents);

                if (assignedStudents.length === 0) {
                    console.error("No assigned students found for this teacher.");
                    setLoading(false);
                    return;
                }

                // 2. Fetch the 10 most recent lessons for assigned students
                const lessonsQuery = query(
                    collection(db, "lessons"),
                    where("student_id", "in", assignedStudents),
                    orderBy("lesson_date", "desc"),
                    limit(10)
                );
                const lessonsSnapshot = await getDocs(lessonsQuery);

                const lessonsList = lessonsSnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }));
                setLessons(lessonsList);

                // 3. Fetch all teachers to display teacher names
                const allTeachersSnapshot = await getDocs(collection(db, "teachers"));
                const teachersMap = {};
                allTeachersSnapshot.docs.forEach((doc) => {
                    teachersMap[doc.id] = doc.data().name;
                });
                setTeachers(teachersMap);

                // 4. Fetch all students to display student names
                const allStudentsSnapshot = await getDocs(collection(db, "students"));
                const studentsMap = {};
                allStudentsSnapshot.docs.forEach((doc) => {
                    studentsMap[doc.id] = doc.data().name;
                });
                setStudents(studentsMap);
            } catch (error) {
                console.error("Error fetching lessons:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [auth]);

    return (
        <div className="p-6">
            <h2 className="text-xl font-bold mb-4">Recent Lessons</h2>

            {/* Add Button */}
            <div className="flex gap-4 mb-4">
                <Link
                    to="/lesson-log/add"
                    className="text-blue-500 hover:underline flex items-center gap-1"
                >
                    ➕ <span>add</span>
                </Link>
            </div>

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
                            <th className="p-2"></th>
                        </tr>
                        </thead>
                        <tbody>
                        {lessons.length > 0 ? (
                            lessons.map((lesson) => {
                                const canEdit = lesson.teacher_id === teacherDocId;
                                return (
                                    <tr key={lesson.id} className="border-b">
                                        <td className="p-2">
                                            {lesson.lesson_date.toDate().toLocaleDateString("en-GB")}
                                        </td>
                                        <td className="p-2">{lesson.subject}</td>
                                        <td className="p-2">
                                            {teachers[lesson.teacher_id] || "Unknown Teacher"}
                                        </td>
                                        <td className="p-2">
                                            {students[lesson.student_id] || "Unknown Student"}
                                        </td>
                                        <td className="p-2">
                                            <div className="flex items-center justify-between w-full">
                                                <Link
                                                    to={`/lesson-log/${lesson.id}/details`}
                                                    className="text-blue-500 hover:underline cursor-pointer"
                                                >
                                                    show more
                                                </Link>
                                                {canEdit && (
                                                    <Link
                                                        to={`/lesson-log/${lesson.id}/edit`}
                                                        className="text-blue-500 hover:text-blue-700"
                                                        title="Edit this lesson"
                                                    >
                                                        📝
                                                    </Link>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan="5" className="p-4 text-center">
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
