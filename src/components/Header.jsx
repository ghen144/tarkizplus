// Header.jsx - Updated with enhanced search (students, teachers, lessons)

import React, { useEffect, useState } from 'react';
import { Search, ChevronDown } from 'lucide-react';
import DropdownMenu from './DropdownMenu.jsx';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { collection, getDocs, getDoc, doc, query, where } from 'firebase/firestore';
import { db } from '@/firebase/firebase.jsx';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

const Header = () => {
  const { t } = useTranslation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [userName, setUserName] = useState('User');
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState({ students: [], teachers: [], lessons: [] });
  const [showResults, setShowResults] = useState(false);
  const auth = getAuth();
  const role = localStorage.getItem('userRole');
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const collectionName = role === 'admin' ? 'admin' : 'teachers';
          const q = query(collection(db, collectionName), where('email', '==', user.email));
          const snapshot = await getDocs(q);
          if (!snapshot.empty) {
            const data = snapshot.docs[0].data();
            setUserName(data.name || (role === 'admin' ? t("admin") : t("teacher")));
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      }
    });
    return () => unsubscribe();
  }, [auth, role, t]);

  const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen);
  const closeDropdown = () => setIsDropdownOpen(false);

  const handleSearch = async (e) => {
    const queryValue = e.target.value;
    setSearchQuery(queryValue);
    if (queryValue.trim() === '') {
      setResults({ students: [], teachers: [], lessons: [] });
      return;
    }

    const [studentsSnap, teachersSnap, lessonsSnap] = await Promise.all([
      getDocs(collection(db, 'students')),
      getDocs(collection(db, 'teachers')),
      getDocs(collection(db, 'lessons')),
    ]);

    const q = queryValue.toLowerCase();

    const students = studentsSnap.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(s => s.name?.toLowerCase().includes(q) || s.student_id?.includes(q))
      .slice(0, 5);

    const teachers = teachersSnap.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(t => t.name?.toLowerCase().includes(q) || t.email?.toLowerCase().includes(q))
      .slice(0, 5);

    const lessonsRaw = lessonsSnap.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(l => l.subject?.toLowerCase().includes(q))
      .slice(0, 5);

    const lessons = await Promise.all(lessonsRaw.map(async (l) => {
      const teacherDoc = l.teacher_id ? await getDoc(doc(db, 'teachers', l.teacher_id)) : null;
      const teacherName = teacherDoc?.exists() ? teacherDoc.data().name : t("unknown");
      const studentsCount = Array.isArray(l.student_ids) ? l.student_ids.length : 0;
      return {
        id: l.id,
        subject: l.subject,
        date: l.lesson_date?.toDate().toLocaleDateString(),
        teacherName,
        studentsCount,
      };
    }));

    setResults({ students, teachers, lessons });
    setShowResults(true);
  };

  const handleResultClick = (type, id) => {
    if (type === 'student') navigate(`/students/${id}`);
    else if (type === 'teacher') navigate(`/admin/teachers/${id}/edit`);
    else if (type === 'lesson') navigate(`/lesson-log/${id}/details`);

    setSearchQuery('');
    setResults({ students: [], teachers: [], lessons: [] });
    setShowResults(false);
  };

  return (
    <header className="bg-white p-4 border-b flex justify-between items-center">
      <div>
        <h1 className="text-xl font-semibold">
          {t("welcome")}, {userName?.split(' ')[0] || t("user")}
        </h1>
      </div>
      <div className="flex items-center gap-4 relative">
        <div className="relative w-96">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder={t("search")}
            value={searchQuery}
            onChange={handleSearch}
            onFocus={() => setShowResults(true)}
            className="pl-10 pr-4 py-2 rounded-lg border border-gray-300 w-full"
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
              {results.teachers.length > 0 && (
                <div>
                  <p className="text-sm text-gray-500 px-4 py-1 border-b">{t("teachers")}</p>
                  {results.teachers.map((t) => (
                    <div
                      key={t.id}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                      onMouseDown={() => handleResultClick('teacher', t.id)}
                    >
                      🧑‍🏫 {t.name}
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
                      📘 {l.date} - {t(l.subject)}<br/>
                      👥 {l.studentsCount} | 🧑‍🏫 {l.teacherName}
                    </div>
                  ))}
                </div>
              )}
              {results.students.length === 0 && results.teachers.length === 0 && results.lessons.length === 0 && (
                <p className="text-gray-500 text-sm px-4 py-2">{t("no_results")}</p>
              )}
            </div>
          )}
        </div>
        <div className="relative">
          {role === 'admin' ? (
            <button
              onClick={toggleDropdown}
              className="flex items-center gap-2 text-gray-600 hover:text-blue-600 focus:outline-none bg-gray-100 px-4 py-2 rounded-full"
            >
              <span className="font-semibold">🛡️ {userName || 'Admin'}</span>
              <ChevronDown size={16} />
            </button>
          ) : (
            <button
              onClick={toggleDropdown}
              className="flex items-center gap-2 text-gray-600 hover:text-blue-500 focus:outline-none"
            >
              <img
                src={`https://ui-avatars.com/api/?name=${userName || 'User'}&background=random`}
                alt="User"
                className="h-10 w-10 rounded-full"
              />
            </button>
          )}
          {isDropdownOpen && <DropdownMenu onClose={closeDropdown} />}
        </div>
      </div>
    </header>
  );
};

export default Header;
