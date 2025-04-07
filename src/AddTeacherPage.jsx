import React, { useState } from 'react';
import { collection, setDoc, doc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from './firebase';
import { useNavigate } from 'react-router-dom';

function AddTeacherPage() {
  const [teacherId, setTeacherId] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subjectSpecialties, setSubjectSpecialties] = useState([]);
  const [experienceYears, setExperienceYears] = useState('');
  const [activeStatus, setActiveStatus] = useState(true);
  const [teachingHoursWeek, setTeachingHoursWeek] = useState('');
  const [joiningDate, setJoiningDate] = useState('');
  const [uid, setUid] = useState('');

  const navigate = useNavigate();

  const subjects = ["Math", "English", "Arabic", "Hebrew"];

  const handleCheckboxChange = (subject) => {
    setSubjectSpecialties(prev =>
      prev.includes(subject)
        ? prev.filter(s => s !== subject)
        : [...prev, subject]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const newDocRef = doc(db, 'teachers', teacherId); // ← استخدمنا teacherId كـ document ID
      await setDoc(newDocRef, {
        teacher_id: teacherId,
        name,
        email,
        subject_specialties: subjectSpecialties,
        experience_years: Number(experienceYears),
        active_status: activeStatus,
        teaching_hours_week: Number(teachingHoursWeek),
        joining_tarkiz_date: Timestamp.fromDate(new Date(joiningDate)),
        uid: uid || "", // اختياري
        assigned_students: [], // افتراضيًا فارغ
        created_at: serverTimestamp()
      });
      alert('Teacher added successfully!');
      navigate('/admin/teachers');
      window.location.reload(); // إعادة تحميل البيانات

    } catch (error) {
      console.error("Error adding teacher:", error);
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h2 className="text-2xl font-semibold mb-4">Add New Teacher</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Teacher ID (e.g., T001)"
          className="w-full border px-4 py-2 rounded"
          value={teacherId}
          onChange={e => setTeacherId(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Full Name"
          className="w-full border px-4 py-2 rounded"
          value={name}
          onChange={e => setName(e.target.value)}
          required
        />
        <input
          type="email"
          placeholder="Email"
          className="w-full border px-4 py-2 rounded"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <div>
          <label className="block font-semibold mb-1">Subjects:</label>
          <div className="flex flex-wrap gap-4">
            {subjects.map(subject => (
              <label key={subject} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={subjectSpecialties.includes(subject)}
                  onChange={() => handleCheckboxChange(subject)}
                />
                {subject}
              </label>
            ))}
          </div>
        </div>
        <input
          type="number"
          placeholder="Years of Experience"
          className="w-full border px-4 py-2 rounded"
          value={experienceYears}
          onChange={e => setExperienceYears(e.target.value)}
          required
        />
        <input
          type="number"
          placeholder="Teaching Hours per Week"
          className="w-full border px-4 py-2 rounded"
          value={teachingHoursWeek}
          onChange={e => setTeachingHoursWeek(e.target.value)}
          required
        />
        <div>
          <label className="block font-semibold mb-1">Joining Date:</label>
          <input
            type="date"
            className="w-full border px-4 py-2 rounded"
            value={joiningDate}
            onChange={e => setJoiningDate(e.target.value)}
            required
          />
        </div>
        <input
          type="text"
          placeholder="Firebase UID (optional)"
          className="w-full border px-4 py-2 rounded"
          value={uid}
          onChange={e => setUid(e.target.value)}
        />
        <div>
          <label className="block font-semibold mb-1">Status:</label>
          <select
            className="w-full border px-4 py-2 rounded"
            value={activeStatus ? 'active' : 'inactive'}
            onChange={(e) => setActiveStatus(e.target.value === 'active')}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <div className="flex gap-4">
          <button type="submit" className="bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600">
            Save
          </button>
          <button type="button" onClick={() => navigate('/admin-teachers')} className="bg-gray-300 px-6 py-2 rounded hover:bg-gray-400">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default AddTeacherPage;
