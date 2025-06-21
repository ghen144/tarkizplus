import React, {useState, useEffect} from "react";
import {Link} from "react-router-dom";
import {db} from "@/firebase/firebase.jsx";
import {
    collection,
    getDocs,
    query,
    orderBy,
    where,
} from "firebase/firestore";
import {getAuth} from "firebase/auth";
import {useTranslation} from "react-i18next";
import DropDownMenu from "@/components/common/DropDownMenu.jsx";
import IconButton from "@/components/common/IconButton.jsx";

const SUBJECT_OPTIONS = ["Math", "English", "Hebrew", "Arabic"];

const LessonLog = () => {
    const {t} = useTranslation();
    const auth = getAuth();
    const [lessons, setLessons] = useState([]);
    const [teachersMap, setTeachersMap] = useState({});
    const [studentsMap, setStudentsMap] = useState({});
    const [loading, setLoading] = useState(true);
    const [teacherDocId, setTeacherDocId] = useState("");
    const [lessonsLimit, setLessonsLimit] = useState(10);
    const [selectedTeacherFilters, setSelectedTeacherFilters] = useState([]);
    const [selectedSubjectFilters, setSelectedSubjectFilters] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortAsc, setSortAsc] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        const fetchStaticData = async () => {
            const user = auth.currentUser;
            if (!user) return;

            const teacherQuerySnapshot = await getDocs(
                query(collection(db, "teachers"), where("email", "==", user.email))
            );
            const teacherDoc = teacherQuerySnapshot.docs[0];
            if (teacherDoc) {
                setTeacherDocId(teacherDoc.id);
            }

            const adminSnap = await getDocs(
                query(collection(db, "admin"), where("email", "==", user.email))
            );
            if (!adminSnap.empty) {
                setIsAdmin(true);
            }

            const teachersSnap = await getDocs(collection(db, "teachers"));
            const tMap = {};
            teachersSnap.forEach((doc) => {
                tMap[doc.id] = doc.data().name;
            });
            setTeachersMap(tMap);

            const studentsSnap = await getDocs(collection(db, "students"));
            const sMap = {};
            studentsSnap.forEach((doc) => {
                sMap[doc.id] = doc.data().name;
            });
            setStudentsMap(sMap);
        };

        fetchStaticData();
    }, [auth]);

    useEffect(() => {
        const fetchLessons = async () => {
            setLoading(true);
            try {
                const q = query(
                    collection(db, "lessons"),
                    orderBy("lesson_date", sortAsc ? "asc" : "desc")
                );
                const snapshot = await getDocs(q);
                const allLessons = snapshot.docs.map((doc) => ({id: doc.id, ...doc.data()}));

                const filtered = isAdmin
                    ? allLessons
                    : allLessons.filter((lesson) => lesson.teacher_id === teacherDocId);

                setLessons(filtered.slice(0, lessonsLimit));
            } catch (err) {
                console.error("Error fetching lessons:", err);
                setLessons([]);
            }
            setLoading(false);
        };

        fetchLessons();
    }, [teacherDocId, lessonsLimit, sortAsc, isAdmin]);

    const filteredLessons = lessons.filter((lesson) => {
        const teacherMatch =
            selectedTeacherFilters.length === 0 ||
            selectedTeacherFilters.includes(lesson.teacher_id);

        const subjectMatch =
            selectedSubjectFilters.length === 0 ||
            selectedSubjectFilters.includes(lesson.subject);

        const keywordMatch =
            !searchTerm ||
            lesson.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (Array.isArray(lesson.students)
                ? lesson.students.some((s) =>
                    (studentsMap[s.student_id]?.toLowerCase() || "").includes(searchTerm.toLowerCase())
                )
                : false);

        return teacherMatch && subjectMatch && keywordMatch;
    });

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold text-blue-900 text-center mb-6">{t("recentLessons")}</h2>

            {loading ? (
                <p className="text-center text-gray-500">{t("loading")}</p>
            ) : filteredLessons.length === 0 ? (
                <p className="text-center text-gray-500">{t("noResults") || "No lessons found."}</p>
            ) : (
                <div
                    className="relative max-w-6xl mx-auto space-y-8 before:absolute before:top-0 before:bottom-0 before:left-1/2 before:w-1 before:-ml-0.5 before:bg-blue-200">
                    {filteredLessons.map((lesson, index) => {
                        const isLeft = index % 2 === 0;
                        const presentCount = Array.isArray(lesson.students)
                            ? lesson.students.filter((s) => s.status === "present").length
                            : 0;
                        const absentCount = Array.isArray(lesson.students)
                            ? lesson.students.filter((s) => s.status === "absent").length
                            : 0;

                        return (
                            <div className={`border-l-4 pl-4 rounded-lg shadow-sm p-4 text-sm hover:shadow-md transition bg-white
  ${lesson.class_type === "Group"
                                ? "border-indigo-300"
                                : lesson.class_type === "Private"
                                    ? "border-yellow-300"
                                    : "border-gray-200"
                            }
`}>
                                <div className="text-xs text-gray-400 mb-1 uppercase tracking-wide">
                                    {lesson.lesson_date?.toDate?.().toLocaleDateString("en-GB")}
                                </div>

                                <div className="flex justify-between items-center mb-1">
    <span className="font-semibold text-blue-900">
      {t(lesson.subject?.toLowerCase())} · {t(lesson.class_type || "individual")}
    </span>
                                    {/* Attendance badge */}
                                    {(() => {
                                        const total = presentCount + absentCount;
                                        const rate = total > 0 ? Math.round((presentCount / total) * 100) : 0;
                                        const badgeColor =
                                            rate >= 75 ? "bg-green-100 text-green-800"
                                                : rate >= 50 ? "bg-yellow-100 text-yellow-800"
                                                    : "bg-red-100 text-red-700";

                                        return (
                                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full
  ${rate >= 75
                                                ? "bg-green-100 text-green-800"
                                                : rate >= 50
                                                    ? "bg-yellow-100 text-yellow-800"
                                                    : "bg-red-100 text-red-700"
                                            }`}
                                            >
  {t("attendance")}: {rate}%
</span>

                                        );
                                    })()}
                                </div>

                                <p className="text-gray-600 leading-snug">
                                    {t("teacher")}: {teachersMap[lesson.teacher_id] || t("unknownTeacher")} <br/>
                                    {t("present")}: <span
                                    className="text-green-700 font-semibold">{presentCount}</span> ·{" "}
                                    {t("absent")}: <span className="text-red-600 font-semibold">{absentCount}</span>
                                </p>

                                <div className="flex gap-3 mt-3 text-sm">
                                    <Link to={`/lesson-log/${lesson.id}/details`}
                                          className="text-blue-600 underline hover:text-blue-800 transition">
                                        {t("showMore")}
                                    </Link>
                                    <Link to={`/lesson-log/${lesson.id}/edit`}
                                          className="text-yellow-500 hover:text-yellow-600 text-base">
                                        📝
                                    </Link>
                                </div>
                            </div>

                        );
                    })}
                </div>
            )}
        </div>
    );


    /* return (
         <div className="p-6 space-y-6">
             <h2 className="text-2xl font-bold text-blue-900 mb-4">{t("recentLessons")}</h2>

             <div className="flex flex-wrap items-center gap-4 mb-6 bg-white p-4 rounded-lg shadow-sm">
                 <Link
                     to="/lesson-log/add"
                     className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 font-semibold shadow-sm"
                 >
                     ➕ {t("add")}
                 </Link>

                 <input
                     type="text"
                     placeholder={t("search")}
                     value={searchTerm}
                     onChange={(e) => setSearchTerm(e.target.value)}
                     className="border p-2 rounded-lg text-sm w-40 shadow-sm"
                 />

                 <select
                     value={lessonsLimit}
                     onChange={(e) => setLessonsLimit(Number(e.target.value))}
                     className="border p-2 rounded-lg text-sm shadow-sm"
                 >
                     {[10, 20, 30, 50].map((n) => (
                         <option key={n} value={n}>
                             {t("show")} {n}
                         </option>
                     ))}
                 </select>

                 <select
                     value={sortAsc ? "asc" : "desc"}
                     onChange={(e) => setSortAsc(e.target.value === "asc")}
                     className="border p-2 rounded-lg text-sm shadow-sm"
                 >
                     <option value="desc">{t("newest")}</option>
                     <option value="asc">{t("oldest")}</option>
                 </select>

                 {isAdmin && (
                     <select
                         onChange={(e) => {
                             const selected = e.target.value;
                             if (selected && !selectedTeacherFilters.includes(selected)) {
                                 setSelectedTeacherFilters([...selectedTeacherFilters, selected]);
                             }
                         }}
                         className="border p-2 rounded-lg text-sm shadow-sm"
                     >
                         <option value="">{t("select")} {t("teacher")}</option>
                         {Object.entries(teachersMap).map(([id, name]) => (
                             <option key={id} value={id}>{name}</option>
                         ))}
                     </select>
                 )}

                 <select
                     onChange={(e) => {
                         const selected = e.target.value;
                         if (selected && !selectedSubjectFilters.includes(selected)) {
                             setSelectedSubjectFilters([...selectedSubjectFilters, selected]);
                         }
                     }}
                     className="border p-2 rounded-lg text-sm shadow-sm"
                 >
                     <option value="">{t("select")} {t("subject")}</option>
                     {SUBJECT_OPTIONS.map((subj) => (
                         <option key={subj} value={subj}>{t(subj.toLowerCase())}</option>
                     ))}
                 </select>
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
                             const presentCount = typeof lesson.present_count === "number"
                                 ? lesson.present_count
                                 : Array.isArray(lesson.students)
                                     ? lesson.students.filter((s) => s.status === "present").length
                                     : 0;

                             const absentCount = typeof lesson.absent_count === "number"
                                 ? lesson.absent_count
                                 : Array.isArray(lesson.students)
                                     ? lesson.students.filter((s) => s.status === "absent").length
                                     : 0;

                             return (
                                 <tr key={lesson.id} className="border-t">
                                     <td className="p-2">{lesson.lesson_date?.toDate?.().toLocaleDateString("en-GB")}</td>
                                     <td className="p-2">{t(lesson.subject?.toLowerCase())}</td>
                                     <td className="p-2">{t(lesson.class_type || "individual")}</td>
                                     <td className="p-2">{teachersMap[lesson.teacher_id] || t("unknownTeacher")}</td>
                                     <td className="p-2">
                                         <p className="text-green-700">{t("present")}: <strong>{presentCount}</strong>
                                         </p>
                                         <p className="text-red-600">{t("absent")}: <strong>{absentCount}</strong></p>
                                     </td>
                                     <td className="p-2 text-center space-x-2">
                                         <Link to={`/lesson-log/${lesson.id}/details`}
                                               className="text-blue-500 underline">
                                             {t("showMore")}
                                         </Link>
                                         <Link to={`/lesson-log/${lesson.id}/edit`} className="text-yellow-500">
                                             📝
                                         </Link>
                                     </td>
                                 </tr>
                             );
                         })}
                         </tbody>
                     </table>
                 )}
             </div>
         </div>
     );*/
};

export default LessonLog;
