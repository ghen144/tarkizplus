import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

/* ---------- Components / pages ---------- */
import Layout from './components/Layout.jsx';
import LoginPage from './pages/LoginPage.jsx';
import HomePage from './pages/HomePage.jsx';
import StudentsPage from './pages/students/StudentsPage.jsx';
import StudentProfile from './pages/students/StudentProfile.jsx';
import LessonLog from './pages/lessons/LessonLog.jsx';
import AddLesson from './pages/lessons/AddLesson.jsx';
import EditLesson from './pages/lessons/EditLessonOverlay.jsx';
import LessonDetails from './pages/lessons/LessonDetails.jsx';


import AdminHomePage from './pages/admin/AdminHomePage.jsx';
import AdminStudentsPage from './pages/admin/AdminStudentsPage.jsx';
import AddStudentPage from './pages/admin/AddStudentPage.jsx';
import EditStudentPage from './pages/admin/EditStudentPage.jsx';
import AdminTeachersPage from './pages/admin/AdminTeachersPage.jsx';
import AddTeacherPage from './pages/admin/AddTeacherPage.jsx';
import EditTeacherPage from './pages/admin/EditTeacherPage.jsx';
import AdminTeacherSchedules from './pages/admin/AdminTeacherSchedules.jsx';

import AdminExamsPage from './pages/admin/AdminExamsPage.jsx';

import TarkizCompass from './pages/TarkizCompass.jsx';
import ProtectedRoute from './components/common/ProtectedRoute.jsx';

function App() {
    return (
        <Router>
            <Routes>

                {/* ---------- Public (login) ---------- */}
                <Route path="/" element={<LoginPage />} />

                {/* ---------- Everything under Layout needs admin OR teacher ---------- */}
                <Route
                    element={
                        <ProtectedRoute
                            element={<Layout />}
                            allowedRoles={['admin', 'teacher']}
                        />
                    }
                >
                    {/* -------- Shared pages (admin + teacher) -------- */}
                    /* LIST page ─ stays as-is */
                    <Route path="/students" element={<StudentsPage />} />
                    <Route path="/lesson-log/add" element={<AddLesson />} />

                    /* SINGLE-student page ─ keep ONE guarded route */
                    <Route
                        path="/students/:studentId"
                        element={
                            <ProtectedRoute
                                element={<StudentProfile />}
                                allowedRoles={['admin', 'teacher']}   // both roles can open it
                            />
                        }
                    />

                    <Route path="/lesson-log" element={<LessonLog />} />
                    <Route path="/lesson-log/:lessonId/edit" element={<EditLesson />} />
                    <Route path="/lesson-log/:lessonId/details" element={<LessonDetails />} />
                    <Route path="/compass" element={<TarkizCompass />} />

                    {/* -------- Teacher-only -------- */}
                    <Route
                        path="/homepage"
                        element={
                            <ProtectedRoute
                                element={<HomePage />}
                                allowedRoles={['teacher']}
                            />
                        }
                    />


                    {/* -------- Admin-only -------- */}
                    <Route
                        path="/admin/home"
                        element={
                            <ProtectedRoute
                                element={<AdminHomePage />}
                                allowedRoles={['admin']}
                            />
                        }
                    />
                    <Route
                        path="/admin/students"
                        element={
                            <ProtectedRoute
                                element={<AdminStudentsPage />}
                                allowedRoles={['admin']}
                            />
                        }
                    />
                    <Route
                        path="/admin/students/add"
                        element={
                            <ProtectedRoute
                                element={<AddStudentPage />}
                                allowedRoles={['admin']}
                            />
                        }
                    />
                    <Route
                        path="/admin/students/:studentId/edit"
                        element={
                            <ProtectedRoute
                                element={<EditStudentPage />}
                                allowedRoles={['admin']}
                            />
                        }
                    />
                    <Route
                        path="/admin/teachers"
                        element={
                            <ProtectedRoute
                                element={<AdminTeachersPage />}
                                allowedRoles={['admin']}
                            />
                        }
                    />
                    <Route
                        path="/admin/teachers/add"
                        element={
                            <ProtectedRoute
                                element={<AddTeacherPage />}
                                allowedRoles={['admin']}
                            />
                        }
                    />
                    <Route
                        path="/admin/teachers/:teacherId/edit"
                        element={
                            <ProtectedRoute
                                element={<EditTeacherPage />}
                                allowedRoles={['admin']}
                            />
                        }
                    />
                    <Route
                        path="/admin/schedule"
                        element={
                            <ProtectedRoute
                                element={<AdminTeacherSchedules />}
                                allowedRoles={['admin']}
                            />
                        }
                    />


                    <Route
                        path="/admin/exams"
                        element={
                            <ProtectedRoute
                                element={<AdminExamsPage />}
                                allowedRoles={['admin']}
                            />
                        }
                    />
                </Route>

                {/* ---------- Optional friendly 403 ---------- */}
                <Route path="/unauthorized" element={<h1>403 • Not authorised</h1>} />
            </Routes>
        </Router>
    );
}

export default App;
