import {useEffect, useState, useRef} from 'react';
import {Search, Globe} from 'lucide-react';
import {getAuth, onAuthStateChanged} from 'firebase/auth';
import {collection, getDocs, getDoc, doc, query, where} from 'firebase/firestore';
import {db} from '@/firebase/firebase.jsx';
import {useTranslation} from 'react-i18next';
import {useNavigate} from 'react-router-dom';
import DropDownMenu from "@/components/common/DropDownMenu.jsx";

const Header = () => {
    const {t, i18n} = useTranslation();
    const [userName, setUserName] = useState('User');
    const [searchQuery, setSearchQuery] = useState('');
    const auth = getAuth();
    const [userRole, setUserRole] = useState(localStorage.getItem('userRole') || '');

    const navigate = useNavigate();
    const [results, setResults] = useState({students: [], teachers: [], lessons: [], exams: []});
    const [showResults, setShowResults] = useState(false);
    const [assignedStudentIds, setAssignedStudentIds] = useState([]);
    const [currentTeacherId, setCurrentTeacherId] = useState('');

    const resultsRef = useRef(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                try {
                    const collectionName = userRole === 'admin' ? 'admin' : 'teachers';
                    const q = query(collection(db, collectionName), where('email', '==', user.email));
                    const snapshot = await getDocs(q);
                    if (!snapshot.empty) {
                        const data = snapshot.docs[0].data();
                        setUserName(data.name || t("user"));
                        if (userRole !== 'admin') {
                            setAssignedStudentIds(data.assigned_students || []);
                            setCurrentTeacherId(snapshot.docs[0].id);
                        }
                    }
                } catch (err) {
                    console.error("Error loading user:", err);
                }
            }
        });
        return () => unsubscribe();
    }, [userRole, t, auth]);

    useEffect(() => {
        const closeOnOutsideClick = (e) => {
            if (resultsRef.current && !resultsRef.current.contains(e.target)) {
                setShowResults(false);
            }
        };
        document.addEventListener("mousedown", closeOnOutsideClick);
        return () => document.removeEventListener("mousedown", closeOnOutsideClick);
    }, []);

    const handleSearch = async (e) => {
        const queryValue = e.target.value;
        setSearchQuery(queryValue);
        if (queryValue.trim() === '') {
            setResults({students: [], teachers: [], lessons: [], exams: []});
            return;
        }

        const q = queryValue.toLowerCase();

        const SUBJECT_TRANSLATIONS = {
            math: ["math", "رياضيات", "מתמטיקה"],
            english: ["english", "انجليزي", "إنجليزي", "אנגלית"],
            hebrew: ["hebrew", "عبري", "עברית"],
            arabic: ["arabic", "عربي", "ערבית"]
        };

        const normalizedSubject = Object.keys(SUBJECT_TRANSLATIONS).find((key) =>
            SUBJECT_TRANSLATIONS[key].some(variant =>
                variant.includes(q) || q.includes(variant)
            )
        );

        const [studentsSnap, teachersSnap, lessonsSnap, examsSnap] = await Promise.all([
            getDocs(collection(db, 'students')),
            getDocs(collection(db, 'teachers')),
            getDocs(collection(db, 'lessons')),
            getDocs(collection(db, 'exams')),
        ]);

        let students = studentsSnap.docs
            .map(doc => ({id: doc.id, ...doc.data()}))
            .filter(s => s.name?.toLowerCase().includes(q) || s.student_id?.includes(q));

        let teachers = teachersSnap.docs
            .map(doc => ({id: doc.id, ...doc.data()}))
            .filter(t => t.name?.toLowerCase().includes(q) || t.email?.toLowerCase().includes(q));

        let lessons = lessonsSnap.docs
            .map(doc => ({id: doc.id, ...doc.data()}))
            .filter(l => {
                const subject = l.subject?.toLowerCase();
                if (!subject) return false;
                if (normalizedSubject) return subject === normalizedSubject;
                return subject.includes(q);
            });

        let exams = examsSnap.docs
            .map(doc => ({id: doc.id, ...doc.data()}))
            .filter(e => e.subject?.toLowerCase().includes(q) || e.material?.toLowerCase().includes(q));

        if (userRole !== 'admin') {
            students = students.filter(s => assignedStudentIds.includes(s.student_id));
            lessons = lessons.filter(
                (l) =>
                    l.teacher_id === currentTeacherId &&
                    Array.isArray(l.students) &&
                    l.students.some(s => assignedStudentIds.includes(s.student_id))
            );

            exams = exams.filter(e => assignedStudentIds.includes(e.student_id));
            teachers = [];
        }

        const enrichedLessons = await Promise.all(
            lessons.slice(0, 5).map(async (l) => {
                const teacherDoc = l.teacher_id ? await getDoc(doc(db, 'teachers', l.teacher_id)) : null;
                const teacherName = teacherDoc?.exists() ? teacherDoc.data().name : t("unknown");
                const studentsCount = l.students?.length || 0;

                return {
                    id: l.id,
                    subject: l.subject,
                    date: l.lesson_date?.toDate().toLocaleDateString(),
                    teacherName,
                    studentsCount,
                };
            })
        );

        setResults({
            students: students.slice(0, 5),
            teachers: teachers.slice(0, 5),
            lessons: enrichedLessons,
            exams: exams.slice(0, 5)
        });
        setShowResults(true);
    };

    const handleResultClick = (type, id) => {
        if (type === 'student') navigate(`/students/${id}`);
        else if (type === 'teacher') navigate(`/admin/teachers/${id}/edit`);
        else if (type === 'lesson') navigate(`/lesson-log/${id}/details`);
        else if (type === 'exam') navigate(`/admin/exams`);

        setSearchQuery('');
        setResults({students: [], teachers: [], lessons: [], exams: []});
        setShowResults(false);
    };

    return (
        <header className="h-16 px-6 flex items-center justify-between bg-white border-b border-blue-100 shadow-sm z-40">
            {/* Search */}
            <div className="relative w-full max-w-sm" ref={resultsRef}>
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                    type="text"
                    placeholder={t("Search Everywhere")}
                    value={searchQuery}
                    onChange={handleSearch}
                    onFocus={() => setShowResults(true)}
                    className="pl-10 pr-4 py-2 rounded-md bg-white/70 backdrop-blur-sm border border-blue-200 shadow-inner text-sm placeholder-gray-400 focus:ring-2 focus:ring-blue-200 focus:outline-none transition"
                />
                {showResults && (
                    <div className="absolute top-full left-0 right-0 bg-white border mt-1 rounded shadow z-10 max-h-96 overflow-y-auto">
                        {results.students.length > 0 && (
                            <div>
                                <p className="text-sm text-gray-500 px-4 py-1 border-b">{t("students")}</p>
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

                        {userRole === 'admin' && results.teachers.length > 0 && (
                            <div>
                                <p className="text-sm text-gray-500 px-4 py-1 border-b">{t("teachers")}</p>
                                {results.teachers.map((tch) => (
                                    <div
                                        key={tch.id}
                                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                                        onMouseDown={() => handleResultClick('teacher', tch.id)}
                                    >
                                        🧑‍🏫 {tch.name}
                                    </div>
                                ))}
                            </div>
                        )}

                        {results.lessons.length > 0 && (
                            <div>
                                <p className="text-sm text-gray-500 px-4 py-1 border-b">{t("lessons")}</p>
                                {results.lessons.map((l) => (
                                    <div
                                        key={l.id}
                                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                                        onMouseDown={() => handleResultClick('lesson', l.id)}
                                    >
                                        📘 {l.date} - {t(l.subject)}<br />
                                        👥 {l.studentsCount} | 🧑‍🏫 {l.teacherName}
                                    </div>
                                ))}
                            </div>
                        )}

                        {results.exams.length > 0 && (
                            <div>
                                <p className="text-sm text-gray-500 px-4 py-1 border-b">{t("exams")}</p>
                                {results.exams.map((e) => (
                                    <div
                                        key={e.id}
                                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                                        onMouseDown={() => handleResultClick('exam', e.id)}
                                    >
                                        📝 {t(e.subject)} - {e.material}
                                    </div>
                                ))}
                            </div>
                        )}

                        {Object.values(results).every(arr => arr.length === 0) && (
                            <p className="text-gray-500 text-sm px-4 py-2">{t("no_results")}</p>
                        )}
                    </div>
                )}
            </div>

            <div className="flex items-center gap-4 ml-auto">
                {/* Language Globe (keeps dropdown) */}
                <DropDownMenu
                    label={<Globe className="h-5 w-5" />}
                    options={["en", "ar", "he"]}
                    selected={[i18n.language]}
                    onChange={([lng]) => i18n.changeLanguage(lng)}
                    renderLabel={(lng) => lng.toUpperCase()}
                    multiSelect={false}
                />

                {/* Avatar — plain image, no dropdown */}
                <img
                    src={`https://ui-avatars.com/api/?name=${userName || 'User'}&background=random`}
                    alt="User"
                    className="h-10 w-10 rounded-full transition-transform hover:scale-105 cursor-default select-none"
                    draggable={false}
                />
            </div>
        </header>
    );
};

export default Header;
