// EnhancedTeacherProfile.jsx
import React, { useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { db } from './firebase';
import { query, collection, where, getDocs, Timestamp, doc, updateDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { useNavigate } from "react-router-dom";

const formatDate = (timestamp) => {
    if (timestamp instanceof Timestamp) {
        const date = timestamp.toDate();
        return date.toLocaleDateString();
    }
    return "Unknown Date";
};

const EnhancedTeacherProfile = () => {
    const [teacher, setTeacher] = useState(null);
    const [loading, setLoading] = useState(true);
    const [totalStudents, setTotalStudents] = useState(0);
    const [uploading, setUploading] = useState(false);
    const navigate = useNavigate();
    const auth = getAuth();
    const storage = getStorage();

    useEffect(() => {
        const fetchTeacherData = async (user) => {
            try {
                const q = query(
                    collection(db, "teachers"),
                    where("email", "==", user.email)
                );
                const snapshot = await getDocs(q);

                if (!snapshot.empty) {
                    const doc = snapshot.docs[0];
                    const teacherData = { id: doc.id, ...doc.data() };
                    setTeacher(teacherData);

                    // Calculate total students assigned
                    const assignedStudents = Array.isArray(teacherData.assigned_students) ? teacherData.assigned_students.length : 0;
                    setTotalStudents(assignedStudents);
                }
            } catch (error) {
                console.error("Error fetching teacher data:", error);
            } finally {
                setLoading(false);
            }
        };

        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                fetchTeacherData(user);
            } else {
                navigate('/login');
            }
        });

        return () => unsubscribe();
    }, [auth, navigate]);

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
                console.log("Image uploaded successfully:", downloadURL);

                try {
                    // Save the URL to Firestore
                    const teacherDocRef = doc(db, "teachers", teacher.id);
                    await updateDoc(teacherDocRef, { profilePicture: downloadURL });

                    // Update local state
                    setTeacher(prev => ({ ...prev, profilePicture: downloadURL }));
                } catch (error) {
                    console.error("Error saving profile picture to Firestore:", error);
                }

                setUploading(false);
            }
        );
    };

    if (loading) {
        return <p className="p-6">Loading teacher profile...</p>;
    }

    if (!teacher) {
        return <p className="p-6">Teacher profile not found.</p>;
    }

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
                        <h1 className="text-4xl font-extrabold text-blue-800">{teacher.name}'s Profile</h1>
                        <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} className="mt-2" />
                        {uploading && <p>Uploading...</p>}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                        <p className="text-lg"><strong>Email:</strong> {teacher.email}</p>
                        <p className="text-lg"><strong>Experience:</strong> {teacher.experience_years} years</p>
                        <p className="text-lg"><strong>Active Status:</strong> {teacher.active_status ? 'Active' : 'Inactive'}</p>
                        <p className="text-lg"><strong>Joining Tarkiz Date:</strong> {formatDate(teacher.joining_tarkiz_date)}</p>
                        <p className="text-lg"><strong>Total Students Assigned:</strong> {totalStudents}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EnhancedTeacherProfile;
