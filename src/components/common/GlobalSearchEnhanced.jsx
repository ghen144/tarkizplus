// GlobalSearchEnhanced.jsx
import React, {useEffect, useState} from 'react';
import {db} from '@/firebase/firebase.jsx';
import {collection, getDocs} from 'firebase/firestore';
import {useNavigate} from 'react-router-dom';
import {useTranslation} from 'react-i18next';

const GlobalSearchEnhanced = ({query}) => {
    const {t} = useTranslation();
    const [results, setResults] = useState({students: [], teachers: [], lessons: [], exams: []});
    const navigate = useNavigate();

    useEffect(() => {
        const fetchAll = async () => {
            if (query.trim() === '') {
                setResults({students: [], teachers: [], lessons: [], exams: []});
                return;
            }

            const [studentsSnap, teachersSnap, lessonsSnap, examsSnap] = await Promise.all([
                getDocs(collection(db, 'students')),
                getDocs(collection(db, 'teachers')),
                getDocs(collection(db, 'lessons')),
                getDocs(collection(db, 'exams')),
            ]);

            const q = query.toLowerCase();

            const students = studentsSnap.docs
                .map(doc => ({id: doc.id, ...doc.data()}))
                .filter(s => s.name?.toLowerCase().includes(q) || s.student_id?.includes(q))
                .slice(0, 5);

            const teachers = teachersSnap.docs
                .map(doc => ({id: doc.id, ...doc.data()}))
                .filter(t => t.name?.toLowerCase().includes(q) || t.email?.toLowerCase().includes(q))
                .slice(0, 5);

            const lessons = lessonsSnap.docs
                .map(doc => ({id: doc.id, ...doc.data()}))
                .filter(l => l.subject?.toLowerCase().includes(q))
                .slice(0, 5);

            const exams = examsSnap.docs
                .map(doc => ({id: doc.id, ...doc.data()}))
                .filter(e => e.subject?.toLowerCase().includes(q) || e.material?.toLowerCase().includes(q))
                .slice(0, 5);

            setResults({students, teachers, lessons, exams});
        };

        fetchAll();
    }, [query]);

    const handleSelect = (type, id) => {
        switch (type) {
            case 'student':
                navigate(`/students/${id}`);
                break;
            case 'teacher':
                navigate(`/admin/teachers/${id}/edit`);
                break;
            case 'lesson':
                navigate(`/lesson-log/${id}/details`);
                break;
            case 'exam':
                navigate(`/admin/exams`); // Modify if individual exam pages exist
                break;
            default:
                break;
        }
    };

    const renderSection = (label, items, icon, type) =>
        items.length > 0 && (
            <div className="mb-4">
                <p className="font-bold text-blue-600">{icon} {t(label)}</p>
                <ul>
                    {items.map(item => (
                        <li key={item.id}>
                            <button
                                onClick={() => handleSelect(type, item.id)}
                                className="text-left w-full py-1 text-sm text-gray-800 hover:underline"
                            >
                                {item.name || item.subject || item.material}
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
        );

    return (
        <div
            className="absolute top-full left-0 right-0 bg-white border mt-1 rounded shadow z-10 max-h-80 overflow-y-auto p-4">
            {renderSection('students', results.students, '👦', 'student')}
            {renderSection('teachers', results.teachers, '🧑‍🏫', 'teacher')}
            {renderSection('lessons', results.lessons, '📚', 'lesson')}
            {renderSection('exams', results.exams, '📝', 'exam')}
            {Object.values(results).every(arr => arr.length === 0) && (
                <p className="text-gray-500 text-sm">{t("no_results")}</p>
            )}
        </div>
    );
};

export default GlobalSearchEnhanced;
