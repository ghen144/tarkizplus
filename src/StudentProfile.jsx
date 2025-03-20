import React, { useState, useEffect } from 'react';
import { Calendar, BookOpen, AlertCircle, User, ArrowLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc, collection, getDocs, query, where , orderBy} from 'firebase/firestore';
import { db } from './firebase';
import Sidebar from './Sidebar';

const StudentProfile = () => {
    const navigate = useNavigate();
    const { studentId } = useParams();
    const [studentData, setStudentData] = useState(null);
    const [lessons, setLessons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchStudentDataAndLessons = async () => {
            if (!studentId) {
                setError('No student ID provided');
                setLoading(false);
                return;
            }

            try {
                console.log('Student ID from URL:', studentId); // Debugging

                // Fetch student data
                const studentRef = doc(db, 'students', studentId);
                const studentDoc = await getDoc(studentRef);

                if (studentDoc.exists()) {
                    const data = studentDoc.data();
                    setStudentData({
                        id: studentId,
                        ...data
                    });

                    // Fetch lessons for the specific student
                    const lessonsQuery = query(
                        collection(db, 'lessons'),
                        where('student_id', '==', studentId), // Filter by studentId
                        orderBy('lesson_date', 'desc') // Order by date in descending order
                    );
                    const lessonsSnapshot = await getDocs(lessonsQuery);
                    const lessonsList = lessonsSnapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }));
                    console.log('Fetched Lessons:', lessonsList); // Debugging
                    setLessons(lessonsList);
                } else {
                    setError('Student not found');
                }
            } catch (err) {
                console.error('Error fetching student or lessons:', err);
                setError(`Error loading data: ${err.message}`);
            } finally {
                setLoading(false);
            }
        };

        fetchStudentDataAndLessons();
    }, [studentId]);

    const handleReturn = () => {
        navigate('/students');
    };

    if (loading) {
        return (
            <div className="flex min-h-screen bg-gray-50">
                <Sidebar activePage="students" />
                <main className="ml-64 flex-1 p-6">
                    <div className="flex items-center justify-center h-full">
                        <p>Loading student data...</p>
                    </div>
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
                            <ArrowLeft className="h-5 w-5 text-gray-500 mr-2"/>
                            Return to Students
                        </button>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar activePage="students" />

            <main className="ml-0 flex-1 p-6">
                {/* Student Details Section */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex items-center gap-2 mb-4">
                        <BookOpen className="h-5 w-5 text-blue-500"/>
                        <h2 className="text-xl font-semibold">Student Details - {studentData?.name}</h2>
                    </div>
                    <div className="space-y-3">
                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded">
                            <User className="h-5 w-5 text-gray-500 mt-1"/>
                            <div>
                                <p className="font-medium">Grade</p>
                                <p className="text-sm text-gray-600">{studentData?.grade}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded">
                            <AlertCircle className="h-5 w-5 text-gray-500 mt-1"/>
                            <div>
                                <p className="font-medium">Subjects</p>
                                <p className="text-sm text-gray-600">
                                    {studentData?.subjects?.join(', ')}
                                </p>
                            </div>
                        </div>
                        {/* Add more fields as needed */}
                    </div>
                </div>

                {/* Lesson History Section */}
                <div className="bg-white p-6 rounded-lg shadow mt-6">
                    <div className="flex items-center gap-2 mb-4">
                        <BookOpen className="h-5 w-5 text-blue-500"/>
                        <h2 className="text-xl font-semibold">Lesson History</h2>
                    </div>
                    <div className="overflow-x-auto">
                        {lessons.length > 0 ? (
                            <table className="min-w-full bg-white">
                                <thead>
                                <tr>
                                    <th className="px-6 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Teacher</th>
                                    <th className="px-6 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Subject</th>
                                    <th className="px-6 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Notes</th>
                                    <th className="px-6 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Progress Assessment</th>

                                </tr>
                                </thead>
                                <tbody>
                                {lessons.map((lesson) => (
                                    <tr key={lesson.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 border-b border-gray-200">
                                            {lesson.lesson_date ? lesson.lesson_date.toDate().toLocaleDateString() : 'No date'}
                                        </td>
                                        <td className="px-6 py-4 border-b border-gray-200">
                                            {lesson.teacher_id || 'No teacher'}
                                        </td>
                                        <td className="px-6 py-4 border-b border-gray-200">
                                            {lesson.subject || 'No subject'}
                                        </td>
                                        <td className="px-6 py-4 border-b border-gray-200">
                                            {lesson.lesson_notes || 'No notes'}
                                        </td>
                                        <td className="px-6 py-4 border-b border-gray-200">
                                            {lesson.progress_assessment || 'No Progress Assessment'}
                                        </td>
                                    </tr>
                                ))}
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
                        onClick={handleReturn}
                    >
                        <ArrowLeft className="h-5 w-5 text-gray-500 mr-2"/>
                        Return to Students
                    </button>
                </div>
            </main>
        </div>
    );
};

export default StudentProfile;