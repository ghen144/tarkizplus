import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';

function AdminStudentsPage() {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sortOrder, setSortOrder] = useState("asc");
    const [selectedGrades, setSelectedGrades] = useState([]);
    const [selectedSubjects, setSelectedSubjects] = useState([]);
    const [gradeDropdownOpen, setGradeDropdownOpen] = useState(false);
    const [subjectDropdownOpen, setSubjectDropdownOpen] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchStudents = async () => {
            try {
                const snapshot = await getDocs(collection(db, 'students'));
                const studentList = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setStudents(studentList);
            } catch (error) {
                console.error("Error fetching students:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStudents();
    }, []);

    const handleStudentClick = (studentId) => {
        navigate(`/students/${studentId}`);
    };

    const toggleSelection = (value, selectedList, setSelectedList) => {
        if (selectedList.includes(value)) {
            setSelectedList(selectedList.filter((v) => v !== value));
        } else {
            setSelectedList([...selectedList, value]);
        }
    };

    const removeTag = (value, setSelectedList) => {
        setSelectedList(prev => prev.filter(v => v !== value));
    };

    const filteredStudents = students
        .filter(student =>
            (selectedGrades.length === 0 || selectedGrades.includes(student.grade)) &&
            (
                selectedSubjects.length === 0 ||
                (Array.isArray(student.subjects) && student.subjects.some(sub => selectedSubjects.includes(sub)))
            )
        )
        .sort((a, b) => {
            const nameA = a.name?.toLowerCase() || "";
            const nameB = b.name?.toLowerCase() || "";
            return sortOrder === "asc" ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
        });

    const allGrades = Array.from(new Set(students.map(s => s.grade))).filter(Boolean);
    const allSubjects = Array.from(new Set(students.flatMap(s => Array.isArray(s.subjects) ? s.subjects : []))).filter(Boolean);

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold">All Students</h2>
                <button
                    onClick={() => navigate("/admin/students/add")}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                    Add Student
                </button>
            </div>

            {/* Filters & Sorting */}
            <div className="flex flex-wrap gap-4 mb-4 items-start">
                {/* Grade Dropdown */}
                <div className="relative">
                    <button
                        onClick={() => setGradeDropdownOpen(!gradeDropdownOpen)}
                        className="bg-white border rounded px-4 py-2 text-sm hover:bg-gray-100"
                    >
                        Filter by Grade
                    </button>
                    {gradeDropdownOpen && (
                        <div className="absolute z-10 mt-2 bg-white border rounded shadow p-2 max-h-60 overflow-y-auto">
                            {allGrades.map((grade) => (
                                <div key={grade}>
                                    <label className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            checked={selectedGrades.includes(grade)}
                                            onChange={() => toggleSelection(grade, selectedGrades, setSelectedGrades)}
                                        />
                                        <span>{grade}</span>
                                    </label>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Subject Dropdown */}
                <div className="relative">
                    <button
                        onClick={() => setSubjectDropdownOpen(!subjectDropdownOpen)}
                        className="bg-white border rounded px-4 py-2 text-sm hover:bg-gray-100"
                    >
                        Filter by Subject
                    </button>
                    {subjectDropdownOpen && (
                        <div className="absolute z-10 mt-2 bg-white border rounded shadow p-2 max-h-60 overflow-y-auto">
                            {allSubjects.map((subject) => (
                                <div key={subject}>
                                    <label className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            checked={selectedSubjects.includes(subject)}
                                            onChange={() => toggleSelection(subject, selectedSubjects, setSelectedSubjects)}
                                        />
                                        <span>{subject}</span>
                                    </label>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Sort Order */}
                <button
                    onClick={() => setSortOrder(prev => (prev === "asc" ? "desc" : "asc"))}
                    className="bg-white border px-4 py-2 rounded text-sm hover:bg-gray-100"
                >
                    Sort: {sortOrder === "asc" ? "A → Z" : "Z → A"}
                </button>
            </div>

            {/* Active Filters Tags */}
            <div className="flex flex-wrap gap-2 mb-6">
                {selectedGrades.map((grade) => (
                    <span key={grade} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                        {grade}
                        <X size={14} className="cursor-pointer" onClick={() => removeTag(grade, setSelectedGrades)} />
                    </span>
                ))}
                {selectedSubjects.map((subject) => (
                    <span key={subject} className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                        {subject}
                        <X size={14} className="cursor-pointer" onClick={() => removeTag(subject, setSelectedSubjects)} />
                    </span>
                ))}
            </div>

            {/* Students Table */}
            {loading ? (
                <p>Loading...</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white rounded shadow">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Name</th>
                                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Grade</th>
                                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Subjects</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredStudents.map((student) => (
                                <tr
                                    key={student.id}
                                    onClick={() => handleStudentClick(student.id)}
                                    className="hover:bg-gray-50 cursor-pointer border-b"
                                >
                                    <td className="px-6 py-4">{student.name}</td>
                                    <td className="px-6 py-4">{student.grade}</td>
                                    <td className="px-6 py-4">
                                        {Array.isArray(student.subjects)
                                            ? student.subjects.join(', ')
                                            : student.subjects || '—'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default AdminStudentsPage;
