import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import LoginPage from './pages/LoginPage.jsx';
import HomePage from './pages/HomePage.jsx';
import StudentsPage from './pages/students/StudentsPage.jsx';
import StudentProfile from './pages/students/StudentProfile.jsx';
import LessonLog from './pages/lessons/LessonLog.jsx';
import AddLesson from './pages/lessons/AddLesson.jsx';
import EditLesson from './pages/lessons/EditLesson.jsx';
import TeacherProfile from './pages/TeacherProfile.jsx';
import AppSettings from './pages/AppSettings.jsx';
import LessonDetails from './pages/lessons/LessonDetails.jsx';
import AdminStudentsPage from './pages/admin/AdminStudentsPage.jsx';
import AddStudentPage from './pages/AddStudentPage.jsx';
import AdminHomePage from './pages/admin/AdminHomePage.jsx';
import EditTeacherSchedule from './pages/schedules/EditTeacherSchedule.jsx';
import AdminTeacherSchedules from './pages/admin/AdminTeacherSchedules.jsx';
import NewSchedule from './pages/NewSchedule.jsx';
import AdminTeachers from './pages/admin/adminteachers.jsx';
import AdminLessonLog from './pages/admin/AdminLessonLog.jsx';
import AddTeacherPage from './pages/AddTeacherPage.jsx';
import EditStudentPage from './pages/EditStudentPage.jsx';
import EditTeacherPage from './pages/EditTeacherPage.jsx';
import AdminExamsPage from "./pages/admin/AdminExamsPage.jsx";
import { useTranslation } from 'react-i18next';

function App() {
  const { i18n } = useTranslation();

  return (
    <Router>
      <Routes>
        {/* Login route (no layout) */}
        <Route path="/" element={<LoginPage />} />

        {/* Routes that share the layout */}
        <Route element={<Layout />}>
          <Route path="/homepage" element={<HomePage />} />
          <Route path="/students" element={<StudentsPage />} />
          <Route path="/students/:studentId" element={<StudentProfile />} />
          <Route path="/lesson-log" element={<LessonLog />} />
          <Route path="/lesson-log/add" element={<AddLesson />} />
          <Route path="/lesson-log/:lessonId/edit" element={<EditLesson />} />
          <Route path="/profile" element={<TeacherProfile />} />
          <Route path="/settings" element={<AppSettings />} />
          <Route path="/lesson-log/:lessonId/details" element={<LessonDetails />} />
          <Route path="/admin/students" element={<AdminStudentsPage />} />
          <Route path="/admin/students/add" element={<AddStudentPage />} />
          <Route path="/admin/home" element={<AdminHomePage />} />
          <Route path="/admin/schedule/edit/:id" element={<EditTeacherSchedule />} />
          <Route path="/admin/schedule" element={<AdminTeacherSchedules />} />
          <Route path="/admin/schedule/new" element={<NewSchedule />} />
          <Route path="/admin/teachers" element={<AdminTeachers />} />
          <Route path="/admin/lessonlog" element={<AdminLessonLog />} />
          <Route path="/add-teacher" element={<AddTeacherPage />} />
          <Route path="/admin/students/:studentId/edit" element={<EditStudentPage />} />
          <Route path="/admin/teachers/:teacherId/edit" element={<EditTeacherPage />} />
          <Route path="/admin/exams" element={<AdminExamsPage />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;