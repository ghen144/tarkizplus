// EditLesson.jsx
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
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { db } from "./firebase";

const EditLesson = () => {
    const { lessonId } = useParams(); // e.g. "abc123"
    const navigate = useNavigate();
    const auth = getAuth();

    const [lessonData, setLessonData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Fetch the lesson + check if the current user is allowed to edit
    useEffect(() => {
        const fetchLessonAndUserRole = async () => {
            try {
                const user = auth.currentUser;
                if (!user) {
                    navigate("/login");
                    return;
                }

                // Check if user is a teacher
                const teacherQuery = query(
                    collection(db, "teachers"),
                    where("email", "==", user.email)
                );
                const teacherSnap = await getDocs(teacherQuery);
                const isTeacher = !teacherSnap.empty;
                const teacherDocId = isTeacher ? teacherSnap.docs[0].id : null;

                // Check if user is an admin
                const adminQuery = query(
                    collection(db, "admin"),
                    where("email", "==", user.email)
                );
                const adminSnap = await getDocs(adminQuery);
                const isAdmin = !adminSnap.empty;

                if (!isTeacher && !isAdmin) {
                    setError("You are not authorized to edit this lesson.");
                    setLoading(false);
                    return;
                }

                // Fetch the lesson
                const lessonRef = doc(db, "lessons", lessonId);
                const lessonSnap = await getDoc(lessonRef);

                if (!lessonSnap.exists()) {
                    setError("Lesson not found.");
                    setLoading(false);
                    return;
                }

                const data = lessonSnap.data();

                // If the user is a teacher, make sure they own this lesson
                if (isTeacher && data.teacher_id !== teacherDocId) {
                    setError("You are not authorized to edit this lesson.");
                    setLoading(false);
                    return;
                }

                // Format lesson date for input
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
                setError("An error occurred while fetching the lesson.");
                setLoading(false);
            }
        };

        fetchLessonAndUserRole();
    }, [lessonId, auth, navigate]);


    // Update state as user edits the form
    const handleChange = (e) => {
        const { name, value } = e.target;
        setLessonData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!lessonData) return;

        try {
            const updatedFields = {
                subject: lessonData.subject,
                lesson_notes: lessonData.lesson_notes,
                progress_assessment: lessonData.progress_assessment,
                duration_minutes: parseInt(lessonData.duration_minutes, 10) || 0,
            };

            const lessonRef = doc(db, "lessons", lessonId);
            await updateDoc(lessonRef, updatedFields);
            console.log("Lesson updated successfully!");

            // Determine if user is admin
            const user = auth.currentUser;
            const adminQuery = query(collection(db, "admin"), where("email", "==", user.email));
            const adminSnap = await getDocs(adminQuery);

            if (!adminSnap.empty) {
                navigate("/admin/lessonlog"); // Go to admin log
            } else {
                navigate("/lesson-log"); // Go to teacher log
            }
        } catch (err) {
            console.error("Error updating lesson:", err);
            setError("Failed to update lesson.");
        }
    };

    if (loading) return <p>Loading...</p>;
    if (error) return <p className="text-red-600">{error}</p>;
    if (!lessonData) return null; // If for some reason the data is missing

    return (
        <div className="p-4 max-w-md mx-auto">
            <h1 className="text-xl font-semibold mb-4">Edit Lesson</h1>
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Subject */}
                <div>
                    <label className="block mb-1 font-medium">Subject</label>
                    <select
                        name="subject"
                        value={lessonData.subject}
                        onChange={handleChange}
                        className="border p-2 rounded w-full"
                    >
                        <option value="Math">Math</option>
                        <option value="English">English</option>
                        <option value="Hebrew">Hebrew</option>
                        <option value="Arabic">Arabic</option>
                    </select>
                </div>

                {/* Lesson Date */}
                <div>
                    <label className="block mb-1 font-medium">Date</label>
                    <input
                        type="date"
                        name="lesson_date"
                        value={lessonData.lesson_date || ""}
                        onChange={handleChange}
                        className="border p-2 rounded w-full"
                    />
                </div>

                {/* Duration */}
                <div>
                    <label className="block mb-1 font-medium">Duration (minutes)</label>
                    <input
                        type="number"
                        name="duration_minutes"
                        value={lessonData.duration_minutes || ""}
                        onChange={handleChange}
                        className="border p-2 rounded w-full"
                    />
                </div>

                {/* Lesson Notes */}
                <div>
                    <label className="block mb-1 font-medium">Lesson Notes</label>
                    <textarea
                        name="lesson_notes"
                        value={lessonData.lesson_notes || ""}
                        onChange={handleChange}
                        className="border p-2 rounded w-full"
                    />
                </div>

                {/* Progress Assessment */}
                <div>
                    <label className="block mb-1 font-medium">Progress Assessment</label>
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
                    Update Lesson
                </button>
            </form>
        </div>
    );
};

export default EditLesson;
