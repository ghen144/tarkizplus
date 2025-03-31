import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from './firebase'; // Update to your firebase.js path
import {
    collection,
    getDocs,
    addDoc,
    serverTimestamp,
    query,
    where
} from 'firebase/firestore';
import { getAuth } from "firebase/auth";

function AddLesson() {
    const navigate = useNavigate();
    const auth = getAuth();
    const user = auth.currentUser;

    // State variables
    const [assignedStudents, setAssignedStudents] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState('');
    const [subject, setSubject] = useState('');
    const [date, setDate] = useState('');
    const [duration, setDuration] = useState('');
    const [lessonNotes, setLessonNotes] = useState('');
    const [progressAssessment, setProgressAssessment] = useState('');
    const [studentNum, setStudentNum] = useState('1');
    const [teacherId, setTeacherId] = useState(null);
    const [loading, setLoading] = useState(true);

    // Fetch assigned students
    useEffect(() => {
        const fetchAssignedStudents = async () => {
            if (!user) {
                console.error("❌ No user is logged in.");
                return;
            }

            console.log("🔹 Logged in as:", user.email);
            setLoading(true);

            try {
                // Get the teacher's document using their email
                const teachersSnapshot = await getDocs(
                    query(collection(db, "teachers"), where("email", "==", user.email))
                );

                if (teachersSnapshot.empty) {
                    console.error("❌ No teacher found for this email.");
                    setLoading(false);
                    return;
                }

                const teacherDoc = teachersSnapshot.docs[0];
                const teacherData = teacherDoc.data();
                setTeacherId(teacherDoc.id);  // Store teacher ID

                console.log("✅ Teacher found:", teacherData);

                // Get assigned students list
                const assignedStudentIds = teacherData.assigned_students || [];
                console.log("🎯 Assigned Students:", assignedStudentIds);

                // Fetch student details from Firestore
                const studentsSnapshot = await getDocs(collection(db, "students"));
                const studentList = studentsSnapshot.docs
                    .filter(doc => assignedStudentIds.includes(doc.id))  // Keep only assigned students
                    .map(doc => ({
                        id: doc.id,
                        name: doc.data().name
                    }));

                setAssignedStudents(studentList);
            } catch (error) {
                console.error("❌ Error fetching assigned students:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAssignedStudents();
    }, [user]);

    // Handle Form Submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!selectedStudent || !teacherId) {
            console.error("❌ Missing student or teacher ID.");
            return;
        }

        try {
            // Convert date string into Date object
            const dateObj = date ? new Date(date) : null;

            // Add lesson to Firestore
            await addDoc(collection(db, 'lessons'), {
                student_id: selectedStudent,  // Store student's ID
                teacher_id: teacherId,        // Store teacher's ID
                subject,
                lesson_date: dateObj || serverTimestamp(),
                duration_minutes: parseInt(duration, 10) || 0,
                lesson_notes: lessonNotes,
                progress_assessment: progressAssessment,
                student_num: parseInt(studentNum, 10),
                created_at: serverTimestamp(),
            });

            console.log("✅ Lesson successfully added!");
            navigate('/lesson-log');
        } catch (error) {
            console.error("❌ Error adding lesson:", error);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <h2 className="text-2xl font-bold mb-4">Add Lesson</h2>

            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow max-w-lg">
                {/* Student Dropdown */}
                <label className="block mb-2 font-semibold">Student</label>
                {loading ? (
                    <p>Loading students...</p>
                ) : (
                    <select
                        className="w-full p-2 mb-4 border rounded bg-white text-black"
                        value={selectedStudent}
                        onChange={(e) => setSelectedStudent(e.target.value)}
                        required
                    >
                        <option value="">-- Select a Student --</option>
                        {assignedStudents.map(stu => (
                            <option key={stu.id} value={stu.id}>
                                {stu.name || `Student ID: ${stu.id}`}
                            </option>
                        ))}
                    </select>
                )}

                {/* Subject Dropdown */}
                <label className="block mb-2 font-semibold">Subject</label>
                <select
                    className="w-full p-2 mb-4 border rounded bg-white text-black"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    required
                >
                    <option value="">-- Select Subject --</option>
                    <option value="Math">Math</option>
                    <option value="Hebrew">Hebrew</option>
                    <option value="Arabic">Arabic</option>
                    <option value="English">English</option>
                </select>

                {/* Date Picker */}
                <label className="block mb-2 font-semibold">Date</label>
                <input
                    type="date"
                    className="w-full p-2 mb-4 border rounded bg-white text-black"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                />

                {/* Duration Input */}
                <label className="block mb-2 font-semibold">Duration (minutes)</label>
                <input
                    type="number"
                    className="w-full p-2 mb-4 border rounded bg-white text-black"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="e.g. 60"
                    required
                />

                {/* Lesson Notes */}
                <label className="block mb-2 font-semibold">Lesson Notes</label>
                <textarea
                    className="w-full p-2 mb-4 border rounded bg-white text-black"
                    value={lessonNotes}
                    onChange={(e) => setLessonNotes(e.target.value)}
                    placeholder="Notes about the lesson..."
                />

                {/* Progress Assessment */}
                <label className="block mb-2 font-semibold">Progress Assessment</label>
                <input
                    type="text"
                    className="w-full p-2 mb-4 border rounded bg-white text-black"
                    value={progressAssessment}
                    onChange={(e) => setProgressAssessment(e.target.value)}
                    placeholder="e.g. Good, Needs Improvement, etc."
                />

                {/* Student Number (1-5) */}
                <label className="block mb-2 font-semibold">Student Number</label>
                <select
                    className="w-full p-2 mb-4 border rounded bg-white text-black"
                    value={studentNum}
                    onChange={(e) => setStudentNum(e.target.value)}
                >
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5">5</option>
                </select>

                {/* Submit Button */}
                <button
                    type="submit"
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                    Save Lesson
                </button>
            </form>
        </div>
    );
}

export default AddLesson;
