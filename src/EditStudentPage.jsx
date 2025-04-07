import React, { useEffect, useState } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useNavigate, useParams } from "react-router-dom";
import { db } from "./firebase";

function EditStudentPage() {
  const { studentId } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    grade: "",
    private_or_group_lessons: "",
    preferred_learning_style: "",
    attendance_count_weekly: "",
    parent_phone_number: "",
    subjects: [],
    accommodations: {
      reading: false,
      oral_response: false,
      extra_time: false,
      spelling_ignored: false,
      calculator: false,
    },
    learning_difficulties: ""
  });

  const allSubjects = ["Hebrew", "English", "Math"];

  useEffect(() => {
    const fetchStudent = async () => {
      const studentRef = doc(db, "students", studentId);
      const docSnap = await getDoc(studentRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setFormData({
          name: data.name || "",
          grade: data.grade || "",
          private_or_group_lessons: data.private_or_group_lessons || "",
          preferred_learning_style: data.preferred_learning_style || "",
          attendance_count_weekly: data.attendance_count_weekly || "",
          parent_phone_number: data.parent_phone_number || "",
          subjects: data.subjects || [],
          accommodations: data.accommodations || {
            reading: false,
            oral_response: false,
            extra_time: false,
            spelling_ignored: false,
            calculator: false,
          },
          learning_difficulties: data.learning_difficulties || ""
        });
      }
    };
    fetchStudent();
  }, [studentId]);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleCheckboxChange = (subject) => {
    setFormData(prev => ({
      ...prev,
      subjects: prev.subjects.includes(subject)
        ? prev.subjects.filter(s => s !== subject)
        : [...prev.subjects, subject]
    }));
  };

  const handleAccommodationsChange = (key) => {
    setFormData(prev => ({
      ...prev,
      accommodations: {
        ...prev.accommodations,
        [key]: !prev.accommodations[key]
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateDoc(doc(db, "students", studentId), formData);
      alert("Student updated successfully!");
      navigate("/admin/students");
    } catch (err) {
      console.error(err);
      alert("Failed to update student.");
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-semibold mb-4">Edit Student</h2>
      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Student ID - ثابت */}
        <div>
          <label className="block font-semibold mb-1">Student ID</label>
          <input
            type="text"
            value={studentId}
            readOnly
            className="w-full border px-4 py-2 rounded bg-gray-100 text-gray-700"
          />
        </div>

        {/* Full Name - ثابت */}
        <div>
          <label className="block font-semibold mb-1">Full Name</label>
          <input
            type="text"
            value={formData.name}
            readOnly
            className="w-full border px-4 py-2 rounded bg-gray-100 text-gray-700"
          />
        </div>

        {/* Grade */}
        <div>
          <label className="block font-semibold mb-1">Grade</label>
          <select
            name="grade"
            value={formData.grade}
            onChange={handleChange}
            className="w-full border px-4 py-2 rounded"
            required
          >
            <option value="">Select grade</option>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={`${i + 1}th Grade`}>{i + 1}th Grade</option>
            ))}
          </select>
        </div>

        {/* Private or Group Lessons */}
        <div>
          <label className="block font-semibold mb-1">Private or Group Lessons</label>
          <select
            name="private_or_group_lessons"
            value={formData.private_or_group_lessons}
            onChange={handleChange}
            className="w-full border px-4 py-2 rounded"
          >
            <option value="">Select</option>
            <option value="Private">Private</option>
            <option value="Group">Group</option>
          </select>
        </div>

        {/* Preferred Learning Style */}
        <div>
          <label className="block font-semibold mb-1">Preferred Learning Style</label>
          <input
            type="text"
            name="preferred_learning_style"
            value={formData.preferred_learning_style}
            onChange={handleChange}
            className="w-full border px-4 py-2 rounded"
          />
        </div>

        {/* ✅ عدد الساعات الأسبوعية */}
        <div>
          <label className="block font-semibold mb-1">عدد الساعات الأسبوعية</label>
          <input
            type="number"
            name="attendance_count_weekly"
            value={formData.attendance_count_weekly}
            onChange={handleChange}
            className="w-full border px-4 py-2 rounded"
            placeholder="مثلاً: 2 أو 3"
          />
        </div>

        {/* Parent Phone Number */}
        <div>
          <label className="block font-semibold mb-1">Parent Phone Number</label>
          <input
            type="text"
            name="parent_phone_number"
            value={formData.parent_phone_number}
            onChange={handleChange}
            className="w-full border px-4 py-2 rounded"
          />
        </div>

        {/* Subjects */}
        <div>
          <label className="block font-semibold mb-1">Subjects</label>
          <div className="flex gap-4 flex-wrap">
            {allSubjects.map(subject => (
              <label key={subject} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.subjects.includes(subject)}
                  onChange={() => handleCheckboxChange(subject)}
                />
                {subject}
              </label>
            ))}
          </div>
        </div>

        {/* Accommodations */}
        <div>
          <label className="block font-semibold mb-1">Accommodations</label>
          <div className="flex flex-col gap-2">
            <label><input type="checkbox" checked={formData.accommodations.reading} onChange={() => handleAccommodationsChange("reading")} /> Reading Accommodation</label>
            <label><input type="checkbox" checked={formData.accommodations.oral_response} onChange={() => handleAccommodationsChange("oral_response")} /> Oral Response Allowed</label>
            <label><input type="checkbox" checked={formData.accommodations.extra_time} onChange={() => handleAccommodationsChange("extra_time")} /> Extra Time</label>
            <label><input type="checkbox" checked={formData.accommodations.spelling_ignored} onChange={() => handleAccommodationsChange("spelling_ignored")} /> Spelling Mistakes Ignored</label>
            <label><input type="checkbox" checked={formData.accommodations.calculator} onChange={() => handleAccommodationsChange("calculator")} /> Calculator or Formula Sheet</label>
          </div>
        </div>

        {/* Learning Difficulties */}
        <div>
          <label className="block font-semibold mb-1">Learning Difficulties</label>
          <textarea
            name="learning_difficulties"
            value={formData.learning_difficulties}
            onChange={handleChange}
            className="w-full border px-4 py-2 rounded"
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-4">
          <button type="submit" className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2 rounded">
            Save
          </button>
          <button type="button" onClick={() => navigate("/admin/students")} className="bg-gray-300 hover:bg-gray-400 px-6 py-2 rounded">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default EditStudentPage;
