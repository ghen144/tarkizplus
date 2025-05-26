import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { db } from "@/firebase/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

const HOURS_RANGE = [13, 14, 15, 16, 17, 18, 19, 20];

function parseHour(timeStr) {
  if (!timeStr) return 0;
  const [hourStr] = timeStr.split(":");
  return parseInt(hourStr, 10) || 0;
}

export function assignLessonsToLanes(lessons) {
  const lanes = [];
  const sorted = [...lessons].sort((a, b) => parseHour(a.start_time) - parseHour(b.start_time));

  sorted.forEach((lesson) => {
    const startIndex = HOURS_RANGE.indexOf(parseHour(lesson.start_time));
    const endIndex = HOURS_RANGE.indexOf(parseHour(lesson.end_time));
    if (startIndex === -1 || endIndex === -1) return;
    const duration = endIndex - startIndex;
    let assigned = false;
    for (let lane of lanes) {
      let free = true;
      for (let i = startIndex; i < endIndex; i++) {
        if (lane[i] !== null) {
          free = false;
          break;
        }
      }
      if (free) {
        lane[startIndex] = { lesson, rowSpan: duration };
        for (let i = startIndex + 1; i < endIndex; i++) {
          lane[i] = "occupied";
        }
        assigned = true;
        break;
      }
    }
    if (!assigned) {
      const newLane = Array(HOURS_RANGE.length).fill(null);
      newLane[startIndex] = { lesson, rowSpan: duration };
      for (let i = startIndex + 1; i < endIndex; i++) {
        newLane[i] = "occupied";
      }
      lanes.push(newLane);
    }
  });

  return lanes;
}

