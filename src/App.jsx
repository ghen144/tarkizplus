import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
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
import AdminSidebar from './AdminSidebar';
import AddStudentPage from './AddStudentPage';
import AdminHomePage from './AdminHomePage';
import EditTeacherSchedule from './EditTeacherSchedule';
import AdminTeacherSchedules from './AdminTeacherSchedules';
import NewSchedule from './NewSchedule';
import AdminTeachers from './adminteachers';
import AdminLessonLog from './AdminLessonLog'
import AddTeacherPage from './AddTeacherPage';
import EditStudentPage from './EditStudentPage';
import EditTeacherPage from './EditTeacherPage';





function AppLayout() {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

  const role = localStorage.getItem('userRole');

  return (
    <div className="flex min-h-screen bg-gray-50">
      {!isLoginPage && (
        role === "admin" ? <AdminSidebar /> : <Sidebar />
      )}

      <div className={`flex-1 ${!isLoginPage ? 'ml-64' : ''}`}>
        {!isLoginPage && <Header />}
        <div className="p-6">
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<HomePage />} />
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
            <Route path= "/admin/lessonlog" element={<AdminLessonLog/>} />
            <Route path="/add-teacher" element={<AddTeacherPage />} />
            <Route path="/admin/students/:studentId/edit" element={<EditStudentPage />} />
            <Route path="/admin/teachers/:teacherId/edit" element={<EditTeacherPage />} />






          </Routes>
        </div>
      </div>
    </div>
  );
}

// 👇 هذا السطر هو اللي ناقصك
function App() {
  return (
    <Router>
      <AppLayout />
    </Router>
  );
}

export default App;
