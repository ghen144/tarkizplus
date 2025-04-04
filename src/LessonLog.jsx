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

// Predefined subject options (adjust as needed)
const SUBJECT_OPTIONS = ["Math", "English", "Hebrew", "Arabic"];

const LessonLog = () => {
    const auth = getAuth();
    const [lessons, setLessons] = useState([]);
    const [teachersMap, setTeachersMap] = useState({}); // teacher_id -> teacher_name
    const [studentsMap, setStudentsMap] = useState({}); // student_id -> student_name
    const [assignedStudentIds, setAssignedStudentIds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [teacherDocId, setTeacherDocId] = useState(""); // Logged-in teacher's doc ID

    // Control number of lessons fetched
    const [lessonsLimit, setLessonsLimit] = useState(10);

    // Dynamic filter states: arrays of selected teacher IDs and subjects
    const [selectedTeacherFilters, setSelectedTeacherFilters] = useState([]);
    const [selectedSubjectFilters, setSelectedSubjectFilters] = useState([]);

    // Fetch static data: teacher doc, assigned students, and maps for teachers and students.
    useEffect(() => {
        const fetchStaticData = async () => {
            try {
                const user = auth.currentUser;
                if (!user) {
                    console.error("No authenticated user found.");
                    setLoading(false);
                    return;
                }
                // Query teacher doc by email
                const teacherQuerySnapshot = await getDocs(
                    query(collection(db, "teachers"), where("email", "==", user.email))
                );
                if (teacherQuerySnapshot.empty) {
                    console.error("No teacher found with this email.");
                    setLoading(false);
                    return;
                }
                const teacherDoc = teacherQuerySnapshot.docs[0];
                setTeacherDocId(teacherDoc.id);
                const teacherData = teacherDoc.data();
                const assignedStudents = teacherData.assigned_students || [];
                setAssignedStudentIds(assignedStudents);

                // Build teachers map (id -> name)
                const allTeachersSnapshot = await getDocs(collection(db, "teachers"));
                const tMap = {};
                allTeachersSnapshot.docs.forEach((doc) => {
                    tMap[doc.id] = doc.data().name;
                });
                setTeachersMap(tMap);

                // Build students map (id -> name)
                const allStudentsSnapshot = await getDocs(collection(db, "students"));
                const sMap = {};
                allStudentsSnapshot.docs.forEach((doc) => {
                    sMap[doc.id] = doc.data().name;
                });
                setStudentsMap(sMap);
            } catch (error) {
                console.error("Error fetching static data:", error);
            }
        };

        fetchStaticData();
    }, [auth]);

    // Fetch lessons (base query), adding limit(lessonsLimit) so the user choice is respected
    useEffect(() => {
        const fetchLessons = async () => {
            try {
                if (assignedStudentIds.length === 0) {
                    setLessons([]);
                    setLoading(false);
                    return;
                }
                setLoading(true);
                const lessonsQuery = query(
                    collection(db, "lessons"),
                    where("student_id", "in", assignedStudentIds),
                    orderBy("lesson_date", "desc"),
                    limit(lessonsLimit)  // <-- IMPORTANT: now we use lessonsLimit here
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

        fetchLessons();
    }, [assignedStudentIds, lessonsLimit, auth]);

    // Client-side filtering based on selected teacher and subject filters
    const filteredLessons = lessons.filter((lesson) => {
        const teacherOk =
            selectedTeacherFilters.length === 0 ||
            selectedTeacherFilters.includes(lesson.teacher_id);
        const subjectOk =
            selectedSubjectFilters.length === 0 ||
            selectedSubjectFilters.includes(lesson.subject);
        return teacherOk && subjectOk;
    });

    // Handlers for adding filters using select inputs (resetting the select value after adding)
    const handleAddTeacherFilter = (e) => {
        const teacherId = e.target.value;
        if (teacherId && !selectedTeacherFilters.includes(teacherId)) {
            setSelectedTeacherFilters((prev) => [...prev, teacherId]);
        }
        e.target.value = ""; // reset select
    };

    const handleAddSubjectFilter = (e) => {
        const subject = e.target.value;
        if (subject && !selectedSubjectFilters.includes(subject)) {
            setSelectedSubjectFilters((prev) => [...prev, subject]);
        }
        e.target.value = "";
    };

    // Handlers for removing a filter chip
    const removeTeacherFilter = (teacherId) => {
        setSelectedTeacherFilters((prev) => prev.filter((id) => id !== teacherId));
    };

    const removeSubjectFilter = (subject) => {
        setSelectedSubjectFilters((prev) => prev.filter((s) => s !== subject));
    };

    return (
        <div className="p-6">
            {/* Header Row */}
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Recent Lessons</h2>
                <div className="flex items-center gap-4">
                    <Link
                        to="/lesson-log/add"
                        className="text-blue-500 hover:underline flex items-center gap-1"
                    >
                        ➕ <span>add</span>
                    </Link>
                    <div className="flex items-center">
                        <label htmlFor="lessonsLimit" className="mr-2 text-sm">
                            Show
                        </label>
                        <select
                            id="lessonsLimit"
                            value={lessonsLimit}
                            onChange={(e) => setLessonsLimit(parseInt(e.target.value, 10))}
                            className="border rounded p-1 text-sm"
                        >
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={30}>30</option>
                            <option value={50}>50</option>
                            {/* Add more if you want, e.g.:
              <option value={100}>100</option>
              <option value={200}>200</option>
              */}
                        </select>
                        <span className="ml-2 text-sm">lessons</span>
                    </div>
                </div>
            </div>

            {/* Filter Section */}
            <div className="mb-4 flex flex-col sm:flex-row gap-6">
                {/* Teacher Filter */}
                <div>
                    <p className="font-medium mb-1">Teacher</p>
                    <select
                        onChange={handleAddTeacherFilter}
                        className="border rounded p-1 text-sm"
                    >
                        <option value="">Select</option>
                        {Object.entries(teachersMap).map(([id, name]) => (
                            <option key={id} value={id}>
                                {name}
                            </option>
                        ))}
                    </select>
                    <div className="mt-2 flex flex-wrap gap-2">
                        {selectedTeacherFilters.map((id) => (
                            <span
                                key={id}
                                className="bg-blue-200 text-blue-800 rounded px-2 py-1 text-sm flex items-center"
                            >
                {teachersMap[id]}
                                <button
                                    onClick={() => removeTeacherFilter(id)}
                                    className="ml-1 text-blue-600 font-bold"
                                >
                  &times;
                </button>
              </span>
                        ))}
                    </div>
                </div>

                {/* Subject Filter */}
                <div>
                    <p className="font-medium mb-1">Subject</p>
                    <select
                        onChange={handleAddSubjectFilter}
                        className="border rounded p-1 text-sm"
                    >
                        <option value="">Select</option>
                        {SUBJECT_OPTIONS.map((subj) => (
                            <option key={subj} value={subj}>
                                {subj}
                            </option>
                        ))}
                    </select>
                    <div className="mt-2 flex flex-wrap gap-2">
                        {selectedSubjectFilters.map((subj) => (
                            <span
                                key={subj}
                                className="bg-green-200 text-green-800 rounded px-2 py-1 text-sm flex items-center"
                            >
                {subj}
                                <button
                                    onClick={() => removeSubjectFilter(subj)}
                                    className="ml-1 text-green-600 font-bold"
                                >
                  &times;
                </button>
              </span>
                        ))}
                    </div>
                </div>
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
                            <th className="p-2"></th>
                        </tr>
                        </thead>
                        <tbody>
                        {filteredLessons.length > 0 ? (
                            filteredLessons.map((lesson) => {
                                const canEdit = lesson.teacher_id === teacherDocId;
                                return (
                                    <tr key={lesson.id} className="border-b">
                                        <td className="p-2">
                                            {lesson.lesson_date.toDate().toLocaleDateString("en-GB")}
                                        </td>
                                        <td className="p-2">{lesson.subject}</td>
                                        <td className="p-2">
                                            {teachersMap[lesson.teacher_id] || "Unknown Teacher"}
                                        </td>
                                        <td className="p-2">
                                            {studentsMap[lesson.student_id] || "Unknown Student"}
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
