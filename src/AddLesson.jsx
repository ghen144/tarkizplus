import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from './firebase';
import { setDoc, doc, getDocs, collection, query, orderBy, limit, serverTimestamp, addDoc } from 'firebase/firestore';
import { getAuth } from "firebase/auth";

function AddLesson() {
    const navigate = useNavigate();
    const auth = getAuth();
    const user = auth.currentUser;

    const [assignedStudents, setAssignedStudents] = useState([]);
    const [selectedStudents, setSelectedStudents] = useState([]); // Store selected students
    const [subject, setSubject] = useState('');
    const [date, setDate] = useState('');
    const [duration, setDuration] = useState('');
    const [lessonNotes, setLessonNotes] = useState('');
    const [progressAssessment, setProgressAssessment] = useState('');
    const [teacherId, setTeacherId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false); // Control dropdown visibility

    // Fetch assigned students
    useEffect(() => {
        const fetchAssignedStudents = async () => {
            if (!user) {
                console.error("❌ No user is logged in.");
                return;
            }

            setLoading(true);

            try {
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
                setTeacherId(teacherDoc.id);

                const assignedStudentIds = teacherData.assigned_students || [];
                const studentsSnapshot = await getDocs(collection(db, "students"));
                const studentList = studentsSnapshot.docs
                    .filter(doc => assignedStudentIds.includes(doc.id))
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

    // Handle student selection
    const handleStudentSelect = (student) => {
        if (selectedStudents.some(s => s.id === student.id)) {
            // If already selected, remove it
            setSelectedStudents(selectedStudents.filter(s => s.id !== student.id));
        } else {
            // Add to selected students
            setSelectedStudents([...selectedStudents, student]);
        }
    };

    // Handle Form Submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (selectedStudents.length === 0 || !teacherId) {
            console.error("❌ Missing students or teacher ID.");
            return;
        }

        try {
            const dateObj = date ? new Date(date) : null;

            for (const student of selectedStudents) {
                await addDoc(collection(db, 'lessons'), {
                    student_id: student.id,
                    teacher_id: teacherId,
                    subject,
                    lesson_date: dateObj || serverTimestamp(),
                    duration_minutes: parseInt(duration, 10) || 0,
                    lesson_notes: lessonNotes,
                    progress_assessment: progressAssessment,
                    student_num: selectedStudents.length, // Automatically set number of students
                    created_at: serverTimestamp(),
                });
            }

            console.log("✅ Lessons successfully added!");
            navigate('/lesson-log');
        } catch (error) {
            console.error("❌ Error adding lessons:", error);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <h2 className="text-2xl font-bold mb-4">Add Lesson</h2>

            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow max-w-lg">
                {/* Student Multi-Select Dropdown */}
                <label className="block mb-2 font-semibold">Students</label>
                {loading ? (
                    <p>Loading students...</p>
                ) : (
                    <div className="relative mb-4">
                        {/* Selected Students Display */}
                        <div className="flex flex-wrap gap-2 mb-2">
                            {selectedStudents.map(student => (
                                <div
                                    key={student.id}
                                    className="bg-blue-100 text-blue-800 px-2 py-1 rounded flex items-center gap-2"
                                >
                                    <span>{student.name}</span>
                                    <button
                                        type="button"
                                        onClick={() => handleStudentSelect(student)}
                                        className="text-red-500 hover:text-red-700"
                                    >
                                        &times;
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Dropdown Button */}
                        <button
                            type="button"
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="w-full p-2 border rounded bg-white text-black text-left"
                        >
                            Select students...
                        </button>

                        {/* Dropdown Menu */}
                        {isDropdownOpen && (
                            <div className="absolute z-10 w-full bg-white border rounded shadow mt-1 max-h-48 overflow-y-auto">
                                {assignedStudents.map(student => (
                                    <div
                                        key={student.id}
                                        onClick={() => handleStudentSelect(student)}
                                        className={`p-2 hover:bg-gray-100 cursor-pointer ${
                                            selectedStudents.some(s => s.id === student.id) ? 'bg-blue-50' : ''
                                        }`}
                                    >
                                        {student.name}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
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