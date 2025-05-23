import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    doc,
    getDoc,
    updateDoc,
    collection,
    getDocs,
    query,
    where,
    Timestamp
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { db } from "@/firebase/firebase.jsx";
import { useTranslation } from "react-i18next";

const EditLesson = () => {
    const { t } = useTranslation();
    const { lessonId } = useParams();
    const navigate = useNavigate();
    const auth = getAuth();

    const [lessonData, setLessonData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchLessonAndUserRole = async () => {
            try {
                const user = auth.currentUser;
                if (!user) {
                    navigate("/login");
                    return;
                }

                const teacherQuery = query(
                    collection(db, "teachers"),
                    where("email", "==", user.email)
                );
                const teacherSnap = await getDocs(teacherQuery);
                const isTeacher = !teacherSnap.empty;
                const teacherDocId = isTeacher ? teacherSnap.docs[0].id : null;

                const adminQuery = query(
                    collection(db, "admin"),
                    where("email", "==", user.email)
                );
                const adminSnap = await getDocs(adminQuery);
                const isAdmin = !adminSnap.empty;

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

                let formattedDate = "";
                if (data.lesson_date?.toDate) {
                    formattedDate = data.lesson_date.toDate().toISOString().slice(0, 10);
                }

                setLessonData({
                    ...data,
                    lesson_date: formattedDate,
                });

                setLoading(false);
            } catch (err) {
                console.error("Error fetching lesson:", err);
                setError(t("errorFetchingLesson"));
                setLoading(false);
            }
        };

        fetchLessonAndUserRole();
    }, [lessonId, auth, navigate, t]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setLessonData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!lessonData) return;

        try {
            const updatedFields = {
                subject: lessonData.subject,
                lesson_notes: lessonData.lesson_notes,
                progress_assessment: lessonData.progress_assessment,
                duration_minutes: parseInt(lessonData.duration_minutes, 10) || 0,
                lesson_date: Timestamp.fromDate(new Date(lessonData.lesson_date)),
            };

            const lessonRef = doc(db, "lessons", lessonId);
            await updateDoc(lessonRef, updatedFields);

            const user = auth.currentUser;
            const adminQuery = query(collection(db, "admin"), where("email", "==", user.email));
            const adminSnap = await getDocs(adminQuery);

            if (!adminSnap.empty) {
                navigate("/admin/lessonlog");
            } else {
                navigate("/lesson-log");
            }
        } catch (err) {
            console.error("Error updating lesson:", err);
            setError(t("updateError"));
        }
    };

    if (loading) return <p>{t("loading")}...</p>;
    if (error) return <p className="text-red-600">{error}</p>;
    if (!lessonData) return null;

    return (
        <div className="p-4 max-w-md mx-auto">
            <h1 className="text-xl font-semibold mb-4">{t("editLesson")}</h1>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block mb-1 font-medium">{t("subject")}</label>
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
                    <label className="block mb-1 font-medium">{t("date")}</label>
                    <input
                        type="date"
                        name="lesson_date"
                        value={lessonData.lesson_date || ""}
                        onChange={handleChange}
                        className="border p-2 rounded w-full"
                    />
                </div>

                <div>
                    <label className="block mb-1 font-medium">{t("duration")}</label>
                    <input
                        type="number"
                        name="duration_minutes"
                        value={lessonData.duration_minutes || ""}
                        onChange={handleChange}
                        className="border p-2 rounded w-full"
                    />
                </div>

                <div>
                    <label className="block mb-1 font-medium">{t("lessonNotes")}</label>
                    <textarea
                        name="lesson_notes"
                        value={lessonData.lesson_notes || ""}
                        onChange={handleChange}
                        className="border p-2 rounded w-full"
                    />
                </div>

                <div>
                    <label className="block mb-1 font-medium">{t("progressAssessment")}</label>
                    <input
                        type="text"
                        name="progress_assessment"
                        value={lessonData.progress_assessment || ""}
                        onChange={handleChange}
                        className="border p-2 rounded w-full"
                    />
                </div>

                {error && <p className="text-red-600">{error}</p>}

                <button
                    type="submit"
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                    {t("updateLesson")}
                </button>
            </form>
        </div>
    );
};

export default EditLesson;
