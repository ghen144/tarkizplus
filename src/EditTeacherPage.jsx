import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "./firebase";
import { useTranslation } from "react-i18next";

function EditTeacherPage() {
  const { teacherId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [formData, setFormData] = useState({
    teacher_id: "",
    name: "",
    email: "",
    subject_specialties: [],
    experience_years: "",
    teaching_hours_week: "",
    uid: "",
    active_status: true
  });

  const allSubjects = ["Math", "English", "Arabic", "Hebrew"];

  useEffect(() => {
    const fetchData = async () => {
      const ref = doc(db, "teachers", teacherId);
      const docSnap = await getDoc(ref);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setFormData({
          teacher_id: data.teacher_id || "",
          name: data.name || "",
          email: data.email || "",
          subject_specialties: data.subject_specialties || [],
          experience_years: data.experience_years || "",
          teaching_hours_week: data.teaching_hours_week || "",
          uid: data.uid || "",
          active_status: data.active_status ?? true
        });
      }
    };
    fetchData();
  }, [teacherId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (subject) => {
    setFormData(prev => ({
      ...prev,
      subject_specialties: prev.subject_specialties.includes(subject)
        ? prev.subject_specialties.filter(s => s !== subject)
        : [...prev.subject_specialties, subject]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateDoc(doc(db, "teachers", teacherId), {
        email: formData.email,
        subject_specialties: formData.subject_specialties,
        experience_years: Number(formData.experience_years),
        teaching_hours_week: Number(formData.teaching_hours_week),
        uid: formData.uid,
        active_status: formData.active_status === "active",
      });
      alert(t("successMessage"));
      navigate("/admin/teachers");
    } catch (err) {
      console.error(err);
      alert(t("errorMessage"));
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h2 className="text-2xl font-semibold mb-4">{t("editTeacher")}</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-semibold mb-1">{t("teacherId")}</label>
          <input
            type="text"
            value={formData.teacher_id}
            readOnly
            className="w-full border px-4 py-2 rounded bg-gray-100 text-gray-700"
          />
        </div>

        <div>
          <label className="block font-semibold mb-1">{t("fullName")}</label>
          <input
            type="text"
            value={formData.name}
            readOnly
            className="w-full border px-4 py-2 rounded bg-gray-100 text-gray-700"
          />
        </div>

        <input
          type="email"
          name="email"
          placeholder={t("email")}
          className="w-full border px-4 py-2 rounded"
          value={formData.email}
          onChange={handleChange}
          required
        />

        <div>
          <label className="block font-semibold mb-1">{t("subjects")}</label>
          <div className="flex flex-wrap gap-4">
            {allSubjects.map(subject => (
              <label key={subject} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.subject_specialties.includes(subject)}
                  onChange={() => handleCheckboxChange(subject)}
                />
                {t(subject.toLowerCase())}
              </label>
            ))}
          </div>
        </div>

        <input
          type="number"
          name="experience_years"
          placeholder={t("yearsOfExperience")}
          className="w-full border px-4 py-2 rounded"
          value={formData.experience_years}
          onChange={handleChange}
          required
        />

        <input
          type="number"
          name="teaching_hours_week"
          placeholder={t("teachingHours")}
          className="w-full border px-4 py-2 rounded"
          value={formData.teaching_hours_week}
          onChange={handleChange}
          required
        />

        <input
          type="text"
          name="uid"
          placeholder={t("firebaseUid")}
          className="w-full border px-4 py-2 rounded"
          value={formData.uid}
          onChange={handleChange}
        />

        <div>
          <label className="block font-semibold mb-1">{t("status")}</label>
          <select
            name="active_status"
            value={formData.active_status ? "active" : "inactive"}
            onChange={(e) =>
              setFormData(prev => ({
                ...prev,
                active_status: e.target.value === "active"
              }))
            }
            className="w-full border px-4 py-2 rounded"
          >
            <option value="active">{t("active")}</option>
            <option value="inactive">{t("inactive")}</option>
          </select>
        </div>

        <div className="flex gap-4">
          <button type="submit" className="bg-yellow-500 text-white px-6 py-2 rounded hover:bg-yellow-600">
            {t("save")}
          </button>
          <button
            type="button"
            onClick={() => navigate("/admin/teachers")}
            className="bg-gray-300 px-6 py-2 rounded hover:bg-gray-400"
          >
            {t("cancel")}
          </button>
        </div>
      </form>
    </div>
  );
}

export default EditTeacherPage;
