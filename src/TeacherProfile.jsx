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

const formatDate = (timestamp) => {
    if (timestamp instanceof Timestamp) {
        return timestamp.toDate().toLocaleDateString();
    }
    return 'Unknown Date';
};

const TeacherProfile = () => {
    const [teacher, setTeacher] = useState(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [showStudents, setShowStudents] = useState(false);
    const [studentNames, setStudentNames] = useState([]);
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

    if (loading) return <p className="p-6">Loading teacher profile...</p>;
    if (!teacher) return <p className="p-6">Teacher profile not found.</p>;

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
                        <h1 className="text-3xl font-extrabold text-blue-800">{teacher.name}'s Profile</h1>
                        {!teacherIdParam && (
                            <>
                                <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} className="mt-2" />
                                {uploading && <p>Uploading...</p>}
                            </>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <p><strong>Email:</strong> {teacher.email}</p>
                    <p><strong>Experience:</strong> {teacher.experience_years} years</p>
                    <p><strong>Subjects:</strong> {(teacher.subject_specialties || []).join(", ")}</p>
                    <p><strong>Active Status:</strong> {teacher.active_status ? 'Active' : 'Inactive'}</p>
                    <p><strong>Joining Tarkiz Date:</strong> {formatDate(teacher.joining_tarkiz_date)}</p>
                    <p>
                        <strong>Total Students Assigned:</strong>{" "}
                        <button onClick={handleToggleStudents} className="text-blue-600 underline hover:text-blue-800">
                            {teacher.assigned_students?.length || 0}
                        </button>
                    </p>
                </div>

                {showStudents && (
                    <div className="mt-6 bg-gray-50 p-4 rounded">
                        <h3 className="text-lg font-semibold mb-2">Assigned Students</h3>
                        {studentNames.length > 0 ? (
                            <ul className="list-disc pl-6 space-y-1">
                                {studentNames.map((name, idx) => (
                                    <li key={idx}>{name}</li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-gray-500">No student names found.</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TeacherProfile;
