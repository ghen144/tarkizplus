import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "./firebase"; // Adjust your Firebase config path
import {
    collection,
    doc,
    getDocs,
    setDoc,
    serverTimestamp,
    query,
    where,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";

function AddMultipleLessons() {
    const navigate = useNavigate();
    const auth = getAuth();
    const user = auth.currentUser;

    const [teacherId, setTeacherId] = useState(null);
    const [assignedStudents, setAssignedStudents] = useState([]);
    const [loading, setLoading] = useState(true);

    // Single date/time for ALL rows
    const [lessonDate, setLessonDate] = useState("");
    const [lessonTime, setLessonTime] = useState("");

    // Each row: { student_id, subject, duration, notes, progress }
    // We share date/time at the top, so each row only has fields unique to that row.
    const [lessonRows, setLessonRows] = useState([
        {
            student_id: "",
            subject: "",
            duration: "",
            notes: "",
            progress: ""
        }
    ]);

    // 1. Fetch teacher doc & assigned students
    useEffect(() => {
        const fetchAssignedStudents = async () => {
            if (!user) {
                console.error("❌ No user is logged in.");
                setLoading(false);
                return;
            }
            setLoading(true);

            try {
                console.log("🔹 Attempting to fetch teacher doc for:", user.email);
                const qTeachers = query(
                    collection(db, "teachers"),
                    where("email", "==", user.email)
                );
                const teacherSnap = await getDocs(qTeachers);
                if (teacherSnap.empty) {
                    console.error("❌ No teacher found for this email.");
                    setLoading(false);
                    return;
                }

                const teacherDoc = teacherSnap.docs[0];
                setTeacherId(teacherDoc.id);
                console.log("✅ Found teacher with ID:", teacherDoc.id);

                const teacherData = teacherDoc.data();
                const assignedStudentIds = teacherData.assigned_students || [];
                console.log("🔹 assigned_student_ids:", assignedStudentIds);

                // Fetch the assigned students
                const allStudentsSnap = await getDocs(collection(db, "students"));
                const studentList = allStudentsSnap.docs
                    .filter((doc) => assignedStudentIds.includes(doc.id))
                    .map((doc) => ({
                        id: doc.id,
                        name: doc.data().name || "Unnamed Student"
                    }));

                setAssignedStudents(studentList);
                console.log("✅ assignedStudents:", studentList);
            } catch (error) {
                console.error("Error fetching teacher/students:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAssignedStudents();
    }, [user]);

    // 2. Handlers for dynamic rows
    const handleAddRow = () => {
        setLessonRows((prev) => [
            ...prev,
            {
                student_id: "",
                subject: "",
                duration: "",
                notes: "",
                progress: ""
            }
        ]);
    };

    const handleRemoveRow = (index) => {
        setLessonRows((prev) => prev.filter((_, i) => i !== index));
    };

    const handleRowChange = (index, field, value) => {
        setLessonRows((prev) =>
            prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
        );
    };

    // 3. Submit: create separate lesson docs for each row, storing lesson_id == docRef.id
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!teacherId) {
            console.error("❌ Missing teacher ID. Is the teacher doc loaded?");
            return;
        }

        try {
            // Combine the date and time into a single Date object if provided
            let finalDate = null;
            if (lessonDate) {
                if (lessonTime) {
                    const dateTimeString = `${lessonDate}T${lessonTime}`;
                    finalDate = new Date(dateTimeString);
                } else {
                    finalDate = new Date(lessonDate);
                }
            }

            console.log("🔹 Submitting multi-row lessons...");
            console.log("🔹 Teacher ID:", teacherId);
            console.log("🔹 finalDate:", finalDate?.toString() || "serverTimestamp()");
            console.log("🔹 lessonRows:", lessonRows);

            for (const [rowIndex, row] of lessonRows.entries()) {
                if (!row.student_id) {
                    console.warn(`Row #${rowIndex + 1} skipped: no student selected.`);
                    continue;
                }

                console.log(
                    `🔸 Creating doc for row #${rowIndex + 1}, student=${row.student_id}, subject=${row.subject}, notes=${row.notes}`
                );

                // Create a new doc reference so we can set docRef.id as lesson_id
                const newDocRef = doc(collection(db, "lessons"));

                await setDoc(newDocRef, {
                    lesson_id: newDocRef.id,  // Store docRef.id as lesson_id
                    teacher_id: teacherId,
                    student_id: row.student_id,
                    subject: row.subject || "",
                    lesson_date: finalDate || serverTimestamp(),
                    duration_minutes: parseInt(row.duration, 10) || 0,
                    lesson_notes: row.notes || "",
                    progress_assessment: row.progress || "",
                    student_num: lessonRows.length,
                    created_at: serverTimestamp(),
                });
            }

            console.log("✅ Lessons added for each row!");
            navigate("/lesson-log");
        } catch (error) {
            console.error("❌ Error adding lessons:", error);
        }
    };

    if (loading) {
        return <p className="p-6">Loading assigned students...</p>;
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <h2 className="text-2xl font-bold mb-4">Add Multiple Lessons</h2>

            <form
                onSubmit={handleSubmit}
                className="bg-white p-6 rounded-lg shadow max-w-3xl"
            >
                {/* Date/Time for ALL rows */}
                <div className="mb-6 p-4 bg-gray-50 rounded">
                    <label className="block mb-2 font-semibold">Lesson Date</label>
                    <input
                        type="date"
                        className="w-full p-2 mb-4 border rounded"
                        value={lessonDate}
                        onChange={(e) => setLessonDate(e.target.value)}
                    />

                    <label className="block mb-2 font-semibold">Begin Time</label>
                    <input
                        type="time"
                        className="w-full p-2 mb-4 border rounded"
                        value={lessonTime}
                        onChange={(e) => setLessonTime(e.target.value)}
                    />
                </div>

                {/* Rows */}
                {lessonRows.map((row, index) => (
                    <div
                        key={index}
                        className="border rounded p-4 mb-4 bg-gray-50 relative"
                    >
                        {lessonRows.length > 1 && (
                            <button
                                type="button"
                                onClick={() => handleRemoveRow(index)}
                                className="absolute top-2 right-2 text-red-500"
                            >
                                Remove
                            </button>
                        )}

                        <label className="block mb-2 font-semibold">Student</label>
                        <select
                            className="w-full p-2 mb-4 border rounded"
                            value={row.student_id}
                            onChange={(e) =>
                                handleRowChange(index, "student_id", e.target.value)
                            }
                            required
                        >
                            <option value="">-- Select a Student --</option>
                            {assignedStudents.map((stu) => (
                                <option key={stu.id} value={stu.id}>
                                    {stu.name}
                                </option>
                            ))}
                        </select>

                        <label className="block mb-2 font-semibold">Subject</label>
                        <select
                            className="w-full p-2 mb-4 border rounded"
                            value={row.subject}
                            onChange={(e) => handleRowChange(index, "subject", e.target.value)}
                        >
                            <option value="">-- Select Subject --</option>
                            <option value="Math">Math</option>
                            <option value="Hebrew">Hebrew</option>
                            <option value="Arabic">Arabic</option>
                            <option value="English">English</option>
                        </select>

                        <label className="block mb-2 font-semibold">Duration (minutes)</label>
                        <input
                            type="number"
                            className="w-full p-2 mb-4 border rounded"
                            value={row.duration}
                            onChange={(e) => handleRowChange(index, "duration", e.target.value)}
                            placeholder="e.g. 60"
                        />

                        <label className="block mb-2 font-semibold">Lesson Notes</label>
                        <textarea
                            className="w-full p-2 mb-4 border rounded"
                            value={row.notes}
                            onChange={(e) => handleRowChange(index, "notes", e.target.value)}
                            placeholder="Notes..."
                        />

                        <label className="block mb-2 font-semibold">Progress Assessment</label>
                        <input
                            type="text"
                            className="w-full p-2 mb-4 border rounded"
                            value={row.progress}
                            onChange={(e) => handleRowChange(index, "progress", e.target.value)}
                            placeholder="e.g. Good, Needs Improvement, etc."
                        />
                    </div>
                ))}

                <button
                    type="button"
                    onClick={handleAddRow}
                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 mr-4"
                >
                    + Add Row
                </button>

                <button
                    type="submit"
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                    Save All Lessons
                </button>
            </form>
        </div>
    );
}

export default AddMultipleLessons;
