import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '@/firebase/firebase.jsx';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { useTranslation } from 'react-i18next';
import SkeletonLoader from '@/components/common/SkeletonLoader.jsx';
import DropDownMenu from '@/components/common/DropDownMenu.jsx';
import { Search, User } from 'lucide-react';

function StudentsPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const auth = getAuth();

    const [searchTerm, setSearchTerm] = useState('');
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentTeacherId, setCurrentTeacherId] = useState(null);
    const [selectedGrades, setSelectedGrades] = useState([]);
    const [selectedSubjects, setSelectedSubjects] = useState([]);
    const [sortOrder, setSortOrder] = useState("asc");

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setCurrentTeacherId(user.uid);
            } else {
                navigate('/login');
            }
        });
        return () => unsubscribe();
    }, [auth, navigate]);

    useEffect(() => {
        if (!currentTeacherId) return;

        const fetchStudents = async () => {
            try {
                const teachersQuery = query(collection(db, "teachers"), where("uid", "==", currentTeacherId));
                const teacherSnapshot = await getDocs(teachersQuery);

                if (teacherSnapshot.empty) {
                    console.error("No teacher found with this UID.");
                    setLoading(false);
                    return;
                }

                const teacherData = teacherSnapshot.docs[0].data();
                const assignedStudentIds = teacherData.assigned_students || [];

                const studentsSnapshot = await getDocs(collection(db, 'students'));

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
    }, [currentTeacherId]);

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

    const handleStudentClick = (studentId) => {
        navigate(`/students/${studentId}`);
    };

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold">{t('all_students')}</h2>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-500" />
                    <input
                        type="text"
                        placeholder={t("search_by_name")}
                        className="pl-10 pr-4 py-2 border rounded w-full"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <DropDownMenu
                    label={t("filter_by_grade")}
                    options={allGrades.map((g) => g.value)}
                    selected={selectedGrades}
                    onChange={setSelectedGrades}
                    renderLabel={(g) => t(`grades.${g.replace(/\D/g, "")}`)}
                    multiSelect={true}
                />

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

            {/* Loader or Grid */}
            {loading ? (
                <SkeletonLoader rows={6} showButton={false} />
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

export default StudentsPage;
