import React, { useEffect, useState } from 'react';
import { collection, getDocs, deleteDoc, doc, query, where, Timestamp } from 'firebase/firestore';
import { db } from '@/firebase/firebase.jsx';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

function AdminTeachers() {
    const { t } = useTranslation();
    const [teachers, setTeachers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSubjects, setSelectedSubjects] = useState([]);
    const [subjectDropdownOpen, setSubjectDropdownOpen] = useState(false);
    const [statusFilter, setStatusFilter] = useState('');
    const [hoursMap, setHoursMap] = useState({});
    const navigate = useNavigate();

    useEffect(() => {
        const fetchTeachers = async () => {
            try {
                const snapshot = await getDocs(collection(db, 'teachers'));
                const teacherList = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setTeachers(teacherList);

                const hoursResult = {};
                for (const teacher of teacherList) {
                    const hours = await getTeacherHoursThisMonth(teacher.teacher_id);
                    hoursResult[teacher.teacher_id] = hours;
                }
                setHoursMap(hoursResult);
            } catch (error) {
                console.error("Error fetching teachers:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchTeachers();
    }, []);

    const getTeacherHoursThisMonth = async (teacherId) => {
        const now = new Date();
        const fromDate = new Date(now.getFullYear(), now.getMonth(), 1);

        const lessonsRef = collection(db, "lessons");
        const q = query(
            lessonsRef,
            where("teacher_id", "==", teacherId),
            where("lesson_date", ">=", Timestamp.fromDate(fromDate))
        );

        const snapshot = await getDocs(q);
        let totalMinutes = 0;

        snapshot.forEach(doc => {
            const data = doc.data();
            if (data.lesson_date && data.duration_minutes) {
                const lessonDate = data.lesson_date.toDate();
                const lessonMonth = lessonDate.getMonth();
                const lessonYear = lessonDate.getFullYear();

                if (
                    lessonYear === now.getFullYear() &&
                    lessonMonth === now.getMonth()
                ) {
                    totalMinutes += Number(data.duration_minutes);
                }
            }
        });

        return (totalMinutes / 60).toFixed(1);
    };

    const toggleSubject = (subject) => {
        setSelectedSubjects(prev =>
            prev.includes(subject)
                ? prev.filter(s => s !== subject)
                : [...prev, subject]
        );
    };

    const handleDelete = async (teacherId) => {
        const confirmDelete = window.confirm(t("confirm_delete_teacher"));
        if (!confirmDelete) return;

        try {
            await deleteDoc(doc(db, "teachers", teacherId));
            setTeachers(prev => prev.filter(t => t.teacher_id !== teacherId));
        } catch (error) {
            console.error("Error deleting teacher:", error);
            alert(t("delete_failed"));
        }
    };

    const allSubjects = Array.from(
        new Set(teachers.flatMap(t => Array.isArray(t.subject_specialties) ? t.subject_specialties : []))
    );

    const filteredTeachers = teachers
        .filter(teacher =>
            teacher.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            teacher.email?.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .filter(teacher =>
            selectedSubjects.length === 0 ||
            (Array.isArray(teacher.subject_specialties) &&
                teacher.subject_specialties.some(s => selectedSubjects.includes(s)))
        )
        .filter(teacher =>
            statusFilter === '' || (statusFilter === 'active' ? teacher.active_status : !teacher.active_status)
        );

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold">{t("all_teachers")}</h2>
                <button
                    onClick={() => navigate('/admin/teachers/add')}
                    className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded"
                >
                    {t("add_teacher")}
                </button>
            </div>

            <div className="flex flex-wrap gap-4 mb-6 items-start">
                <input
                    type="text"
                    placeholder={t("search_by_name_or_email")}
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="border px-4 py-2 rounded w-64"
                />

                <div className="relative">
                    <button
                        onClick={() => setSubjectDropdownOpen(!subjectDropdownOpen)}
                        className="bg-white border px-4 py-2 rounded text-sm hover:bg-gray-100"
                    >
                        {t("filter_by_subject")}
                    </button>
                    {subjectDropdownOpen && (
                        <div className="absolute z-10 mt-2 bg-white border rounded shadow p-2 max-h-60 overflow-y-auto">
                            {allSubjects.map(subject => (
                                <label key={subject} className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        checked={selectedSubjects.includes(subject)}
                                        onChange={() => toggleSubject(subject)}
                                    />
                                    <span>{t(`subjects.${subject.toLowerCase()}`)}</span>
                                </label>
                            ))}
                        </div>
                    )}
                </div>

                <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    className="border px-4 py-2 rounded text-sm"
                >
                    <option value="">{t("all_statuses")}</option>
                    <option value="active">{t("active")}</option>
                    <option value="inactive">{t("inactive")}</option>
                </select>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
                {selectedSubjects.map(subject => (
                    <span key={subject} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                        {t(`subjects.${subject.toLowerCase()}`)}
                        <X size={14} className="cursor-pointer" onClick={() => toggleSubject(subject)} />
                    </span>
                ))}
            </div>

            {loading ? (
                <p>{t("loading")}</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white rounded shadow">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">{t("name")}</th>
                                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">{t("email")}</th>
                                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">{t("subjects")}</th>
                                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">{t("experience")}</th>
                                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">{t("hours_this_month")}</th>
                                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">{t("status")}</th>
                                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">{t("actions")}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTeachers.map(teacher => (
                                <tr key={teacher.id} className="hover:bg-gray-50 border-b">
                                    <td className="px-6 py-4">{teacher.name}</td>
                                    <td className="px-6 py-4">{teacher.email}</td>
                                    <td className="px-6 py-4">
                                        {(teacher.subject_specialties || []).map((subj, idx) => (
                                            <span key={idx} className="inline-block mr-1">
                                                {t(`subjects.${subj.toLowerCase()}`)}
                                            </span>
                                        ))}
                                    </td>
                                    <td className="px-6 py-4">
                                        {teacher.experience_years ? `${teacher.experience_years} ${t("years")}` : `0 ${t("years")}`}
                                    </td>
                                    <td className="px-6 py-4">
                                        {hoursMap[teacher.teacher_id] || 0} {t("hours_unit")}
                                    </td>
                                    <td className="px-6 py-4">
                                        {teacher.active_status ? (
                                            <span className="text-green-600 font-semibold">{t("active")}</span>
                                        ) : (
                                            <span className="text-red-600 font-semibold">{t("inactive")}</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 flex gap-2">
                                        <button
                                            onClick={() => navigate(`/admin/teachers/${teacher.id}/edit`)}
                                            className="bg-yellow-400 hover:bg-yellow-500 text-white px-3 py-1 rounded text-sm"
                                        >
                                            {t("edit")}
                                        </button>
                                        <button
                                            onClick={() => handleDelete(teacher.teacher_id)}
                                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                                        >
                                            {t("delete")}
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

export default AdminTeachers;
