import React, { createContext, useEffect, useState, useContext } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { db } from "@/firebase/firebase.jsx";
import { collection, getDocs, query, where } from "firebase/firestore";

const UserContext = createContext();

export const UserProvider = ({ children }) => {
    const [userName, setUserName] = useState(null);
    const [role, setRole] = useState(null);
    const [loading, setLoading] = useState(true); // optional: useful for app layout gating

    useEffect(() => {
        const auth = getAuth();

        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                try {
                    setLoading(true);

                    // Check admin collection
                    const adminQuery = query(
                        collection(db, "admin"),
                        where("email", "==", user.email)
                    );
                    const adminSnap = await getDocs(adminQuery);

                    if (!adminSnap.empty) {
                        const adminData = adminSnap.docs[0].data();
                        setUserName(adminData.name || "Admin");
                        setRole("admin");
                        return setLoading(false);
                    }

                    // Check teachers collection
                    const teacherQuery = query(
                        collection(db, "teachers"),
                        where("email", "==", user.email)
                    );
                    const teacherSnap = await getDocs(teacherQuery);

                    if (!teacherSnap.empty) {
                        const teacherData = teacherSnap.docs[0].data();
                        setUserName(teacherData.name || "Teacher");
                        setRole("teacher");
                        return setLoading(false);
                    }

                    // Not found in either
                    setUserName("User");
                    setRole("unknown");
                } catch (err) {
                    console.error("Error fetching user data:", err);
                } finally {
                    setLoading(false);
                }
            } else {
                setUserName(null);
                setRole(null);
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, []);

    return (
        <UserContext.Provider value={{ userName, role, loading }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => useContext(UserContext);
