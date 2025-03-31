// Header.jsx
import React, { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import DropdownMenu from './DropdownMenu';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from './firebase';

const Header = () => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [teacherName, setTeacherName] = useState('Teacher');
    const [searchQuery, setSearchQuery] = useState('');
    const auth = getAuth();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                try {
                    const teachersQuery = query(
                        collection(db, 'teachers'),
                        where('email', '==', user.email)
                    );
                    const teachersSnapshot = await getDocs(teachersQuery);
                    if (!teachersSnapshot.empty) {
                        const teacherDoc = teachersSnapshot.docs[0];
                        const teacherData = teacherDoc.data();
                        setTeacherName(teacherData.name || 'Teacher');
                    }
                } catch (error) {
                    console.error('Error fetching teacher data:', error);
                }
            }
        });
        return () => unsubscribe();
    }, [auth]);

    const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen);
    const closeDropdown = () => setIsDropdownOpen(false);

    // Example function to handle search (you can modify it to actually perform a search)
    const handleSearch = (e) => {
        const queryValue = e.target.value;
        setSearchQuery(queryValue);
        console.log('Search query:', queryValue);
        // Here you can add logic to filter data or query your database
    };

    return (
        <header className="bg-white p-4 border-b flex justify-between items-center">
            <div>
                <h1 className="text-xl font-semibold">
                    Welcome, {teacherName ? teacherName.split(' ')[0] : 'Teacher'}
                </h1>
            </div>
            <div className="flex items-center gap-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search"
                        value={searchQuery}
                        onChange={handleSearch}
                        className="pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div className="relative">
                    <button
                        onClick={toggleDropdown}
                        className="flex items-center gap-2 text-gray-600 hover:text-blue-500 focus:outline-none"
                    >
                        <img
                            src="https://via.placeholder.com/40"
                            alt="User"
                            className="h-10 w-10 rounded-full"
                        />
                    </button>
                    {isDropdownOpen && <DropdownMenu onClose={closeDropdown} />}
                </div>
            </div>
        </header>
    );
};

export default Header;
