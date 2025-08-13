// AddTeacherPage.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "@/firebase/firebase.jsx";
import {
  collection,
  doc,
  setDoc,
  getDocs,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import IconButton from "@/components/common/IconButton.jsx";
import { Save, ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";

function AddTeacherPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [teacherId, setTeacherId] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subjectSpecialties, setSubjectSpecialties] = useState([]);
  const [experienceYears, setExperienceYears] = useState("");
  const [teachingHoursWeek, setTeachingHoursWeek] = useState("");
  const [activeStatus, setActiveStatus] = useState(true);
  const [joiningDate, setJoiningDate] = useState(
      () => new Date().toISOString().split("T")[0]
  );
  const [uid, setUid] = useState("");
  const [students, setStudents] = useState([]);
  const [assignedStudents, setAssignedStudents] = useState([]);

  const subjects = ["Math", "English", "Arabic", "Hebrew"];

  useEffect(() => {
    const init = async () => {
      const teachersSnap = await getDocs(collection(db, "teachers"));
      let max = 0;
      teachersSnap.forEach((d) => {
        const id = d.data().teacher_id || "";
        const num = parseInt(id.replace(/^T/, ""), 10);
        if (!isNaN(num) && num > max) max = num;
      });
      setTeacherId(`T${(max + 1).toString().padStart(3, "0")}`);

      const studentsSnap = await getDocs(collection(db, "students"));
      const list = studentsSnap.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().name || doc.id,
      }));
      setStudents(list);
    };
    init();
  }, []);

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
      const docRef = doc(collection(db, "teachers"), teacherId);
      await setDoc(docRef, {
        teacher_id: teacherId,
        name,
        email,
        subject_specialties: subjectSpecialties,
        experience_years: Number(experienceYears),
        teaching_hours_week: Number(teachingHoursWeek),
        active_status: activeStatus,
        joining_tarkiz_date: Timestamp.fromDate(new Date(joiningDate)),
        assigned_students: assignedStudents,
        uid: uid || "",
        created_at: serverTimestamp(),
      });
      navigate("/admin/teachers");
    } catch (err) {
      console.error("Error adding teacher:", err);
    }
  };

  return (
      <div className="min-h-screen bg-gray-100 py-8 px-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <IconButton color="gray" onClick={() => navigate("/admin/teachers")}>
            <ArrowLeft className="w-4 h-4" /> Back
          </IconButton>

          <h1 className="text-3xl font-bold">{t("add_new_teacher")}</h1>

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
                    value={teacherId}
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

export default AddTeacherPage;
