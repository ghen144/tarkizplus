import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    doc,
    getDoc,
    collection,
    getDocs,
    query,
    where,
    orderBy
} from "firebase/firestore";
import { db } from "./firebase";
import Sidebar from "./Sidebar";
import { ArrowLeft, BookOpen, AlertCircle, User, Smartphone, Calendar } from "lucide-react";

const StudentProfile = () => {
    const navigate = useNavigate();
    const { studentId } = useParams();

    const [studentData, setStudentData] = useState(null);
    const [lessons, setLessons] = useState([]);
    const [teachersMap, setTeachersMap] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchStudentDataAndLessons = async () => {
            if (!studentId) {
                setError("No student ID provided");
                setLoading(false);
                return;
            }

            try {
                // 1. Fetch the student document
                const studentRef = doc(db, "students", studentId);
                const studentDocSnap = await getDoc(studentRef);
                if (!studentDocSnap.exists()) {
                    setError("Student not found");
                    setLoading(false);
                    return;
                }
                const studentDocData = studentDocSnap.data();
                setStudentData({ id: studentId, ...studentDocData });

                // 2. Fetch lessons for this student
                const lessonsQuery = query(
                    collection(db, "lessons"),
                    where("student_id", "==", studentId),
                    orderBy("lesson_date", "desc")
                );
                const lessonsSnapshot = await getDocs(lessonsQuery);
                const lessonsList = lessonsSnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }));
                setLessons(lessonsList);

                // 3. Fetch all teachers for teacher name lookup
                const teachersSnap = await getDocs(collection(db, "teachers"));
                const tMap = {};
                teachersSnap.forEach((tdoc) => {
                    const tData = tdoc.data();
                    tMap[tdoc.id] = tData.name || "Unnamed Teacher";
                });
                setTeachersMap(tMap);

            } catch (err) {
                console.error("Error fetching student/lessons:", err);
                setError(`Error loading data: ${err.message}`);
            } finally {
                setLoading(false);
            }
        };

        fetchStudentDataAndLessons();
    }, [studentId]);

    const handleReturn = () => {
        navigate("/students");
    };

    if (loading) {
        return (
            <div className="flex min-h-screen bg-gray-50">
                <Sidebar activePage="students" />
                <main className="ml-64 flex-1 p-6 flex items-center justify-center">
                    <p>Loading student data...</p>
                </main>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex min-h-screen bg-gray-50">
                <Sidebar activePage="students" />
                <main className="ml-64 flex-1 p-6">
                    <div className="flex items-center justify-center h-full">
                        <p className="text-red-500">{error}</p>
                    </div>
                    <div className="mt-6">
                        <button
                            className="flex items-center bg-white p-3 rounded-lg shadow hover:bg-gray-100"
                            onClick={handleReturn}
                        >
                            <ArrowLeft className="h-5 w-5 text-gray-500 mr-2" />
                            Return to Students
                        </button>
                    </div>
                </main>
            </div>
        );
    }

    // Extract fields you want to display (adjust as needed)
    const {
        name,
        grade,
        subjects,
        learning_difficulty,
        parent_phone_number,
        preferred_learning_style,
        engagement_level,
        recent_performance,
        // ... any other fields
    } = studentData || {};

    // Convert array of subjects into a string
    const subjectsText = Array.isArray(subjects) ? subjects.join(", ") : "N/A";

    // Helper for lesson date
    const formatDate = (ts) => (ts ? ts.toDate().toLocaleDateString() : "No date");

    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar activePage="students" />

            <main className="ml-0 flex-1 p-6">
                {/* Student Details Card */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex items-center gap-2 mb-4">
                        <User className="h-5 w-5 text-blue-500" />
                        <h2 className="text-xl font-semibold">{name}'s Profile</h2>
                    </div>

                    {/*
            2) We'll use a grid with 3 columns on medium screens, 1 column on small screens
               so we can place fields side by side. Adjust `md:grid-cols-3` to `grid-cols-2` or `grid-cols-4` if needed
          */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Field 1 */}
                        <div className="p-3 bg-gray-50 rounded">
                            <p className="font-medium">Grade</p>
                            <p className="text-sm text-gray-600">{grade || "N/A"}</p>
                        </div>
                        {/* Field 2 */}
                        <div className="p-3 bg-gray-50 rounded">
                            <p className="font-medium">Engagement Level</p>
                            <p className="text-sm text-gray-600">{engagement_level || "N/A"}</p>
                        </div>
                        {/* Field 3 */}
                        <div className="p-3 bg-gray-50 rounded">
                            <p className="font-medium">Subjects</p>
                            <p className="text-sm text-gray-600">{subjectsText}</p>
                        </div>

                        {/* Field 4 */}
                        <div className="p-3 bg-gray-50 rounded">
                            <p className="font-medium">Preferred Learning Style</p>
                            <p className="text-sm text-gray-600">{preferred_learning_style || "N/A"}</p>
                        </div>
                        {/* Field 5 */}
                        <div className="p-3 bg-gray-50 rounded">
                            <p className="font-medium">Learning Difficulty</p>
                            <p className="text-sm text-gray-600">
                                {learning_difficulty ? "Yes" : "No"}
                            </p>
                        </div>
                        {/* Field 6 */}
                        <div className="p-3 bg-gray-50 rounded">
                            <p className="font-medium">Recent Performance</p>
                            <p className="text-sm text-gray-600">{recent_performance || "N/A"}</p>
                        </div>

                        {/* Field 7 */}
                        <div className="p-3 bg-gray-50 rounded">
                            <p className="font-medium">Parent Phone</p>
                            <p className="text-sm text-gray-600">{parent_phone_number || "N/A"}</p>
                        </div>
                        {/* ... Add more fields as needed in the grid */}
                    </div>
                </div>

                {/* Lesson History */}
                <div className="bg-white p-6 rounded-lg shadow mt-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Calendar className="h-5 w-5 text-blue-500" />
                        <h2 className="text-xl font-semibold">Lesson History</h2>
                    </div>
                    <div className="overflow-x-auto">
                        {lessons.length > 0 ? (
                            <table className="min-w-full bg-white">
                                <thead>
                                <tr>
                                    <th className="px-6 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Date
                                    </th>
                                    <th className="px-6 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Teacher
                                    </th>
                                    <th className="px-6 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Subject
                                    </th>
                                    <th className="px-6 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Notes
                                    </th>
                                    <th className="px-6 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Progress
                                    </th>
                                </tr>
                                </thead>
                                <tbody>
                                {lessons.map((lesson) => {
                                    const teacherName =
                                        teachersMap[lesson.teacher_id] || lesson.teacher_id || "No teacher";

                                    return (
                                        <tr key={lesson.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 border-b border-gray-200">
                                                {formatDate(lesson.lesson_date)}
                                            </td>
                                            <td className="px-6 py-4 border-b border-gray-200">
                                                {teacherName}
                                            </td>
                                            <td className="px-6 py-4 border-b border-gray-200">
                                                {lesson.subject || "No subject"}
                                            </td>
                                            <td className="px-6 py-4 border-b border-gray-200">
                                                {lesson.lesson_notes || "No notes"}
                                            </td>
                                            <td className="px-6 py-4 border-b border-gray-200">
                                                {lesson.progress_assessment || "No Progress"}
                                            </td>
                                        </tr>
                                    );
                                })}
                                </tbody>
                            </table>
                        ) : (
                            <p className="text-gray-500">No lessons found for this student.</p>
                        )}
                    </div>
                </div>

                {/* Return Button */}
                <div className="mt-6">
                    <button
                        className="flex items-center bg-white p-3 rounded-lg shadow hover:bg-gray-100"
                        onClick={() => navigate("/students")}
                    >
                        <ArrowLeft className="h-5 w-5 text-gray-500 mr-2" />
                        Return to Students
                    </button>
                </div>
            </main>
        </div>
    );
};

export default StudentProfile;

