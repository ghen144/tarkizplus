import React, {useState, useEffect, useRef, useLayoutEffect} from "react";
import {Link} from "react-router-dom";
import {db} from "@/firebase/firebase.jsx";
import {
    collection,
    getDocs,
    query,
    orderBy,
} from "firebase/firestore";
import {getAuth} from "firebase/auth";
import {useTranslation} from "react-i18next";
import {startOfMonth} from "date-fns";
import {AnimatePresence, motion} from "framer-motion";
import MonthTimeline from "@/components/common/MonthTimeline.jsx";
import ObjectDropDownMenu from "@/components/common/ObjectDropDownMenu.jsx";
import EditLessonOverlay from "@/pages/lessons/EditLessonOverlay.jsx";

const SUBJECT_OPTIONS = ["Math", "English", "Hebrew", "Arabic"];
const TYPE_OPTIONS = ["Group", "Private"];

const LessonLog = () => {
    const {t} = useTranslation();
    const auth = getAuth();
    const [lessons, setLessons] = useState([]);
    const [teachersMap, setTeachersMap] = useState({});
    const [studentsMap, setStudentsMap] = useState({});
    const [loading, setLoading] = useState(true);
    const [visibleMonth, setVisibleMonth] = useState(startOfMonth(new Date()));
    const [subjectFilter, setSubjectFilter] = useState("");
    const [typeFilter, setTypeFilter] = useState("");
    const today = new Date();
    const [expandedLessonIds, setExpandedLessonIds] = useState(new Set());
    const [selectedTeacher, setSelectedTeacher] = useState(null);
    const [selectedSubject, setSelectedSubject] = useState(null);
    const [editingLessonId, setEditingLessonId] = useState(null);


    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            if (!user) return;

            try {
                const userRole = localStorage.getItem("userRole");

                // 1. Load teachers map
                const teachersSnap = await getDocs(collection(db, "teachers"));
                const tMap = {};
                let currentTeacherId = null;
                teachersSnap.forEach((doc) => {
                    const data = doc.data();
                    tMap[doc.id] = data.name;
                    if (userRole !== "admin" && data.uid === user.uid) {
                        currentTeacherId = data.teacher_id;
                    }
                });
                setTeachersMap(tMap);

                // 2. Load students map
                const studentsSnap = await getDocs(collection(db, "students"));
                const sMap = {};
                studentsSnap.forEach((doc) => {
                    sMap[doc.id] = doc.data().name;
                });
                setStudentsMap(sMap);

                // 3. Load lessons
                const lessonsSnap = await getDocs(query(collection(db, "lessons"), orderBy("lesson_date", "asc")));
                const allLessons = lessonsSnap.docs.map((doc) => ({id: doc.id, ...doc.data()}));

                let filteredLessons = allLessons;
                if (userRole !== "admin" && currentTeacherId) {
                    filteredLessons = allLessons.filter(lesson => lesson.teacher_id === currentTeacherId);
                }

                setLessons(filteredLessons);
            } catch (err) {
                console.error("Error fetching data:", err);
            } finally {
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, []);


    const monthRange = () => {
        const months = [];
        if (lessons.length === 0) return months;
        const sortedLessons = [...lessons].sort((a, b) => a.lesson_date.toDate() - b.lesson_date.toDate());
        const start = startOfMonth(sortedLessons[0].lesson_date.toDate());
        const end = startOfMonth(today);
        let current = new Date(start);
        while (current <= end) {
            months.push(new Date(current));
            current.setMonth(current.getMonth() + 1);
        }
        return months;
    };

    const handleMonthClick = (date) => {
        setVisibleMonth(startOfMonth(date));
    };

// 1. First filter the visible lessons by month
    const visibleMonthLessons = lessons.filter((lesson) => {
        const date = lesson.lesson_date?.toDate?.();
        return (
            date &&
            date.getMonth() === visibleMonth.getMonth() &&
            date.getFullYear() === visibleMonth.getFullYear()
        );
    });

// 2. Derive teacher options based on filtered lessons
    const visibleTeacherOptions = Array.from(
        new Set(visibleMonthLessons.map((lesson) => lesson.teacher_id))
    ).map((id) => ({
        label: teachersMap[id] || id,
        value: id,
    }));

// 3. Derive subject options based on filtered lessons
    const visibleSubjectOptions = Array.from(
        new Set(visibleMonthLessons.map((lesson) => lesson.subject))
    ).map((subject) => ({
        label: subject,
        value: subject,
    }));

// 4. Function to check expanded state of a lesson
    const isExpanded = (id) => expandedLessonIds.has(id);

// 5. Function to toggle expanded state of a lesson
    const toggleCard = (id) => {
        setExpandedLessonIds((prev) => {
            const updated = new Set(prev);
            if (updated.has(id)) {
                updated.delete(id);
            } else {
                updated.add(id);
            }
            return updated;
        });
    };

// 6. Apply filters to grouped lessons
    const filteredGroupedLessons = visibleMonthLessons
        .filter((lesson) => {
            return (
                (!selectedTeacher || lesson.teacher_id === selectedTeacher.value) &&
                (!selectedSubject || lesson.subject === selectedSubject.value)
            );
        })
        .reduce((acc, lesson) => {
            const date = lesson.lesson_date.toDate();
            const monday = new Date(date);
            monday.setDate(date.getDate() - date.getDay() + 1);
            const label = `${monday.toLocaleDateString("en-GB", {
                month: "long",
                day: "numeric",
            })} – ${new Date(monday.getTime() + 6 * 86400000).getDate()}`;
            acc[label] = acc[label] || [];
            acc[label].push(lesson);
            return acc;
        }, {});

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6">
            {loading ? (
                <div className="text-center text-gray-500 py-10">Loading lessons...</div>
            ) : (
                <>
                    <h2 className="text-2xl font-semibold">{t("lesson_log")}</h2>


                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">

                        {/* Left: Month timeline */}
                        <div className="mt-2 md:mt-0">
                            <MonthTimeline
                                monthRange={monthRange}
                                visibleMonth={visibleMonth}
                                handleMonthClick={handleMonthClick}
                            />
                        </div>
                        {/* Right: Filters */}
                        <div className="flex flex-wrap items-center gap-4">
                            <ObjectDropDownMenu
                                label="Teacher"
                                options={visibleTeacherOptions}
                                selected={selectedTeacher || {}}
                                onSelect={setSelectedTeacher}
                                placeholder="Filter by teacher"
                                width="min-w-[12rem]"
                            />

                            <ObjectDropDownMenu
                                label="Subject"
                                options={visibleSubjectOptions}
                                selected={selectedSubject || {}}
                                onSelect={setSelectedSubject}
                                placeholder="Filter by subject"
                                width="min-w-[12rem]"
                            />

                            {(selectedTeacher || selectedSubject) && (
                                <button
                                    onClick={() => {
                                        setSelectedTeacher(null);
                                        setSelectedSubject(null);
                                    }}
                                    className="text-sm text-blue-600 hover:underline"
                                >
                                    Clear filters
                                </button>
                            )}
                            <div className="flex justify-end">
                                <Link
                                    to="/lesson-log/add"
                                    className="mb-4 inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
                                >
                                    + Add Lesson
                                </Link>
                            </div>
                        </div>


                    </div>

                    {Object.entries(filteredGroupedLessons).length === 0 && (
                        <div className="text-center text-gray-400 mt-8">
                            {t("noLessonsThisMonth") || "No lessons found for this month."}
                        </div>
                    )}

                {Object.entries(filteredGroupedLessons).map(([weekLabel, weekLessons]) => {
                    const attendanceRates = weekLessons.map((l) => {
                        const present = l.students?.filter((s) => s.status === t("present")).length || 0;
                        const absent = l.students?.filter((s) => s.status === t("absent")).length || 0;
                        const total = present + absent;
                        return total > 0 ? (present / total) * 100 : 100;
                    });
                    const avgAttendance =
                        attendanceRates.length > 0
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
                                const present = lesson.students?.filter((s) => s.status === "present") || [];
                                const absent = lesson.students?.filter((s) => s.status === "absent") || [];
                                const total = present.length + absent.length;
                                const rate = total > 0 ? Math.round((present.length / total) * 100) : 0;

                                const barColor =
                                    rate >= 75 ? "bg-green-500" : rate >= 50 ? "bg-yellow-500" : "bg-red-500";
                                const rateColor =
                                    rate >= 75
                                        ? "bg-green-100 text-green-800"
                                        : rate >= 50
                                            ? "bg-yellow-100 text-yellow-800"
                                            : "bg-red-100 text-red-700";

                                const isExpanded = expandedLessonIds.has(lesson.id);

                                return (
                                    <motion.div
                                        layout
                                        key={lesson.id}
                                        onClick={() => toggleCard(lesson.id)}
                                        transition={{duration: 0.6, ease: "easeInOut"}}
                                        className="cursor-pointer border border-gray-200 rounded-lg bg-white shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
                                    >
                                        {/* Header */}
                                        <div className="px-4 py-3 flex justify-between items-center">
                                            <div className="text-sm text-gray-700 font-medium">
                                                {lesson.lesson_date.toDate().toLocaleDateString("en-GB")} •{t(lesson.subject)}• {t(lesson.class_type)}

                                            </div>
                                            <div
                                                className={`text-xs px-2 py-0.5 rounded-full font-medium ${rateColor}`}>
                                                {rate}%
                                            </div>
                                        </div>

                                        <div
                                            className="px-4 text-xs text-gray-500 flex justify-between items-center">
                                            <span>{teachersMap[lesson.teacher_id] || t("unknownTeacher")}</span>
                                            <span>
                        {lesson.start_time && lesson.end_time
                            ? `${lesson.start_time} - ${lesson.end_time}`
                            : t("timeNotSet")}
                      </span>
                                        </div>

                                        <div className="px-4 pt-2 pb-3">
                                            <div className="w-full h-2 bg-gray-200 rounded">
                                                <div className={`h-full ${barColor}`}
                                                     style={{width: `${rate}%`}}></div>
                                            </div>
                                        </div>

                                        <AnimatePresence initial={false}>
                                            {isExpanded && (
                                                <motion.div
                                                    key="expanded"
                                                    initial={{opacity: 0, height: 0}}
                                                    animate={{opacity: 1, height: "auto"}}
                                                    exit={{opacity: 0, height: 0}}
                                                    transition={{duration: 0.4, ease: "easeInOut"}}
                                                    className="px-4 pb-4 text-sm text-gray-700 space-y-3"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    {(lesson.duration_minutes || lesson.start_time || lesson.end_time) && (
                                                        <p className="text-xs text-gray-600">
                                                            <strong>{t("duration")}:</strong>{" "}
                                                            {lesson.duration_minutes
                                                                ? `${lesson.duration_minutes} minutes`
                                                                : `${lesson.start_time || "?"} - ${lesson.end_time || "?"}`}
                                                        </p>
                                                    )}

                                                    {lesson.notes && (
                                                        <p className="text-xs text-gray-600">
                                                            <strong>Lesson Notes:</strong> {lesson.notes}
                                                        </p>
                                                    )}

                                                    {present.length > 0 && (
                                                        <div>
                                                            <p className="text-xs font-semibold text-green-700 mb-1">{t("present")}</p>
                                                            <div className="space-y-1">
                                                                {present.map((s) => (
                                                                    <div
                                                                        key={s.student_id}
                                                                        className="bg-green-50 px-2 py-1 rounded text-xs text-green-900"
                                                                    >
                                                                        <strong>{studentsMap[s.student_id] || s.student_id}</strong>
                                                                        {s.progress_evaluation && (
                                                                            <span
                                                                                className="ml-1">— {t("progress_evaluation")}: {s.progress_evaluation}</span>
                                                                        )}
                                                                        {s.student_notes && (
                                                                            <div
                                                                                className="ml-1">Notes: {s.student_notes}</div>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {absent.length > 0 && (
                                                        <div>
                                                            <p className="text-xs font-semibold text-red-700 mb-1">{t("absent")}</p>
                                                            <div className="space-y-1">
                                                                {absent.map((s) => (
                                                                    <div
                                                                        key={s.student_id}
                                                                        className="bg-red-50 px-2 py-1 rounded text-xs text-red-900"
                                                                    >
                                                                        <strong>{studentsMap[s.student_id] || s.student_id}</strong>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setEditingLessonId(lesson.id);
                                                        }}
                                                        className="text-xs text-blue-600 hover:underline"
                                                    >
                                                        {t("editLesson")}
                                                    </button>

                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </motion.div>

                                );
                            })}
                        </div>
                    );
                })}
                </>
            )}
            <AnimatePresence>
                {editingLessonId && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center"
                        onClick={() => setEditingLessonId(null)}
                    >
                        <div
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white max-h-[90vh] overflow-y-auto rounded-xl shadow-lg w-[95vw] max-w-2xl p-6"
                        >
                            <EditLessonOverlay lessonId={editingLessonId} onClose={() => setEditingLessonId(null)} />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>

    );

};

export default LessonLog;
