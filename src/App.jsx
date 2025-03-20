import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './Sidebar';
import LoginPage from './LoginPage';
import HomePage from './HomePage';
import StudentsPage from './StudentsPage';
import StudentProfile from './StudentProfile';
import LessonLog from './LessonLog';
import AddLesson from "./AddLesson";

function App() {
    return (
        <Router>
            <div className="flex">
                {/* Sidebar Stays Fixed */}
                <Sidebar />

                {/* Main Content Area */}
                <div className="flex-1 p-6 ml-64">
                    <Routes>
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/" element={<HomePage />} />
                        <Route path="/students" element={<StudentsPage />} />
                        <Route path="/students/:studentId" element={<StudentProfile />} />
                        <Route path="/lesson-log" element={<LessonLog />} />
                        <Route path="/lesson-log/add" element={<AddLesson />} />
                    </Routes>
                </div>
            </div>
        </Router>
    );
}

export default App;
