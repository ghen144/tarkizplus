import React, {useState, useEffect} from "react";
import {
    doc,
    getDoc,
    updateDoc,
    collection,
    getDocs,
    query,
    where,
    Timestamp,
} from "firebase/firestore";
import {getAuth} from "firebase/auth";
import {db} from "@/firebase/firebase.jsx";
import {useTranslation} from "react-i18next";

const EditLessonOverlay = ({lessonId, onClose}) => {
    const {t} = useTranslation();
    const auth = getAuth();

    const [lessonData, setLessonData] = useState(null);
    const [studentsInfo, setStudentsInfo] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchLessonData = async () => {
            try {
                const user = auth.currentUser;
                if (!user) return;

                const email = user.email;

                const [teacherSnap, adminSnap] = await Promise.all([
                    getDocs(query(collection(db, "teachers"), where("email", "==", email))),
                    getDocs(query(collection(db, "admin"), where("email", "==", email)))
                ]);

                const isTeacher = !teacherSnap.empty;
                const isAdmin = !adminSnap.empty;
                const teacherDocId = isTeacher ? teacherSnap.docs[0].id : null;

                if (!isTeacher && !isAdmin) {
                    setError(t("notAuthorized"));
                    setLoading(false);
                    return;
                }

                const lessonRef = doc(db, "lessons", lessonId);
                const lessonSnap = await getDoc(lessonRef);
                if (!lessonSnap.exists()) {
                    setError(t("lessonNotFound"));
                    setLoading(false);
                    return;
                }

                const data = lessonSnap.data();
                if (isTeacher && data.teacher_id !== teacherDocId) {
                    setError(t("notAuthorized"));
                    setLoading(false);
                    return;
                }

                const formattedDate = data.lesson_date?.toDate()?.toISOString().slice(0, 10) || "";

                const studentsWithInfo = await Promise.all(
                    data.students.map(async (stu) => {
                        const ref = doc(db, "students", stu.student_id);
                        const snap = await getDoc(ref);
                        return {
                            ...stu,
                            name: snap.exists() ? snap.data().name : "",
                        };
                    })
                );

                setLessonData({
                    ...data,
                    lesson_date: formattedDate,
                    start_time: data.start_time || "",
                    end_time: data.end_time || "",
                    lesson_notes: data.lesson_notes || "",
                    subject: data.subject || "",
                });

                setStudentsInfo(studentsWithInfo);
                setLoading(false);
            } catch (err) {
                console.error("Error fetching lesson:", err);
                setError(t("errorFetchingLesson"));
                setLoading(false);
            }
        };

        fetchLessonData();
    }, [lessonId, auth, t]);

    const handleChange = (e) => {
        const {name, value} = e.target;
        setLessonData((prev) => ({...prev, [name]: value}));
    };

    const handleStudentChange = (index, field, value) => {
        const updated = [...studentsInfo];
        updated[index][field] = value;
        setStudentsInfo(updated);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const ref = doc(db, "lessons", lessonId);
            const payload = {
                subject: lessonData.subject,
                lesson_date: Timestamp.fromDate(new Date(lessonData.lesson_date)),
                lesson_notes: lessonData.lesson_notes,
                start_time: lessonData.start_time,
                end_time: lessonData.end_time,
                students: studentsInfo.map((s) => ({
                    student_id: s.student_id,
                    status: s.status,
                    progress_evaluation: s.progress_evaluation,
                    student_notes: s.student_notes,
                })),
            };

            await updateDoc(ref, payload);
            onClose();
        } catch (err) {
            console.error("Error updating:", err);
            setError(t("updateError"));
        }
    };

    if (loading) return <p className="text-center">{t("loading")}...</p>;
    if (error) return <p className="text-center text-red-600">{error}</p>;
    if (!lessonData) return null;

    return (
        <div className="space-y-4 max-w-xl mx-auto">
            <h1 className="text-xl font-bold text-center">{t("editLesson")}</h1>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label>{t("subject")}</label>
                    <select
                        name="subject"
                        value={lessonData.subject}
                        onChange={handleChange}
                        className="border p-2 rounded w-full"
                    >
                        <option value="Math">{t("math")}</option>
                        <option value="English">{t("english")}</option>
                        <option value="Hebrew">{t("hebrew")}</option>
                        <option value="Arabic">{t("arabic")}</option>
                    </select>
                </div>

                <div>
                    <label>{t("date")}</label>
                    <input
                        type="date"
                        name="lesson_date"
                        value={lessonData.lesson_date}
                        onChange={handleChange}
                        className="border p-2 rounded w-full"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label>{t("startTime")}</label>
                        <input
                            type="time"
                            name="start_time"
                            value={lessonData.start_time}
                            onChange={handleChange}
                            className="border p-2 rounded w-full"
                        />
                    </div>
                    <div>
                        <label>{t("endTime")}</label>
                        <input
                            type="time"
                            name="end_time"
                            value={lessonData.end_time}
                            onChange={handleChange}
                            className="border p-2 rounded w-full"
                        />
                    </div>
                </div>

                <div>
                    <label>{t("lessonNotes")}</label>
                    <textarea
                        name="lesson_notes"
                        value={lessonData.lesson_notes}
                        onChange={handleChange}
                        className="border p-2 rounded w-full"
                    />
                </div>

                <h2 className="text-lg font-semibold text-purple-600 mt-4">{t("students")}</h2>
                {studentsInfo.map((student, index) => (
                    <div key={index} className="bg-gray-50 p-4 rounded shadow mt-2">
                        <p className="font-medium mb-2">{student.name}</p>

                        <div>
                            <label>{t("status")}</label>
                            <select
                                value={student.status}
                                onChange={(e) => handleStudentChange(index, "status", e.target.value)}
                                className="border p-2 rounded w-full"
                            >
                                <option value="present">{t("present")}</option>
                                <option value="absent">{t("absent")}</option>
                            </select>
                        </div>

                        <div>
                            <label>{t("progressEvaluation")}</label>
                            <input
                                type="number"
                                min="1"
                                max="10"
                                step="1"
                                value={student.progress_evaluation || ""}
                                onChange={(e) => handleStudentChange(index, "progress_evaluation", e.target.value)}
                                className="border p-2 rounded w-full"
                            />
                        </div>

                        <div>
                            <label>{t("studentNotes")}</label>
                            <textarea
                                value={student.student_notes || ""}
                                onChange={(e) => handleStudentChange(index, "student_notes", e.target.value)}
                                className="border p-2 rounded w-full"
                            />
                        </div>
                    </div>
                ))}

                <div className="flex justify-between items-center pt-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-gray-600 hover:underline"
                    >
                        {t("cancel")}
                    </button>
                    <button
                        type="submit"
                        className="bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600"
                    >
                        {t("updateLesson")}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default EditLessonOverlay;
