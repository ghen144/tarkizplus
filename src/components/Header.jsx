// Header.jsx
import React, {useEffect, useState, useRef} from 'react';
import {Search, Globe, ChevronDown} from 'lucide-react';
import {getAuth, onAuthStateChanged} from 'firebase/auth';
import {
    collection,
    getDocs,
    query,
    where,
    getDoc,
    doc
} from 'firebase/firestore';
import {db} from '@/firebase/firebase.jsx';
import {useTranslation} from 'react-i18next';
import {useNavigate} from 'react-router-dom';
import DropdownMenu from './DropdownMenu.jsx';

const Header = () => {
    const {t, i18n} = useTranslation();
    const navigate = useNavigate();
    const auth = getAuth();

    // user & auth state
    const [userRole, setUserRole] = useState(localStorage.getItem('userRole') || '');
    const [userName, setUserName] = useState('');
    const [assignedStudentIds, setAssignedStudentIds] = useState([]);
    const [currentTeacherId, setCurrentTeacherId] = useState('');

    // search state
    const [searchQuery, setSearchQuery] = useState('');
    const [results, setResults] = useState({
        students: [],
        teachers: [],
        lessons: [],
        exams: []
    });
    const [showResults, setShowResults] = useState(false);

    const resultsRef = useRef(null);

    // load user info on auth
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (!user) return;
            try {
                const collectionName = userRole === 'admin' ? 'admin' : 'teachers';
                const q = query(
                    collection(db, collectionName),
                    where('email', '==', user.email)
                );
                const snap = await getDocs(q);
                if (snap.empty) return;
                const docSnap = snap.docs[0];
                const data = docSnap.data();
                setUserName(data.name || t('user'));
                if (userRole !== 'admin') {
                    setAssignedStudentIds(data.assigned_students || []);
                    setCurrentTeacherId(docSnap.id);
                }
            } catch (err) {
                console.error('Error loading user:', err);
            }
        });
        return () => unsubscribe();
    }, [auth, userRole, t]);

    // close search on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (resultsRef.current && !resultsRef.current.contains(e.target)) {
                setShowResults(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // perform search
    const handleSearch = async (e) => {
        const q = e.target.value;
        setSearchQuery(q);
        if (!q.trim()) {
            setResults({students: [], teachers: [], lessons: [], exams: []});
            setShowResults(false);
            return;
        }
        // normalize subject keywords
        const SUBJECTS = {
            math: ['math', 'رياضيات', 'מתמטיקה'],
            english: ['english', 'انجليزي', 'אנגלית'],
            hebrew: ['hebrew', 'עברית', 'عبرية'],
            arabic: ['arabic', 'ערבית', 'عربي']
        };
        const low = q.toLowerCase();
        const normalized = Object.keys(SUBJECTS).find((sub) =>
            SUBJECTS[sub].some((v) => low.includes(v) || v.includes(low))
        );

        const [studentsSnap, teachersSnap, lessonsSnap, examsSnap] = await Promise.all([
            getDocs(collection(db, 'students')),
            getDocs(collection(db, 'teachers')),
            getDocs(collection(db, 'lessons')),
            getDocs(collection(db, 'exams')),
        ]);

        let students = studentsSnap.docs
            .map((d) => ({id: d.id, ...d.data()}))
            .filter((s) =>
                s.name?.toLowerCase().includes(low) ||
                s.student_id?.toLowerCase().includes(low)
            );
        let teachers = teachersSnap.docs
            .map((d) => ({id: d.id, ...d.data()}))
            .filter((t) =>
                t.name?.toLowerCase().includes(low) ||
                t.email?.toLowerCase().includes(low)
            );
        let lessons = lessonsSnap.docs
            .map((d) => ({id: d.id, ...d.data()}))
            .filter((l) => {
                const subj = l.subject?.toLowerCase();
                if (!subj) return false;
                return normalized ? subj === normalized : subj.includes(low);
            });
        let exams = examsSnap.docs
            .map((d) => ({id: d.id, ...d.data()}))
            .filter((e) =>
                e.subject?.toLowerCase().includes(low) ||
                e.material?.toLowerCase().includes(low)
            );

        // restrict for teachers
        if (userRole !== 'admin') {
            students = students.filter((s) =>
                assignedStudentIds.includes(s.student_id)
            );
            exams = exams.filter((e) =>
                assignedStudentIds.includes(e.student_id)
            );
            lessons = lessons.filter((l) =>
                l.teacher_id === currentTeacherId &&
                Array.isArray(l.students) &&
                l.students.some((st) =>
                    assignedStudentIds.includes(st.student_id)
                )
            );
            teachers = [];
        }

        // enrich lessons with teacherName & count
        const enriched = await Promise.all(
            lessons.slice(0, 5).map(async (l) => {
                let teacherName = t('unknown');
                if (l.teacher_id) {
                    const docRef = doc(db, 'teachers', l.teacher_id);
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) teacherName = docSnap.data().name;
                }
                return {
                    id: l.id,
                    subject: l.subject,
                    date: l.lesson_date?.toDate().toLocaleDateString(),
                    teacherName,
                    studentsCount: l.students?.length || 0,
                };
            })
        );

        setResults({
            students: students.slice(0, 5),
            teachers: teachers.slice(0, 5),
            lessons: enriched,
            exams: exams.slice(0, 5),
        });
        setShowResults(true);
    };

    // navigate on click
    const handleResultClick = (type, id) => {
        if (type === 'student') navigate(`/students/${id}`);
        if (type === 'teacher') navigate(`/admin/teachers/${id}/edit`);
        if (type === 'lesson') navigate(`/lesson-log/${id}/details`);
        if (type === 'exam') navigate(`/admin/exams`);
        setSearchQuery('');
        setShowResults(false);
    };

    return (
        <header className="bg-white p-4 border-b flex justify-between items-center">
            {/* Search */}
            <div className="relative w-96" ref={resultsRef}>
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400"/>
                <input
                    type="text"
                    placeholder={t('search')}
                    value={searchQuery}
                    onChange={handleSearch}
                    onFocus={() => setShowResults(true)}
                    className="pl-10 pr-4 py-2 rounded-lg border border-gray-300 w-full"
                />
                {showResults && (
                    <div
                        className="absolute top-full left-0 right-0 bg-white border mt-1 rounded shadow z-10 max-h-96 overflow-y-auto">
                        {results.students.length > 0 && (
                            <div>
                                <p className="text-sm text-gray-500 px-4 py-1 border-b">
                                    {t('students')}
                                </p>
                                {results.students.map((s) => (
                                    <div
                                        key={s.id}
                                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                                        onMouseDown={() => handleResultClick('student', s.id)}
                                    >
                                        👦 {s.name}
                                    </div>
                                ))}
                            </div>
                        )}
                        {results.teachers.length > 0 && (
                            <div>
                                <p className="text-sm text-gray-500 px-4 py-1 border-b">
                                    {t('teachers')}
                                </p>
                                {results.teachers.map((tchr) => (
                                    <div
                                        key={tchr.id}
                                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                                        onMouseDown={() => handleResultClick('teacher', tchr.id)}
                                    >
                                        🧑‍🏫 {tchr.name}
                                    </div>
                                ))}
                            </div>
                        )}
                        {results.lessons.length > 0 && (
                            <div>
                                <p className="text-sm text-gray-500 px-4 py-1 border-b">
                                    {t('lessons')}
                                </p>
                                {results.lessons.map((l) => (
                                    <div
                                        key={l.id}
                                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                                        onMouseDown={() => handleResultClick('lesson', l.id)}
                                    >
                                        📘 {l.date} – {t(l.subject)}
                                        <br/>
                                        👥 {l.studentsCount} | 🧑‍🏫 {l.teacherName}
                                    </div>
                                ))}
                            </div>
                        )}
                        {results.exams.length > 0 && (
                            <div>
                                <p className="text-sm text-gray-500 px-4 py-1 border-b">
                                    {t('exams')}
                                </p>
                                {results.exams.map((e) => (
                                    <div
                                        key={e.id}
                                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                                        onMouseDown={() => handleResultClick('exam', e.id)}
                                    >
                                        📝 {t(e.subject)} – {e.material}
                                    </div>
                                ))}
                            </div>
                        )}
                        {Object.values(results).every((arr) => arr.length === 0) && (
                            <p className="text-gray-500 text-sm px-4 py-2">
                                {t('no_results')}
                            </p>
                        )}
                    </div>
                )}
            </div>

            {/* Language & Profile */}
            <div className="flex items-center gap-4">
                <DropdownMenu
                    trigger={<Globe className="h-6 w-6 text-gray-600 hover:text-blue-600"/>}
                    className=""
                >
                    {['en', 'ar', 'he'].map((lng) => (
                        <button
                            key={lng}
                            onClick={() => i18n.changeLanguage(lng)}
                            className={`block w-full text-left px-4 py-2 text-sm transition ${
                                i18n.language === lng
                                    ? 'bg-blue-100 text-blue-700 font-semibold'
                                    : 'text-gray-700 hover:bg-gray-100'
                            }`}
                        >
                            {lng.toUpperCase()}
                        </button>
                    ))}
                </DropdownMenu>

                {/* Profile dropdown (with name) */}
                <div className="relative">

                    <DropdownMenu
                        trigger={
                            <button
                                className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 hover:bg-gray-200 focus:outline-none"
                            >
                                <span className="font-semibold text-gray-700">{userName}</span>
                                <ChevronDown className="text-gray-600" size={16}/>
                            </button>
                        }
                        className="mt-1"
                    >
                        {/* your profileItems here, e.g.: */}
                        <button
                            onClick={() => navigate('/profile')}
                            className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                        >
                            {t('My Profile')}
                        </button>
                        <button
                            onClick={() => navigate('/settings')}
                            className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                        >
                            {t('Settings')}
                        </button>

                    </DropdownMenu>
                </div>
            </div>
        </header>
    );
};

export default Header;
