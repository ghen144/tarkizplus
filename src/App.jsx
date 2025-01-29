import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginPage from './LoginPage';
import HomePage from './HomePage.jsx';
import StudentsPage from './StudentsPage';
import StudentProfile from './StudentProfile';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/" element={<HomePage />} />
                <Route path="/students" element={<StudentsPage />} />
                <Route path="/students/:studentId" element={<StudentProfile />} />
            </Routes>
        </Router>
    );
}

export default App;