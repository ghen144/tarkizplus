import React, { useState, useEffect } from "react";
import { collection, getDocs, addDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { db } from "@/firebase/firebase.jsx";
import AdminSidebar from "@/components/admin/AdminSidebar.jsx";
import { useTranslation } from "react-i18next";

const SUBJECT_OPTIONS = ["Math", "English", "Hebrew", "Arabic"];
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function NewSchedule() {
  const { t } = useTranslation();
  const [teachers, setTeachers] = useState([]);
  const [teacherId, setTeacherId] = useState("");
  const [students, setStudents] = useState([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [dayOfWeek, setDayOfWeek] = useState(DAYS[0]);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [subject, setSubject] = useState(SUBJECT_OPTIONS[0]);
  const [active, setActive] = useState("yes");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTeachers = async () => {
      const snap = await getDocs(collection(db, "teachers"));
      const list = snap.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name || `Unnamed Teacher (${doc.id})`
      }));
      setTeachers(list);
    };
    fetchTeachers();
  }, []);

  useEffect(() => {
    const fetchStudents = async () => {
      const snap = await getDocs(collection(db, "students"));
      const list = snap.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name || `Unnamed Student (${doc.id})`
      }));
      setStudents(list);
    };
    fetchStudents();
  }, []);

  const toggleStudent = (id) => {
    setSelectedStudentIds(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!teacherId || !startTime || !endTime) {
      setError(t("fillRequiredFields"));
      return;
    }

    const classType = selectedStudentIds.length > 1 ? "Group" : "Private";

    try {
      await addDoc(collection(db, "weekly_schedule"), {
        teacher_id: teacherId,
        day_of_week: dayOfWeek,
        start_time: startTime,
        end_time: endTime,
        subject,
        class_type: classType,
        active,
        student_ids: selectedStudentIds
      });
      navigate("/admin/schedule");
    } catch (err) {
      console.error("Error saving schedule:", err);
      setError(t("errorSavingSchedule"));
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <AdminSidebar active="schedules" />
      <main className="flex-1 p-6">
        <h1 className="text-3xl font-bold mb-4">{t("newSchedule")}</h1>
        {error && <p className="text-red-500 mb-4">{error}</p>}

        <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow space-y-4">

          {/* Teacher */}
          <div>
            <label className="block mb-1 font-medium">{t("teacher")} *</label>
            <select
              value={teacherId}
              onChange={(e) => setTeacherId(e.target.value)}
              className="w-full border p-2 rounded"
            >
              <option value="">{t("selectTeacher")}</option>
              {teachers.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          {/* Day of Week */}
          <div>
            <label className="block mb-1 font-medium">{t("dayOfWeek")}</label>
            <select
              value={dayOfWeek}
              onChange={(e) => setDayOfWeek(e.target.value)}
              className="w-full border p-2 rounded"
            >
              {DAYS.map(day => (
                <option key={day} value={day}>{t(day.toLowerCase())}</option>
              ))}
            </select>
          </div>

          {/* Time */}
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block mb-1 font-medium">{t("startTime")} *</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full border p-2 rounded"
              />
            </div>
            <div className="flex-1">
              <label className="block mb-1 font-medium">{t("endTime")} *</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full border p-2 rounded"
              />
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className="block mb-1 font-medium">{t("subject")}</label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full border p-2 rounded"
            >
              {SUBJECT_OPTIONS.map(sub => (
                <option key={sub} value={sub}>{t(sub.toLowerCase())}</option>
              ))}
            </select>
          </div>

          {/* Active */}
          <div>
            <label className="block mb-1 font-medium">{t("activeStatus")}</label>
            <select
              value={active}
              onChange={(e) => setActive(e.target.value)}
              className="w-full border p-2 rounded"
            >
              <option value="yes">{t("yes")}</option>
              <option value="no">{t("no")}</option>
            </select>
          </div>

          {/* Students */}
          <div>
            <label className="block mb-2 font-medium">{t("selectStudents")}</label>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border p-3 rounded bg-gray-50">
              {students.map(stu => (
                <label key={stu.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedStudentIds.includes(stu.id)}
                    onChange={() => toggleStudent(stu.id)}
                  />
                  {stu.name}
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            {t("createSchedule")}
          </button>
        </form>
      </main>
    </div>
  );
}
