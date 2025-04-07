import React, { useEffect, useState } from 'react';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from './firebase';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';

function AdminTeachers() {
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

    const handleDelete = async (teacherId) => {
        const confirmDelete = window.confirm("Are you sure you want to delete this teacher?");
        if (!confirmDelete) return;

        try {
            await deleteDoc(doc(db, "teachers", teacherId));
            setTeachers(prev => prev.filter(t => t.teacher_id !== teacherId));
        } catch (error) {
            console.error("Error deleting teacher:", error);
            alert("Failed to delete teacher.");
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
                <h2 className="text-2xl font-semibold">All Teachers</h2>
                <button
                    onClick={() => navigate('/add-teacher')}
                    className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded"
                >
                    Add Teacher
                </button>
            </div>

            <div className="flex flex-wrap gap-4 mb-6 items-start">
                <input
                    type="text"
                    placeholder="Search by name or email"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="border px-4 py-2 rounded w-64"
                />

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

            <div className="flex flex-wrap gap-2 mb-4">
                {selectedSubjects.map(subject => (
                    <span key={subject} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                        {subject}
                        <X size={14} className="cursor-pointer" onClick={() => toggleSubject(subject)} />
                    </span>
                ))}
            </div>

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
                                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTeachers.map(teacher => (
                                <tr
                                    key={teacher.id}
                                    className="hover:bg-gray-50 border-b"
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
                                    <td className="px-6 py-4 flex gap-2">
                                        <button
                                            onClick={() => navigate(`/admin/teachers/${teacher.id}/edit`)}
                                            className="bg-yellow-400 hover:bg-yellow-500 text-white px-3 py-1 rounded text-sm"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(teacher.teacher_id)}
                                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                                        >
                                            Delete
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
