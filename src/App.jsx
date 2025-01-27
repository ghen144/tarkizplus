import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginPage from './LoginPage';
import HomePage from './HomePage';
import StudentsPage from './StudentsPage';
import StudentProfile from './StudentProfile';
import LessonsPage from './LessonsPage';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/" element={<HomePage />} />
                <Route path="/students" element={<StudentsPage />} />
                <Route path="/students/:studentName" element={<StudentProfile />} />
                <Route path="/lessons" element={<LessonsPage />} />
            </Routes>
        </Router>
    );
}

export default App;