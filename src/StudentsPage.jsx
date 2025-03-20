import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Search } from 'lucide-react';
import { db } from './firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import SkeletonLoader from './SkeletonLoader'; // Import the skeleton loader

function StudentsPage() {
    const navigate = useNavigate();
    const auth = getAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentTeacherId, setCurrentTeacherId] = useState(null); // State to store the logged-in teacher's ID

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

    // Fetch students only after currentTeacherId is set
    useEffect(() => {
        if (!currentTeacherId) return; // Do nothing if currentTeacherId is not set

        const fetchStudents = async () => {
            try {
                // Find the teacher document based on the logged-in teacher's UID
                const teachersQuery = query(collection(db, "teachers"), where("uid", "==", currentTeacherId));
                const teacherSnapshot = await getDocs(teachersQuery);

                if (teacherSnapshot.empty) {
                    console.error("No teacher found with this UID.");
                    setLoading(false);
                    return;
                }

                const teacherData = teacherSnapshot.docs[0].data();
                const assignedStudentIds = teacherData.assigned_students || [];

                // Fetch only the students assigned to the logged-in teacher
                const studentsCollection = collection(db, 'students');
                const studentsSnapshot = await getDocs(studentsCollection);

                const studentsList = studentsSnapshot.docs
                    .map(doc => ({ id: doc.id, ...doc.data() }))
                    .filter(student => assignedStudentIds.includes(student.student_id));

                setStudents(studentsList);
                setLoading(false);
            } catch (error) {
                console.error("Error fetching students:", error);
                setLoading(false);
            }
        };

        fetchStudents();
    }, [currentTeacherId]); // Run this effect only when currentTeacherId changes

    // Ensure we use the correct field name from Firestore
    const filteredStudents = students.filter((student) =>
        student.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleStudentClick = (student) => {
        navigate(`/students/${student.id}`);
    };

    return (
        <div>
            {/* Search Box */}
            <div className="mb-6 flex items-center bg-white p-3 rounded-lg shadow">
                <Search className="h-5 w-5 text-gray-500 mr-3" />
                <input
                    type="text"
                    placeholder="Search students..."
                    className="flex-1 focus:outline-none bg-white text-black p-2 rounded-md"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Students Grid */}
            {loading ? (
                // Use SkeletonLoader while loading
                <SkeletonLoader rows={3} />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredStudents.length > 0 ? (
                        filteredStudents.map((student) => (
                            <div
                                key={student.id}
                                className="bg-white p-6 rounded-lg shadow cursor-pointer hover:bg-gray-100"
                                onClick={() => handleStudentClick(student)}
                            >
                                <div className="flex items-center gap-3">
                                    <User className="h-12 w-12 text-gray-500" />
                                    <div>
                                        <h3 className="text-lg font-medium">{student.name}</h3>
                                        <p className="text-gray-500 text-sm">{student.grade}</p>
                                        <p className="text-gray-500 text-sm">
                                            {Array.isArray(student.subjects) ? student.subjects.join(', ') : student.subjects}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-gray-500">No students found.</p>
                    )}
                </div>
            )}
        </div>
    );
}

export default StudentsPage;