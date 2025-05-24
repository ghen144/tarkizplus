// LessonLog.jsx - يشمل نوع الدرس، الحضور، التعديل، التفاصيل، الفلترة، البحث، الترتيب
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { db } from "@/firebase/firebase.jsx";
import {
  collection,
  getDocs,
  query,
  orderBy,
  where,
  limit,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { useTranslation } from "react-i18next";

const SUBJECT_OPTIONS = ["Math", "English", "Hebrew", "Arabic"];

const LessonLog = () => {
  const { t } = useTranslation();
  const auth = getAuth();
  const [lessons, setLessons] = useState([]);
  const [teachersMap, setTeachersMap] = useState({});
  const [studentsMap, setStudentsMap] = useState({});
  const [assignedStudentIds, setAssignedStudentIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [teacherDocId, setTeacherDocId] = useState("");
  const [lessonsLimit, setLessonsLimit] = useState(10);
  const [selectedTeacherFilters, setSelectedTeacherFilters] = useState([]);
  const [selectedSubjectFilters, setSelectedSubjectFilters] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortAsc, setSortAsc] = useState(false);

  useEffect(() => {
    const fetchStaticData = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const teacherQuerySnapshot = await getDocs(
          query(collection(db, "teachers"), where("email", "==", user.email))
        );
        const teacherDoc = teacherQuerySnapshot.docs[0];
        setTeacherDocId(teacherDoc.id);
        const teacherData = teacherDoc.data();
        setAssignedStudentIds(teacherData.assigned_students || []);

        const allTeachersSnapshot = await getDocs(collection(db, "teachers"));
        const tMap = {};
        allTeachersSnapshot.docs.forEach((doc) => {
          tMap[doc.id] = doc.data().name;
        });
        setTeachersMap(tMap);

        const allStudentsSnapshot = await getDocs(collection(db, "students"));
        const sMap = {};
        allStudentsSnapshot.docs.forEach((doc) => {
          sMap[doc.id] = doc.data().name;
        });
        setStudentsMap(sMap);
      } catch (error) {
        console.error("Error fetching static data:", error);
      }
    };

    fetchStaticData();
  }, [auth]);

  useEffect(() => {
    const fetchLessons = async () => {
      try {
        if (assignedStudentIds.length === 0) {
          setLessons([]);
          setLoading(false);
          return;
        }
        setLoading(true);
        const lessonsQuery = query(
          collection(db, "lessons"),
          orderBy("lesson_date", sortAsc ? "asc" : "desc"),
          limit(lessonsLimit)
        );
        const lessonsSnapshot = await getDocs(lessonsQuery);
        const lessonsList = lessonsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setLessons(lessonsList);
      } catch (error) {
        console.error("Error fetching lessons:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLessons();
  }, [assignedStudentIds, lessonsLimit, sortAsc]);

  const filteredLessons = lessons.filter((lesson) => {
    const teacherOk =
      selectedTeacherFilters.length === 0 ||
      selectedTeacherFilters.includes(lesson.teacher_id);
    const subjectOk =
      selectedSubjectFilters.length === 0 ||
      selectedSubjectFilters.includes(lesson.subject);
    const keywordOk =
      !searchTerm ||
      lesson.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (studentsMap[lesson.student_id]?.toLowerCase() || "").includes(searchTerm.toLowerCase());
    return teacherOk && subjectOk && keywordOk;
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-blue-900">{t("recentLessons")}</h2>
        <div className="flex items-center gap-4 flex-wrap">
          <Link
            to="/lesson-log/add"
            className="bg-blue-500 text-white px-3 py-2 rounded hover:bg-blue-600"
          >
            ➕ {t("add")}
          </Link>
          <input
            type="text"
            placeholder={t("search")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border p-2 rounded text-sm"
          />
          <select
            value={lessonsLimit}
            onChange={(e) => setLessonsLimit(Number(e.target.value))}
            className="border p-2 rounded text-sm"
          >
            {[10, 20, 30, 50].map(n => (
              <option key={n} value={n}>{t("show")} {n}</option>
            ))}
          </select>
          <button
            onClick={() => setSortAsc(!sortAsc)}
            className="text-sm underline text-blue-600"
          >
            {sortAsc ? t("oldest") : t("newest")}
          </button>
        </div>
      </div>

      <div className="flex gap-6 flex-wrap">
        <div>
          <p className="font-medium mb-1">{t("teacher")}</p>
          <select
            onChange={(e) => setSelectedTeacherFilters([e.target.value])}
            className="border p-2 rounded text-sm"
          >
            <option value="">{t("select")}</option>
            {Object.entries(teachersMap).map(([id, name]) => (
              <option key={id} value={id}>{name}</option>
            ))}
          </select>
        </div>
        <div>
          <p className="font-medium mb-1">{t("subject")}</p>
          <select
            onChange={(e) => setSelectedSubjectFilters([e.target.value])}
            className="border p-2 rounded text-sm"
          >
            <option value="">{t("select")}</option>
            {SUBJECT_OPTIONS.map(subj => (
              <option key={subj} value={subj}>{t(subj.toLowerCase())}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white p-4 rounded shadow">
        {loading ? (
          <p>{t("loading")}</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-100 text-left">
              <tr>
                <th className="p-2">{t("date")}</th>
                <th className="p-2">{t("subject")}</th>
                <th className="p-2">{t("class_type")}</th>
                <th className="p-2">{t("teacher")}</th>
                <th className="p-2">{t("attendance")}</th>
                <th className="p-2 text-center">{t("actions")}</th>
              </tr>
            </thead>
            <tbody>
              {filteredLessons.map((lesson) => {
                const canEdit = lesson.teacher_id === teacherDocId;
                const presentCount = typeof lesson.present_count === "number"
                  ? lesson.present_count
                  : Array.isArray(lesson.students)
                  ? lesson.students.filter((s) => s.status === "present").length
                  : Array.isArray(lesson.student_ids)
                  ? lesson.student_ids.length
                  : typeof lesson.student_num === "number"
                  ? lesson.student_num
                  : lesson.student_id
                  ? 1
                  : 0;
                const absentCount = typeof lesson.absent_count === "number"
                  ? lesson.absent_count
                  : Array.isArray(lesson.students)
                  ? lesson.students.filter((s) => s.status === "absent").length
                  : 0;
                return (
                  <tr key={lesson.id} className="border-t">
                    <td className="p-2">{lesson.lesson_date.toDate().toLocaleDateString("en-GB")}</td>
                    <td className="p-2">{t(lesson.subject.toLowerCase())}</td>
                    <td className="p-2">{t(lesson.class_type === "individual" ? "individual" : "group")}</td>
                    <td className="p-2">{teachersMap[lesson.teacher_id] || t("unknownTeacher")}</td>
                    <td className="p-2">
                      <p className="text-green-700">{t("present")}: <strong>{presentCount}</strong></p>
                      <p className="text-red-600">{t("absent")}: <strong>{absentCount}</strong></p>
                    </td>
                    <td className="p-2 text-center space-x-2">
                      <Link to={`/lesson-log/${lesson.id}/details`} className="text-blue-500 underline">
                        {t("showMore")}
                      </Link>
                      {canEdit && (
                        <Link to={`/lesson-log/${lesson.id}/edit`} className="text-yellow-500" title={t("editLesson")}>
                          📝
                        </Link>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default LessonLog;
