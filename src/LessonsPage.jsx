import React from 'react';
import {BookOpenText, Calendar, Clock, Edit, Home, LogOut, Plus, Users} from 'lucide-react';
import {Link, useNavigate} from 'react-router-dom';
import {getAuth, signOut} from "firebase/auth";
import Sidebar from './Sidebar'; // Import the Sidebar component


const LessonsPage = () => {
    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar activePage="LessonsPage" />
            <main className="ml-64 flex-1 p-6">
                <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-blue-500" />
                            <h2 className="text-xl font-semibold">Weekly Schedule</h2>
                        </div>
                        <div className="flex gap-2">
                            <button className="flex items-center gap-2 p-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100">
                                <Plus className="h-4 w-4" />
                                Add Lesson
                            </button>
                            <button className="flex items-center gap-2 p-2 bg-gray-50 text-gray-600 rounded hover:bg-gray-100">
                                <Edit className="h-4 w-4" />
                                Edit Schedule
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full table-auto">
                            <thead>
                            <tr className="bg-gray-100">
                                <th className="p-3 text-left">TIME</th>
                                <th className="p-3 text-left">8:00 am</th>
                                <th className="p-3 text-left">9:00 am</th>
                                <th className="p-3 text-left">10:00 am</th>
                                <th className="p-3 text-left">11:00 am</th>
                                <th className="p-3 text-left">12:00 pm</th>
                                <th className="p-3 text-left">1:00 pm</th>
                                <th className="p-3 text-left">2:00 pm</th>
                                <th className="p-3 text-left">3:00 pm</th>
                                <th className="p-3 text-left">4:00 pm</th>
                                <th className="p-3 text-left">5:00 pm</th>
                                <th className="p-3 text-left">6:00 pm</th>
                                <th className="p-3 text-left">7:00 pm</th>
                                <th className="p-3 text-left">8:00 pm</th>
                                <th className="p-3 text-left">NOTES</th>
                            </tr>
                            </thead>
                            <tbody>
                            {['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'].map((day) => (
                                <tr key={day} className="border-b">
                                    <td className="p-3 font-medium">{day}</td>
                                    {Array.from({ length: 13 }).map((_, index) => (
                                        <td key={index} className="p-3">
                                            <input
                                                type="text"
                                                className="w-full p-2 border rounded"
                                                placeholder="Add lesson"
                                            />
                                        </td>
                                    ))}
                                    <td className="p-3">
                                        <input
                                            type="text"
                                            className="w-full p-2 border rounded"
                                            placeholder="Notes"
                                        />
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-6">
                        <h3 className="text-lg font-semibold">Hours Summary for the Week</h3>
                        <div className="mt-2">
                            <p>Mon: 4h total</p>
                            <p>Tue: 0h total</p>
                            <p>Wed: 2h total</p>
                            <p>Thu: 3h total</p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default LessonsPage;