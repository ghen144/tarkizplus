import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/firebase/firebase.jsx";
import AdminSidebar from "@/components/admin/AdminSidebar.jsx";
import { useTranslation } from "react-i18next";

const AdminExamsPage = () => {
  const { t } = useTranslation();
  const [exams, setExams] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  const [subjectFilter, setSubjectFilter] = useState("");
  const [sortByDate, setSortByDate] = useState("asc");
  const [searchName, setSearchName] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const examsSnap = await getDocs(collection(db, "exams"));
        const studentsSnap = await getDocs(collection(db, "students"));

        const examsData = examsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const studentsData = studentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        setExams(examsData);
        setStudents(studentsData);
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getStudentName = (studentId) => {
    const student = students.find(s => s.student_id === studentId);
    return student?.name || studentId;
  };

  const filteredExams = exams
    .filter(e => !subjectFilter || e.subject === subjectFilter)
    .filter(e => {
      const studentName = getStudentName(e.student_id);
      return studentName?.toLowerCase().includes(searchName.toLowerCase());
    })
    .sort((a, b) => {
      const dateA = a.exam_date?.seconds || 0;
      const dateB = b.exam_date?.seconds || 0;
      return sortByDate === "asc" ? dateA - dateB : dateB - dateA;
    });

  return (
    <div className="flex min-h-screen bg-gray-100">
      <AdminSidebar active="exams" />
      <main className="flex-1 p-6">
        <h1 className="text-3xl font-bold mb-6">{t('all_exams')}</h1>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-4">
          <input
            type="text"
            placeholder={t('search_student')}
            className="border px-4 py-2 rounded"
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
          />

          <select
            className="border px-4 py-2 rounded"
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
          >
            <option value="">{t('all_subjects')}</option>
            <option value="Math">{t('math')}</option>
            <option value="English">{t('english')}</option>
            <option value="Hebrew">{t('hebrew')}</option>
            <option value="Arabic">{t('arabic')}</option>
          </select>

          <select
            className="border px-4 py-2 rounded"
            value={sortByDate}
            onChange={(e) => setSortByDate(e.target.value)}
          >
            <option value="asc">{t('nearest_first')}</option>
            <option value="desc">{t('farthest_first')}</option>
          </select>
        </div>

        {loading ? (
          <p>{t('loading_exams')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded shadow">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">{t('student_name')}</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">{t('subject')}</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">{t('exam_date')}</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">{t('material')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredExams.map(exam => (
                  <tr key={exam.id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4">{getStudentName(exam.student_id)}</td>
                    <td className="px-6 py-4">{t(exam.subject.toLowerCase())}</td>
                    <td className="px-6 py-4">
                      {exam.exam_date?.seconds
                        ? new Date(exam.exam_date.seconds * 1000).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="px-6 py-4 whitespace-pre-line">{exam.material || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminExamsPage;