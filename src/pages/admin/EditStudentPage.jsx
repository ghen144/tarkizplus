import React, { useEffect, useState } from "react";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { db } from "@/firebase/firebase.jsx";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import IconButton from "@/components/common/IconButton.jsx";
import { Save, ArrowLeft } from "lucide-react";

const EditStudentPage = () => {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const learningStyles = [
    "Auditory",
    "Musical Game",
    "Movement",
    "Visual",
    "Reading/Writing",
  ];
  const lessonTypes = ["Private", "Group"];
  const subjectOptions = ["Math", "Hebrew", "Arabic", "English"];

  const [name, setName] = useState("");
  const [grade, setGrade] = useState("");
  const [preferredLearningStyle, setPreferredLearningStyle] = useState("");
  const [lessonType, setLessonType] = useState("");
  const [phone, setPhone] = useState("");
  const [subjects, setSubjects] = useState([]);
  const [accommodations, setAccommodations] = useState({
    calculator_or_formula_sheet: false,
    extra_time: false,
    reading_accommodation: false,
    oral_response_allowed: false,
    learning_difficulties: false,
    spelling_mistakes_ignored: false,
  });

  const [teachers, setTeachers] = useState([]);
  const [teacherId, setTeacherId] = useState("");
  const [originalTeacherId, setOriginalTeacherId] = useState("");

  useEffect(() => {
    const init = async () => {
      const ref = doc(db, "students", studentId);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        setName(data.name || "");
        setGrade(data.grade || "");
        setPreferredLearningStyle(data.PreferredLearningStyle || "");
        setLessonType(data.private_or_group_lessons || "");
        setPhone(data.parent_phone_number || "");
        setSubjects(data.subjects || []);
        setAccommodations({
          calculator_or_formula_sheet: data.calculator_or_formula_sheet || false,
          extra_time: data.extra_time || false,
          reading_accommodation: data.reading_accommodation || false,
          oral_response_allowed: data.oral_response_allowed || false,
          learning_difficulties: data.learning_difficulties || false,
          spelling_mistakes_ignored: data.spelling_mistakes_ignored || false,
        });
      }

      const teachersSnap = await getDocs(collection(db, "teachers"));
      const teacherList = teachersSnap.docs.map((tdoc) => ({
        id: tdoc.id,
        name: tdoc.data().name || tdoc.id,
        assigned: tdoc.data().assigned_students || [],
      }));
      setTeachers(teacherList);
      const current = teacherList.find((tch) => tch.assigned.includes(studentId));
      if (current) {
        setTeacherId(current.id);
        setOriginalTeacherId(current.id);
      }
    };
    init();
  }, [studentId]);

  const handleSubjectToggle = (sub) => (e) => {
    setSubjects((prev) =>
        e.target.checked ? [...prev, sub] : prev.filter((s) => s !== sub)
    );
  };

  const handleCheckboxChange = (field) => (e) => {
    setAccommodations((prev) => ({ ...prev, [field]: e.target.checked }));
  };

  const isFormValid = () =>
      name && grade && preferredLearningStyle && lessonType && phone && subjects.length > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid()) {
      alert("Please fill all required fields.");
      return;
    }
    const phoneRegex = /^05\d(-?\d){7}$/;
    if (!phoneRegex.test(phone)) {
      alert("Invalid phone number");
      return;
    }
    try {
      const ref = doc(db, "students", studentId);
      await updateDoc(ref, {
        name,
        grade,
        PreferredLearningStyle: preferredLearningStyle,
        private_or_group_lessons: lessonType,
        parent_phone_number: phone,
        subjects,
        ...accommodations,
      });

      if (teacherId !== originalTeacherId) {
        if (originalTeacherId) {
          await updateDoc(doc(db, "teachers", originalTeacherId), {
            assigned_students: arrayRemove(studentId),
          });
        }
        if (teacherId) {
          await updateDoc(doc(db, "teachers", teacherId), {
            assigned_students: arrayUnion(studentId),
          });
        }
      }

      alert(t("studentUpdated"));
      navigate("/admin/students");
    } catch (err) {
      console.error("Error updating student:", err);
      alert(t("updateFailed"));
    }
  };

  return (
      <div className="min-h-screen bg-gray-100 py-8 px-4">
        <div className="max-w-5xl mx-auto space-y-6">
          <IconButton color="gray" onClick={() => navigate("/admin/students")}>
            <ArrowLeft className="w-4 h-4" /> {t("back")}
          </IconButton>

          <h1 className="text-3xl font-bold">{t("edit_student")}</h1>

          <form
              onSubmit={handleSubmit}
              className="bg-white p-6 rounded-xl shadow space-y-8"
          >
            <section className="grid md:grid-cols-2 gap-6">
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
                  {t("grade")}
                </label>
                <select
                    className="w-full border rounded-lg p-2"
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    required
                >
                  <option value="">{t("select_grade")}</option>
                  {Array.from({ length: 12 }, (_, i) => (
                      <option key={i + 1} value={String(i + 1)}>
                        {t(`grades.${i + 1}`)}
                      </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  {t("learning_style")}
                </label>
                <select
                    className="w-full border rounded-lg p-2"
                    value={preferredLearningStyle}
                    onChange={(e) => setPreferredLearningStyle(e.target.value)}
                    required
                >
                  <option value="">{t("select")}</option>
                  {learningStyles.map((style) => (
                      <option key={style} value={style}>
                        {style}
                      </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  {t("lessonType")}
                </label>
                <select
                    className="w-full border rounded-lg p-2"
                    value={lessonType}
                    onChange={(e) => setLessonType(e.target.value)}
                    required
                >
                  <option value="">{t("select")}</option>
                  {lessonTypes.map((type) => (
                      <option key={type} value={type}>
                        {t(type.toLowerCase())}
                      </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  {t("parent_phone")}
                </label>
                <input
                    type="tel"
                    className="w-full border rounded-lg p-2"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  {t("teacher")}
                </label>
                <select
                    className="w-full border rounded-lg p-2"
                    value={teacherId}
                    onChange={(e) => setTeacherId(e.target.value)}
                >
                  <option value="">{t("select")}</option>
                  {teachers.map((tch) => (
                      <option key={tch.id} value={tch.id}>
                        {tch.name}
                      </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">
                  {t("subjects")}
                </label>
                <div className="grid md:grid-cols-2 gap-2 mt-2">
                  {subjectOptions.map((sub) => (
                      <label key={sub} className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            value={sub}
                            checked={subjects.includes(sub)}
                            onChange={handleSubjectToggle(sub)}
                        />
                        <span>{t(sub.toLowerCase())}</span>
                      </label>
                  ))}
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold">{t("accommodations")}</h2>
              <div className="grid md:grid-cols-2 gap-2 mt-2">
                {[
                  "calculator_or_formula_sheet",
                  "extra_time",
                  "reading_accommodation",
                  "oral_response_allowed",
                  "learning_difficulties",
                  "spelling_mistakes_ignored",
                ].map((field) => (
                    <label key={field} className="flex items-center gap-2">
                      <input
                          type="checkbox"
                          checked={accommodations[field]}
                          onChange={handleCheckboxChange(field)}
                      />
                      <span>{t(field)}</span>
                    </label>
                ))}
              </div>
            </section>

            <div className="flex justify-end">
              <IconButton
                  type="submit"
                  color="blue"
                  disabled={!isFormValid()}
                  className={!isFormValid() ? "opacity-50 cursor-not-allowed" : ""}
              >
                <Save className="w-4 h-4" /> {t("save")}
              </IconButton>
            </div>
          </form>
        </div>
      </div>
  );
};

export default EditStudentPage;
