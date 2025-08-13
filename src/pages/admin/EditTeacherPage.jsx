import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { db } from "@/firebase/firebase.jsx";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  Timestamp,
} from "firebase/firestore";
import IconButton from "@/components/common/IconButton.jsx";
import { Save, ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";

function EditTeacherPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { teacherId } = useParams();

  const [teacherIdValue, setTeacherIdValue] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subjectSpecialties, setSubjectSpecialties] = useState([]);
  const [experienceYears, setExperienceYears] = useState("");
  const [teachingHoursWeek, setTeachingHoursWeek] = useState("");
  const [activeStatus, setActiveStatus] = useState(true);
  const [joiningDate, setJoiningDate] = useState("");
  const [uid, setUid] = useState("");
  const [students, setStudents] = useState([]);
  const [assignedStudents, setAssignedStudents] = useState([]);

  const subjects = ["Math", "English", "Arabic", "Hebrew"];

  useEffect(() => {
    const init = async () => {
      const ref = doc(db, "teachers", teacherId);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        setTeacherIdValue(data.teacher_id || "");
        setName(data.name || "");
        setEmail(data.email || "");
        setSubjectSpecialties(data.subject_specialties || []);
        setExperienceYears(
            data.experience_years !== undefined
                ? data.experience_years.toString()
                : ""
        );
        setTeachingHoursWeek(
            data.teaching_hours_week !== undefined
                ? data.teaching_hours_week.toString()
                : ""
        );
        setActiveStatus(data.active_status ?? true);
        setJoiningDate(
            data.joining_tarkiz_date
                ? data.joining_tarkiz_date.toDate().toISOString().split("T")[0]
                : new Date().toISOString().split("T")[0]
        );
        setUid(data.uid || "");
        setAssignedStudents(data.assigned_students || []);
      }

      const studentsSnap = await getDocs(collection(db, "students"));
      const list = studentsSnap.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().name || doc.id,
      }));
      setStudents(list);
    };
    init();
  }, [teacherId]);

  const handleSubjectChange = (subject) => {
    setSubjectSpecialties((prev) =>
        prev.includes(subject)
            ? prev.filter((s) => s !== subject)
            : [...prev, subject]
    );
  };

  const handleAssignedStudentToggle = (id) => {
    setAssignedStudents((prev) =>
        prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const isValidEmail = (value) => /\S+@\S+\.\S+/.test(value);
  const isValidNumber = (value) => value !== "" && Number(value) >= 0;

  const canSave =
      name &&
      isValidEmail(email) &&
      subjectSpecialties.length > 0 &&
      isValidNumber(experienceYears) &&
      isValidNumber(teachingHoursWeek);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSave) return;

    try {
      const ref = doc(db, "teachers", teacherId);
      await updateDoc(ref, {
        name,
        email,
        subject_specialties: subjectSpecialties,
        experience_years: Number(experienceYears),
        teaching_hours_week: Number(teachingHoursWeek),
        active_status: activeStatus,
        joining_tarkiz_date: Timestamp.fromDate(new Date(joiningDate)),
        assigned_students: assignedStudents,
        uid: uid || "",
      });

      const updatedSnap = await getDoc(ref);
      if (updatedSnap.exists()) {
        const updated = updatedSnap.data();
        if (updated.active_status !== activeStatus) {
          console.error("Active status did not update correctly");
        }
      }

      navigate("/admin/teachers");
    } catch (err) {
      console.error("Error updating teacher:", err);
    }
  };

  return (
      <div className="min-h-screen bg-gray-100 py-8 px-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <IconButton color="gray" onClick={() => navigate("/admin/teachers")}>
            <ArrowLeft className="w-4 h-4" /> Back
          </IconButton>

          <h1 className="text-3xl font-bold">{t("edit_teacher")}</h1>

          <form
              onSubmit={handleSubmit}
              className="bg-white p-6 rounded-xl shadow space-y-8"
          >
            <section className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Teacher ID
                </label>
                <input
                    type="text"
                    className="w-full border rounded-lg p-2 bg-gray-100"
                    value={teacherIdValue}
                    readOnly
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  {t("full_name")}
                </label>
                <input
                    type="text"
                    className="w-full border rounded-lg p-2"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  {t("email")}
                </label>
                <input
                    type="email"
                    className="w-full border rounded-lg p-2"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  {t("experience_years")}
                </label>
                <input
                    type="number"
                    min="0"
                    className="w-full border rounded-lg p-2"
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(e.target.value)}
                    required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  {t("teaching_hours")}
                </label>
                <input
                    type="number"
                    min="0"
                    className="w-full border rounded-lg p-2"
                    value={teachingHoursWeek}
                    onChange={(e) => setTeachingHoursWeek(e.target.value)}
                    required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  {t("status")}
                </label>
                <label className="inline-flex items-center gap-2">
                  <input
                      type="checkbox"
                      className="form-checkbox h-5 w-5 text-blue-600"
                      checked={activeStatus}
                      onChange={(e) => setActiveStatus(e.target.checked)}
                  />
                  {activeStatus ? t("active") : t("inactive")}
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  {t("joining_date")}
                </label>
                <input
                    type="date"
                    className="w-full border rounded-lg p-2"
                    value={joiningDate}
                    onChange={(e) => setJoiningDate(e.target.value)}
                    required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  {t("uid_optional")}
                </label>
                <input
                    type="text"
                    className="w-full border rounded-lg p-2"
                    value={uid}
                    onChange={(e) => setUid(e.target.value)}
                />
              </div>
            </section>

            <section className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t("subjects")}
                </label>
                <div className="flex flex-wrap gap-4">
                  {subjects.map((sub) => (
                      <label key={sub} className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={subjectSpecialties.includes(sub)}
                            onChange={() => handleSubjectChange(sub)}
                        />
                        {t(sub.toLowerCase())}
                      </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  {t("assigned_students")}
                </label>
                <div className="flex flex-col gap-2 h-40 overflow-auto border rounded-lg p-2">
                  {students.map((stu) => (
                      <label key={stu.id} className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={assignedStudents.includes(stu.id)}
                            onChange={() => handleAssignedStudentToggle(stu.id)}
                        />
                        {stu.name}
                      </label>
                  ))}
                </div>
              </div>
            </section>

            <div className="flex justify-end">
              <IconButton
                  type="submit"
                  color="blue"
                  disabled={!canSave}
                  className={!canSave ? "opacity-50 cursor-not-allowed" : ""}
              >
                <Save className="w-4 h-4" /> {t("save")}
              </IconButton>
            </div>
          </form>
        </div>
      </div>
  );
}

export default EditTeacherPage;
