import React, {useState, useEffect} from "react";
import {useNavigate} from "react-router-dom";
import {db} from "@/firebase/firebase.jsx";
import {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    serverTimestamp,
    query,
    where,
} from "firebase/firestore";
import {getAuth} from "firebase/auth";
import {useTranslation} from "react-i18next";
import IconButton from "@/components/common/IconButton.jsx";
import {PlusCircle, Trash2, Save, ArrowLeft} from "lucide-react";

function AddLesson() {
    const {t} = useTranslation();
    const navigate = useNavigate();
    const auth = getAuth();
    const user = auth.currentUser;

    const [userRole, setUserRole] = useState("");
    const [teacherId, setTeacherId] = useState(null);
    const [teachers, setTeachers] = useState([]);
    const [assignedStudents, setAssignedStudents] = useState([]);
    const [loading, setLoading] = useState(true);

    const [subject, setSubject] = useState("");
    const [lessonDate, setLessonDate] = useState("");
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");
    const [lessonNotes, setLessonNotes] = useState("");

    const [lessonRows, setLessonRows] = useState([
        {
            student_id: "",
            status: "present",
            student_notes: "",
            progress: "3",
        },
    ]);

    useEffect(() => {
        const init = async () => {
            if (!user) return setLoading(false);

            const role = localStorage.getItem("userRole");
            setUserRole(role);

            try {
                if (role === "admin") {
                    const teachersSnap = await getDocs(collection(db, "teachers"));
                    const list = teachersSnap.docs.map((doc) => ({
                        id: doc.id,
                        name: doc.data().name || doc.data().email,
                    }));
                    setTeachers(list);
                } else {
                    const q = query(
                        collection(db, "teachers"),
                        where("email", "==", user.email)
                    );
                    const teacherSnap = await getDocs(q);
                    if (teacherSnap.empty) return setLoading(false);

                    const teacherDoc = teacherSnap.docs[0];
                    setTeacherId(teacherDoc.id);
                    await fetchStudentsForTeacher(teacherDoc.id);
                }
            } catch (err) {
                console.error("Error initializing lesson form:", err);
            } finally {
                setLoading(false);
            }
        };

        init();
    }, [user]);

    const fetchStudentsForTeacher = async (tid) => {
        try {
            const teacherRef = doc(db, "teachers", tid);
            const teacherSnap = await getDoc(teacherRef);
            if (!teacherSnap.exists()) {
                setAssignedStudents([]);
                return;
            }
            const assignedIds = teacherSnap.data().assigned_students || [];
            if (assignedIds.length === 0) {
                setAssignedStudents([]);
                return;
            }
            const studentsSnap = await getDocs(collection(db, "students"));
            const list = studentsSnap.docs
                .filter((doc) => assignedIds.includes(doc.id))
                .map((doc) => ({
                    id: doc.id,
                    name: doc.data().name || t("unnamed_student"),
                }));
            setAssignedStudents(list);
        } catch (err) {
            console.error("Error fetching students:", err);
        }
    };

    const handleTeacherChange = async (tid) => {
        setTeacherId(tid);
        if (tid) {
            setLoading(true);
            await fetchStudentsForTeacher(tid);
            setLoading(false);
        } else {
            setAssignedStudents([]);
        }
    };

    const handleAddRow = () => {
        setLessonRows((prev) => [
            ...prev,
            {student_id: "", status: "present", student_notes: "", progress: "3"},
        ]);
    };

    const handleRemoveRow = (index) => {
        setLessonRows((prev) => prev.filter((_, i) => i !== index));
    };

    const handleRowChange = (index, field, value) => {
        setLessonRows((prev) =>
            prev.map((row, i) => {
                if (i !== index) return row;
                if (field === "status") {
                    return {
                        ...row,
                        status: value,
                        progress:
                            value === "absent" ? "0" : row.progress === "0" ? "3" : row.progress,
                    };
                }
                return {...row, [field]: value};
            })
        );
    };

    const isFormValid = () => {
        if (!teacherId || !subject || !lessonDate || !startTime || !endTime) {
            return false;
        }
        for (const row of lessonRows) {
            if (!row.student_id || !row.status || !row.progress) return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isFormValid()) return;

        try {
            let finalDate = null;
            if (lessonDate) {
                finalDate = startTime
                    ? new Date(`${lessonDate}T${startTime}`)
                    : new Date(lessonDate);
            }

            let durationMinutes = 0;
            if (startTime && endTime) {
                const [sh, sm] = startTime.split(":").map(Number);
                const [eh, em] = endTime.split(":").map(Number);
                durationMinutes = eh * 60 + em - (sh * 60 + sm);
                if (durationMinutes < 0) durationMinutes = 0;
            }

            const filledRows = lessonRows.filter((row) => row.student_id);
            let presentCount = 0;
            let absentCount = 0;
            const students = filledRows.map((row) => {
                const status = row.status || "present";
                if (status === "present") presentCount++;
                else absentCount++;
                return {
                    student_id: row.student_id,
                    subject: subject || "",
                    status,
                    student_notes: row.student_notes || "",
                    progress_evaluation: Number(row.progress) || 0,
                };
            });

            const classType = filledRows.length > 1 ? "Group" : "Individual";

            const newDocRef = doc(collection(db, "lessons"));
            await setDoc(newDocRef, {
                lesson_id: newDocRef.id,
                teacher_id: teacherId,
                class_type: classType,
                subject: subject || "",
                lesson_date: finalDate || serverTimestamp(),
                start_time: startTime || "",
                end_time: endTime || "",
                duration_minutes: durationMinutes,
                lesson_notes: lessonNotes || "",
                present_count: presentCount,
                absent_count: absentCount,
                students,
                created_at: serverTimestamp(),
            });

            navigate("/lesson-log");
        } catch (error) {
            console.error("Error adding lesson:", error);
        }
    };

    if (loading) {
        return <p className="p-6">{t("loading_students")}</p>;
    }

    const canSave = isFormValid();
    const classTypeDisplay =
        lessonRows.filter((row) => row.student_id).length > 1
            ? t("group")
            : t("individual");

    return (
        <div className="min-h-screen bg-gray-100 py-8 px-4">
            <div className="max-w-5xl mx-auto space-y-6">
                <IconButton color="gray" onClick={() => navigate("/lesson-log")}>
                    <ArrowLeft className="w-4 h-4"/>
                    {t("back")}
                </IconButton>

                <h1 className="text-3xl font-bold">{t("add_lesson")}</h1>

                <form
                    onSubmit={handleSubmit}
                    className="bg-white p-6 rounded-xl shadow space-y-8"
                >
                    {userRole === "admin" && (
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                {t("teacher")}
                            </label>
                            <select
                                className="w-full border rounded-lg p-2"
                                value={teacherId || ""}
                                onChange={(e) => handleTeacherChange(e.target.value)}
                                required
                            >
                                <option value="">{t("select_teacher")}</option>
                                {teachers.map((tea) => (
                                    <option key={tea.id} value={tea.id}>
                                        {tea.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    <section className="grid md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                {t("subject")}
                            </label>
                            <select
                                className="w-full border rounded-lg p-2"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                required
                            >
                                <option value="">{t("select_subject")}</option>
                                <option value="Math">{t("math")}</option>
                                <option value="Hebrew">{t("hebrew")}</option>
                                <option value="Arabic">{t("arabic")}</option>
                                <option value="English">{t("english")}</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">
                                {t("lesson_date")}
                            </label>
                            <input
                                type="date"
                                className="w-full border rounded-lg p-2"
                                value={lessonDate}
                                onChange={(e) => setLessonDate(e.target.value)}
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">
                                {t("start_time")}
                            </label>
                            <input
                                type="time"
                                className="w-full border rounded-lg p-2"
                                value={startTime}
                                onChange={(e) => setStartTime(e.target.value)}
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">
                                {t("end_time")}
                            </label>
                            <input
                                type="time"
                                className="w-full border rounded-lg p-2"
                                value={endTime}
                                onChange={(e) => setEndTime(e.target.value)}
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">
                                {t("class_type")}
                            </label>
                            <input
                                type="text"
                                readOnly
                                className="w-full border rounded-lg p-2 bg-gray-100"
                                value={classTypeDisplay}
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium mb-1">
                                {t("lesson_notes")}
                            </label>
                            <textarea
                                className="w-full border rounded-lg p-2"
                                value={lessonNotes}
                                onChange={(e) => setLessonNotes(e.target.value)}
                                placeholder={t("notes_placeholder")}
                            />
                        </div>
                    </section>

                    <section className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold">{t("students")}</h2>
                            <IconButton color="green" onClick={handleAddRow}>
                                <PlusCircle className="w-4 h-4"/> {t("add_student")}
                            </IconButton>
                        </div>

                        {lessonRows.map((row, index) => (
                            <div
                                key={index}
                                className="relative space-y-4 bg-gray-50 p-4 rounded-lg shadow-sm"
                            >
                                {lessonRows.length > 1 && (
                                    <IconButton
                                        color="red"
                                        onClick={() => handleRemoveRow(index)}
                                        className="absolute top-2 right-2"
                                    >
                                        <Trash2 className="w-4 h-4"/>
                                    </IconButton>
                                )}

                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">
                                            {t("student")}
                                        </label>
                                        <select
                                            className="w-full border rounded-lg p-2"
                                            value={row.student_id}
                                            onChange={(e) =>
                                                handleRowChange(index, "student_id", e.target.value)
                                            }
                                            required
                                        >
                                            <option value="">{t("select_student")}</option>
                                            {assignedStudents.map((stu) => (
                                                <option key={stu.id} value={stu.id}>
                                                    {stu.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-1">
                                            {t("status")}
                                        </label>
                                        <select
                                            className="w-full border rounded-lg p-2"
                                            value={row.status}
                                            onChange={(e) =>
                                                handleRowChange(index, "status", e.target.value)
                                            }
                                            required
                                        >
                                            <option value="present">{t("present")}</option>
                                            <option value="absent">{t("absent")}</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">
                                            {t("progress_evaluation")}
                                        </label>
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="range"
                                                min="1"
                                                max="5"
                                                step="1"
                                                className="flex-1 accent-blue-600"
                                                value={row.progress}
                                                onChange={(e) =>
                                                    handleRowChange(index, "progress", e.target.value)
                                                }
                                                disabled={row.status === "absent"}
                                            />
                                            <span className="w-6 text-center text-sm font-semibold">
                        {row.progress}
                      </span>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-1">
                                            {t("student_notes")}
                                        </label>
                                        <textarea
                                            className="w-full border rounded-lg p-2"
                                            value={row.student_notes}
                                            onChange={(e) =>
                                                handleRowChange(index, "student_notes", e.target.value)
                                            }
                                            placeholder={t("student_notes_placeholder")}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </section>

                    <div className="flex justify-end">
                        <IconButton
                            type="submit"
                            color="blue"
                            disabled={!canSave}
                            className={!canSave ? "opacity-50 cursor-not-allowed" : ""}
                        >
                            <Save className="w-4 h-4"/> {t("save_lesson")}
                        </IconButton>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default AddLesson;
