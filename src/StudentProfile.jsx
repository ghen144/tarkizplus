import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    doc,
    getDoc,
    collection,
    getDocs,
    query,
    where,
    orderBy
} from "firebase/firestore";
import { db } from "./firebase";
import Sidebar from "./Sidebar";
import { ArrowLeft, BookOpen, AlertCircle, User, Smartphone, Calendar, ClipboardList } from "lucide-react";
import { addDoc } from "firebase/firestore"; // تأكدي أنك مستوردة addDoc
const StudentProfile = () => {
    const navigate = useNavigate();
    const { studentId } = useParams();
    const [studentData, setStudentData] = useState(null);
    const [lessons, setLessons] = useState([]);
    const [teachersMap, setTeachersMap] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedTeacherFilters, setSelectedTeacherFilters] = useState([]);
    const [selectedSubjectFilters, setSelectedSubjectFilters] = useState([]);
    const [selectedDate, setSelectedDate] = useState("");
    const [sortOrder, setSortOrder] = useState("desc"); // "desc" = newest first
    const [exams, setExams] = useState([]); 
    const [showExamForm, setShowExamForm] = useState(false);
    const [newExam, setNewExam] = useState({
        subject: "",
        exam_date: "",
        material: "",
    });
    const handleSaveExam = async () => {
        if (!newExam.subject || !newExam.exam_date || !newExam.material) {
            alert("Please fill in all exam fields.");
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
            alert("Exam added successfully!");
            setShowExamForm(false);
            setNewExam({ subject: "", exam_date: "", material: "" });
    
            // إعادة تحميل الامتحانات بعد الإضافة:
            const updatedSnapshot = await getDocs(
                query(collection(db, "exams"), where("student_id", "==", studentId))
            );
            const updatedExams = updatedSnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
            setExams(updatedExams);
        } catch (err) {
            console.error("Error adding exam:", err);
            alert("Failed to add exam.");
        }
    };
    

    const handleAddTeacherFilter = (e) => {
        const teacherName = e.target.value;
        if (teacherName && !selectedTeacherFilters.includes(teacherName)) {
            setSelectedTeacherFilters((prev) => [...prev, teacherName]);
        }
        e.target.value = "";
    };

    const handleAddSubjectFilter = (e) => {
        const subject = e.target.value;
        if (subject && !selectedSubjectFilters.includes(subject)) {
            setSelectedSubjectFilters((prev) => [...prev, subject]);
        }
        e.target.value = "";
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
                setError("No student ID provided");
                setLoading(false);
                return;
            }

            try {
                // 1. Fetch the student document
                const studentRef = doc(db, "students", studentId);
                const studentDocSnap = await getDoc(studentRef);
                if (!studentDocSnap.exists()) {
                    setError("Student not found");
                    setLoading(false);
                    return;
                }
                const studentDocData = studentDocSnap.data();
                setStudentData({ id: studentId, ...studentDocData });

                // 2. Fetch lessons for this student
                const lessonsQuery = query(
                    collection(db, "lessons"),
                    where("student_id", "==", studentId),
                    orderBy("lesson_date", "desc")
                );
                const lessonsSnapshot = await getDocs(lessonsQuery);
                const lessonsList = lessonsSnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }));
                setLessons(lessonsList);

                // 3. Fetch all teachers for teacher name lookup
                const teachersSnap = await getDocs(collection(db, "teachers"));
                const tMap = {};
                teachersSnap.forEach((tdoc) => {
                    const tData = tdoc.data();
                    tMap[tdoc.id] = tData.name || "Unnamed Teacher";
                });
                setTeachersMap(tMap);
                // 4. Fetch exams for this student
                const examsQuery = query(
                collection(db, "exams"),
                where("student_id", "==", studentId)
                );
                const examsSnapshot = await getDocs(examsQuery);
                const examsList = examsSnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
                }));
                setExams(examsList);
  

            } catch (err) {
                console.error("Error fetching student/lessons:", err);
                setError(`Error loading data: ${err.message}`);
            } finally {
                setLoading(false);
            }
        };

        fetchStudentDataAndLessons();
    }, [studentId]);

    const handleReturn = () => {
        navigate("/students");
    };

    if (loading) {
        return (
            <div className="flex min-h-screen bg-gray-50">
                <Sidebar activePage="students" />
                <main className="ml-64 flex-1 p-6 flex items-center justify-center">
                    <p>Loading student data...</p>
                </main>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex min-h-screen bg-gray-50">
                <Sidebar activePage="students" />
                <main className="ml-64 flex-1 p-6">
                    <div className="flex items-center justify-center h-full">
                        <p className="text-red-500">{error}</p>
                    </div>
                    <div className="mt-6">
                        <button
                            className="flex items-center bg-white p-3 rounded-lg shadow hover:bg-gray-100"
                            onClick={handleReturn}
                        >
                            <ArrowLeft className="h-5 w-5 text-gray-500 mr-2" />
                            Return to Students
                        </button>
                    </div>
                </main>
            </div>
        );
    }

    // Extract fields you want to display (adjust as needed)
    const {
        name,
        grade,
        subjects,
        learning_difficulty,
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

    // Convert array of subjects into a string
    const subjectsText = Array.isArray(subjects) ? subjects.join(", ") : "N/A";

    // Helper for lesson date
    const formatDate = (ts) => (ts ? ts.toDate().toLocaleDateString() : "No date");
    const sortedLessons = [...lessons].sort((a, b) => {
        const dateA = a.lesson_date?.toDate();
        const dateB = b.lesson_date?.toDate();
        if (!dateA || !dateB) return 0;
        return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
    });

    return (
        <div className="flex min-h-screen bg-gray-200">
            <Sidebar activePage="students" />

            <main className="ml-0 flex-1 p-6 space-y-6">
                {/* General Information Card */}
                <div className="bg-white p-6 rounded-lg shadow-md space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                        <User className="h-5 w-5 text-blue-600" />
                        <h2 className="text-2xl font-bold">General Information</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div><strong>Name:</strong> {name || "N/A"}</div>
                        <div><strong>Grade:</strong> {grade || "N/A"}</div>
                        <div><strong>Subjects:</strong> {subjectsText}</div>
                        <div><strong>Parent Phone:</strong> {parent_phone_number || "N/A"}</div>
                    </div>
                </div>

                {/* Learning Accommodations Card */}
                <div className="bg-white p-6 rounded-lg shadow-md space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                        <BookOpen className="h-5 w-5 text-blue-600" />
                        <h2 className="text-2xl font-bold">Learning Accommodations</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div><strong>Preferred Learning Style:</strong> {PreferredLearningStyle || "N/A"}</div>
                        <div><strong>Learning Difficulty:</strong> {learning_difficulty || "No"}</div>
                        <div><strong>Private / Group Lessons:</strong> {private_or_group_lessons || "N/A"}</div>
                        <div><strong>Reading Accommodation:</strong> {reading_accommodation ? "Yes" : "No"}</div>
                        <div><strong>Oral Response Allowed:</strong> {oral_response_allowed ? "Yes" : "No"}</div>
                        <div><strong>Extra Time:</strong> {extra_time ? "Yes" : "No"}</div>
                        <div><strong>Spelling Mistakes Ignored:</strong> {spelling_mistakes_ignored ? "Yes" : "No"}</div>
                        <div><strong>Calculator or Formula Sheet:</strong> {calculator_or_formula_sheet ? "Yes" : "No"}</div>
                    </div>
                </div>

                {/* Performance & Progress Card */}
                <div className="bg-white p-6 rounded-lg shadow-md space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                        <CheckCircle className="h-5 w-5 text-blue-600" />
                        <h2 className="text-2xl font-bold">Performance & Progress</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div><strong>Engagement Level:</strong> {engagement_level || "N/A"}</div>
                        <div><strong>Recent Performance:</strong> {recent_performance || "N/A"}</div>
                        <div><strong>Attendance Count Weekly:</strong> {attendance_count_weekly || "N/A"}</div>
                    </div>
                </div>

                {/* Lesson History */}
                <div className="bg-white p-6 rounded-lg shadow mt-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Calendar className="h-5 w-5 text-blue-500" />
                        <h2 className="text-2xl font-bold">Lesson History</h2>
                    </div>
                    <p className="text-sm text-gray-500 mb-2">You can filter by one or more teachers or subjects:</p>

                    {/* Filter Controls */}
                    <div className="flex flex-wrap gap-4 mb-4">


                        {/* Filter by Teacher */}
                        {/* Teacher Filter */}
                        <div>
                            <p className="font-medium mb-1">Teacher</p>
                            <select onChange={handleAddTeacherFilter} className="p-2 border rounded text-sm">
                                <option value="">Select</option>
                                {Object.entries(teachersMap).map(([id, name]) => (
                                    <option key={id} value={name}>{name}</option>
                                ))}
                            </select>

                            <div className="mt-2 flex flex-wrap gap-2">
                                {selectedTeacherFilters.map((name) => (
                                    <span key={name} className="bg-blue-200 text-blue-800 rounded px-2 py-1 text-sm flex items-center">
                    {name}
                                        <button onClick={() => removeTeacherFilter(name)} className="ml-1 text-blue-600 font-bold">&times;</button>
                    </span>
                                ))}
                            </div>
                        </div>


                        {/* Subject Filter */}
                        <div>
                            <p className="font-medium mb-1">Subject</p>
                            <select onChange={handleAddSubjectFilter} className="p-2 border rounded text-sm">
                                <option value="">Select</option>
                                {[...new Set(lessons.map((l) => l.subject))].map((subject) => (
                                    <option key={subject} value={subject}>{subject}</option>
                                ))}
                            </select>

                            <div className="mt-2 flex flex-wrap gap-2">
                                {selectedSubjectFilters.map((subject) => (
                                    <span key={subject} className="bg-green-200 text-green-800 rounded px-2 py-1 text-sm flex items-center">
                    {subject}
                                        <button onClick={() => removeSubjectFilter(subject)} className="ml-1 text-green-600 font-bold">&times;</button>
                    </span>
                                ))}
                            </div>
                        </div>
                        {/* Filter by Date */}
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="p-2 border rounded"
                        />

                        {/* Sort button */}
                        <button
                            onClick={() => setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"))}
                            className="p-2 border rounded bg-white text-gray-700 hover:bg-gray-100"
                        >
                            {sortOrder === "desc" ? "Sort: Newest First" : "Sort: Oldest First"}
                        </button>

                    </div>

                    <div className="overflow-x-auto">
                        {lessons.length > 0 ? (
                            <table className="min-w-full bg-white">
                                <thead>
                                <tr>
                                    <th className="px-6 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Date
                                    </th>
                                    <th className="px-6 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Teacher
                                    </th>
                                    <th className="px-6 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Subject
                                    </th>
                                    <th className="px-6 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Notes
                                    </th>
                                    <th className="px-6 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Progress
                                    </th>
                                </tr>
                                </thead>
                                <tbody>


                                {sortedLessons.filter((lesson) => {
                                    const teacherName = teachersMap[lesson.teacher_id] || lesson.teacher_id;
                                    const dateString = lesson.lesson_date?.toDate().toISOString().split("T")[0];
                                    return (
                                        (selectedTeacherFilters.length === 0 || selectedTeacherFilters.includes(teacherName)) &&
                                        (selectedSubjectFilters.length === 0 || selectedSubjectFilters.includes(lesson.subject)) &&
                                        (!selectedDate || selectedDate === dateString)
                                    );
                                }).map((lesson) => {

                                    const teacherName =
                                        teachersMap[lesson.teacher_id] || lesson.teacher_id || "No teacher";

                                    return (
                                        <tr key={lesson.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 border-b border-gray-200">
                                                {formatDate(lesson.lesson_date)}
                                            </td>
                                            <td className="px-6 py-4 border-b border-gray-200">
                                                {teacherName}
                                            </td>
                                            <td className="px-6 py-4 border-b border-gray-200">
                                                {lesson.subject || "No subject"}
                                            </td>
                                            <td className="px-6 py-4 border-b border-gray-200">
                                                {lesson.lesson_notes || "No notes"}
                                            </td>
                                            <td className="px-6 py-4 border-b border-gray-200">
                                                {lesson.progress_assessment || "No Progress"}
                                            </td>
                                        </tr>
                                    );
                                })}
                                </tbody>
                            </table>
                        ) : (
                            <p className="text-gray-500">No lessons found for this student.</p>
                        )}
                    </div>
                </div>

                {/* Exam Table */}
<div className="bg-white p-6 rounded-lg shadow mt-6">
<div className="flex items-center gap-2 mb-4">
  <ClipboardList className="h-5 w-5 text-blue-500" />
  <h2 className="text-xl font-semibold">Exams</h2>
</div>
  {exams.length > 0 ? (
    <table className="min-w-full bg-white">
      <thead>
        <tr>
          <th className="px-6 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
            Subject
          </th>
          <th className="px-6 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
            Exam Date
          </th>
          <th className="px-6 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
            Material
          </th>
        </tr>
      </thead>
      <tbody>
      {exams.map((exam) => {
  let examDate = "No date";

  if (exam.exam_date && typeof exam.exam_date.toDate === "function") {
    examDate = exam.exam_date.toDate().toLocaleDateString("en-GB");
  }

  return (
    <tr key={exam.id} className="hover:bg-gray-50">
      <td className="px-6 py-4 border-b border-gray-200">{exam.subject}</td>
      <td className="px-6 py-4 border-b border-gray-200">{examDate}</td>
      <td className="px-6 py-4 border-b border-gray-200">{exam.material}</td>
    </tr>
  );
})}


      </tbody>
    </table>
  ) : (
    <p className="text-gray-500">No exams found for this student.</p>
  )}
</div>

<div className="mt-4">
  <button
    onClick={() => setShowExamForm((prev) => !prev)}
    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
  >
    {showExamForm ? "Cancel" : "Add Exam"}
  </button>
</div>
{showExamForm && (
  <div className="bg-gray-50 p-4 mt-4 rounded shadow space-y-4 max-w-md">
    <div>
      <label className="block font-medium">Subject</label>
      <input
        type="text"
        value={newExam.subject}
        onChange={(e) => setNewExam({ ...newExam, subject: e.target.value })}
        className="w-full border p-2 rounded"
        placeholder="Enter subject"
      />
    </div>
    <div>
      <label className="block font-medium">Exam Date</label>
      <input
        type="datetime-local"
        value={newExam.exam_date}
        onChange={(e) => setNewExam({ ...newExam, exam_date: e.target.value })}
        className="w-full border p-2 rounded"
      />
    </div>
    <div>
      <label className="block font-medium">Material</label>
      <input
        type="text"
        value={newExam.material}
        onChange={(e) => setNewExam({ ...newExam, material: e.target.value })}
        className="w-full border p-2 rounded"
        placeholder="e.g. Unit 3: Fractions"
      />
    </div>
    <button
      onClick={handleSaveExam}
      className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
    >
      Save Exam
    </button>
  </div>
)}




                {/* Return Button */}
                <div className="mt-6">
                    <button
                        className="flex items-center bg-white p-3 rounded-lg shadow hover:bg-gray-100"
                        onClick={() => navigate("/students")}
                    >
                        <ArrowLeft className="h-5 w-5 text-gray-500 mr-2" />
                        Return to Students
                    </button>
                </div>
            </main>
        </div>
    );
};

export default StudentProfile;

