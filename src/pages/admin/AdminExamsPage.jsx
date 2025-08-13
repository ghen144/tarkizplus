import React, { useEffect, useState } from "react";
import { collection, getDocs, doc, updateDoc, addDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/firebase/firebase.jsx";
import { useTranslation } from "react-i18next";
import IconButton from "@/components/common/IconButton.jsx";
import { Plus, ArrowUp, ArrowDown, FolderOpen } from "lucide-react";

const ROW_SKELETONS = 6;
const SUBJECTS = [
  { value: "Math", color: "bg-[#f1f4fb] text-[#4a5d8c]" },
  { value: "English", color: "bg-[#f6f1fb] text-[#6a4a8c]" },
  { value: "Hebrew", color: "bg-[#f1fbf1] text-[#4a8c5d]" },
  { value: "Arabic", color: "bg-[#fbfbf1] text-[#8c8a4a]" }
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

  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  function showToast(message, type = "success") {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type }), 2100);
  }

  const [editExam, setEditExam] = useState(null);
  const [editForm, setEditForm] = useState({});

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    student_id: "",
    subject: "",
    exam_date: "",
    material: ""
  });

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

  const matchingStudents = students
      .filter(s => s.name?.toLowerCase().includes(searchName.toLowerCase()) && searchName)
      .slice(0, 5);

  const openEdit = (exam) => {
    setEditExam(exam);
    setEditForm({
      student_id: exam.student_id,
      subject: exam.subject,
      exam_date: exam.exam_date?.seconds
          ? new Date(exam.exam_date.seconds * 1000).toISOString().split("T")[0]
          : "",
      material: exam.material || ""
    });
  };

  const handleEditSave = async () => {
    if (!editExam) return;
    setExams(prev =>
        prev.map(ex =>
            ex.id === editExam.id
                ? {
                  ...ex,
                  student_id: editForm.student_id,
                  subject: editForm.subject,
                  exam_date: { seconds: Math.floor(new Date(editForm.exam_date).getTime() / 1000) },
                  material: editForm.material
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
        material: editForm.material
      });
      showToast("Exam updated successfully!", "success");
    } catch (e) {
      showToast("Error updating exam: " + e.message, "error");
    }
    setEditExam(null);
  };

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
      <div className="p-6">
        {toast.show && (
            <div
                className={`fixed top-8 left-1/2 transform -translate-x-1/2 z-50 px-8 py-3 rounded-full shadow-lg text-white text-lg font-semibold transition-all duration-300 ${
                    toast.type === "success" ? "bg-green-500" : "bg-red-500"
                }`}
            >
              {toast.message}
            </div>
        )}

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">{t("all_exams")}</h2>
          <IconButton color="blue" onClick={handleAddExam}>
            <Plus size={16} />
            {t("add_exam")}
          </IconButton>
        </div>

        <div className="flex flex-wrap gap-4 mb-6">
          <div className="relative">
            <input
                type="text"
                placeholder={t("search_student")}
                className="border px-4 py-2 rounded w-64"
                value={searchName}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 100)}
                onChange={e => setSearchName(e.target.value)}
            />
            {showSuggestions && matchingStudents.length > 0 && (
                <ul className="absolute z-10 bg-white border shadow w-full rounded mt-1">
                  {matchingStudents.map(s => (
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
              className="border px-4 py-2 rounded text-sm"
              value={subjectFilter}
              onChange={e => setSubjectFilter(e.target.value)}
          >
            <option value="">{t("all_subjects")}</option>
            {SUBJECTS.map(sub => (
                <option key={sub.value} value={sub.value}>
                  {t(sub.value.toLowerCase())}
                </option>
            ))}
          </select>

          <button
              className="border px-4 py-2 rounded flex items-center font-semibold hover:bg-blue-50 transition"
              onClick={() => setSortByDate(sortByDate === "asc" ? "desc" : "asc")}
          >
            {sortByDate === "asc" ? t("nearest_first") : t("farthest_first")}
            {sortByDate === "asc" ? <ArrowUp size={16} className="ml-2" /> : <ArrowDown size={16} className="ml-2" />}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded shadow">
            <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">{t("student_name")}</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">{t("subject")}</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">{t("exam_date")}</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">{t("material")}</th>
              <th className="px-3 py-3"></th>
            </tr>
            </thead>
            <tbody>
            {loading
                ? [...Array(ROW_SKELETONS)].map((_, idx) => (
                    <tr key={idx} className="animate-pulse border-b">
                      <td className="px-6 py-4">
                        <div className="h-4 bg-gray-200 rounded w-24"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 bg-gray-200 rounded w-16"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 bg-gray-200 rounded w-20"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 bg-gray-200 rounded w-32"></div>
                      </td>
                      <td></td>
                    </tr>
                ))
                : filteredExams.length === 0
                    ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                            <div className="flex flex-col items-center text-lg">
                              <FolderOpen size={40} className="mb-2 text-gray-400" />
                              {t("no_exams_found") || "No exams found."}
                            </div>
                          </td>
                        </tr>
                    )
                    : filteredExams.map(exam => (
                        <tr key={exam.id} className="hover:bg-gray-50 border-b">
                          <td className="px-6 py-4 font-medium">{getStudentName(exam.student_id)}</td>
                          <td className="px-6 py-4">
                      <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              SUBJECTS.find(s => s.value === exam.subject)?.color || "bg-gray-100 text-gray-700"
                          }`}
                      >
                        {t(exam.subject?.toLowerCase())}
                      </span>
                          </td>
                          <td className="px-6 py-4">
                            {exam.exam_date?.seconds ? new Date(exam.exam_date.seconds * 1000).toLocaleDateString() : "—"}
                          </td>
                          <td className="px-6 py-4 whitespace-pre-line">{exam.material || "—"}</td>
                          <td className="px-3 py-4 flex gap-2">


                            <IconButton
                                color="yellow"
                                label={t("edit")}
                                onClick={(e) => {openEdit(exam)
                                }}
                            />

                            <IconButton
                                color="red"
                                label={t("delete")}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(exam);
                                }}
                            />
                          </td>
                        </tr>
                    ))}
            </tbody>
          </table>
        </div>

        {editExam && (
            <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/30">
              <div className="bg-white rounded-2xl shadow-2xl p-8 w-[95vw] max-w-lg">
                <h2 className="text-2xl font-bold mb-4">{t("edit_exam") || "Edit Exam"}</h2>
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
                    {SUBJECTS.map(sub => (
                        <option key={sub.value} value={sub.value}>
                          {t(sub.value.toLowerCase())}
                        </option>
                    ))}
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
                  <button className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded font-semibold" onClick={() => setEditExam(null)}>
                    {t("cancel") || "Cancel"}
                  </button>
                  <button
                      className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded font-semibold"
                      onClick={handleEditSave}
                  >
                    {t("save") || "Save"}
                  </button>
                </div>
              </div>
            </div>
        )}

        {addModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/30">
              <div className="bg-white rounded-2xl shadow-2xl p-8 w-[95vw] max-w-lg">
                <h2 className="text-2xl font-bold mb-4">{t("add_exam") || "Add Exam"}</h2>
                <div className="mb-4">
                  <label className="block text-sm mb-1">{t("student_name")}</label>
                  <select
                      className="border px-3 py-2 rounded w-full"
                      value={addForm.student_id}
                      onChange={e => setAddForm(f => ({ ...f, student_id: e.target.value }))}
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
                      value={addForm.subject}
                      onChange={e => setAddForm(f => ({ ...f, subject: e.target.value }))}
                  >
                    {SUBJECTS.map(sub => (
                        <option key={sub.value} value={sub.value}>
                          {t(sub.value.toLowerCase())}
                        </option>
                    ))}
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
                      className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded font-semibold"
                      onClick={handleAddSave}
                  >
                    {t("save") || "Save"}
                  </button>
                </div>
              </div>
            </div>
        )}
      </div>
  );
};

export default AdminExamsPage;
