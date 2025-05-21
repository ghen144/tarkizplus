import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { db } from './firebase';
import {
  query, collection, where, getDocs, Timestamp,
  doc, updateDoc
} from 'firebase/firestore';
import {
  getStorage, ref, uploadBytesResumable, getDownloadURL
} from 'firebase/storage';
import { useTranslation } from 'react-i18next';

const formatDate = (timestamp) => {
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate().toLocaleDateString();
  }
  return 'Unknown Date';
};

const TeacherProfile = () => {
  const { t } = useTranslation();
  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showStudents, setShowStudents] = useState(false);
  const [studentNames, setStudentNames] = useState([]);
  const [hoursThisMonth, setHoursThisMonth] = useState(null);

  const auth = getAuth();
  const storage = getStorage();
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const teacherIdParam = queryParams.get('teacherId');

  useEffect(() => {
    const fetchById = async (id) => {
      try {
        const snapshot = await getDocs(
          query(collection(db, "teachers"), where("teacher_id", "==", id))
        );
        if (!snapshot.empty) {
          const docData = snapshot.docs[0];
          const teacherData = { id: docData.id, ...docData.data() };
          setTeacher(teacherData);
        }
      } catch (error) {
        console.error("Error fetching by ID:", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchByEmail = async (email) => {
      try {
        const q = query(collection(db, "teachers"), where("email", "==", email));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const doc = snapshot.docs[0];
          const teacherData = { id: doc.id, ...doc.data() };
          setTeacher(teacherData);
        }
      } catch (error) {
        console.error("Error fetching by email:", error);
      } finally {
        setLoading(false);
      }
    };

    if (teacherIdParam) {
      fetchById(teacherIdParam);
    } else {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
          fetchByEmail(user.email);
        } else {
          navigate('/login');
        }
      });
      return () => unsubscribe();
    }
  }, [auth, navigate, teacherIdParam]);

  useEffect(() => {
    const getTeacherHoursThisMonth = async () => {
      if (!teacher?.teacher_id) return;
      const now = new Date();
      const fromDate = new Date(now.getFullYear(), now.getMonth(), 1);

      const lessonsRef = collection(db, "lessons");
      const q = query(
        lessonsRef,
        where("teacher_id", "==", teacher.teacher_id),
        where("lesson_date", ">=", Timestamp.fromDate(fromDate))
      );

      const snapshot = await getDocs(q);
      let totalMinutes = 0;

      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.lesson_date && data.duration_minutes) {
          const lessonDate = data.lesson_date.toDate();
          if (
            lessonDate.getFullYear() === now.getFullYear() &&
            lessonDate.getMonth() === now.getMonth()
          ) {
            totalMinutes += Number(data.duration_minutes);
          }
        }
      });

      setHoursThisMonth((totalMinutes / 60).toFixed(1));
    };

    getTeacherHoursThisMonth();
  }, [teacher]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file || !teacher) return;

    setUploading(true);
    const storageRef = ref(storage, `profilePictures/${teacher.id}/${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      "state_changed",
      null,
      (error) => {
        console.error("Image upload failed:", error);
        setUploading(false);
      },
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        try {
          await updateDoc(doc(db, "teachers", teacher.id), {
            profilePicture: downloadURL,
          });
          setTeacher(prev => ({ ...prev, profilePicture: downloadURL }));
        } catch (err) {
          console.error("Error updating image:", err);
        }
        setUploading(false);
      }
    );
  };

  const fetchStudentNames = async () => {
    if (!teacher?.assigned_students?.length) return;
    try {
      const studentsRef = collection(db, "students");
      const q = query(studentsRef, where("student_id", "in", teacher.assigned_students));
      const snapshot = await getDocs(q);
      const names = snapshot.docs.map(doc => doc.data().name);
      setStudentNames(names);
    } catch (err) {
      console.error("Error fetching student names:", err);
    }
  };

  const handleToggleStudents = () => {
    if (!showStudents) fetchStudentNames();
    setShowStudents(!showStudents);
  };

  if (loading) return <p className="p-6">{t("loading")}</p>;
  if (!teacher) return <p className="p-6">{t("not_found")}</p>;

  return (
    <div className="p-6 space-y-6">
      <div className="p-6 bg-white rounded-2xl shadow-lg">
        <div className="flex items-center space-x-6 mb-6">
          <img
            src={teacher.profilePicture || "https://www.gravatar.com/avatar?d=mp&s=100"}
            alt={`${teacher.name}'s profile`}
            className="w-20 h-20 rounded-full border-2 border-gray-300"
          />
          <div>
            <h1 className="text-3xl font-extrabold text-blue-800">
              {teacher.name} – {t("profile")}
            </h1>
            {!teacherIdParam && (
              <>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploading}
                  className="mt-2"
                />
                {uploading && <p>{t("uploading")}</p>}
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <p><strong>{t("email")}:</strong> {teacher.email}</p>
          <p><strong>{t("experience")}:</strong> {teacher.experience_years} {t("years")}</p>
          <p><strong>{t("subjects")}:</strong> {(teacher.subject_specialties || []).map(s => t(s)).join(", ")}</p>
          <p><strong>{t("status")}:</strong> {teacher.active_status ? t("active") : t("inactive")}</p>
          <p><strong>{t("joining_date")}:</strong> {formatDate(teacher.joining_tarkiz_date)}</p>
          <p>
            <strong>{t("total_students")}:</strong>{" "}
            <button
              onClick={handleToggleStudents}
              className="text-blue-600 underline hover:text-blue-800"
            >
              {teacher.assigned_students?.length || 0}
            </button>
          </p>
          <p><strong>{t("hours_this_month")}:</strong> {hoursThisMonth ?? "-"} {t("hours_unit")}</p>
        </div>

        {showStudents && (
          <div className="mt-6 bg-gray-50 p-4 rounded">
            <h3 className="text-lg font-semibold mb-2">{t("assigned_students")}</h3>
            {studentNames.length > 0 ? (
              <ul className="list-disc pl-6 space-y-1">
                {studentNames.map((name, idx) => (
                  <li key={idx}>{name}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">{t("no_students_found")}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherProfile;
