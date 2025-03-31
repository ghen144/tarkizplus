// LessonDetails.jsx
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';

const LessonDetails = () => {
    const { lessonId } = useParams();
    const [lesson, setLesson] = useState(null);
    const [teacherName, setTeacherName] = useState('');
    const [studentName, setStudentName] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchLesson = async () => {
            try {
                // Fetch the lesson document
                const lessonRef = doc(db, 'lessons', lessonId);
                const lessonSnap = await getDoc(lessonRef);
                if (!lessonSnap.exists()) {
                    setError('Lesson not found.');
                    setLoading(false);
                    return;
                }
                const lessonData = lessonSnap.data();
                setLesson(lessonData);

                // Fetch the teacher document using lessonData.teacher_id
                if (lessonData.teacher_id) {
                    const teacherRef = doc(db, 'teachers', lessonData.teacher_id);
                    const teacherSnap = await getDoc(teacherRef);
                    if (teacherSnap.exists()) {
                        setTeacherName(teacherSnap.data().name || 'Unknown Teacher');
                    } else {
                        setTeacherName('Unknown Teacher');
                    }
                }

                // Fetch the student document using lessonData.student_id
                if (lessonData.student_id) {
                    const studentRef = doc(db, 'students', lessonData.student_id);
                    const studentSnap = await getDoc(studentRef);
                    if (studentSnap.exists()) {
                        setStudentName(studentSnap.data().name || 'Unknown Student');
                    } else {
                        setStudentName('Unknown Student');
                    }
                }
            } catch (err) {
                console.error('Error fetching lesson details:', err);
                setError('An error occurred while fetching lesson details.');
            } finally {
                setLoading(false);
            }
        };

        fetchLesson();
    }, [lessonId]);

    if (loading) return <p className="p-6">Loading lesson details...</p>;
    if (error) return <p className="p-6 text-red-600">{error}</p>;
    if (!lesson) return null;

    // Format the lesson date (assuming it's a Firestore Timestamp)
    let formattedDate = '';
    if (lesson.lesson_date && lesson.lesson_date.toDate) {
        formattedDate = lesson.lesson_date.toDate().toLocaleString();
    }

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Lesson Details</h1>
            <div className="bg-white p-6 rounded shadow max-w-md">
                <p>
                    <strong>Date:</strong> {formattedDate || 'N/A'}
                </p>
                <p>
                    <strong>Teacher:</strong> {teacherName}
                </p>
                <p>
                    <strong>Student:</strong> {studentName}
                </p>
                <p>
                    <strong>Subject:</strong> {lesson.subject || 'N/A'}
                </p>
                <p>
                    <strong>Duration:</strong> {lesson.duration_minutes} minutes
                </p>
                <p>
                    <strong>Notes:</strong> {lesson.lesson_notes || 'N/A'}
                </p>
                <p>
                    <strong>Progress:</strong> {lesson.progress_assessment || 'N/A'}
                </p>
                <p>
                    <strong>Number of Students:</strong> {lesson.student_num || 'N/A'}
                </p>
                {/* Add any additional fields here */}
            </div>
            <div className="mt-4">
                <Link to="/lesson-log" className="text-blue-500 hover:underline">
                    Back to Lesson Log
                </Link>
            </div>
        </div>
    );
};

export default LessonDetails;
