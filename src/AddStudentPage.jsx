import React, { useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const AddStudentPage = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [student, setStudent] = useState({
        student_id: "",
        name: "",
        grade: "",
        subjects: [],
        PreferredLearningStyle: "",
        attendance_count_weekly: "",
        calculator_or_formula_sheet: false,
        created_at: new Date().toLocaleDateString("en-GB"),
        extra_time: false,
        learning_difficulties: false,
        oral_response_allowed: false,
        parent_phone_number: "",
        private_or_group_lessons: "",
        reading_accommodation: false,
        spelling_mistakes_ignored: false,
    });

    const availableSubjects = ["Hebrew", "English", "Math", "Arabic"];
    const lessonTypes = ["Private", "Group"];

    const handleCheckboxChange = (subject) => {
        setStudent((prev) => {
            const updatedSubjects = prev.subjects.includes(subject)
                ? prev.subjects.filter((s) => s !== subject)
                : [...prev.subjects, subject];
            return { ...prev, subjects: updatedSubjects };
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!student.student_id || !student.name || !student.grade) {
            alert(t("fill_required"));
            return;
        }
        try {
            await setDoc(doc(db, "students", student.student_id), student);
            alert(t("student_added"));
            navigate("/admin/students");
        } catch (err) {
            console.error("Error adding student:", err);
            alert(t("student_add_failed"));
        }
    };

    return (
        <div className="p-6 max-w-2xl mx-auto bg-white shadow rounded">
            <h2 className="text-2xl font-bold mb-6">{t("add_new_student")}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block font-medium">{t("student_id")}</label>
                    <input
                        type="text"
                        value={student.student_id}
                        onChange={(e) => setStudent({ ...student, student_id: e.target.value })}
                        className="w-full border p-2 rounded"
                        required
                    />
                </div>

                <div>
                    <label className="block font-medium">{t("full_name")}</label>
                    <input
                        type="text"
                        value={student.name}
                        onChange={(e) => setStudent({ ...student, name: e.target.value })}
                        className="w-full border p-2 rounded"
                        required
                    />
                </div>

                <div>
                    <label className="block font-medium">{t("grade")}</label>
                    <select
                        value={student.grade}
                        onChange={(e) => setStudent({ ...student, grade: e.target.value })}
                        className="w-full border p-2 rounded"
                        required
                    >
                        <option value="">{t("select_grade")}</option>
                        {Array.from({ length: 12 }, (_, i) => (
                            <option key={i + 1} value={`${i + 1}th Grade`}>
                                {t(`grades.${i + 1}`)}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block font-medium">{t("lesson_type")}</label>
                    <select
                        value={student.private_or_group_lessons}
                        onChange={(e) => setStudent({ ...student, private_or_group_lessons: e.target.value })}
                        className="w-full border p-2 rounded"
                    >
                        <option value="">{t("select")}</option>
                        {lessonTypes.map((type) => (
                            <option key={type} value={type}>{t(type.toLowerCase())}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block font-medium">{t("learning_style")}</label>
                    <input
                        type="text"
                        value={student.PreferredLearningStyle}
                        onChange={(e) => setStudent({ ...student, PreferredLearningStyle: e.target.value })}
                        className="w-full border p-2 rounded"
                    />
                </div>

                <div>
                    <label className="block font-medium">{t("attendance_count")}</label>
                    <input
                        type="number"
                        value={student.attendance_count_weekly}
                        onChange={(e) => setStudent({ ...student, attendance_count_weekly: e.target.value })}
                        className="w-full border p-2 rounded"
                    />
                </div>

                <div>
                    <label className="block font-medium">{t("parent_phone")}</label>
                    <input
                        type="text"
                        value={student.parent_phone_number}
                        onChange={(e) => setStudent({ ...student, parent_phone_number: e.target.value })}
                        className="w-full border p-2 rounded"
                    />
                </div>

                <div>
                    <label className="block font-medium">{t("subjects")}</label>
                    <div className="flex gap-4 mt-2 flex-wrap">
                        {availableSubjects.map((subject) => (
                            <label key={subject} className="flex items-center gap-1">
                                <input
                                    type="checkbox"
                                    checked={student.subjects.includes(subject)}
                                    onChange={() => handleCheckboxChange(subject)}
                                />
                                {t(`subjects.${subject.toLowerCase()}`)}
                            </label>
                        ))}
                    </div>
                </div>

                {[
                    "reading_accommodation",
                    "oral_response_allowed",
                    "extra_time",
                    "spelling_mistakes_ignored",
                    "calculator_or_formula_sheet",
                    "learning_difficulties"
                ].map((key) => (
                    <div key={key} className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={student[key]}
                            onChange={(e) => setStudent({ ...student, [key]: e.target.checked })}
                        />
                        <label>{t(key)}</label>
                    </div>
                ))}

                <button
                    type="submit"
                    className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
                >
                    {t("save_student")}
                </button>
            </form>
        </div>
    );
};

export default AddStudentPage;
