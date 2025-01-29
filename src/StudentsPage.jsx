import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Search } from 'lucide-react';
import Sidebar from './Sidebar';
import { db } from './firebase'; // Import Firebase Firestore
import { collection, getDocs } from 'firebase/firestore';

const StudentsPage = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [students, setStudents] = useState([]); // State to store students

    // Fetch students from Firestore
    useEffect(() => {
        const fetchStudents = async () => {
            const querySnapshot = await getDocs(collection(db, 'students'));
            const studentsList = querySnapshot.docs.map(doc => ({
                id: doc.id, // Include the document ID
                ...doc.data() // Spread the document data
            }));
            setStudents(studentsList);
        };

        fetchStudents();
    }, []);

    // Filter students based on search term
    const filteredStudents = students.filter((student) =>
        student.studentName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Handle student click
    const handleStudentClick = (student) => {
        navigate(`/students/${student.id}`); // Use student ID for routing
    };

    // Handle search input change
    const handleSearchChange = (event) => {
        setSearchTerm(event.target.value);
    };

    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar activePage="students" />
            <main className="ml-64 flex-1 p-6">
                <div className="mb-6">
                    <div className="flex items-center bg-white p-3 rounded-lg shadow">
                        <Search className="h-5 w-5 text-gray-500 mr-3" />
                        <input
                            type="text"
                            placeholder="Search students..."
                            className="flex-1 focus:outline-none"
                            value={searchTerm}
                            onChange={handleSearchChange}
                        />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredStudents.map((student, index) => (
                        <div
                            key={index}
                            className="bg-white p-6 rounded-lg shadow cursor-pointer hover:bg-gray-100"
                            onClick={() => handleStudentClick(student)}
                        >
                            <div className="flex items-center gap-3">
                                <User className="h-12 w-12 text-gray-500" />
                                <div>
                                    <h3 className="text-lg font-medium">{student.studentName}</h3>
                                    <p className="text-gray-500 text-sm">{student.grade}</p>
                                    <p className="text-gray-500 text-sm">{student.subjects.join(', ')}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
};

export default StudentsPage;