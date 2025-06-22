import React, { useEffect, useRef, useState } from "react";
import { collection, getDocs, doc, updateDoc, addDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/firebase/firebase.jsx";
import AdminSidebar from "@/components/admin/AdminSidebar.jsx";
import { useTranslation } from "react-i18next";

// Config
const ROW_SKELETONS = 6;
const SUBJECTS = [
  { value: "Math", color: "bg-[#e8f0fe] text-[#3464f6]" },
  { value: "English", color: "bg-[#f3e8fe] text-[#a346f6]" },
  { value: "Hebrew", color: "bg-[#e8fee8] text-[#34f646]" },
  { value: "Arabic", color: "bg-[#fefee8] text-[#b1ae1f]" }
];

const AdminExamsPage = () => {
  const { t } = useTranslation();
  const [exams, setExams] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  const [subjectFilter, setSubjectFilter] = useState("");
  const [sortByDate, setSortByDate] = useState("desc");
  const [searchName, setSearchName] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeRow, setActiveRow] = useState(-1);
  const tableRef = useRef(null);

  // Toast (success/error message)
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  function showToast(message, type = "success") {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type }), 2100);
  }

  // Edit Modal
  const [editExam, setEditExam] = useState(null);
  const [editForm, setEditForm] = useState({});
  // Add Modal
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    student_id: "",
    subject: "",
    exam_date: "",
    material: ""
  });

  // Fetch Data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const examsSnap = await getDocs(collection(db, "exams"));
        const studentsSnap = await getDocs(collection(db, "students"));
        const examsData = examsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const studentsData = studentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setExams(examsData);
        setStudents(studentsData);
      } catch (err) {
        showToast("Error fetching data", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Helpers
  const getStudentName = (studentId) => {
    const student = students.find(s => s.student_id === studentId);
    return student?.name || studentId;
  };

  const filteredExams = exams
      .filter(e => !subjectFilter || e.subject === subjectFilter)
      .filter(e => {
        const studentName = getStudentName(e.student_id);
        return studentName?.toLowerCase().includes(searchName.toLowerCase());
      })
      .sort((a, b) => {
        const dateA = a.exam_date?.seconds || 0;
        const dateB = b.exam_date?.seconds || 0;
        return sortByDate === "asc" ? dateA - dateB : dateB - dateA;
      });

  const matchingStudents = students.filter(s =>
      s.name?.toLowerCase().includes(searchName.toLowerCase()) && searchName
  ).slice(0, 5);

  // Edit modal open
  const openEdit = (exam) => {
    setEditExam(exam);
    setEditForm({
      student_id: exam.student_id,
      subject: exam.subject,
      exam_date: exam.exam_date?.seconds
          ? new Date(exam.exam_date.seconds * 1000).toISOString().split("T")[0]
          : "",
      material: exam.material || "",
    });
  };

  // Edit modal save
  const handleEditSave = async () => {
    if (!editExam) return;
    setExams((prev) =>
        prev.map((ex) =>
            ex.id === editExam.id
                ? {
                  ...ex,
                  student_id: editForm.student_id,
                  subject: editForm.subject,
                  exam_date: { seconds: Math.floor(new Date(editForm.exam_date).getTime() / 1000) },
                  material: editForm.material,
                }
                : ex
        )
    );
    try {
      const examRef = doc(db, "exams", editExam.id);
      await updateDoc(examRef, {
        student_id: editForm.student_id,
        subject: editForm.subject,
        exam_date: new Date(editForm.exam_date),
        material: editForm.material,
      });
      showToast("Exam updated successfully!", "success");
    } catch (e) {
      showToast("Error updating exam: " + e.message, "error");
    }
    setEditExam(null);
  };

  // Add modal save
  const handleAddSave = async () => {
    if (!addForm.student_id || !addForm.subject || !addForm.exam_date) {
      showToast("Please fill all required fields", "error");
      return;
    }
    try {
      const newExam = {
        student_id: addForm.student_id,
        subject: addForm.subject,
        exam_date: new Date(addForm.exam_date),
        material: addForm.material
      };
      const docRef = await addDoc(collection(db, "exams"), newExam);
      setExams(exams => [
        ...exams,
        { ...newExam, id: docRef.id, exam_date: { seconds: Math.floor(new Date(addForm.exam_date).getTime() / 1000) } }
      ]);
      setAddModalOpen(false);
      setAddForm({ student_id: "", subject: "", exam_date: "", material: "" });
      showToast("Exam added successfully!", "success");
    } catch (err) {
      showToast("Error adding exam: " + err.message, "error");
    }
  };

  // Delete Exam
  const handleDelete = async (exam) => {
    if (!window.confirm("Are you sure you want to delete this exam?")) return;
    try {
      await deleteDoc(doc(db, "exams", exam.id));
      setExams(exams => exams.filter(e => e.id !== exam.id));
      showToast("Exam deleted successfully!", "success");
    } catch (e) {
      showToast("Error deleting exam: " + e.message, "error");
    }
  };

  // Add Exam button handler
  const handleAddExam = () => {
    setAddForm({
      student_id: students[0]?.student_id || "",
      subject: SUBJECTS[0]?.value || "",
      exam_date: "",
      material: ""
    });
    setAddModalOpen(true);
  };

  return (
      <div className="flex min-h-screen bg-gradient-to-tr from-[#eef5ff] via-[#f5f5fc] to-[#e6f3fc]">
        <AdminSidebar active="exams" />
        <main className="flex-1 p-6 relative">

          {/* Toast Message */}
          {toast.show && (
              <div className={`
            fixed top-8 left-1/2 transform -translate-x-1/2 z-50
            px-8 py-3 rounded-full shadow-lg text-white text-lg font-semibold
            transition-all duration-300
            ${toast.type === "success" ? "bg-green-500" : "bg-red-500"}
          `}>
                {toast.message}
              </div>
          )}

          {/* Add Exam Button */}
          <button
              onClick={handleAddExam}
              className="absolute right-10 top-8 bg-[#4f8cff] hover:bg-[#3464f6] text-white px-5 py-2 rounded-xl shadow font-bold transition-all z-10"
          >
            + {t("add_exam") || "Add Exam"}
          </button>
          <div className="-m-6 p-6 min-h-screen">
            <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
              <span role="img" aria-label="exam">📝</span>
              {t("all_exams")}
            </h1>
            {/* Filters */}
            <div className="flex flex-wrap gap-4 mb-4 bg-white bg-opacity-70 p-4 rounded-xl shadow-sm">
              <div className="relative">
                <input
                    type="text"
                    placeholder={t("search_student")}
                    className="border px-4 py-2 rounded focus:outline-blue-300"
                    value={searchName}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 100)}
                    onChange={(e) => setSearchName(e.target.value)}
                />
                {showSuggestions && matchingStudents.length > 0 && (
                    <ul className="absolute z-10 bg-white border shadow w-full rounded mt-1">
                      {matchingStudents.map((s) => (
                          <li
                              key={s.id}
                              className="px-3 py-2 hover:bg-blue-50 cursor-pointer"
                              onMouseDown={() => {
                                setSearchName(s.name);
                                setShowSuggestions(false);
                              }}
                          >
                            {s.name}
                          </li>
                      ))}
                    </ul>
                )}
              </div>
              <select
                  className="border px-4 py-2 rounded focus:outline-blue-300"
                  value={subjectFilter}
                  onChange={(e) => setSubjectFilter(e.target.value)}
              >
                <option value="">{t("all_subjects")}</option>
                {SUBJECTS.map(sub =>
                    <option key={sub.value} value={sub.value}>
                      {t(sub.value.toLowerCase())}
                    </option>
                )}
              </select>
              <button
                  className="border px-4 py-2 rounded flex items-center font-semibold hover:bg-blue-50 transition"
                  onClick={() => setSortByDate(sortByDate === "asc" ? "desc" : "asc")}
              >
                {sortByDate === "asc" ? t("nearest_first") : t("farthest_first")}
                <span className="inline-block ml-2">{sortByDate === "asc" ? "▲" : "▼"}</span>
              </button>
            </div>
            {/* Table Card */}
            <div className="overflow-x-auto">
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <table className="min-w-full">
                  <thead className="bg-[#f5f8fa]">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">{t("student_name")}</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">{t("subject")}</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">{t("exam_date")}</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">{t("material")}</th>
                    <th className="px-3 py-3"></th>
                  </tr>
                  </thead>
                  <tbody>
                  {loading
                      ? [...Array(ROW_SKELETONS)].map((_, idx) => (
                          <tr key={idx} className="animate-pulse">
                            <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                            <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
                            <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
                            <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-32"></div></td>
                            <td></td>
                          </tr>
                      ))
                      : filteredExams.length === 0
                          ? (
                              <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                  <div className="flex flex-col items-center text-lg">
                                    <span className="text-4xl mb-2">🗂️</span>
                                    {t("no_exams_found") || "No exams found."}
                                  </div>
                                </td>
                              </tr>
                          )
                          : filteredExams.map((exam) => (
                              <tr
                                  key={exam.id}
                                  className={`
                            border-b
                            transition-all duration-200
                            group
                            hover:bg-[#f0f6ff]
                            rounded-xl
                          `}
                              >
                                <td className="px-6 py-4 font-medium">{getStudentName(exam.student_id)}</td>
                                <td className="px-6 py-4">
                            <span className={`
                              px-3 py-1 rounded-full text-xs font-semibold
                              ${SUBJECTS.find(s => s.value === exam.subject)?.color || "bg-gray-100 text-gray-700"}
                            `}>
                              {t(exam.subject?.toLowerCase())}
                            </span>
                                </td>
                                <td className="px-6 py-4">
                                  {exam.exam_date?.seconds
                                      ? new Date(exam.exam_date.seconds * 1000).toLocaleDateString()
                                      : "—"}
                                </td>
                                <td className="px-6 py-4 whitespace-pre-line">{exam.material || "—"}</td>
                                {/* Actions */}
                                <td className="px-3 py-4 flex gap-2">
                                  <button
                                      className="px-4 py-2 rounded-xl font-bold shadow-sm transition bg-[#fff9c6] text-[#a06b00] hover:bg-[#fff7b0]"

                                      onClick={() => openEdit(exam)}
                                  >
                                    {t("edit") || "Edit"}
                                  </button>
                                  <button
                                      className="px-3 py-1 rounded-lg bg-[#fde8e8] hover:bg-[#f6bbbb] text-[#d93025] font-bold shadow-sm transition"
                                      onClick={() => handleDelete(exam)}
                                  >
                                    {t("delete") || "Delete"}
                                  </button>
                                </td>
                              </tr>
                          ))
                  }
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Edit Modal */}
          {editExam && (
              <div className="fixed inset-0 z-30 flex items-center justify-center bg-black bg-opacity-30">
                <div className="bg-white rounded-2xl shadow-2xl p-8 w-[95vw] max-w-lg relative">
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                    <span role="img" aria-label="edit">✏️</span> {t("edit_exam") || "Edit Exam"}
                  </h2>
                  <div className="mb-4">
                    <label className="block text-sm mb-1">{t("student_name")}</label>
                    <select
                        className="border px-3 py-2 rounded w-full"
                        value={editForm.student_id}
                        onChange={e => setEditForm(f => ({ ...f, student_id: e.target.value }))}
                    >
                      {students.map(st => (
                          <option key={st.student_id} value={st.student_id}>
                            {st.name}
                          </option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm mb-1">{t("subject")}</label>
                    <select
                        className="border px-3 py-2 rounded w-full"
                        value={editForm.subject}
                        onChange={e => setEditForm(f => ({ ...f, subject: e.target.value }))}
                    >
                      {SUBJECTS.map(sub =>
                          <option key={sub.value} value={sub.value}>{t(sub.value.toLowerCase())}</option>
                      )}
                    </select>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm mb-1">{t("exam_date")}</label>
                    <input
                        type="date"
                        className="border px-3 py-2 rounded w-full"
                        value={editForm.exam_date}
                        onChange={e => setEditForm(f => ({ ...f, exam_date: e.target.value }))}
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm mb-1">{t("material")}</label>
                    <input
                        type="text"
                        className="border px-3 py-2 rounded w-full"
                        value={editForm.material}
                        onChange={e => setEditForm(f => ({ ...f, material: e.target.value }))}
                    />
                  </div>
                  <div className="flex justify-end gap-4 mt-6">
                    <button
                        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded font-semibold"
                        onClick={() => setEditExam(null)}
                    >
                      {t("cancel") || "Cancel"}
                    </button>
                    <button
                        className="px-4 py-2 bg-[#4f8cff] hover:bg-[#3464f6] text-white rounded font-semibold"
                        onClick={handleEditSave}
                    >
                      {t("save") || "Save"}
                    </button>
                  </div>
                </div>
              </div>
          )}

          {/* Add Modal */}
          {addModalOpen && (
              <div className="fixed inset-0 z-30 flex items-center justify-center bg-black bg-opacity-30">
                <div className="bg-white rounded-2xl shadow-2xl p-8 w-[95vw] max-w-lg relative">
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                    <span role="img" aria-label="add">➕</span> {t("add_exam") || "Add Exam"}
                  </h2>
                  <div className="mb-4">
                    <label className="block text-sm mb-1">{t("student_name")}</label>
                    <select
                        className="border px-3 py-2 rounded w-full"
                        value={addForm.student_id}
                        onChange={e => setAddForm(f => ({ ...f, student_id: e.target.value }))}
                    >
                      {students.map(st => (
                          <option key={st.student_id} value={st.student_id}>{st.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm mb-1">{t("subject")}</label>
                    <select
                        className="border px-3 py-2 rounded w-full"
                        value={addForm.subject}
                        onChange={e => setAddForm(f => ({ ...f, subject: e.target.value }))}
                    >
                      {SUBJECTS.map(sub =>
                          <option key={sub.value} value={sub.value}>{t(sub.value.toLowerCase())}</option>
                      )}
                    </select>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm mb-1">{t("exam_date")}</label>
                    <input
                        type="date"
                        className="border px-3 py-2 rounded w-full"
                        value={addForm.exam_date}
                        onChange={e => setAddForm(f => ({ ...f, exam_date: e.target.value }))}
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm mb-1">{t("material")}</label>
                    <input
                        type="text"
                        className="border px-3 py-2 rounded w-full"
                        value={addForm.material}
                        onChange={e => setAddForm(f => ({ ...f, material: e.target.value }))}
                    />
                  </div>
                  <div className="flex justify-end gap-4 mt-6">
                    <button
                        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded font-semibold"
                        onClick={() => setAddModalOpen(false)}
                    >
                      {t("cancel") || "Cancel"}
                    </button>
                    <button
                        className="px-4 py-2 bg-[#4f8cff] hover:bg-[#3464f6] text-white rounded font-semibold"
                        onClick={handleAddSave}
                    >
                      {t("save") || "Save"}
                    </button>
                  </div>
                </div>
              </div>
          )}
        </main>
      </div>
  );
};

export default AdminExamsPage;
