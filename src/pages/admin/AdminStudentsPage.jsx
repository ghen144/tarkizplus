import React, {useEffect, useState} from 'react';
import {collection, getDocs, deleteDoc, doc} from 'firebase/firestore';
import {db} from '@/firebase/firebase.jsx';
import {useNavigate} from 'react-router-dom';
import {X,Plus } from 'lucide-react';
import {useTranslation} from 'react-i18next';
import SkeletonLoader from "@/components/common/SkeletonLoader.jsx";
import DropDownMenu from "@/components/common/DropDownMenu.jsx";
import IconButton from "@/components/common/IconButton.jsx";

function AdminStudentsPage() {
    const {t} = useTranslation();
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sortOrder, setSortOrder] = useState("asc");
    const [selectedGrades, setSelectedGrades] = useState([]);
    const [selectedSubjects, setSelectedSubjects] = useState([]);
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
        console.log(localStorage.getItem('userRole'))
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

    const allGrades = Array.from(new Set(students.map((s) => s.grade)))
        .filter(Boolean)
        .map((grade) => ({
            key: grade.replace(/\D/g, ""),
            value: grade,
        }))
        .sort((a, b) => Number(a.key) - Number(b.key));


    const allSubjects = Array.from(new Set(
        students.flatMap(s => Array.isArray(s.subjects) ? s.subjects : [])
    )).filter(Boolean);

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold">{t('all_students')}</h2>
                <IconButton
                    color="green"
                    onClick={() => navigate("/admin/students/add")}
                >
                    <Plus size={16} />
                    {t("add_student")}
                </IconButton>
            </div>

            {/* Filters & Tags */}
            <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
                <input
                    type="text"
                    placeholder={t('search_by_name')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="border px-4 py-2 rounded w-full md:w-64"
                />

                {/* Grade filter button */}

                <DropDownMenu
                    label={t("filter_by_grade")}
                    options={allGrades.map((g) => g.value)}
                    selected={selectedGrades}
                    onChange={setSelectedGrades}
                    renderLabel={(g) => t(`grades.${g.replace(/\D/g, "")}`)}
                    multiSelect={true}
                />

                {/* Subject filter button */}
                <DropDownMenu
                    label={t("filter_by_subject")}
                    options={allSubjects}
                    selected={selectedSubjects}
                    onChange={setSelectedSubjects}
                    renderLabel={(s) => t(`subjects.${s.toLowerCase()}`)}
                    multiSelect={true}
                />


                <button
                    onClick={() => setSortOrder(prev => (prev === "asc" ? "desc" : "asc"))}
                    className="bg-white border px-4 py-2 rounded text-sm hover:bg-gray-100"
                >
                    {t('sort')}: {sortOrder === "asc" ? "A → Z" : "Z → A"}
                </button>
            </div>

            {/* Selected tags */}
            <div className="flex flex-wrap gap-2 mb-6">
                {selectedGrades.map((grade) => (
                    <span key={grade}
                          className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                    {t(`grades.${grade.replace(/\D/g, "")}`)}
                        <X size={14} className="cursor-pointer" onClick={() => removeTag(grade, setSelectedGrades)}/>
                </span>
                ))}
                {selectedSubjects.map((subject) => (
                    <span key={subject}
                          className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                    {t(`subjects.${subject.toLowerCase()}`)}
                        <X size={14} className="cursor-pointer"
                           onClick={() => removeTag(subject, setSelectedSubjects)}/>
                </span>
                ))}
            </div>

            {/* Loader or Grid */}
            {loading ? (
                <SkeletonLoader rows={6} showButton={true}/>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredStudents.length > 0 ? (
                        filteredStudents.map((student) => (
                            <div
                                key={student.id}
                                className="bg-white p-6 rounded-lg shadow hover:bg-gray-50 transition cursor-pointer"
                                onClick={() => handleStudentClick(student.id)}
                            >
                                <h3 className="text-lg font-medium">{student.name}</h3>
                                <p className="text-gray-600 text-sm mt-1">{t(`grades.${student.grade.replace(/\D/g, "")}`)}</p>
                                <p className="text-gray-500 text-sm mt-1">
                                    {Array.isArray(student.subjects)
                                        ? student.subjects.map((sub) => t(`subjects.${sub.toLowerCase()}`)).join(', ')
                                        : student.subjects || '—'}
                                </p>
                                <div className="flex justify-end gap-2 pt-4">
                                    <IconButton
                                        color="yellow"
                                        label={t("edit")}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(`/admin/students/${student.id}/edit`);
                                        }}
                                    />
                                    <IconButton
                                        color="red"
                                        label={t("delete")}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteStudent(student.id);
                                        }}
                                    />

                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-gray-500">{t("no_students")}</p>
                    )}
                </div>
            )}
        </div>
    );

}

export default AdminStudentsPage;
