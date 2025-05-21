import React, { useEffect, useState } from 'react';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/firebase/firebase.jsx';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

function AdminStudentsPage() {
    const { t } = useTranslation();
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sortOrder, setSortOrder] = useState("asc");
    const [selectedGrades, setSelectedGrades] = useState([]);
    const [selectedSubjects, setSelectedSubjects] = useState([]);
    const [gradeDropdownOpen, setGradeDropdownOpen] = useState(false);
    const [subjectDropdownOpen, setSubjectDropdownOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
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

    const handleDeleteStudent = async (studentId) => {
        const confirmDelete = window.confirm(t('confirm_delete_student'));
        if (!confirmDelete) return;

        try {
            await deleteDoc(doc(db, 'students', studentId));
            setStudents(prev => prev.filter(s => s.id !== studentId));
        } catch (error) {
            console.error("Error deleting student:", error);
            alert(t('delete_failed'));
        }
    };

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
            (!searchTerm || student.name?.toLowerCase().includes(searchTerm.toLowerCase())) &&
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

    const allGrades = Array.from(new Set(students.map(s => s.grade)))
        .filter(Boolean)
        .map(grade => ({
            key: grade.replace(/\D/g, ""), // "5th Grade" -> "5"
            value: grade
        }));

    const allSubjects = Array.from(new Set(
        students.flatMap(s => Array.isArray(s.subjects) ? s.subjects : [])
    )).filter(Boolean);

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold">{t('all_students')}</h2>
                <button
                    onClick={() => navigate("/admin/students/add")}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                    {t('add_student')}
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
                <input
                    type="text"
                    placeholder={t('search_by_name')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="border px-4 py-2 rounded w-full md:w-64"
                />

                <div className="relative">
                    <button
                        onClick={() => setGradeDropdownOpen(!gradeDropdownOpen)}
                        className="bg-white border rounded px-4 py-2 text-sm hover:bg-gray-100"
                    >
                        {t('filter_by_grade')}
                    </button>
                    {gradeDropdownOpen && (
                        <div className="absolute z-10 mt-2 bg-white border rounded shadow p-2 max-h-60 overflow-y-auto">
                            {allGrades.map((grade) => (
                                <label key={grade.value} className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        checked={selectedGrades.includes(grade.value)}
                                        onChange={() => toggleSelection(grade.value, selectedGrades, setSelectedGrades)}
                                    />
                                    <span>{t(`grades.${grade.key}`)}</span>
                                </label>
                            ))}
                        </div>
                    )}
                </div>

                <div className="relative">
                    <button
                        onClick={() => setSubjectDropdownOpen(!subjectDropdownOpen)}
                        className="bg-white border rounded px-4 py-2 text-sm hover:bg-gray-100"
                    >
                        {t('filter_by_subject')}
                    </button>
                    {subjectDropdownOpen && (
                        <div className="absolute z-10 mt-2 bg-white border rounded shadow p-2 max-h-60 overflow-y-auto">
                            {allSubjects.map((subject) => (
                                <label key={subject} className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        checked={selectedSubjects.includes(subject)}
                                        onChange={() => toggleSelection(subject, selectedSubjects, setSelectedSubjects)}
                                    />
                                    <span>{t(`subjects.${subject.toLowerCase()}`)}</span>
                                </label>
                            ))}
                        </div>
                    )}
                </div>

                <button
                    onClick={() => setSortOrder(prev => (prev === "asc" ? "desc" : "asc"))}
                    className="bg-white border px-4 py-2 rounded text-sm hover:bg-gray-100"
                >
                    {t('sort')}: {sortOrder === "asc" ? "A → Z" : "Z → A"}
                </button>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
                {selectedGrades.map((grade) => (
                    <span key={grade} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                        {t(`grades.${grade.replace(/\D/g, "")}`)}
                        <X size={14} className="cursor-pointer" onClick={() => removeTag(grade, setSelectedGrades)} />
                    </span>
                ))}
                {selectedSubjects.map((subject) => (
                    <span key={subject} className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                        {t(`subjects.${subject.toLowerCase()}`)}
                        <X size={14} className="cursor-pointer" onClick={() => removeTag(subject, setSelectedSubjects)} />
                    </span>
                ))}
            </div>

            {loading ? (
                <p>{t('loading')}</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white rounded shadow">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">{t('name')}</th>
                                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">{t('grade')}</th>
                                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">{t('subjects')}</th>
                                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">{t('actions')}</th>
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
                                    <td className="px-6 py-4">
                                        {t(`grades.${student.grade.replace(/\D/g, "")}`)}
                                    </td>
                                    <td className="px-6 py-4">
                                        {Array.isArray(student.subjects)
                                            ? student.subjects.map((sub, i) => (
                                                <span key={i} className="inline-block mr-2">
                                                    {t(`subjects.${sub.toLowerCase()}`)}
                                                </span>
                                            ))
                                            : student.subjects || '—'}
                                    </td>
                                    <td className="px-6 py-4 flex gap-2">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigate(`/admin/students/${student.id}/edit`);
                                            }}
                                            className="bg-yellow-400 hover:bg-yellow-500 text-white px-3 py-1 rounded text-sm"
                                        >
                                            {t('edit')}
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteStudent(student.id);
                                            }}
                                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                                        >
                                            {t('delete')}
                                        </button>
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
