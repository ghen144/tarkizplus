import React, { useState, useEffect } from 'react';
import {
    Calendar, Clock, BookOpen, AlertCircle, User, LogOut,
    FileText, Compass, Home, Users, BookOpenText
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { getAuth, signOut } from 'firebase/auth';
import Sidebar from './Sidebar'; // Import the Sidebar component

const HomePage = () => {
    // const [currentTime, setCurrentTime] = useState(new Date());
    const navigate = useNavigate();

    // Sample data
    const upcomingLessons = [
        { student: "Adam", subject: "Math", time: "3:00 PM", duration: "1 hour" },
        { student: "Sara", subject: "English", time: "4:30 PM", duration: "1 hour" },
        { student: "Mohammad", subject: "Science", time: "6:00 PM", duration: "1.5 hours" }
    ];

    const importantNotes = [
        "Adam's algebra exam is this Thursday",
        "Sara needs extra focus on reading comprehension",
        "Review this week's homework with Mohammad"
    ];



    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar activePage="dashboard"/>

            <main className="ml-64 flex-1 p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Today's Schedule */}
                    <div className="bg-white p-6 rounded-lg shadow">
                        <div className="flex items-center gap-2 mb-4">
                            <Calendar className="h-5 w-5 text-blue-500"/>
                            <h2 className="text-xl font-semibold">Today's Schedule</h2>
                        </div>
                        <div className="space-y-4">
                            {upcomingLessons.map((lesson, index) => (
                                <div key={index} className="flex items-start gap-4 p-3 bg-gray-50 rounded">
                                    <Clock className="h-5 w-5 text-gray-500 mt-1"/>
                                    <div>
                                        <p className="font-medium">{lesson.time} - {lesson.student}</p>
                                        <p className="text-sm text-gray-600">
                                            {lesson.subject} ({lesson.duration})
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Important Notes */}
                    <div className="bg-white p-6 rounded-lg shadow">
                        <div className="flex items-center gap-2 mb-4">
                            <AlertCircle className="h-5 w-5 text-red-500"/>
                            <h2 className="text-xl font-semibold">Important Notes</h2>
                        </div>
                        <div className="space-y-3">
                            {importantNotes.map((note, index) => (
                                <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded">
                                    <BookOpen className="h-5 w-5 text-gray-500 mt-1"/>
                                    <p>{note}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default HomePage;