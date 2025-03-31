// TeacherProfile.jsx
import React, { useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { db } from './firebase';
import { query, collection, where, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

const TeacherProfile = () => {
    const [teacher, setTeacher] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const auth = getAuth();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                try {
                    // Query the "teachers" collection by email
                    const q = query(
                        collection(db, "teachers"),
                        where("email", "==", user.email)
                    );
                    const snapshot = await getDocs(q);

                    if (!snapshot.empty) {
                        const doc = snapshot.docs[0];
                        setTeacher({ id: doc.id, ...doc.data() });
                    }
                } catch (error) {
                    console.error("Error fetching teacher data:", error);
                } finally {
                    setLoading(false);
                }
            } else {
                // If not logged in, redirect to /login
                navigate('/login');
            }
        });

        return () => unsubscribe();
    }, [auth, navigate]);

    if (loading) {
        return <p className="p-6">Loading teacher profile...</p>;
    }

    if (!teacher) {
        return <p className="p-6">Teacher profile not found.</p>;
    }

    return (
        <div className="p-6">
            <h1 className="text-2xl font-semibold mb-4">Teacher Profile</h1>
            <div className="bg-white rounded shadow p-6 max-w-md">
                <p className="mb-2"><strong>Name:</strong> {teacher.name}</p>
                <p className="mb-2"><strong>Email:</strong> {teacher.email}</p>
                {teacher.subject_specialties && (
                    <p className="mb-2">
                        <strong>Subjects:</strong> {teacher.subject_specialties.join(", ")}
                    </p>
                )}
                {teacher.experience_years && (
                    <p className="mb-2">
                        <strong>Experience (years):</strong> {teacher.experience_years}
                    </p>
                )}
                {/* Add more fields as needed, for example: assigned_students, etc. */}
            </div>
        </div>
    );
};

export default TeacherProfile;
