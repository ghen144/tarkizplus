import React, { useEffect, useState } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useNavigate, useParams } from "react-router-dom";
import { db } from "@/firebase/firebase.jsx";
import { useTranslation } from "react-i18next";

function EditStudentPage() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

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

  const availableSubjects = ["Hebrew", "English", "Math", "Arabic"];

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

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-semibold mb-4">{t("editStudent")}</h2>
      <form onSubmit={async (e) => {
        e.preventDefault();
        try {
          await updateDoc(doc(db, "students", studentId), formData);
          alert(t("studentUpdated"));
          navigate("/admin/students");
        } catch (err) {
          console.error(err);
          alert(t("updateFailed"));
        }
      }} className="space-y-4">

       

        <div>
          <label className="block font-semibold mb-1">{t("fullName")}</label>
          <input
            type="text"
            value={formData.name}
            readOnly
            className="w-full border px-4 py-2 rounded bg-gray-100 text-gray-700"
          />
        </div>

        <div>
          <label className="block font-semibold mb-1">{t("grade")}</label>
          <select
            name="grade"
            value={formData.grade}
            onChange={handleChange}
            className="w-full border px-4 py-2 rounded"
            required
          >
            <option value="">{t("selectGrade")}</option>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={`${i + 1}th Grade`}>
                {t(`grades.${i + 1}`)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-semibold mb-1">{t("lessonType")}</label>
          <select
            name="private_or_group_lessons"
            value={formData.private_or_group_lessons}
            onChange={handleChange}
            className="w-full border px-4 py-2 rounded"
          >
            <option value="">{t("select")}</option>
            <option value="Private">{t("private")}</option>
            <option value="Group">{t("group")}</option>
          </select>
        </div>

        <div>
          <label className="block font-semibold mb-1">{t("preferredLearningStyle")}</label>
          <input
            type="text"
            name="preferred_learning_style"
            value={formData.preferred_learning_style}
            onChange={handleChange}
            className="w-full border px-4 py-2 rounded"
          />
        </div>

        <div>
          <label className="block font-semibold mb-1">{t("weeklyAttendance")}</label>
          <input
            type="number"
            name="attendance_count_weekly"
            value={formData.attendance_count_weekly}
            onChange={handleChange}
            className="w-full border px-4 py-2 rounded"
            placeholder="مثلاً: 2 أو 3"
          />
        </div>

        <div>
          <label className="block font-semibold mb-1">{t("parentPhone")}</label>
          <input
            type="text"
            name="parent_phone_number"
            value={formData.parent_phone_number}
            onChange={handleChange}
            className="w-full border px-4 py-2 rounded"
          />
        </div>

        <div>
          <label className="block font-semibold mb-1">{t("subjects")}</label>
          <div className="flex gap-4 flex-wrap">
            {availableSubjects.map(subject => (
              <label key={subject} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.subjects.includes(subject)}
                  onChange={() => handleCheckboxChange(subject)}
                />
                {t(`subjects.${subject.toLowerCase()}`)}
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block font-semibold mb-1">{t("accommodations")}</label>
          <div className="flex flex-col gap-2">
            <label><input type="checkbox" checked={formData.accommodations.reading} onChange={() => handleAccommodationsChange("reading")} /> {t("accReading")}</label>
            <label><input type="checkbox" checked={formData.accommodations.oral_response} onChange={() => handleAccommodationsChange("oral_response")} /> {t("accOral")}</label>
            <label><input type="checkbox" checked={formData.accommodations.extra_time} onChange={() => handleAccommodationsChange("extra_time")} /> {t("accExtraTime")}</label>
            <label><input type="checkbox" checked={formData.accommodations.spelling_ignored} onChange={() => handleAccommodationsChange("spelling_ignored")} /> {t("accSpelling")}</label>
            <label><input type="checkbox" checked={formData.accommodations.calculator} onChange={() => handleAccommodationsChange("calculator")} /> {t("accCalculator")}</label>
          </div>
        </div>

        <div>
          <label className="block font-semibold mb-1">{t("learningDifficulties")}</label>
          <textarea
            name="learning_difficulties"
            value={formData.learning_difficulties}
            onChange={handleChange}
            className="w-full border px-4 py-2 rounded"
          />
        </div>

        <div className="flex gap-4">
          <button type="submit" className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2 rounded">
            {t("save")}
          </button>
          <button type="button" onClick={() => navigate("/admin/students")} className="bg-gray-300 hover:bg-gray-400 px-6 py-2 rounded">
            {t("cancel")}
          </button>
        </div>
      </form>
    </div>
  );
}

export default EditStudentPage;
