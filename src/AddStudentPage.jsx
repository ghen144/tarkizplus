// AddStudentPage.jsx

import React, { useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { useNavigate } from 'react-router-dom';

const AddStudentPage = () => {
    const navigate = useNavigate();
    const [student, setStudent] = useState({
        student_id: "",
        name: "",
        grade: "",
        subjects: [],
        PreferredLearningStyle: "",
        attendance_count_weekly: "",
        calculator_or_formula_sheet: false,
        created_at: new Date().toLocaleDateString("en-GB"),
        extra_time: false,
        grade: "",
        learning_difficulties: false,
        oral_response_allowed: false,
        parent_phone_number: "",
        private_or_group_lessons: "",
        reading_accommodation: false,
        spelling_mistakes_ignored: false,
    });

    const allGrades = Array.from({ length: 12 }, (_, i) => `${i + 1}th Grade`);
    const availableSubjects = ["Hebrew", "English", "Math" , "Arabic"];
    const lessonTypes = ["Private", "Group"];

    const handleCheckboxChange = (subject) => {
        setStudent((prev) => {
            const updatedSubjects = prev.subjects.includes(subject)
                ? prev.subjects.filter((s) => s !== subject)
                : [...prev.subjects, subject];
            return { ...prev, subjects: updatedSubjects };
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!student.student_id || !student.name || !student.grade) {
            alert("Please fill in required fields: ID, Name, Grade");
            return;
        }
        try {
            await setDoc(doc(db, "students", student.student_id), student);
            alert("Student added successfully!");
            navigate("/admin/students");
        } catch (err) {
            console.error("Error adding student:", err);
            alert("Failed to add student.");
        }
    };

    return (
        <div className="p-6 max-w-2xl mx-auto bg-white shadow rounded">
            <h2 className="text-2xl font-bold mb-6">Add New Student</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block font-medium">Student ID *</label>
                    <input
                        type="text"
                        value={student.student_id}
                        onChange={(e) => setStudent({ ...student, student_id: e.target.value })}
                        className="w-full border p-2 rounded"
                        required
                    />
                </div>

                <div>
                    <label className="block font-medium">Full Name *</label>
                    <input
                        type="text"
                        value={student.name}
                        onChange={(e) => setStudent({ ...student, name: e.target.value })}
                        className="w-full border p-2 rounded"
                        required
                    />
                </div>

                <div>
                    <label className="block font-medium">Grade *</label>
                    <select
                        value={student.grade}
                        onChange={(e) => setStudent({ ...student, grade: e.target.value })}
                        className="w-full border p-2 rounded"
                        required
                    >
                        <option value="">Select grade</option>
                        {allGrades.map((grade) => (
                            <option key={grade} value={grade}>{grade}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block font-medium">Private or Group Lessons</label>
                    <select
                        value={student.private_or_group_lessons}
                        onChange={(e) => setStudent({ ...student, private_or_group_lessons: e.target.value })}
                        className="w-full border p-2 rounded"
                    >
                        <option value="">Select</option>
                        {lessonTypes.map((type) => (
                            <option key={type} value={type}>{type}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block font-medium">Preferred Learning Style</label>
                    <input
                        type="text"
                        value={student.PreferredLearningStyle}
                        onChange={(e) => setStudent({ ...student, PreferredLearningStyle: e.target.value })}
                        className="w-full border p-2 rounded"
                    />
                </div>

                <div>
                    <label className="block font-medium">Attendance Count Weekly</label>
                    <input
                        type="number"
                        value={student.attendance_count_weekly}
                        onChange={(e) => setStudent({ ...student, attendance_count_weekly: e.target.value })}
                        className="w-full border p-2 rounded"
                    />
                </div>

                <div>
                    <label className="block font-medium">Parent Phone Number</label>
                    <input
                        type="text"
                        value={student.parent_phone_number}
                        onChange={(e) => setStudent({ ...student, parent_phone_number: e.target.value })}
                        className="w-full border p-2 rounded"
                    />
                </div>

                {/* Subjects - Checkboxes */}
                <div>
                    <label className="block font-medium">Subjects</label>
                    <div className="flex gap-4 mt-2">
                        {availableSubjects.map((subject) => (
                            <label key={subject} className="flex items-center gap-1">
                                <input
                                    type="checkbox"
                                    checked={student.subjects.includes(subject)}
                                    onChange={() => handleCheckboxChange(subject)}
                                />
                                {subject}
                            </label>
                        ))}
                    </div>
                </div>

                {/* Booleans */}
                {[
                    { key: "reading_accommodation", label: "Reading Accommodation" },
                    { key: "oral_response_allowed", label: "Oral Response Allowed" },
                    { key: "extra_time", label: "Extra Time" },
                    { key: "spelling_mistakes_ignored", label: "Spelling Mistakes Ignored" },
                    { key: "calculator_or_formula_sheet", label: "Calculator or Formula Sheet" },
                    { key: "learning_difficulties", label: "Learning Difficulties" },
                ].map(({ key, label }) => (
                    <div key={key} className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={student[key]}
                            onChange={(e) => setStudent({ ...student, [key]: e.target.checked })}
                        />
                        <label>{label}</label>
                    </div>
                ))}

                <button
                    type="submit"
                    className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
                >
                    Save Student
                </button>
            </form>
        </div>
    );
};

export default AddStudentPage;
