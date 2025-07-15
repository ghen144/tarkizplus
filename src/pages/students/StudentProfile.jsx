import {useState, useEffect} from "react";
import {useNavigate, useParams, useLocation} from "react-router-dom";
import {
    doc, getDoc, collection, getDocs, query, where, orderBy, addDoc,
} from "firebase/firestore";
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

import {db} from "@/firebase/firebase.jsx";
import {getAuth} from "firebase/auth";
import {
    ArrowLeft, BookOpen, AlertCircle, User, Smartphone, Calendar, ClipboardList, CheckCircle,
} from "lucide-react";
import {useTranslation} from "react-i18next";
import IconButton from "@/components/common/IconButton.jsx";
import {CircularProgressbarWithChildren, buildStyles} from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import ObjectDropDownMenu from "@/components/common/ObjectDropDownMenu.jsx";


const StudentProfile = () => {
    const {t} = useTranslation();
    const navigate = useNavigate();
    const {studentId} = useParams();
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
        subject: "", exam_date: "", material: "",
    });
    const [isAdmin, setIsAdmin] = useState(false);
    const currentStudentId = studentData?.student_id || "";

    // calculate student attendance
    const studentLessons = lessons.filter((lesson) => {
        if (Array.isArray(lesson.students)) {
            // درس جماعي: لازم يكون الطالب موجود وstatus = "present"
            return lesson.students.some((s) => s.student_id === currentStudentId && s.status === "present");
        }
    });

    const attendedCount = studentLessons.length;


    const missedCount = lessons.filter((lesson) => {
        if (Array.isArray(lesson.students)) {
            const studentEntry = lesson.students.find((s) => s.student_id === currentStudentId);
            return studentEntry && studentEntry.status === "absent";
        }
        return false;
    }).length;

    const totalAttendance = attendedCount;
    const weeklyAttendance = studentData?.attendance_count_weekly || 0;

    const teacherOptions = Object.entries(teachersMap).map(([id, name]) => ({
        label: name,
        value: name
    }));
    console.log("Options:", teacherOptions);


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
            setNewExam({subject: "", exam_date: "", material: ""});

            const updatedSnapshot = await getDocs(query(collection(db, "exams"), where("student_id", "==", studentId)));
            const updatedExams = updatedSnapshot.docs.map((doc) => ({id: doc.id, ...doc.data()}));
            setExams(updatedExams);
        } catch (err) {
            console.error("Error adding exam:", err);
            alert(t("alert_exam_failed"));
        }
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
                setStudentData({id: studentId, ...studentDocData});

                const lessonsQuery = query(collection(db, "lessons"), orderBy("lesson_date", "desc"));

                const lessonsSnapshot = await getDocs(lessonsQuery);
                const lessonsList = lessonsSnapshot.docs.map((doc) => ({id: doc.id, ...doc.data()}));
                setLessons(lessonsList);


                const teachersSnap = await getDocs(collection(db, "teachers"));
                const tMap = {};
                teachersSnap.forEach((tdoc) => {
                    const tData = tdoc.data();
                    tMap[tdoc.id] = tData.name || t("unnamed_teacher");
                });
                setTeachersMap(tMap);

                const examsQuery = query(collection(db, "exams"), where("student_id", "==", studentId));
                const examsSnapshot = await getDocs(examsQuery);
                const examsList = examsSnapshot.docs.map((doc) => ({id: doc.id, ...doc.data()}));
                setExams(examsList);
            } catch (err) {
                console.error("Error fetching student/lessons:", err);
                setError(t("error_loading_data", {message: err.message}));
            } finally {
                setLoading(false);
            }
        };

        fetchStudentDataAndLessons();
    }, [studentId]);
    const handleReturn = () => {
        const role = localStorage.getItem('userRole');      //  synchronous
        navigate(role === 'admin' ? '/admin/students' : '/students');
    };

    if (loading) {
        return (<div className="flex min-h-screen bg-gray-50">
            <main className="ml-64 flex-1 p-6 flex items-center justify-center">
                <p>{t("loading")}</p>
            </main>
        </div>);
    }

    if (error) {
        return (<div className="flex min-h-screen bg-gray-50">
            <main className="ml-64 flex-1 p-6">
                <div className="flex items-center justify-center h-full">
                    <p className="text-red-500">{error}</p>
                </div>
                <div className="mt-6">
                    <button
                        className="flex items-center bg-white p-3 rounded-lg shadow hover:bg-gray-100"
                        onClick={handleReturn}
                    >
                        <ArrowLeft className="h-5 w-5 text-gray-500 mr-2"/>
                        {t("return_button")}
                    </button>
                </div>
            </main>
        </div>);
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

    const subjectsText = Array.isArray(subjects) ? subjects.map((s) => t(s)).join(", ") : t("na");


    const formatDate = (ts) => ts ? ts.toDate().toLocaleDateString() : t("no_date");

    const filteredAndSortedLessons = [...studentLessons]
        .filter((lesson) => {
            const teacherName = teachersMap[lesson.teacher_id] || "";
            const matchesTeacher = selectedTeacherFilters.length === 0 || selectedTeacherFilters.includes(teacherName);

            const matchesSubject = selectedSubjectFilters.length === 0 || selectedSubjectFilters.includes(lesson.subject);

            const matchesDate = !selectedDate || (lesson.lesson_date && lesson.lesson_date.toDate().toLocaleDateString("en-CA") === selectedDate);


            return matchesTeacher && matchesSubject && matchesDate;
        })
        .sort((a, b) => {
            const dateA = a.lesson_date?.toDate();
            const dateB = b.lesson_date?.toDate();
            if (!dateA || !dateB) return 0;
            return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
        });
    console.log(" Active teacher filters:", selectedTeacherFilters);


    const progressData = filteredAndSortedLessons
        .map((lesson) => {
            const match = lesson.students.find(s => s.student_id === currentStudentId);
            const progress = match?.progress_evaluation;

            return {
                date: lesson.lesson_date?.toDate().toLocaleDateString("en-GB"), progress: Number(progress)
            };
        })
        .filter(item => !isNaN(item.progress));

    return (
        <div className="flex min-h-screen bg-gray-50">
            <main className="flex-1 p-6 space-y-10">

                {/* Sticky Header Row */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">{name}</h1>
                        <p className="text-sm text-gray-600">{grade} • {subjectsText}</p>
                    </div>
                    <IconButton label={t("return_button")} color="gray" onClick={handleReturn}/>
                </div>

                {/* Data Overview Grid */}
                <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
                    {/* Attendance Circle */}
                    <div className="bg-white p-6 rounded-xl shadow flex flex-col items-center">
                        <p className="text-sm font-medium text-gray-700 mb-2">{t("attendance_rate")}</p>
                        <div className="w-24 h-24">
                            <CircularProgressbarWithChildren
                                value={(attendedCount / (missedCount + attendedCount)) * 100}
                                styles={buildStyles({
                                    pathColor: attendedCount / (missedCount + attendedCount) > 0.75 ? "#16a34a" : "#dc2626",
                                    trailColor: "#f3f4f6",
                                    strokeLinecap: "butt"
                                })}
                                strokeWidth={10}
                            >
                                <div className="text-sm font-bold text-gray-800">
                                    {Math.round((attendedCount / (missedCount + attendedCount)) * 100)}%
                                </div>
                            </CircularProgressbarWithChildren>
                        </div>
                    </div>

                    {/* Performance & Engagement */}
                    <div className="bg-white p-6 rounded-xl shadow space-y-2">
                        <p className="text-sm text-gray-600 font-medium">{t("engagement_level")}</p>
                        <span
                            className="inline-block bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-semibold">
            {engagement_level || t("na")}
          </span>

                        <p className="text-sm text-gray-600 font-medium mt-4">{t("recent_performance")}</p>
                        <span
                            className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
            {recent_performance || t("na")}
          </span>
                    </div>

                    {/* Attendance Count */}
                    <div className="bg-white p-6 rounded-xl shadow flex flex-col gap-2 text-sm text-gray-700">
                        <p><strong>{t("weekly_attendance")}</strong>: {weeklyAttendance}</p>
                        <p><strong>{t("total_absences")}</strong>: {missedCount}</p>
                        <p><strong>{t("private_or_group")}</strong>: {t(private_or_group_lessons)}</p>
                        <p><strong>{t("parent_phone")}:</strong> {parent_phone_number}</p>
                    </div>
                </div>

                {/* Accommodations */}
                <div className="bg-white p-6 rounded-xl shadow space-y-4">
                    <h2 className="text-lg font-semibold text-blue-700">{t("learning_accommodations")}</h2>
                    <div className="flex flex-wrap gap-3 text-sm">
                        {PreferredLearningStyle && (
                            <span
                                className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full">{t("preferred_learning_style")}: {PreferredLearningStyle}</span>
                        )}
                        {learning_difficulties && (
                            <span
                                className="bg-red-100 text-red-800 px-3 py-1 rounded-full">{t("learning_difficulties")}</span>
                        )}
                        {reading_accommodation && (
                            <span className="pill">{t("reading_accommodation")}</span>
                        )}
                        {oral_response_allowed && (
                            <span className="pill">{t("oral_response")}</span>
                        )}
                        {extra_time && (
                            <span className="pill">{t("extra_time")}</span>
                        )}
                        {spelling_mistakes_ignored && (
                            <span className="pill">{t("spelling_ignored")}</span>
                        )}
                        {calculator_or_formula_sheet && (
                            <span className="pill">{t("calculator_or_sheet")}</span>
                        )}
                        {!reading_accommodation && !oral_response_allowed && !extra_time && !spelling_mistakes_ignored && !calculator_or_formula_sheet && (
                            <span className="text-sm text-gray-500">{t("no_accommodations")}</span>
                        )}
                    </div>
                </div>

                {/* Progress Line Chart */}
                <div className="bg-white p-6 rounded-xl shadow">
                    <h2 className="text-lg font-semibold text-blue-700 mb-3">{t("progress_over_time")}</h2>
                    {progressData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={progressData.reverse()}>
                                <CartesianGrid strokeDasharray="3 3"/>
                                <XAxis dataKey="date"/>
                                <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]}/>
                                <Tooltip/>
                                <Line
                                    type="monotone"
                                    dataKey="progress"
                                    stroke="#2563eb"
                                    strokeWidth={3}
                                    dot={{r: 4}}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <p className="text-sm text-gray-500">{t("no_progress_data")}</p>
                    )}
                </div>
                <div className="bg-white p-6 rounded-xl shadow space-y-4">
                    <div className="flex items-center gap-2 mb-1">
                        <Calendar className="h-5 w-5 text-blue-500"/>
                        <h2 className="text-lg font-semibold text-blue-700">{t("lesson_history")}</h2>
                    </div>
                    <p className="text-sm text-gray-500">{t("filter_info")}</p>

                    {/* Filters */}
                    <div className="flex flex-wrap items-center gap-4 mb-2">
                        <ObjectDropDownMenu
                            label={t("teacher")}
                            options={Object.entries(teachersMap).map(([id, name]) => ({
                                label: name,
                                value: name
                            }))}
                            selected={selectedTeacherFilters.map((name) => ({label: name, value: name}))}
                            onSelect={(newList) =>
                                setSelectedTeacherFilters(newList.map((opt) => opt.value))
                            }
                            placeholder={t("select")}
                            multiSelect={true}
                        />


                        <ObjectDropDownMenu
                            label={t("subject")}
                            options={[...new Set(lessons.map((l) => l.subject))].map((subject) => ({
                                label: t(subject),
                                value: subject
                            }))}
                            selected={selectedSubjectFilters.map((s) => ({
                                label: t(s),
                                value: s
                            }))}
                            onSelect={(newList) =>
                                setSelectedSubjectFilters(newList.map((opt) => opt.value))
                            }
                            placeholder={t("select")}
                            multiSelect={true}
                        />

                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="p-2 border rounded text-sm"
                        />
                        <button
                            onClick={() => setSortOrder(prev => (prev === "desc" ? "asc" : "desc"))}
                            className="px-3 py-2 text-sm border rounded bg-white text-gray-700 hover:bg-gray-100"
                        >
                            {sortOrder === "desc" ? t("sort_newest") : t("sort_oldest")}
                        </button>
                    </div>

                    {/* Filter Tags */}
                    <div className="flex flex-wrap gap-2">
                        {selectedTeacherFilters.map((name) => (
                            <span
                                key={name}
                                className="bg-blue-100 text-blue-800 rounded px-2 py-1 text-sm flex items-center"
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
                        {selectedSubjectFilters.map((subject) => (
                            <span
                                key={subject}
                                className="bg-green-100 text-green-800 rounded px-2 py-1 text-sm flex items-center"
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

                    {/* Table */}
                    {filteredAndSortedLessons.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
                                <tr>
                                    <th className="px-4 py-2">{t("date")}</th>
                                    <th className="px-4 py-2">{t("teacher")}</th>
                                    <th className="px-4 py-2">{t("subject")}</th>
                                    <th className="px-4 py-2">{t("notes")}</th>
                                    <th className="px-4 py-2">{t("progress")}</th>
                                </tr>
                                </thead>
                                <tbody>
                                {filteredAndSortedLessons.map((lesson) => {
                                    const teacherName = teachersMap[lesson.teacher_id] || t("no_teacher");
                                    const match = lesson.students?.find(s => s.student_id === currentStudentId) || {};
                                    const notes = match.student_notes || lesson.lesson_notes || t("no_notes");
                                    const progress = match.progress_evaluation || t("no_progress");

                                    return (
                                        <tr key={lesson.id} className="border-t hover:bg-gray-50">
                                            <td className="px-4 py-2">{formatDate(lesson.lesson_date)}</td>
                                            <td className="px-4 py-2">{teacherName}</td>
                                            <td className="px-4 py-2">{t(lesson.subject)}</td>
                                            <td className="px-4 py-2">{notes}</td>
                                            <td className="px-4 py-2">{progress}</td>
                                        </tr>
                                    );
                                })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500">{t("no_lessons")}</p>
                    )}
                </div>

                {/* Add Exams / View Exams */}
                <div className="bg-white p-6 rounded-xl shadow space-y-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-lg font-semibold text-blue-700">{t("exams")}</h2>
                        <button
                            onClick={() => setShowExamForm(prev => !prev)}
                            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                        >
                            {showExamForm ? t("cancel") : t("add_exam")}
                        </button>
                    </div>

                    {exams.length > 0 ? (
                        <ul className="space-y-3">
                            {exams.map((exam) => {
                                const date = exam.exam_date?.toDate?.().toLocaleDateString("en-GB") || t("no_date");
                                return (
                                    <li key={exam.id} className="bg-gray-50 p-4 rounded-lg border text-sm">
                                        <p className="font-semibold text-blue-800">{t(exam.subject)}</p>
                                        <p className="text-gray-500">{t("exam_date")}: {date}</p>
                                        <p className="text-gray-600">{t("material")}: {exam.material}</p>
                                    </li>
                                );
                            })}
                        </ul>
                    ) : (
                        <p className="text-gray-500">{t("no_exams")}</p>
                    )}

                    {showExamForm && (
                        <div className="bg-white border p-4 rounded shadow space-y-4">
                            <input
                                type="text"
                                value={newExam.subject}
                                onChange={(e) => setNewExam({...newExam, subject: e.target.value})}
                                className="w-full border px-3 py-2 rounded"
                                placeholder={t("placeholder_subject")}
                            />
                            <input
                                type="datetime-local"
                                value={newExam.exam_date}
                                onChange={(e) => setNewExam({...newExam, exam_date: e.target.value})}
                                className="w-full border px-3 py-2 rounded"
                            />
                            <input
                                type="text"
                                value={newExam.material}
                                onChange={(e) => setNewExam({...newExam, material: e.target.value})}
                                className="w-full border px-3 py-2 rounded"
                                placeholder={t("placeholder_material")}
                            />
                            <button
                                onClick={handleSaveExam}
                                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                            >
                                {t("save_exam")}
                            </button>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );

};

export default StudentProfile;