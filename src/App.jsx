import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './Layout';
import LoginPage from './LoginPage';
import HomePage from './HomePage';
import StudentsPage from './StudentsPage';
import StudentProfile from './StudentProfile';
import LessonLog from './LessonLog';
import AddLesson from './AddLesson';
import EditLesson from './EditLesson';
import TeacherProfile from './TeacherProfile';
import AppSettings from './AppSettings';
import LessonDetails from './LessonDetails';
import AdminStudentsPage from './AdminStudentsPage';
import AddStudentPage from './AddStudentPage';
import AdminHomePage from './AdminHomePage';
import EditTeacherSchedule from './EditTeacherSchedule';
import AdminTeacherSchedules from './AdminTeacherSchedules';
import NewSchedule from './NewSchedule';
import AdminTeachers from './adminteachers';
import AdminLessonLog from './AdminLessonLog';
import AddTeacherPage from './AddTeacherPage';
import EditStudentPage from './EditStudentPage';
import EditTeacherPage from './EditTeacherPage';
import AdminExamsPage from "./AdminExamsPage";
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