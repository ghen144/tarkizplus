import React, {useState, useEffect} from "react";
import {db} from "@/firebase/firebase.jsx";
import {
    collection,
    getDocs,
    addDoc,
    doc,
    updateDoc,
    arrayUnion,
    query,
    where
} from "firebase/firestore";
import {getAuth, onAuthStateChanged} from "firebase/auth";
import {useTranslation} from "react-i18next";
import AdminSidebar from "@/components/admin/AdminSidebar.jsx";
import {
    Users,
    User,
    BookOpen,
    ClipboardList,
    PlusCircle,
} from "lucide-react";

import {
    StatCard,
    SubjectChart,
    QuickActionButton,
    ActivityItem,
    ExamModal
} from "@/components/admin";

const AdminHomePage = () => {
    const {t} = useTranslation();
    const [counts, setCounts] = useState({teachers: 0, students: 0, lessons: 0, exams: 0});
    const [recentActivity, setRecentActivity] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showExamModal, setShowExamModal] = useState(false);
    const [examForm, setExamForm] = useState({student_id: "", subject: "", exam_date: "", material: ""});
    const [students, setStudents] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [adminName, setAdminName] = useState("");

    useEffect(() => {
        const fetchAdminName = async () => {
            const auth = getAuth();
            onAuthStateChanged(auth, async (user) => {
                if (user) {
                    const q = query(collection(db, "admin"), where("email", "==", user.email));
                    const snap = await getDocs(q);
                    if (!snap.empty) {
                        setAdminName(snap.docs[0].data().name || "");
                    }
                }
            });
        };

        const fetchData = async () => {
            try {
                const [tSnap, sSnap, lSnap, eSnap] = await Promise.all([
                    getDocs(collection(db, "teachers")),
                    getDocs(collection(db, "students")),
                    getDocs(collection(db, "lessons")),
                    getDocs(collection(db, "exams"))
                ]);

                // Teachers: Only those with active_status === true
                const teachersData = tSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                const activeTeachers = teachersData.filter(t => t.active_status === true);

                setTeachers(teachersData); // You can use all teachers if you need the full list elsewhere
                setStudents(sSnap.docs.map(doc => doc.data()));

                setCounts({
                    teachers: activeTeachers.length, // Only active teachers
                    students: sSnap.size,
                    lessons: lSnap.size,
                    exams: eSnap.size
                });

                const recentLessons = lSnap.docs
                    .sort((a, b) => b.data().lesson_date.toDate() - a.data().lesson_date.toDate())
                    .slice(0, 3)
                    .map(d => {
                        const count = d.data().students?.length || 0;
                        return `${t(d.data().subject)} (${count} ${t('students')}) ${t('lesson_on')} ${d.data().lesson_date.toDate().toLocaleDateString()}`;
                    });

                const recentExams = eSnap.docs
                    .sort((a, b) => b.data().exam_date.toDate() - a.data().exam_date.toDate())
                    .slice(0, 2)
                    .map(d => `${t('exam')}: ${t(d.data().subject)} ${t('on_date')} ${d.data().exam_date.toDate().toLocaleDateString()}`);

                setRecentActivity([...recentLessons, ...recentExams]);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchAdminName();
        fetchData();
    }, [t]);

    const subjectList = ["Math", "Arabic", "English", "Hebrew"];
    const studentSubjectCounts = subjectList.map(subject => ({
        subject: t(subject),
        count: students.filter(s => s.subjects?.includes(subject)).length
    }));
    const teacherSubjectCounts = subjectList.map(subject => ({
        subject: t(subject),
        count: teachers.filter(t => t.subject_specialties?.includes(subject)).length
    }));

    const handleAddExam = async (e) => {
        e.preventDefault();
        try {
            const newExam = {
                student_id: examForm.student_id,
                subject: examForm.subject,
                material: examForm.material,
                exam_date: new Date(examForm.exam_date)
            };
            await addDoc(collection(db, "exams"), newExam);
            await updateDoc(doc(db, "students", examForm.student_id), {
                exams: arrayUnion(newExam)
            });
            alert(t('exam_added'));
            setShowExamModal(false);
            setExamForm({student_id: "", subject: "", exam_date: "", material: ""});
        } catch (err) {
            console.error("Error adding exam:", err);
            alert(t('exam_add_failed'));
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-screen bg-gray-100">
                <AdminSidebar active="home"/>
                <main className="flex-1 p-6 flex items-center justify-center">
                    <p>{t('loading_dashboard')}</p>
                </main>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-gray-50">
            <AdminSidebar active="home"/>
            <main className="flex-1 p-6 space-y-8">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-800">
                            {t("welcome")}, {adminName?.split(" ")[0] || t("admin")}
                        </h1>
                        <p className="text-gray-500">{new Date().toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })}</p>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    <StatCard icon={<Users className="h-6 w-6 text-blue-500"/>} value={counts.teachers}
                              label={t('teachers')} link="/admin/teachers" color="bg-blue-50"/>
                    <StatCard icon={<User className="h-6 w-6 text-green-500"/>} value={counts.students}
                              label={t('students')} link="/admin/students" color="bg-green-50"/>
                    <StatCard icon={<BookOpen className="h-6 w-6 text-orange-500"/>} value={counts.lessons}
                              label={t('lessons')} link="/lesson-log/add" color="bg-orange-50"/>
                    <StatCard icon={<ClipboardList className="h-6 w-6 text-purple-500"/>} value={counts.exams}
                              label={t('exams')} link="/admin/exams" color="bg-purple-50"/>
                </div>
                {/* Main Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    <div className="lg:col-span-2 space-y-5">
                        {/* Quick Actions */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm">
                            <h2 className="text-lg font-semibold text-gray-800 mb-5 border-b pb-2">{t('quick_actions')}</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                                <QuickActionButton icon={<PlusCircle className="h-6 w-6 text-indigo-600"/>}
                                                   label={t('add_teacher')} to="/admin/teachers/add"
                                                   color="bg-indigo-50"/>
                                <QuickActionButton icon={<PlusCircle className="h-6 w-6 text-emerald-600"/>}
                                                   label={t('add_student')} to="/admin/students/add"
                                                   color="bg-emerald-50"/>
                                <QuickActionButton icon={<PlusCircle className="h-6 w-6 text-yellow-600"/>}
                                                   label={t('schedule_lesson')} to="/admin/schedule/new"
                                                   color="bg-yellow-50"/>
                                <QuickActionButton icon={<PlusCircle className="h-6 w-6 text-purple-500"/>}
                                                   label={t('log_exam')} onClick={() => setShowExamModal(true)}
                                                   color="bg-purple-50"/>
                            </div>
                        </div>

                        {/* Charts */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <SubjectChart data={studentSubjectCounts} title={t('students_by_subject')} color="#3B82F6"/>
                            <SubjectChart data={teacherSubjectCounts} title={t('teachers_by_subject')} color="#10B981"/>
                        </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="bg-white p-5 rounded-xl shadow-sm">
                        <h2 className="text-lg font-medium text-gray-800 mb-4">{t('recent_activity')}</h2>
                        <div className="space-y-4">
                            {recentActivity.map((act, i) => <ActivityItem key={i} activity={act}/>)}
                        </div>
                    </div>
                </div>
                {/* Exam Modal */}
                <ExamModal
                    show={showExamModal}
                    onClose={() => setShowExamModal(false)}
                    form={examForm}
                    onSubmit={handleAddExam}
                    onFormChange={setExamForm}
                    t={t}
                />


            </main>
        </div>
    );
};

export default AdminHomePage;
