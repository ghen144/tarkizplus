import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/firebase/firebase.jsx";
import AdminSidebar from "@/components/admin/AdminSidebar.jsx";
import { useTranslation } from "react-i18next";

const EditTeacherSchedule = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [dayOfWeek, setDayOfWeek] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [subject, setSubject] = useState("");
  const [classType, setClassType] = useState("");
  const [active, setActive] = useState("");

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const docRef = doc(db, "weekly_schedule", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setSchedule(data);
          setDayOfWeek(data.day_of_week || "");
          setStartTime(data.start_time || "");
          setEndTime(data.end_time || "");
          setSubject(data.subject || "");
          setClassType(data.class_type || "");
          setActive(data.active || "");
        } else {
          setError(t("scheduleNotFound"));
        }
      } catch (err) {
        console.error("Error fetching schedule:", err);
        setError(t("errorLoadingSchedule"));
      } finally {
        setLoading(false);
      }
    };

    fetchSchedule();
  }, [id, t]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const docRef = doc(db, "weekly_schedule", id);
      await updateDoc(docRef, {
        day_of_week: dayOfWeek,
        start_time: startTime,
        end_time: endTime,
        subject,
        class_type: classType,
        active,
      });
      navigate("/admin/schedule");
    } catch (err) {
      console.error("Error updating schedule:", err);
      setError(t("errorUpdatingSchedule"));
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <p>{t("loadingSchedule")}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <AdminSidebar active="teachers" />
      <main className="flex-1 p-6">
        <h1 className="text-3xl font-bold mb-6">{t("editSchedule")}</h1>
        <form onSubmit={handleUpdate} className="space-y-4 bg-white p-6 rounded shadow">
          <div>
            <label className="block font-medium mb-1">{t("dayOfWeek")}</label>
            <input
              type="text"
              value={dayOfWeek}
              onChange={(e) => setDayOfWeek(e.target.value)}
              className="w-full border rounded p-2"
              placeholder={t("dayPlaceholder")}
            />
          </div>
          <div>
            <label className="block font-medium mb-1">{t("startTime")}</label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full border rounded p-2"
            />
          </div>
          <div>
            <label className="block font-medium mb-1">{t("endTime")}</label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full border rounded p-2"
            />
          </div>
          <div>
            <label className="block font-medium mb-1">{t("subject")}</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full border rounded p-2"
              placeholder={t("subjectPlaceholder")}
            />
          </div>
          <div>
            <label className="block font-medium mb-1">{t("classType")}</label>
            <input
              type="text"
              value={classType}
              onChange={(e) => setClassType(e.target.value)}
              className="w-full border rounded p-2"
              placeholder={t("classTypePlaceholder")}
            />
          </div>
          <div>
            <label className="block font-medium mb-1">{t("activeStatus")}</label>
            <select
              value={active}
              onChange={(e) => setActive(e.target.value)}
              className="w-full border rounded p-2"
            >
              <option value="">{t("select")}</option>
              <option value="yes">{t("yes")}</option>
              <option value="no">{t("no")}</option>
            </select>
          </div>
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            {t("saveChanges")}
          </button>
        </form>
      </main>
    </div>
  );
};

export default EditTeacherSchedule;
