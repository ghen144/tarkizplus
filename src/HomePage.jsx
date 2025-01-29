import React, { useState, useEffect } from 'react';
import {
    Calendar, BookOpen, AlertCircle, User,
     Search
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
//import { getAuth, signOut } from 'firebase/auth';
import Sidebar from './Sidebar'; // Import the Sidebar component
import { collection, getDocs, getDoc } from 'firebase/firestore';
import { db } from './firebase'; // Import Firebase Firestore

const HomePage = () => {
    const navigate = useNavigate();
    const [lessons, setLessons] = useState([]);

    useEffect(() => {
        const fetchLessonsWithStudents = async () => {
            try {
                const lessonsSnapshot = await getDocs(collection(db, 'lessons'));
                const lessonsList = [];

                for (const lessonDoc of lessonsSnapshot.docs) {
                    const lessonData = lessonDoc.data();
                    console.log('Lesson Data:', lessonData);

                    // Since studentId is already a DocumentReference, use it directly
                    if (!lessonData.studentId) {
                        console.error('Invalid studentId:', lessonData.studentId);
                        continue;
                    }

                    // Get the student document directly using the reference
                    const studentSnap = await getDoc(lessonData.studentId);

                    if (!studentSnap.exists()) {
                        console.error('Student not found:', lessonData.studentId);
                        continue;
                    }

                    // Add the student name to the lesson data
                    lessonsList.push({
                        id: lessonDoc.id,
                        ...lessonData,
                        studentName: studentSnap.data().studentName || 'Unknown Student',
                    });
                }

                setLessons(lessonsList);
            } catch (error) {
                console.error('Error fetching lessons with students:', error);
            }
        };

        fetchLessonsWithStudents();
    }, []);

    const importantNotes = [
        "William has a Hebrew quiz tomorrow",
        "Emma has a maths homework due tomorrow",
        "Harry needs to finish his science project by Friday",
    ];

    return (
        <div className="flex min-h-screen bg-gray-50">
            {/* Sidebar */}
            <div className="w-64 bg-white border-r h-screen fixed left-0 top-0 flex flex-col">
                <Sidebar activePage="home"/>
            </div>

            {/* Main Content */}
            <main className="flex-1 ml-64">
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

                        <div className="flex items-center gap-2">
                            <User className="h-5 w-5 text-gray-600" />
                            <span className="text-gray-600">Tom Harrison</span>
                        </div>
                    </div>
                </header>

                {/* Main Content Area */}
                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Today's Schedule */}
                        <div className="bg-white p-6 rounded-lg shadow">
                            <div className="flex items-center gap-2 mb-4">
                                <Calendar className="h-5 w-5 text-blue-500"/>
                                <h2 className="text-xl font-semibold">Today's Schedule</h2>
                            </div>
                            <div className="space-y-4">
                                {lessons.map((lesson) => {
                                    const formattedTime = lesson.time
                                        ? lesson.time.toDate().toLocaleString()
                                        : 'No Time Specified';

                                    // Get the actual ID from the DocumentReference
                                    const studentId = lesson.studentId.id;  // Add this line

                                    return (
                                        <div key={lesson.id} className="p-4 bg-gray-50 rounded-lg mb-4">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="font-medium text-gray-800">{lesson.studentName}</p>
                                                    <p className="text-gray-600 text-sm">{formattedTime}</p>
                                                    <p className="text-gray-600 text-sm">Student: {lesson.subject}</p>
                                                </div>
                                                <Link
                                                    to={`/students/${studentId}`}  // Use studentId instead of lesson.studentId
                                                    className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm bg-white px-3 py-2 rounded-md shadow-sm"
                                                >
                                                    <User className="h-4 w-4" />
                                                    View Profile
                                                </Link>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Keep in Mind Section */}
                        <div className="bg-white p-6 rounded-lg shadow">
                            <div className="flex items-center gap-2 mb-4">
                                <AlertCircle className="h-5 w-5 text-red-500"/>
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