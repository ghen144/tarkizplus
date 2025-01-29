import React, { useState, useEffect } from 'react';
import { Calendar, Clock, BookOpen, AlertCircle, User, LogOut, Home, Users, BookOpenText, ArrowLeft } from 'lucide-react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase'; // Update this path to match your firebase.js location
import Sidebar from './Sidebar';

const StudentProfile = () => {
    const navigate = useNavigate();
    const { studentId } = useParams();
    const [studentData, setStudentData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchStudentData = async () => {
            if (!studentId) {
                setError('No student ID provided');
                setLoading(false);
                return;
            }

            try {
                // Create a reference to the student document using the document ID
                const studentRef = doc(db, 'students', studentId);
                const studentDoc = await getDoc(studentRef);

                if (studentDoc.exists()) {
                    const data = studentDoc.data();
                    setStudentData({
                        id: studentId,  // Use the document ID from params
                        ...data  // Spread all the data from the document
                    });
                } else {
                    setError('Student not found');
                }
            } catch (err) {
                console.error('Error fetching student:', err);
                setError(`Error loading student data: ${err.message}`);
            } finally {
                setLoading(false);
            }
        };

        fetchStudentData();
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

            <main className="ml-64 flex-1 p-6">
                <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex items-center gap-2 mb-4">
                        <BookOpen className="h-5 w-5 text-blue-500"/>
                        <h2 className="text-xl font-semibold">Student Details - {studentData?.studentName}</h2>
                    </div>
                    <div className="space-y-3">
                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded">
                            <Calendar className="h-5 w-5 text-gray-500 mt-1"/>
                            <div>
                                <p className="font-medium">Class</p>
                                <p className="text-sm text-gray-600">{studentData?.grade}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded">
                            <User className="h-5 w-5 text-gray-500 mt-1"/>
                            <div>
                                <p className="font-medium">School</p>
                                <p className="text-sm text-gray-600">{studentData?.school}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded">
                            <AlertCircle className="h-5 w-5 text-gray-500 mt-1"/>
                            <div>
                                <p className="font-medium">Challenging Subjects</p>
                                <p className="text-sm text-gray-600">
                                    {studentData?.subjects?.length > 0 ?
                                        studentData.subjects.join(', ') :
                                        'None specified'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded">
                            <AlertCircle className="h-5 w-5 text-gray-500 mt-1"/>
                            <div>
                                <p className="font-medium">Focus Challenges</p>
                                <p className="text-sm text-gray-600">{studentData?.challenges}</p>
                            </div>
                        </div>
                        {studentData?.additionalInfo?.length > 0 && (
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
                        )}
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