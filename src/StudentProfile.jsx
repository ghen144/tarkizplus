import React from 'react';
import {Calendar, Clock, BookOpen, AlertCircle, User, LogOut, Home, Users, BookOpenText, ArrowLeft} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import Sidebar from './Sidebar'; // Import the Sidebar component


const StudentProfile = () => {
    const navigate = useNavigate();
    const studentData = {
        name: 'Liam',
        age: 10,
        class: '5th Grade',
        school: 'Al Razi',
        id: '987654321',
        subjects: ['Math', 'Science'],
        challenges: 'Needs Short Breaks',
        additionalInfo: [
            'The student has mild ADHD; requires short breaks during lessons.',
            'Allergic to peanuts; ensure safe snacks.'
        ]
    };
    const handleReturn = () => {
        navigate('/students');
    };
    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar activePage="students" />

            <main className="ml-64 flex-1 p-6">
                <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex items-center gap-2 mb-4">
                        <BookOpen className="h-5 w-5 text-blue-500"/>
                        <h2 className="text-xl font-semibold">Student Details</h2>
                    </div>
                    <div className="space-y-3">
                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded">
                            <Calendar className="h-5 w-5 text-gray-500 mt-1"/>
                            <div>
                                <p className="font-medium">Class</p>
                                <p className="text-sm text-gray-600">{studentData.class}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded">
                            <User className="h-5 w-5 text-gray-500 mt-1"/>
                            <div>
                                <p className="font-medium">School</p>
                                <p className="text-sm text-gray-600">{studentData.school}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded">
                            <AlertCircle className="h-5 w-5 text-gray-500 mt-1"/>
                            <div>
                                <p className="font-medium">Challenging Subjects</p>
                                <p className="text-sm text-gray-600">{studentData.subjects.join(', ')}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded">
                            <AlertCircle className="h-5 w-5 text-gray-500 mt-1"/>
                            <div>
                                <p className="font-medium">Focus Challenges</p>
                                <p className="text-sm text-gray-600">{studentData.challenges}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded">
                            <BookOpen className="h-5 w-5 text-gray-500 mt-1"/>
                            <div>
                                <p className="font-medium">Additional Information</p>
                                <ul className="text-sm text-gray-600 list-disc pl-5">
                                    {studentData.additionalInfo.map((info, index) => (
                                        <li key={index}>{info}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
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
};

export default StudentProfile;