const Modal = ({ onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
    <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-3xl relative max-h-[90vh] overflow-y-auto">
      <button
        onClick={onClose}
        className="absolute top-2 right-2 text-gray-500 hover:text-red-500 text-xl font-bold"
      >
        ×
      </button>
      {children}
    </div>
  </div>
);

const DaySchedule = ({ day, lessons, teacherMap, onLessonClick }) => {
  const { t } = useTranslation();
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [studentStates, setStudentStates] = useState([]);
  const [lessonNotes, setLessonNotes] = useState("");

  useEffect(() => {
    if (selectedLesson && selectedLesson.assigned_students) {
      setStudentStates(
        selectedLesson.assigned_students.map((studentId) => ({
          student_id: studentId,
          present: false,
          progress_evaluation: ""
        }))
      );
      setLessonNotes("");
    }
  }, [selectedLesson]);

  const handleStudentChange = (index, value) => {
    const updated = [...studentStates];
    updated[index].present = value;
    if (!value) updated[index].progress_evaluation = "";
    setStudentStates(updated);
  };

  const handleEvaluationChange = (index, value) => {
    const updated = [...studentStates];
    updated[index].progress_evaluation = value;
    setStudentStates(updated);
  };

  const handleSaveLesson = async () => {
    if (!selectedLesson) return;

    const lessonData = {
      lesson_id: `${selectedLesson.lesson_date}_${selectedLesson.start_time}_${selectedLesson.teacher_id}`,
      teacher_id: selectedLesson.teacher_id,
      subject: selectedLesson.subject,
      class_type: selectedLesson.class_type,
      lesson_date: selectedLesson.lesson_date,
      start_time: selectedLesson.start_time,
      end_time: selectedLesson.end_time,
      timestamp: serverTimestamp(),
      lesson_notes: lessonNotes,
      students: studentStates.filter((s) => s.present).map((s) => ({
        student_id: s.student_id,
        progress_evaluation: s.progress_evaluation
      })),
      present_count: studentStates.filter((s) => s.present).length,
      absent_count: studentStates.filter((s) => !s.present).length
    };

    try {
      await addDoc(collection(db, "lessons"), lessonData);
      alert("Lesson saved successfully!");
      setSelectedLesson(null);
    } catch (error) {
      console.error("Error saving lesson:", error);
    }
  };

  const lanes = assignLessonsToLanes(lessons);

  return (
    <div className="bg-white rounded shadow p-4 m-2">
      <h2 className="text-xl font-bold mb-2 text-center">{t(day.toLowerCase())}</h2>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="border p-1 bg-gray-200">{t("time")}</th>
            {lanes.map((_, laneIndex) => (
              <th key={laneIndex} className="border p-1 bg-gray-200">
                {t("lane")} {laneIndex + 1}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {HOURS_RANGE.map((hour, rowIndex) => (
            <tr key={hour}>
              <td className="border p-1 text-center">{hour}:00</td>
              {lanes.map((lane, laneIndex) => {
                const cell = lane[rowIndex];
                if (cell === "occupied") return null;
                if (cell && cell.lesson) {
                  const { lesson, rowSpan } = cell;
                  const colorClass = subjectColors[lesson.subject] || "bg-gray-200";
                  const teacherName = teacherMap[lesson.teacher_id] || lesson.teacher_id;
                  return (
                    <td
                      key={laneIndex}
                      rowSpan={rowSpan}
                      className={`border p-1 ${colorClass} cursor-pointer`}
                      onClick={() => setSelectedLesson(lesson)}
                    >
                      <p className="text-sm font-bold">{t(lesson.subject.toLowerCase())}</p>
                      <p className="text-xs">{t(lesson.class_type.toLowerCase())}</p>
                      <p className="text-xs italic">{teacherName}</p>
                      <p className="text-xxs">
                        {lesson.start_time} - {lesson.end_time}
                      </p>
                    </td>
                  );
                }
                return <td key={laneIndex} className="border p-1"></td>;
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {selectedLesson && (
        <Modal onClose={() => setSelectedLesson(null)}>
          <h2 className="text-lg font-bold mb-4">{t("add_lesson_instance")}</h2>

          <div className="mb-4">
            <p>{t("subject")}: {t(selectedLesson.subject.toLowerCase())}</p>
            <p>{t("time")}: {selectedLesson.start_time} - {selectedLesson.end_time}</p>
            <p>{t("date")}: {selectedLesson.lesson_date}</p>
            <p>{t("class_type")}: {t(selectedLesson.class_type.toLowerCase())}</p>
          </div>

          <div className="mb-4">
            <label className="block font-semibold mb-1">{t("lesson_notes")}</label>
            <textarea
              className="w-full border rounded p-2"
              placeholder={t("lesson_notes_placeholder")}
              value={lessonNotes}
              onChange={(e) => setLessonNotes(e.target.value)}
            />
          </div>

          <div className="mb-2 font-semibold">{t("select_present_students")}</div>
          <div className="space-y-4">
            {studentStates.map((student, index) => (
              <div key={student.student_id} className="border p-2 rounded">
                <label className="flex items-center gap-2 font-semibold">
                  <input
                    type="checkbox"
                    checked={student.present}
                    onChange={(e) => handleStudentChange(index, e.target.checked)}
                  />
                  {student.student_id}
                </label>

                {student.present && (
                  <div className="mt-2">
                    <label className="block text-sm mb-1">{t("progress_evaluation")}</label>
                    <input
                      type="text"
                      className="w-full border rounded p-1"
                      placeholder={t("progress_placeholder")}
                      value={student.evaluation}
                      onChange={(e) => handleEvaluationChange(index, e.target.value)}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <button
              onClick={() => setSelectedLesson(null)}
              className="bg-gray-200 text-black px-4 py-2 rounded"
            >
              {t("cancel")}
            </button>
            <button
              onClick={handleSaveLesson}
              className="bg-green-600 text-white px-4 py-2 rounded"
            >
              {t("save_lesson")}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default DaySchedule;

export const subjectColors = {
  Math: "bg-green-200",
  English: "bg-blue-200",
  Hebrew: "bg-yellow-200",
  Arabic: "bg-pink-200",
};
