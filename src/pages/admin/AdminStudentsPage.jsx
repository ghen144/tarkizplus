import React, { useEffect, useState } from 'react';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/firebase/firebase.jsx';
import { useNavigate } from 'react-router-dom';
import { X, ChevronDown, ChevronUp, PlusCircle } from 'lucide-react'; // Added PlusCircle here
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
            key: grade.replace(/\D/g, ""),
            value: grade
        }));

    const allSubjects = Array.from(new Set(
        students.flatMap(s => Array.isArray(s.subjects) ? s.subjects : [])
    )).filter(Boolean);

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-semibold text-gray-800">{t('all_students')}</h2>
                    <p className="text-gray-500">{t('Manage Student Records')}</p>
                </div>
                <button
                    onClick={() => navigate("/admin/students/add")}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                    <PlusCircle className="h-4 w-4" />
                    {t('add_student')}
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm mb-6">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <div className="relative flex-1">
                        <input
                            type="text"
                            placeholder={t('search_by_name')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    <div className="relative">
                        <button
                            onClick={() => setGradeDropdownOpen(!gradeDropdownOpen)}
                            className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm hover:bg-gray-50"
                        >
                            {t('filter_by_grade')}
                            {gradeDropdownOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                        {gradeDropdownOpen && (
                            <div className="absolute z-10 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg p-2 max-h-60 overflow-y-auto w-48">
                                {allGrades.map((grade) => (
                                    <label key={grade.value} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded">
                                        <input
                                            type="checkbox"
                                            className="rounded text-blue-600 focus:ring-blue-500"
                                            checked={selectedGrades.includes(grade.value)}
                                            onChange={() => toggleSelection(grade.value, selectedGrades, setSelectedGrades)}
                                        />
                                        <span className="text-sm">{t(`grades.${grade.key}`)}</span>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="relative">
                        <button
                            onClick={() => setSubjectDropdownOpen(!subjectDropdownOpen)}
                            className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm hover:bg-gray-50"
                        >
                            {t('filter_by_subject')}
                            {subjectDropdownOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                        {subjectDropdownOpen && (
                            <div className="absolute z-10 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg p-2 max-h-60 overflow-y-auto w-48">
                                {allSubjects.map((subject) => (
                                    <label key={subject} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded">
                                        <input
                                            type="checkbox"
                                            className="rounded text-blue-600 focus:ring-blue-500"
                                            checked={selectedSubjects.includes(subject)}
                                            onChange={() => toggleSelection(subject, selectedSubjects, setSelectedSubjects)}
                                        />
                                        <span className="text-sm">{t(`subjects.${subject.toLowerCase()}`)}</span>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>

                    <button
                        onClick={() => setSortOrder(prev => (prev === "asc" ? "desc" : "asc"))}
                        className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm hover:bg-gray-50"
                    >
                        {t('sort')}: {sortOrder === "asc" ? "A → Z" : "Z → A"}
                    </button>
                </div>

                {/* Active filters */}
                <div className="flex flex-wrap gap-2 mt-4">
                    {selectedGrades.map((grade) => (
                        <span key={grade} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                            {t(`grades.${grade.replace(/\D/g, "")}`)}
                            <X size={14} className="cursor-pointer hover:text-blue-600" onClick={() => removeTag(grade, setSelectedGrades)} />
                        </span>
                    ))}
                    {selectedSubjects.map((subject) => (
                        <span key={subject} className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                            {t(`subjects.${subject.toLowerCase()}`)}
                            <X size={14} className="cursor-pointer hover:text-green-600" onClick={() => removeTag(subject, setSelectedSubjects)} />
                        </span>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="bg-white p-8 rounded-xl shadow-sm flex justify-center">
                    <div className="animate-pulse text-gray-400">Loading students...</div>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('name')}</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('grade')}</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('subjects')}</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('actions')}</th>
                            </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                            {filteredStudents.map((student) => (
                                <tr
                                    key={student.id}
                                    onClick={() => handleStudentClick(student.id)}
                                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                                >
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="font-medium text-gray-900">{student.name}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                                                {t(`grades.${student.grade.replace(/\D/g, "")}`)}
                                            </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-wrap gap-2">
                                            {Array.isArray(student.subjects)
                                                ? student.subjects.map((sub, i) => (
                                                    <span key={i} className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                                                            {t(`subjects.${sub.toLowerCase()}`)}
                                                        </span>
                                                ))
                                                : <span className="text-gray-500">—</span>}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap flex gap-2">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigate(`/admin/students/${student.id}/edit`);
                                            }}
                                            className="px-3 py-1 rounded-lg bg-yellow-100 text-yellow-800 hover:bg-yellow-200 text-sm font-medium transition-colors"
                                        >
                                            {t('edit')}
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteStudent(student.id);
                                            }}
                                            className="px-3 py-1 rounded-lg bg-red-100 text-red-800 hover:bg-red-200 text-sm font-medium transition-colors"
                                        >
                                            {t('delete')}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminStudentsPage;