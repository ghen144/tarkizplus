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
        const fetchLessonAndTeacher = async () => {
            try {
                const user = auth.currentUser;
                if (!user) {
                    // If not logged in, redirect or show error
                    navigate("/login");
                    return;
                }

                // 1. Find the teacher's document (based on email or UID)
                const teacherQuery = query(
                    collection(db, "teachers"),
                    where("email", "==", user.email) // or where("uid", "==", user.uid)
                );
                const teacherSnap = await getDocs(teacherQuery);

                if (teacherSnap.empty) {
                    setError("No teacher profile found for this user.");
                    setLoading(false);
                    return;
                }

                const teacherDoc = teacherSnap.docs[0];
                const teacherDocId = teacherDoc.id; // e.g. "T001"

                // 2. Fetch the lesson document
                const lessonRef = doc(db, "lessons", lessonId);
                const lessonSnap = await getDoc(lessonRef);

                if (!lessonSnap.exists()) {
                    setError("Lesson not found.");
                    setLoading(false);
                    return;
                }

                const data = lessonSnap.data();

                // 3. Check if the lesson belongs to the logged-in teacher
                if (data.teacher_id !== teacherDocId) {
                    setError("You are not authorized to edit this lesson.");
                    setLoading(false);
                    return;
                }

                // 4. Convert lesson_date from Firestore Timestamp to a string (for <input type="date">)
                let formattedDate = "";
                if (data.lesson_date && data.lesson_date.toDate) {
                    formattedDate = data.lesson_date.toDate().toISOString().slice(0, 10);
                }

                // 5. Store the lesson data in state
                setLessonData({
                    ...data,
                    lesson_date: formattedDate, // If you want to show it in a date input
                });
                setLoading(false);
            } catch (err) {
                console.error("Error fetching lesson:", err);
                setError("An error occurred while fetching the lesson.");
                setLoading(false);
            }
        };

        fetchLessonAndTeacher();
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
            // Convert the lesson_date string back to a JS Date if your Firestore schema expects a Timestamp
            // const newDate = lessonData.lesson_date ? new Date(lessonData.lesson_date) : null;

            const updatedFields = {
                subject: lessonData.subject,
                lesson_notes: lessonData.lesson_notes,
                progress_assessment: lessonData.progress_assessment,
                duration_minutes: parseInt(lessonData.duration_minutes, 10) || 0,
                // lesson_date: newDate, // Uncomment if you want to store it back as a Timestamp
            };

            // Update Firestore
            const lessonRef = doc(db, "lessons", lessonId);
            await updateDoc(lessonRef, updatedFields);

            console.log("Lesson updated successfully!");
            navigate("/lesson-log"); // Go back to the lessons list
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
