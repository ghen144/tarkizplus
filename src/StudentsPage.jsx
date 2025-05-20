import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Search } from 'lucide-react';
import { db } from './firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import SkeletonLoader from './SkeletonLoader';
import { useTranslation } from 'react-i18next';

function StudentsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const auth = getAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTeacherId, setCurrentTeacherId] = useState(null);

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

        const studentsCollection = collection(db, 'students');
        const studentsSnapshot = await getDocs(studentsCollection);

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

  const filteredStudents = students.filter((student) =>
    student.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleStudentClick = (student) => {
    navigate(`/students/${student.id}`);
  };

  return (
    <div>
      {/* Search Box */}
      <div className="mb-6 flex items-center bg-white p-3 rounded-lg shadow">
        <Search className="h-5 w-5 text-gray-500 mr-3" />
        <input
          type="text"
          placeholder={t("studentsPage.search_placeholder")}
          className="flex-1 focus:outline-none bg-white text-black p-2 rounded-md"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Students Grid */}
      {loading ? (
        <SkeletonLoader rows={3} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStudents.length > 0 ? (
            filteredStudents.map((student) => (
              <div
                key={student.id}
                className="bg-white p-6 rounded-lg shadow cursor-pointer hover:bg-gray-100"
                onClick={() => handleStudentClick(student)}
              >
                <div className="flex items-center gap-3">
                  <User className="h-12 w-12 text-gray-500" />
                  <div>
                    <h3 className="text-lg font-medium">{student.name}</h3>
                    <p className="text-gray-500 text-sm">{student.grade}</p>
                    <p className="text-gray-500 text-sm">
                      {Array.isArray(student.subjects)
                        ? student.subjects.join(', ')
                        : student.subjects}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500">{t("studentsPage.no_students")}</p>
          )}
        </div>
      )}
    </div>
  );
}

export default StudentsPage;
