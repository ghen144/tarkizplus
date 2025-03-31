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

    // States for static data
    const [teacherDocId, setTeacherDocId] = useState(""); // Logged-in teacher's doc ID
    const [assignedStudentIds, setAssignedStudentIds] = useState([]);
    const [teachers, setTeachers] = useState({});
    const [students, setStudents] = useState({});

    // States for lessons and loading
    const [lessons, setLessons] = useState([]);
    const [loadingLessons, setLoadingLessons] = useState(true);

    // State for the number of lessons to fetch (default 10)
    const [lessonsLimit, setLessonsLimit] = useState(10);

    // --- Fetch teacher data and static teachers/students maps (runs once) ---
    useEffect(() => {
        const fetchStaticData = async () => {
            try {
                const user = auth.currentUser;
                if (!user) {
                    console.error("No authenticated user found.");
                    return;
                }

                // Fetch teacher document for the logged-in teacher (by email)
                const teacherQuery = query(
                    collection(db, "teachers"),
                    where("email", "==", user.email)
                );
                const teacherSnapshot = await getDocs(teacherQuery);
                if (teacherSnapshot.empty) {
                    console.error("No teacher found with this email.");
                    return;
                }
                const teacherDoc = teacherSnapshot.docs[0];
                setTeacherDocId(teacherDoc.id);
                const teacherData = teacherDoc.data();
                const assignedStudents = teacherData.assigned_students || [];
                setAssignedStudentIds(assignedStudents);

                // Fetch all teachers map
                const teachersSnapshot = await getDocs(collection(db, "teachers"));
                const teachersMap = {};
                teachersSnapshot.docs.forEach((doc) => {
                    teachersMap[doc.id] = doc.data().name;
                });
                setTeachers(teachersMap);

                // Fetch all students map
                const studentsSnapshot = await getDocs(collection(db, "students"));
                const studentsMap = {};
                studentsSnapshot.docs.forEach((doc) => {
                    studentsMap[doc.id] = doc.data().name;
                });
                setStudents(studentsMap);
            } catch (error) {
                console.error("Error fetching static data:", error);
            }
        };

        fetchStaticData();
    }, [auth]);

    // --- Fetch lessons based on assignedStudentIds and lessonsLimit ---
    useEffect(() => {
        const fetchLessons = async () => {
            setLoadingLessons(true);
            try {
                if (assignedStudentIds.length === 0) {
                    // No assigned students—nothing to fetch
                    setLessons([]);
                    return;
                }
                const lessonsQuery = query(
                    collection(db, "lessons"),
                    where("student_id", "in", assignedStudentIds),
                    orderBy("lesson_date", "desc"),
                    limit(lessonsLimit)
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
                setLoadingLessons(false);
            }
        };

        fetchLessons();
    }, [assignedStudentIds, lessonsLimit]);

    return (
        <div className="p-6">
            <h2 className="text-xl font-bold mb-4">Recent Lessons</h2>

            {/* Controls: Add Button and Lessons Limit Dropdown */}
            <div className="flex flex-col sm:flex-row gap-4 mb-4 items-center justify-between">
                <Link
                    to="/lesson-log/add"
                    className="text-blue-500 hover:underline flex items-center gap-1"
                >
                    ➕ <span>add</span>
                </Link>

                {/* Dropdown for selecting the number of lessons to display */}
                <div className="flex items-center gap-2">
                    <label htmlFor="lessonsLimit" className="text-sm">
                        Show
                    </label>
                    <select
                        id="lessonsLimit"
                        value={lessonsLimit}
                        onChange={(e) => setLessonsLimit(parseInt(e.target.value, 10))}
                        className="border rounded p-1"
                    >
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                    </select>
                    <span className="text-sm">lessons</span>
                </div>
            </div>

            <div className="bg-gray-100 p-4 rounded-lg shadow-md">
                {loadingLessons ? (
                    <p>Loading lessons...</p>
                ) : (
                    <table className="w-full border-collapse">
                        <thead>
                        <tr className="border-b">
                            <th className="text-left p-2">Date</th>
                            <th className="text-left p-2">Subject</th>
                            <th className="text-left p-2">Teacher</th>
                            <th className="text-left p-2">Student(s)</th>
                            {/* Empty header for the final column */}
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
                                        {/* Final cell: "show more" on the left, edit icon on the right */}
                                        <td className="p-2">
                                            <div className="flex items-center justify-between w-full">
                          <span className="text-blue-500 cursor-pointer">
                            show more
                          </span>
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
