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

function AppLayout() {
    const location = useLocation();
    const isLoginPage = location.pathname === '/login';

    return (
        <div className="flex min-h-screen bg-gray-50">
            {/* Render Sidebar only if not on login page */}
            {!isLoginPage && <Sidebar />}

            {/* Main Content Area */}
            <div className={`flex-1 ${!isLoginPage ? 'ml-64' : ''}`}>
                {/* Render Header only if not on login page */}
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


                    </Routes>
                </div>
            </div>
        </div>
    );
}

export default function App() {
    return (
        <Router>
            <AppLayout />
        </Router>
    );
}
