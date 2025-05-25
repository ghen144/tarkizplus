
import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  where,
  orderBy,
  addDoc,
} from "firebase/firestore";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { db } from "@/firebase/firebase.jsx";
import { getAuth } from "firebase/auth";
import {
  ArrowLeft,
  BookOpen,
  AlertCircle,
  User,
  Smartphone,
  Calendar,
  ClipboardList,
  CheckCircle,
} from "lucide-react";
import { useTranslation } from "react-i18next";

const StudentProfile = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { studentId } = useParams();
  const [studentData, setStudentData] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [teachersMap, setTeachersMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [selectedTeacherFilters, setSelectedTeacherFilters] = useState([]);
  const [selectedSubjectFilters, setSelectedSubjectFilters] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [sortOrder, setSortOrder] = useState("desc");

  // Exams
  const [exams, setExams] = useState([]);
  const [showExamForm, setShowExamForm] = useState(false);
  const [newExam, setNewExam] = useState({
    subject: "",
    exam_date: "",
    material: "",
  });
  const [isAdmin, setIsAdmin] = useState(false);
const currentStudentId = studentData?.student_id || "";

  // نحسب حضور وغياب الطالب
const studentLessons = lessons.filter((lesson) => {
  if (Array.isArray(lesson.students)) {
    // درس جماعي: لازم يكون الطالب موجود وstatus = "present"
    return lesson.students.some(
      (s) => s.student_id === currentStudentId && s.status === "present"
    );
  } else {
    // درس قديم: نعرضه فقط إذا الطالب نفسه (وما فيه حالة absent لأنه ما في status أصلاً)
    return lesson.student_id === currentStudentId;
  }
});










const attendedCount = studentLessons.filter(
  (lesson) =>
    Array.isArray(lesson.students) &&
    lesson.students.some(
      (s) => s.student_id === currentStudentId && s.status === "present"
    )
).length;

const missedCount = lessons.filter((lesson) => {
  if (Array.isArray(lesson.students)) {
    const studentEntry = lesson.students.find((s) => s.student_id === currentStudentId);
    return studentEntry && studentEntry.status === "absent";
  }
  return false; // لا نحسب الغياب للدروس القديمة
}).length;



const untrackedLessons = studentLessons.filter(
  (lesson) =>
    Array.isArray(lesson.students) &&
    !lesson.students.some((s) => s.student_id === currentStudentId)
).length;

const totalAttendance = attendedCount + untrackedLessons;
const weeklyAttendance = studentData?.attendance_count_weekly || 0;



  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;

    if (user) {
      const checkAdminStatus = async () => {
        try {
          const adminRef = doc(db, "admins", user.uid);
          const adminSnap = await getDoc(adminRef);
          setIsAdmin(adminSnap.exists());
        } catch (error) {
          console.error(t("error_checking_admin"), error);
          setIsAdmin(false);
        }
      };
      checkAdminStatus();
    }
  }, []);

  const handleSaveExam = async () => {
    if (!newExam.subject || !newExam.exam_date || !newExam.material) {
      alert(t("alert_fill_all_fields"));
      return;
    }

    try {
      const examDateTimestamp = new Date(newExam.exam_date);
      await addDoc(collection(db, "exams"), {
        student_id: studentId,
        subject: newExam.subject,
        exam_date: examDateTimestamp,
        material: newExam.material,
      });
      alert(t("alert_exam_added"));
      setShowExamForm(false);
      setNewExam({ subject: "", exam_date: "", material: "" });

      const updatedSnapshot = await getDocs(
        query(collection(db, "exams"), where("student_id", "==", studentId))
      );
      const updatedExams = updatedSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setExams(updatedExams);
    } catch (err) {
      console.error("Error adding exam:", err);
      alert(t("alert_exam_failed"));
    }
  };

  const handleAddTeacherFilter = (e) => {
    const teacherName = e.target.value;
    if (teacherName && !selectedTeacherFilters.includes(teacherName)) {
      setSelectedTeacherFilters((prev) => [...prev, teacherName]);
    }
    e.target.value = "";
  };

  const handleAddSubjectFilter = (e) => {
    const subject = e.target.value;
    if (subject && !selectedSubjectFilters.includes(subject)) {
      setSelectedSubjectFilters((prev) => [...prev, subject]);
    }
    e.target.value = "";
  };

  const removeTeacherFilter = (name) => {
    setSelectedTeacherFilters((prev) => prev.filter((t) => t !== name));
  };

  const removeSubjectFilter = (subject) => {
    setSelectedSubjectFilters((prev) => prev.filter((s) => s !== subject));
  };

  useEffect(() => {
    const fetchStudentDataAndLessons = async () => {
      if (!studentId) {
        setError(t("error_no_student_id"));
        setLoading(false);
        return;
      }

      try {
        const studentRef = doc(db, "students", studentId);
        const studentDocSnap = await getDoc(studentRef);
        if (!studentDocSnap.exists()) {
          setError(t("error_student_not_found"));
          setLoading(false);
          return;
        }
        const studentDocData = studentDocSnap.data();
        setStudentData({ id: studentId, ...studentDocData });

        const lessonsQuery = query(
  collection(db, "lessons"),
  orderBy("lesson_date", "desc")
);

        const lessonsSnapshot = await getDocs(lessonsQuery);
        const lessonsList = lessonsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setLessons(lessonsList);




        const teachersSnap = await getDocs(collection(db, "teachers"));
        const tMap = {};
        teachersSnap.forEach((tdoc) => {
          const tData = tdoc.data();
          tMap[tdoc.id] = tData.name || t("unnamed_teacher");
        });
        setTeachersMap(tMap);

        const examsQuery = query(
          collection(db, "exams"),
          where("student_id", "==", studentId)
        );
        const examsSnapshot = await getDocs(examsQuery);
        const examsList = examsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setExams(examsList);
      } catch (err) {
        console.error("Error fetching student/lessons:", err);
        setError(t("error_loading_data", { message: err.message }));
      } finally {
        setLoading(false);
      }
    };

    fetchStudentDataAndLessons();
  }, [studentId]);
  const handleReturn = () => {
    navigate(isAdmin ? "/admin/students" : "/students");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <main className="ml-64 flex-1 p-6 flex items-center justify-center">
          <p>{t("loading")}</p>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <main className="ml-64 flex-1 p-6">
          <div className="flex items-center justify-center h-full">
            <p className="text-red-500">{error}</p>
          </div>
          <div className="mt-6">
            <button
              className="flex items-center bg-white p-3 rounded-lg shadow hover:bg-gray-100"
              onClick={handleReturn}
            >
              <ArrowLeft className="h-5 w-5 text-gray-500 mr-2" />
              {t("return_button")}
            </button>
          </div>
        </main>
      </div>
    );
  }

  const {
    name,
    grade,
    subjects,
    learning_difficulties,
    parent_phone_number,
    PreferredLearningStyle,
    engagement_level,
    recent_performance,
    attendance_count_weekly,
    reading_accommodation,
    oral_response_allowed,
    extra_time,
    spelling_mistakes_ignored,
    calculator_or_formula_sheet,
    private_or_group_lessons,
  } = studentData || {};

  const subjectsText = Array.isArray(subjects)
  ? subjects.map((s) => t(s)).join(", ")
  : t("na");


  const formatDate = (ts) =>
    ts ? ts.toDate().toLocaleDateString() : t("no_date");

 const filteredAndSortedLessons = [...studentLessons]
  .filter((lesson) => {
    // فلترة حسب المعلم
    const teacherName = teachersMap[lesson.teacher_id] || "";
    const matchesTeacher =
      selectedTeacherFilters.length === 0 ||
      selectedTeacherFilters.includes(teacherName);

    // فلترة حسب الموضوع
    const matchesSubject =
      selectedSubjectFilters.length === 0 ||
      selectedSubjectFilters.includes(lesson.subject);

    // فلترة حسب التاريخ
    const matchesDate =
      !selectedDate ||
      (lesson.lesson_date &&
 lesson.lesson_date.toDate().toLocaleDateString("en-CA") === selectedDate);


    return matchesTeacher && matchesSubject && matchesDate;
  })
  .sort((a, b) => {
    const dateA = a.lesson_date?.toDate();
    const dateB = b.lesson_date?.toDate();
    if (!dateA || !dateB) return 0;
    return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
  });

  const progressData = filteredAndSortedLessons
  .map((lesson) => {
    let progress = null;
    if (Array.isArray(lesson.students)) {
      const studentEntry = lesson.students.find(s => s.student_id === currentStudentId);
      progress = studentEntry?.progress_assessment;
    } else {
      progress = lesson.progress_assessment;
    }

    return {
      date: lesson.lesson_date?.toDate().toLocaleDateString("en-GB"),
      progress: Number(progress)
    };
  })
  .filter(item => !isNaN(item.progress));


 


  return (
    <div className="flex min-h-screen bg-gray-200">
      <main className="ml-0 flex-1 p-6 space-y-6">
        {/* General Information Card */}
        <div className="bg-white p-6 rounded-lg shadow-md space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <User className="h-5 w-5 text-blue-600" />
            <h2 className="text-2xl font-bold">
              {t("general_info")}
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <strong>{t("name")}:</strong> {name || t("na")}
            </div>
            <div>
            <strong>{t("grade")}:</strong> {t(grade) || t("na")}

            </div>
            <div>
              <strong>{t("subjects")}:</strong> {subjectsText}
            </div>
            <div>
              <strong>{t("parent_phone")}:</strong> {parent_phone_number || t("na")}
            </div>
          </div>
        </div>

        {/* Learning Accommodations Card */}
        <div className="bg-white p-6 rounded-lg shadow-md space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="h-5 w-5 text-blue-600" />

            <h2 className="text-2xl font-bold">{t("learning_accommodations")}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div><strong>{t("preferred_learning_style")}</strong>: {PreferredLearningStyle || t("na")}</div>
            <div><strong>{t("learning_difficulties")}</strong>: {learning_difficulties || t("no")}</div>
            <div><strong>{t("private_or_group")}</strong>: {t(private_or_group_lessons) || t("na")}</div>
            <div><strong>{t("reading_accommodation")}</strong>: {reading_accommodation ? t("yes") : t("no")}</div>
            <div><strong>{t("oral_response")}</strong>: {oral_response_allowed ? t("yes") : t("no")}</div>
            <div><strong>{t("extra_time")}</strong>: {extra_time ? t("yes") : t("no")}</div>
            <div><strong>{t("spelling_ignored")}</strong>: {spelling_mistakes_ignored ? t("yes") : t("no")}</div>
            <div><strong>{t("calculator_or_sheet")}</strong>: {calculator_or_formula_sheet ? t("yes") : t("no")}</div>
          </div>
        </div>

        {/* Performance & Progress Card */}
<div className="bg-white p-6 rounded-lg shadow-md space-y-4">
  <div className="flex items-center gap-2 mb-4">
    <CheckCircle className="h-5 w-5 text-blue-600" />
    <h2 className="text-2xl font-bold">{t("performance_progress")}</h2>
  </div>
  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
    <div><strong>{t("engagement_level")}</strong>: {engagement_level || t("na")}</div>
    <div><strong>{t("recent_performance")}</strong>: {recent_performance || t("na")}</div>
    <div><strong>{t("weekly_attendance")}</strong>: {weeklyAttendance}</div>
    <div><strong>{t("total_absences")}</strong>: {missedCount}</div>
  </div>
</div>


        {/* Lesson History */}
        <div className="bg-white p-6 rounded-lg shadow mt-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-5 w-5 text-blue-500" />
            <h2 className="text-2xl font-bold">{t("lesson_history")}</h2>
          </div>
          <p className="text-sm text-gray-500 mb-2">
            {t("filter_info")}
          </p>

          {/* Filter Controls */}
          <div className="flex flex-wrap gap-4 mb-4">
            {/* Teacher Filter */}
            <div>
              <p className="font-medium mb-1">{t("teacher")}</p>
              <select onChange={handleAddTeacherFilter} className="p-2 border rounded text-sm">
                <option value="">{t("select")}</option>
                {Object.entries(teachersMap).map(([id, name]) => (
                  <option key={id} value={name}>{name}</option>
                ))}
              </select>
              <div className="mt-2 flex flex-wrap gap-2">
                {selectedTeacherFilters.map((name) => (
                  <span
                    key={name}
                    className="bg-blue-200 text-blue-800 rounded px-2 py-1 text-sm flex items-center"
                  >
                    {name}
                    <button
                      onClick={() => removeTeacherFilter(name)}
                      className="ml-1 text-blue-600 font-bold"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            </div>

    {/* Subject Filter */}
    <div>
      <p className="font-medium mb-1">{t("subject")}</p>
      <select onChange={handleAddSubjectFilter} className="p-2 border rounded text-sm">
        <option value="">{t("select")}</option>
        {[...new Set(lessons.map((l) => l.subject))].map((subject) => (
          <option key={subject} value={subject}>{t(subject)}</option>
        ))}
      </select>
      <div className="mt-2 flex flex-wrap gap-2">
        {selectedSubjectFilters.map((subject) => (
          <span
            key={subject}
            className="bg-green-200 text-green-800 rounded px-2 py-1 text-sm flex items-center"
          >
            {subject}
            <button
              onClick={() => removeSubjectFilter(subject)}
              className="ml-1 text-green-600 font-bold"
            >
              &times;
            </button>
          </span>
        ))}
      </div>
    </div>


                        {/* Date Filter */}
<input
  type="date"
  value={selectedDate}
  onChange={(e) => setSelectedDate(e.target.value)}
  className="p-2 border rounded"
/>

{/* Sort Button */}
<button
  onClick={() => setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"))}
  className="p-2 border rounded bg-white text-gray-700 hover:bg-gray-100"
>
  {sortOrder === "desc"
    ? t("sort_newest")
    : t("sort_oldest")}
</button>
</div>

<div className="overflow-x-auto">
  {lessons.length > 0 ? (
    <table className="min-w-full bg-white">
      <thead>
        <tr>
          <th className="px-6 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
            {t("date")}
          </th>
          <th className="px-6 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
            {t("teacher")}
          </th>
          <th className="px-6 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
            {t("subject")}
          </th>
          <th className="px-6 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
            {t("notes")}
          </th>
          <th className="px-6 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
            {t("progress")}
          </th>
        </tr>
      </thead>
      <tbody>
  {filteredAndSortedLessons.map((lesson) => {
      const teacherName = teachersMap[lesson.teacher_id] || lesson.teacher_id || t("no_teacher");

      let studentNote = "";
      let studentProgress = "";

      if (Array.isArray(lesson.students)) {
        const match = lesson.students.find(s => s.student_id === currentStudentId);
        studentNote = match?.student_notes || lesson.lesson_notes || "";

        studentProgress = match?.progress_assessment || "";
      } else {
        studentNote = lesson.lesson_notes || "";
        studentProgress = lesson.progress_assessment || "";
      }

      return (
        <tr key={lesson.id} className="hover:bg-gray-50">
          <td className="px-6 py-4 border-b border-gray-200">
            {formatDate(lesson.lesson_date)}
          </td>
          <td className="px-6 py-4 border-b border-gray-200">
            {teacherName}
          </td>
          <td className="px-6 py-4 border-b border-gray-200">
            {t(lesson.subject) || t("no_subject")}
          </td>
          <td className="px-6 py-4 border-b border-gray-200">
            {studentNote || t("no_notes")}
          </td>
          <td className="px-6 py-4 border-b border-gray-200">
            {studentProgress || t("no_progress")}
          </td>
        </tr>
      );
    })}
    
</tbody>

    </table>
  ) : (
    <p className="text-gray-500">{t("no_lessons")}</p>
  )}
</div>
</div>

{/* Missed Lessons Table */}
<div className="bg-white p-6 rounded-lg shadow mt-6">
  <div className="flex items-center gap-2 mb-4">
    <AlertCircle className="h-5 w-5 text-red-500" />
    <h2 className="text-2xl font-bold">{t("missed_lessons")}</h2>
  </div>
  <div className="overflow-x-auto">
    {lessons.some(lesson =>
      Array.isArray(lesson.students) &&
      lesson.students.find(s => s.student_id === currentStudentId && s.status === "absent")
    ) ? (
      <table className="min-w-full bg-white">
        <thead>
          <tr>
            <th className="px-6 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              {t("date")}
            </th>
            <th className="px-6 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              {t("teacher")}
            </th>
            <th className="px-6 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              {t("subject")}
            </th>
          </tr>
        </thead>
        <tbody>
          {lessons
            .filter(
              lesson =>
                Array.isArray(lesson.students) &&
                lesson.students.some(s => s.student_id === currentStudentId && s.status === "absent")
            )
            .map(lesson => {
              const teacherName =
                teachersMap[lesson.teacher_id] || lesson.teacher_id || t("no_teacher");
              return (
                <tr key={lesson.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 border-b border-gray-200">
                    {formatDate(lesson.lesson_date)}
                  </td>
                  <td className="px-6 py-4 border-b border-gray-200">{teacherName}</td>
                  <td className="px-6 py-4 border-b border-gray-200">
                    {t(lesson.subject) || t("no_subject")}
                  </td>
                </tr>
              );
            })}
        </tbody>
      </table>
    ) : (
      <p className="text-gray-500">{t("no_absent_lessons")}</p>
    )}
  </div>
</div>



{/* Progress Chart */}
<div className="bg-white p-6 rounded-lg shadow-md space-y-4">
  <div className="flex items-center gap-2 mb-4">
    <CheckCircle className="h-5 w-5 text-blue-600" />
    <h2 className="text-2xl font-bold">{t("progress_over_time")}</h2>
  </div>
  {progressData.length > 0 ? (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={progressData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis
  domain={[1, 5]}
  ticks={[1, 2, 3, 4, 5]}
  label={{
    value: t("progress"),
    angle: -90,
    position: "insideLeft",
    offset: 10
  }}
/>

<Tooltip
  formatter={(value, name) => {
    const translatedName = name === "progress" ? t("progress") : name;
    return [value, translatedName];
  }}
/>

        <Line
          type="monotone"
          dataKey="progress"
          stroke="#3182ce"
          strokeWidth={2}
          dot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  ) : (
    <p className="text-gray-500">{t("no_progress_data")}</p>
  )}
</div>

{/* Exam Table */}
<div className="bg-white p-6 rounded-lg shadow mt-6">
  <div className="flex items-center gap-2 mb-4">
    <ClipboardList className="h-5 w-5 text-blue-500" />
    <h2 className="text-xl font-semibold">{t("exams")}</h2>
  </div>
  {exams.length > 0 ? (
    <table className="min-w-full bg-white">
      <thead>
        <tr>
          <th className="px-6 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
            {t("subject")}
          </th>
          <th className="px-6 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
            {t("exam_date")}
          </th>
          <th className="px-6 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
            {t("material")}
          </th>
        </tr>
      </thead>
      <tbody>
        {exams.map((exam) => {
          let examDate = t("no_date");
          if (exam.exam_date && typeof exam.exam_date.toDate === "function") {
            examDate = exam.exam_date.toDate().toLocaleDateString("en-GB");
          }
          return (
            <tr key={exam.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 border-b border-gray-200">{exam.subject}</td>
              <td className="px-6 py-4 border-b border-gray-200">{examDate}</td>
              <td className="px-6 py-4 border-b border-gray-200">{exam.material}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  ) : (
    <p className="text-gray-500">{t("no_exams")}</p>
  )}
</div>

<div className="mt-4">
  <button
    onClick={() => setShowExamForm((prev) => !prev)}
    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
  >
    {showExamForm ? t("cancel") : t("add_exam")}
  </button>
</div>

{showExamForm && (
  <div className="bg-gray-50 p-4 mt-4 rounded shadow space-y-4 max-w-md">
    <div>
      <label className="block font-medium">{t("subject")}</label>
      <input
        type="text"
        value={newExam.subject}
        onChange={(e) => setNewExam({ ...newExam, subject: e.target.value })}
        className="w-full border p-2 rounded"
        placeholder={t("placeholder_subject")}
      />
    </div>
    <div>
      <label className="block font-medium">{t("exam_date")}</label>
      <input
        type="datetime-local"
        value={newExam.exam_date}
        onChange={(e) => setNewExam({ ...newExam, exam_date: e.target.value })}
        className="w-full border p-2 rounded"
      />
    </div>
    <div>
      <label className="block font-medium">{t("material")}</label>
      <input
        type="text"
        value={newExam.material}
        onChange={(e) => setNewExam({ ...newExam, material: e.target.value })}
        className="w-full border p-2 rounded"
        placeholder={t("placeholder_material")}
      />
    </div>
    <button
      onClick={handleSaveExam}
      className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
    >
      {t("save_exam")}
    </button>
  </div>
)}

{/* Return Button */}
<div className="mt-6">
  <button
    className="flex items-center bg-white p-3 rounded-lg shadow hover:bg-gray-100"
    onClick={handleReturn}
  >
    <ArrowLeft className="h-5 w-5 text-gray-500 mr-2" />
    {t("return_button")}
  </button>
</div>
</main>
</div>
);
};

export default StudentProfile;