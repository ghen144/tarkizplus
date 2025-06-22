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
import {startOfMonth, addMonths} from "date-fns";
import {useRef, useLayoutEffect} from "react";

const SUBJECT_OPTIONS = ["Math", "English", "Hebrew", "Arabic"];
const TYPE_OPTIONS = ["Group", "Private"];

const groupByWeek = (lessons) => {
    const weeks = {};
    lessons.forEach((lesson) => {
        const date = lesson.lesson_date?.toDate?.();
        const monday = new Date(date);
        monday.setDate(date.getDate() - date.getDay() + 1);
        const label = `${monday.toLocaleDateString("en-GB", {
            month: "long",
            day: "numeric",
        })} – ${new Date(monday.getTime() + 6 * 86400000).getDate()}`;
        if (!weeks[label]) weeks[label] = [];
        weeks[label].push(lesson);
    });
    return weeks;
};

const LessonLog = () => {
    const {t} = useTranslation();
    const auth = getAuth();
    const [lessons, setLessons] = useState([]);
    const [teachersMap, setTeachersMap] = useState({});
    const [studentsMap, setStudentsMap] = useState({});
    const [loading, setLoading] = useState(true);
    const [expandedLessonId, setExpandedLessonId] = useState(null);
    const [visibleMonth, setVisibleMonth] = useState(startOfMonth(new Date()));
    const [subjectFilter, setSubjectFilter] = useState("");
    const [typeFilter, setTypeFilter] = useState("");
    const today = new Date();
    const isFutureMonth = visibleMonth.getFullYear() > today.getFullYear() ||
        (visibleMonth.getFullYear() === today.getFullYear() && visibleMonth.getMonth() >= today.getMonth());

    const handlePrevMonth = () => setVisibleMonth(addMonths(visibleMonth, -1));
    const handleNextMonth = () => {
        const next = addMonths(visibleMonth, 1);
        if (
            next.getFullYear() < today.getFullYear() ||
            (next.getFullYear() === today.getFullYear() && next.getMonth() <= today.getMonth())
        ) {
            setVisibleMonth(next);
        }
    };


    useEffect(() => {
        const fetchData = async () => {
            const user = auth.currentUser;
            if (!user) return;

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

            const lessonsSnap = await getDocs(query(collection(db, "lessons"), orderBy("lesson_date", "asc")));
            const allLessons = lessonsSnap.docs.map((doc) => ({id: doc.id, ...doc.data()}));
            setLessons(allLessons);
            setLoading(false);
        };
        fetchData();
    }, [auth]);

    const getMonthLabel = (date) =>
        date.toLocaleDateString("en-GB", {month: "long", year: "numeric"});

    const filteredLessons = lessons.filter((lesson) => {
        const date = lesson.lesson_date?.toDate?.();
        return (
            date.getMonth() === visibleMonth.getMonth() &&
            date.getFullYear() === visibleMonth.getFullYear() &&
            (!subjectFilter || lesson.subject === subjectFilter) &&
            (!typeFilter || lesson.class_type === typeFilter)
        );
    });

    const grouped = groupByWeek(filteredLessons);
    const expandedRef = useRef(null);
    const [height, setHeight] = useState(0);
    useLayoutEffect(() => {
        if (expandedRef.current && expandedLessonId) {
            setHeight(expandedRef.current.scrollHeight);
        } else {
            setHeight(0);
        }
    }, [expandedLessonId]);
    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6">
            <div className="flex items-center gap-3">
                <button
                    onClick={handlePrevMonth}
                    className="text-sm text-gray-500 hover:text-blue-600 transition"
                >
                    ←
                </button>
                <h2 className="text-xl font-semibold text-gray-800">
                    {getMonthLabel(visibleMonth)}
                </h2>
                <button
                    onClick={handleNextMonth}
                    disabled={isFutureMonth}
                    className={`text-sm transition ${isFutureMonth ? "text-gray-300 cursor-not-allowed" : "text-gray-500 hover:text-blue-600"}`}
                >
                    →
                </button>
            </div>

            {Object.entries(grouped).map(([weekLabel, weekLessons]) => {
                const attendanceRates = weekLessons.map(l => {
                    const present = l.students?.filter(s => s.status === "present").length || 0;
                    const absent = l.students?.filter(s => s.status === "absent").length || 0;
                    const total = present + absent;
                    return total > 0 ? (present / total) * 100 : 100;
                });
                const avgAttendance = attendanceRates.length > 0
                    ? Math.round(attendanceRates.reduce((a, b) => a + b, 0) / attendanceRates.length)
                    : 0;

                return (
                    <div key={weekLabel} className="space-y-2">
                        <div className="flex justify-between items-center bg-gray-100 px-4 py-2 rounded-md">
                            <h3 className="text-sm font-semibold text-gray-700">
                                {weekLabel} — Avg Attendance: {avgAttendance}%
                            </h3>
                        </div>

                        {weekLessons.map((lesson) => {
                            const present = lesson.students?.filter(s => s.status === "present") || [];
                            const absent = lesson.students?.filter(s => s.status === "absent") || [];
                            const total = present.length + absent.length;
                            const rate = total > 0 ? Math.round((present.length / total) * 100) : 0;

                            const barColor = rate >= 75 ? "bg-green-500" : rate >= 50 ? "bg-yellow-500" : "bg-red-500";
                            const rateColor = rate >= 75 ? "bg-green-100 text-green-800" : rate >= 50 ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-700";

                            return (
                                <div
                                    key={lesson.id}
                                    onClick={() => setExpandedLessonId(expandedLessonId === lesson.id ? null : lesson.id)}
                                    className="cursor-pointer border border-gray-200 rounded-lg bg-white shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
                                >
                                    <div className="px-4 py-3 flex justify-between items-center">
                                        <div className="text-sm text-gray-700 font-medium">
                                            {lesson.lesson_date.toDate().toLocaleDateString("en-GB")} • {lesson.subject} • {lesson.class_type}
                                        </div>
                                        <div
                                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${rateColor}`}>{rate}%
                                        </div>
                                    </div>

                                    <div className="px-4 text-xs text-gray-500 flex justify-between items-center">
                                        <span>{teachersMap[lesson.teacher_id] || t("unknownTeacher")}</span>
                                        <span>{lesson.start_time && lesson.end_time ? `${lesson.start_time} - ${lesson.end_time}` : "Time not set"}</span>
                                    </div>

                                    <div className="px-4 pt-2 pb-3">
                                        <div className="w-full h-2 bg-gray-200 rounded">
                                            <div className={`h-full ${barColor}`} style={{width: `${rate}%`}}></div>
                                        </div>
                                    </div>

                                    {(
                                        <div
                                            className="transition-all duration-500 ease-in-out overflow-hidden"
                                            style={{ maxHeight: expandedLessonId === lesson.id ? `${height}px` : "0px" }}
                                        >
                                            <div ref={expandedRef} className="px-4 pb-4 text-sm text-gray-700 space-y-3">
                                                {present.length > 0 && (
                                                    <div>
                                                        <p className="text-xs font-semibold text-green-700 mb-1">Present</p>
                                                        <div className="flex flex-wrap gap-1">
                                                            {present.map((s) => (
                                                                <span
                                                                    key={s.student_id}
                                                                    className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800"
                                                                >
                {studentsMap[s.student_id] || s.student_id}
              </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {absent.length > 0 && (
                                                    <div>
                                                        <p className="text-xs font-semibold text-red-700 mb-1">Absent</p>
                                                        <div className="flex flex-wrap gap-1">
                                                            {absent.map((s) => (
                                                                <span
                                                                    key={s.student_id}
                                                                    className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-800"
                                                                >
                {studentsMap[s.student_id] || s.student_id}
              </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {lesson.notes && (
                                                    <p className="text-xs text-gray-600">Notes: {lesson.notes}</p>
                                                )}
                                            </div>
                                        </div>
                                    )}


                                </div>
                            );
                        })}
                    </div>
                );
            })}
        </div>
    );
};

export default LessonLog;
