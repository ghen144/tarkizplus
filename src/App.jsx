import {BrowserRouter as Router, Routes, Route} from 'react-router-dom';
import Layout from './components/Layout.jsx';
import LoginPage from './pages/LoginPage.jsx';
import HomePage from './pages/HomePage.jsx';
import StudentsPage from './pages/students/StudentsPage.jsx';
import StudentProfile from './pages/students/StudentProfile.jsx';
import LessonLog from './pages/lessons/LessonLog.jsx';
import AddLesson from './pages/lessons/AddLesson.jsx';
import EditLesson from './pages/lessons/EditLessonOverlay.jsx';
import TeacherProfile from './pages/TeacherProfile.jsx';
import AppSettings from './pages/AppSettings.jsx';
import LessonDetails from './pages/lessons/LessonDetails.jsx';
import AdminStudentsPage from './pages/admin/AdminStudentsPage.jsx';
import AddStudentPage from './pages/admin/AddStudentPage.jsx';
import AdminHomePage from './pages/admin/AdminHomePage.jsx';
import EditTeacherSchedule from './pages/schedules/EditTeacherSchedule.jsx';
import AdminTeacherSchedules from './pages/admin/AdminTeacherSchedules.jsx';
import NewSchedule from './pages/NewSchedule.jsx';
import AdminTeachersPage from './pages/admin/AdminTeachersPage.jsx';
import AddTeacherPage from './pages/admin/AddTeacherPage.jsx';
import EditStudentPage from './pages/admin/EditStudentPage.jsx';
import EditTeacherPage from './pages/admin/EditTeacherPage.jsx';
import AdminExamsPage from "./pages/admin/AdminExamsPage.jsx";
import TarkizCompass from "./pages/TarkizCompass.jsx";
import ChatWidget from './components/common/ChatWidget';
import ProtectedRoute from './components/common/ProtectedRoute';

import {useTranslation} from 'react-i18next';


function App() {
    const {i18n} = useTranslation();

    return (
        <Router>
            <Routes>
                {/* Login route (no layout) */}
                <Route path="/" element={<LoginPage/>}/>

                {/* Routes that share the layout */}
                <Route element={<Layout />}>
                    {/* Public or shared routes */}
                    <Route path="/homepage" element={<HomePage />} />
                    <Route path="/students" element={<ProtectedRoute element={<StudentsPage />} allowedRoles={['admin', 'teacher']} />} />
                    <Route path="/students/:studentId" element={<ProtectedRoute element={<StudentProfile />} allowedRoles={['admin', 'teacher']} />} />

                    {/* Admin-only routes */}
                    <Route path="/admin/students" element={<ProtectedRoute element={<AdminStudentsPage />} allowedRoles={['admin']} />} />
                    <Route path="/admin/students/add" element={<ProtectedRoute element={<AddStudentPage />} allowedRoles={['admin']} />} />
                    <Route path="/admin/home" element={<ProtectedRoute element={<AdminHomePage />} allowedRoles={['admin']} />} />
                    <Route path="/admin/schedule/edit/:id" element={<ProtectedRoute element={<EditTeacherSchedule />} allowedRoles={['admin']} />} />
                    <Route path="/admin/schedule" element={<ProtectedRoute element={<AdminTeacherSchedules />} allowedRoles={['admin']} />} />
                    <Route path="/admin/schedule/new" element={<ProtectedRoute element={<NewSchedule />} allowedRoles={['admin']} />} />
                    <Route path="/admin/teachers" element={<ProtectedRoute element={<AdminTeachersPage />} allowedRoles={['admin']} />} />
                    <Route path="/admin/teachers/add" element={<ProtectedRoute element={<AddTeacherPage />} allowedRoles={['admin']} />} />
                    <Route path="/admin/students/:studentId/edit" element={<ProtectedRoute element={<EditStudentPage />} allowedRoles={['admin']} />} />
                    <Route path="/admin/teachers/:teacherId/edit" element={<ProtectedRoute element={<EditTeacherPage />} allowedRoles={['admin']} />} />
                    <Route path="/admin/exams" element={<ProtectedRoute element={<AdminExamsPage />} allowedRoles={['admin']} />} />

                    {/* Teacher or Admin shared */}
                    <Route path="/lesson-log" element={<ProtectedRoute element={<LessonLog />} allowedRoles={['admin', 'teacher']} />} />
                    <Route path="/lesson-log/add" element={<ProtectedRoute element={<AddLesson />} allowedRoles={['admin', 'teacher']} />} />
                    <Route path="/lesson-log/:lessonId/edit" element={<ProtectedRoute element={<EditLesson />} allowedRoles={['admin', 'teacher']} />} />
                    <Route path="/lesson-log/:lessonId/details" element={<ProtectedRoute element={<LessonDetails />} allowedRoles={['admin', 'teacher']} />} />

                    {/* Other */}
                    <Route path="/teacher-profile" element={<ProtectedRoute element={<TeacherProfile />} allowedRoles={['teacher']} />} />
                    <Route path="/settings" element={<ProtectedRoute element={<AppSettings />} allowedRoles={['admin', 'teacher']} />} />
                    <Route
                        path="/student-profile/:studentId"
                        element={<ProtectedRoute element={<StudentProfile />} allowedRoles={['admin', 'teacher']} />}
                    />
                    <Route path="/compass" element={<ProtectedRoute element={<TarkizCompass />} allowedRoles={['admin', 'teacher']} />} />
                </Route>
            </Routes>
        </Router>
    );
}

export default App;