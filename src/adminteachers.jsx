import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';

function adminteachers() {
    const [teachers, setTeachers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSubjects, setSelectedSubjects] = useState([]);
    const [subjectDropdownOpen, setSubjectDropdownOpen] = useState(false);
    const [statusFilter, setStatusFilter] = useState('');
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
            } catch (error) {
                console.error("Error fetching teachers:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchTeachers();
    }, []);

    const toggleSubject = (subject) => {
        setSelectedSubjects(prev =>
            prev.includes(subject)
                ? prev.filter(s => s !== subject)
                : [...prev, subject]
        );
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
                <h2 className="text-2xl font-semibold">All Teachers</h2>
            </div>

            <div className="flex flex-wrap gap-4 mb-6 items-start">
                {/* 🔍 Search */}
                <input
                    type="text"
                    placeholder="Search by name or email"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="border px-4 py-2 rounded w-64"
                />

                {/* 🎯 Subject Filter */}
                <div className="relative">
                    <button
                        onClick={() => setSubjectDropdownOpen(!subjectDropdownOpen)}
                        className="bg-white border px-4 py-2 rounded text-sm hover:bg-gray-100"
                    >
                        Filter by Subject
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
                                    <span>{subject}</span>
                                </label>
                            ))}
                        </div>
                    )}
                </div>

                {/* 🔄 Active Status Filter */}
                <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    className="border px-4 py-2 rounded text-sm"
                >
                    <option value="">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                </select>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-4">
                {selectedSubjects.map(subject => (
                    <span key={subject} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                        {subject}
                        <X size={14} className="cursor-pointer" onClick={() => toggleSubject(subject)} />
                    </span>
                ))}
            </div>

            {/* Table */}
            {loading ? (
                <p>Loading...</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white rounded shadow">
                        <thead className="bg-gray-100">
                        <tr>
                            <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Name</th>
                            <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Email</th>
                            <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Subjects</th>
                            <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Experience</th>
                            <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                        </tr>
                        </thead>
                        <tbody>
                        {filteredTeachers.map(teacher => (
                            <tr
                                key={teacher.id}
                                onClick={() => navigate(`/profile?teacherId=${teacher.teacher_id}`)}
                                className="hover:bg-gray-50 cursor-pointer border-b"
                            >
                                <td className="px-6 py-4">{teacher.name}</td>
                                <td className="px-6 py-4">{teacher.email}</td>
                                <td className="px-6 py-4">{(teacher.subject_specialties || []).join(", ")}</td>
                                <td className="px-6 py-4">{teacher.experience_years || 0} yrs</td>
                                <td className="px-6 py-4">
                                    {teacher.active_status ? (
                                        <span className="text-green-600 font-semibold">Active</span>
                                    ) : (
                                        <span className="text-red-600 font-semibold">Inactive</span>
                                    )}
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

export default adminteachers;
