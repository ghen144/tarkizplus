// HomePage.jsx
import React, { useEffect, useState } from 'react';
import { Calendar, BookOpen, AlertCircle, User } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { collection, getDocs, getDoc, doc, query, where } from 'firebase/firestore';
import { db } from './firebase';
import SkeletonLoader from './SkeletonLoader';
import { getAuth, onAuthStateChanged } from "firebase/auth";

const HomePage = () => {
    const navigate = useNavigate();
    const [lessons, setLessons] = useState([]);
    const [currentTeacherId, setCurrentTeacherId] = useState(null);
    const [teacherName, setTeacherName] = useState('');
    const [loading, setLoading] = useState(false);
    const auth = getAuth();

    useEffect(() => {
        console.log("Current Teacher ID:", currentTeacherId);
    }, [currentTeacherId]);

    // Listen for authentication state and set teacher ID
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                console.log("User is signed in. UID:", user.uid);
                setCurrentTeacherId(user.uid);
            } else {
                console.log("No user is signed in. Redirecting to login...");
                navigate('/login');
            }
        });

        return () => unsubscribe();
    }, [auth, navigate]);

    // Fetch lessons for the logged-in teacher and get teacher details including name
    useEffect(() => {
        if (!currentTeacherId) return;

        const fetchLessonsForTeacher = async () => {
            setLoading(true);
            console.log("Fetching lessons...");

            try {
                // Query the teacher using their UID
                const teachersQuery = query(
                    collection(db, "teachers"),
                    where("uid", "==", currentTeacherId)
                );
                const teachersSnapshot = await getDocs(teachersQuery);

                if (!teachersSnapshot.empty) {
                    const teacherDoc = teachersSnapshot.docs[0];
                    const teacherData = teacherDoc.data();
                    // Set the teacher's name from the teacher document
                    setTeacherName(teacherData.name || 'Teacher');

                    const teacherId = teacherDoc.id;

                    // Query the lessons collection for lessons assigned to this teacher
                    const lessonsQuery = query(
                        collection(db, "lessons"),
                        where("teacher_id", "==", teacherId)
                    );
                    const lessonsSnapshot = await getDocs(lessonsQuery);

                    const lessonsList = [];
                    for (const lessonDoc of lessonsSnapshot.docs) {
                        const lessonData = lessonDoc.data();

                        // Fetch student details
                        const studentRef = doc(db, "students", lessonData.student_id);
                        const studentSnap = await getDoc(studentRef);

                        if (studentSnap.exists()) {
                            lessonsList.push({
                                id: lessonDoc.id,
                                ...lessonData,
                                studentName: studentSnap.data().name || 'Unknown Student',
                            });
                        }
                    }

                    setLessons(lessonsList);
                    console.log("Lessons fetched:", lessonsList);
                } else {
                    console.log("No teacher found with UID:", currentTeacherId);
                }
            } catch (error) {
                console.error("Error fetching lessons:", error);
            } finally {
                setLoading(false);
                console.log("Loading complete.");
            }
        };

        fetchLessonsForTeacher();
    }, [currentTeacherId]);

    const importantNotes = [
        "William has a Hebrew quiz tomorrow",
        "Emma has a maths homework due tomorrow",
        "Harry needs to finish his science project by Friday",
    ];

    return (
        <div className="p-6">
            {/* Since the header is already rendered by Layout, we only show the content here */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Today's Schedule Section */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex items-center gap-2 mb-4">
                        <Calendar className="h-5 w-5 text-blue-500" />
                        <h2 className="text-xl font-semibold">Today's Schedule</h2>
                    </div>

                    <div className="space-y-4">
                        {loading ? (
                            <SkeletonLoader rows={3} showButton={true} />
                        ) : lessons.length > 0 ? (
                            lessons.map((lesson) => (
                                <div key={lesson.id} className="p-4 bg-gray-50 rounded-lg">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-medium text-gray-800">{lesson.studentName}</p>
                                            <p className="text-gray-600 text-sm">
                                                {lesson.lesson_date.toDate().toLocaleString()}
                                            </p>
                                            <p className="text-gray-600 text-sm">Subject: {lesson.subject}</p>
                                        </div>
                                        <Link
                                            to={`/students/${lesson.student_id}`}
                                            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm bg-white px-3 py-2 rounded-md shadow-sm"
                                        >
                                            <User className="h-4 w-4" />
                                            View Profile
                                        </Link>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="flex justify-center items-center p-4">
                                <p className="text-gray-600">No lessons scheduled for today.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Keep in Mind Section */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex items-center gap-2 mb-4">
                        <AlertCircle className="h-5 w-5 text-red-500" />
                        <h2 className="text-xl font-semibold">Keep in Mind</h2>
                    </div>
                    <div className="space-y-3">
                        {importantNotes.map((note, index) => (
                            <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded">
                                <BookOpen className="h-5 w-5 text-gray-500 mt-1" />
                                <p>{note}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HomePage;
