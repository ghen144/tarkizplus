import React, { useEffect, useState } from 'react';
import { Calendar, BookOpen, AlertCircle, User, Search } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import Sidebar from './Sidebar';
import { collection, getDocs, getDoc, doc, query, where } from 'firebase/firestore';
import { db } from './firebase';
import DropdownMenu from './DropdownMenu';
import { getAuth, onAuthStateChanged } from "firebase/auth";
import SkeletonLoader from './SkeletonLoader'; // Import the skeleton loader

const HomePage = () => {
    const navigate = useNavigate();
    const [lessons, setLessons] = useState([]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [currentTeacherId, setCurrentTeacherId] = useState(null); // State to store the logged-in teacher's ID
    const [loading, setLoading] = useState(false); // Add loading state
    const auth = getAuth(); // Initialize Firebase Auth

    // Debugging: Log the current teacher ID
    useEffect(() => {
        console.log("Current Teacher ID:", currentTeacherId);
    }, [currentTeacherId]);

    // Fetch the logged-in teacher's ID
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                // User is signed in, set the teacher_id to the user's uid
                console.log("User is signed in. UID:", user.uid);
                setCurrentTeacherId(user.uid);
            } else {
                // User is signed out, redirect to login page
                console.log("No user is signed in. Redirecting to login...");
                navigate('/login');
            }
        });

        // Cleanup subscription on unmount
        return () => unsubscribe();
    }, [auth, navigate]);

    // Fetch lessons for the logged-in teacher
    useEffect(() => {
        if (!currentTeacherId) return;

        const fetchLessonsForTeacher = async () => {
            setLoading(true); // Start loading
            console.log("Fetching lessons..."); // Debugging

            try {
                // Query the teachers collection to find the teacher's custom ID
                const teachersQuery = query(collection(db, "teachers"), where("uid", "==", currentTeacherId));
                const teachersSnapshot = await getDocs(teachersQuery);

                if (!teachersSnapshot.empty) {
                    const teacherDoc = teachersSnapshot.docs[0];
                    const teacherId = teacherDoc.id; // Custom ID (e.g., T007)

                    // Query the lessons collection for lessons assigned to this teacher
                    const lessonsQuery = query(collection(db, "lessons"), where("teacher_id", "==", teacherId));
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

                    setLessons(lessonsList); // Update lessons
                    console.log("Lessons fetched:", lessonsList); // Debugging
                } else {
                    console.log("No teacher found with UID:", currentTeacherId);
                }
            } catch (error) {
                console.error("Error fetching lessons:", error);
            } finally {
                setLoading(false); // Stop loading
                console.log("Loading complete."); // Debugging
            }
        };

        fetchLessonsForTeacher(); // Call the function
    }, [currentTeacherId]);

    const importantNotes = [
        "William has a Hebrew quiz tomorrow",
        "Emma has a maths homework due tomorrow",
        "Harry needs to finish his science project by Friday",
    ];

    const toggleDropdown = () => {
        setIsDropdownOpen(!isDropdownOpen);
    };

    const closeDropdown = () => {
        setIsDropdownOpen(false);
    };

    return (
        <div className="flex min-h-screen bg-gray-50">
            {/* Sidebar */}
            <div className="w-64 bg-white border-r h-screen fixed left-0 top-0 flex flex-col">
                <Sidebar activePage="home" />
            </div>

            {/* Main Content */}
            <main className="flex-1 ml-0">
                {/* Header Section */}
                <header className="bg-white p-4 border-b flex justify-between items-center">
                    <div>
                        <h1 className="text-xl font-semibold">Good Morning, Tom</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search"
                                className="pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div className="relative">
                            <button
                                onClick={toggleDropdown}
                                className="flex items-center gap-2 text-gray-600 hover:text-blue-500 focus:outline-none"
                            >
                                <img
                                    src="https://via.placeholder.com/40" // Replace with the actual user photo URL
                                    alt="User"
                                    className="h-10 w-10 rounded-full"
                                />
                            </button>

                            {/* Dropdown Menu */}
                            {isDropdownOpen && <DropdownMenu onClose={closeDropdown} />}
                        </div>
                    </div>
                </header>

                {/* Main Content Area */}
                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Today's Schedule */}
                        <div className="bg-white p-6 rounded-lg shadow">
                            <div className="flex items-center gap-2 mb-4">
                                <Calendar className="h-5 w-5 text-blue-500" />
                                <h2 className="text-xl font-semibold">Today's Schedule</h2>
                            </div>

                            {/* Content */}
                            <div className="space-y-4">
                                {loading ? ( // Show skeleton loader while loading
                                    <SkeletonLoader rows={3} showButton={true} />
                                ) : lessons.length > 0 ? ( // Show lessons if data is available
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
                                ) : ( // Show message if no lessons are scheduled
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
            </main>
        </div>
    );
};

export default HomePage;