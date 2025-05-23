import React, { useEffect, useState } from 'react';
import { collection, getDocs, deleteDoc, doc, query, where, Timestamp } from 'firebase/firestore';
import { db } from '@/firebase/firebase.jsx';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PlusCircle, ChevronDown, ChevronUp, X } from 'lucide-react';
import DropdownMenu from '@/components/DropdownMenu';

function AdminTeachers() {
    const { t, i18n } = useTranslation();
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
                const teacherList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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
                const date = data.lesson_date.toDate();
                if (date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()) {
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
        if (!window.confirm(t("confirm_delete_teacher"))) return;
        try {
            await deleteDoc(doc(db, "teachers", teacherId));
            setTeachers(prev => prev.filter(t => t.teacher_id !== teacherId));
        } catch (err) {
            console.error("Error deleting teacher:", err);
            alert(t("delete_failed"));
        }
    };

    const allSubjects = Array.from(new Set(teachers.flatMap(t => Array.isArray(t.subject_specialties) ? t.subject_specialties : [])));

    const filteredTeachers = teachers.filter(t => {
        const matchSearch = t.name?.toLowerCase().includes(searchTerm.toLowerCase()) || t.email?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchSubject = selectedSubjects.length === 0 || (Array.isArray(t.subject_specialties) && t.subject_specialties.some(s => selectedSubjects.includes(s)));
        const matchStatus = statusFilter === '' || (statusFilter === 'active' ? t.active_status : !t.active_status);
        return matchSearch && matchSubject && matchStatus;
    });

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            {/* Page Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-semibold text-gray-800">{t("all_teachers")}</h2>
                    <p className="text-gray-500">{t("Manage Teacher Records")}</p>
                </div>
                <button
                    onClick={() => navigate("/add-teacher")}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                    <PlusCircle className="h-4 w-4" />
                    {t("add_teacher")}
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm mb-6">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                    {/* Search */}
                    <div className="relative flex-1">
                        <input
                            type="text"
                            placeholder={t('search_by_name_or_email')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    {/* Subject Filter */}
                    <DropdownMenu
                        trigger={
                            <>
                                {t('filter_by_subject')}
                                {subjectDropdownOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </>
                        }
                    >
                        <div className="p-2 max-h-60 overflow-y-auto w-48">
                            {allSubjects.map((subject) => (
                                <label key={subject} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded">
                                    <input
                                        type="checkbox"
                                        className="rounded text-blue-600 focus:ring-blue-500"
                                        checked={selectedSubjects.includes(subject)}
                                        onChange={() => toggleSubject(subject)}
                                    />
                                    <span className="text-sm">{t(`subjects.${subject.toLowerCase()}`)}</span>
                                </label>
                            ))}
                        </div>
                    </DropdownMenu>


                    {/* Status Filter */}
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="border border-gray-300 px-4 py-2 rounded-lg text-sm bg-white hover:bg-gray-50"
                    >
                        <option value="">{t("all_statuses")}</option>
                        <option value="active">{t("active")}</option>
                        <option value="inactive">{t("inactive")}</option>
                    </select>
                </div>

                {/* Active subject tags */}
                {selectedSubjects.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                        {selectedSubjects.map((subject) => (
                            <span key={subject} className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm flex items-center gap-2">
              {t(`subjects.${subject.toLowerCase()}`)}
                                <X size={14} className="cursor-pointer hover:text-green-600" onClick={() => toggleSubject(subject)} />
            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* Table */}
            {loading ? (
                <div className="bg-white p-8 rounded-xl shadow-sm flex justify-center">
                    <div className="animate-pulse text-gray-400">{t("loading")}</div>
                </div>
            ) : (
                <div className="overflow-x-auto bg-white rounded-xl shadow-sm">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-100 text-left text-sm text-gray-600">
                        <tr>
                            <th className="px-6 py-3 font-medium">{t("name")}</th>
                            <th className="px-6 py-3 font-medium">{t("email")}</th>
                            <th className="px-6 py-3 font-medium">{t("subjects")}</th>
                            <th className="px-6 py-3 font-medium">{t("experience")}</th>
                            <th className="px-6 py-3 font-medium">{t("hours_this_month")}</th>
                            <th className="px-6 py-3 font-medium">{t("status")}</th>
                            <th className="px-6 py-3 font-medium">{t("actions")}</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-sm">
                        {filteredTeachers.map((teacher) => (
                            <tr key={teacher.id} className="hover:bg-gray-50 transition">
                                <td className="px-6 py-4 text-gray-800">{teacher.name}</td>
                                <td className="px-6 py-4">{teacher.email}</td>
                                <td className="px-6 py-4">
                                    {(teacher.subject_specialties || []).map((subj, idx) => (
                                        <span key={idx} className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs mr-1 mb-1">
                      {t(`subjects.${subj.toLowerCase()}`)}
                    </span>
                                    ))}
                                </td>
                                <td className="px-6 py-4">
                                    {teacher.experience_years ? `${teacher.experience_years} ${t("years")}` : `0 ${t("years")}`}
                                </td>
                                <td className="px-6 py-4">{hoursMap[teacher.teacher_id] || 0} {t("hours_unit")}</td>
                                <td className="px-6 py-4">
                                    {teacher.active_status ? (
                                        <span className="text-green-600 font-semibold">{t("active")}</span>
                                    ) : (
                                        <span className="text-red-600 font-semibold">{t("inactive")}</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap flex gap-2">
                                    <button
                                        onClick={() => navigate(`/admin/teachers/${teacher.id}/edit`)}
                                        className="px-3 py-1 rounded-lg bg-yellow-100 text-yellow-800 hover:bg-yellow-200 text-sm font-medium transition-colors"
                                    >
                                        {t('edit')}
                                    </button>
                                    <button
                                        oonClick={() => handleDelete(teacher.teacher_id)}
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
            )}
        </div>
    );

}

export default AdminTeachers;
