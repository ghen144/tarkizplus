import React, { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import DropdownMenu from './DropdownMenu';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from './firebase';
import { useTranslation } from 'react-i18next';

const Header = () => {
    const { t } = useTranslation();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [userName, setUserName] = useState('User');
    const [searchQuery, setSearchQuery] = useState('');
    const auth = getAuth();

    const role = localStorage.getItem('userRole');

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                try {
                    const collectionName = role === 'admin' ? 'admin' : 'teachers';
                    const q = query(collection(db, collectionName), where('email', '==', user.email));
                    const snapshot = await getDocs(q);
                    if (!snapshot.empty) {
                        const data = snapshot.docs[0].data();
                        setUserName(data.name || (role === 'admin' ? t("admin") : t("teacher")));
                    }
                } catch (error) {
                    console.error('Error fetching user data:', error);
                }
            }
        });
        return () => unsubscribe();
    }, [auth, role, t]);

    const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen);
    const closeDropdown = () => setIsDropdownOpen(false);

    const handleSearch = (e) => {
        const queryValue = e.target.value;
        setSearchQuery(queryValue);
        console.log('Search query:', queryValue);
    };

    return (
        <header className="bg-white p-4 border-b flex justify-between items-center">
            <div>
                <h1 className="text-xl font-semibold">
                    {t("welcome")}, {userName?.split(' ')[0] || t("user")}
                </h1>
            </div>
            <div className="flex items-center gap-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder={t("search")}
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
                            src={`https://ui-avatars.com/api/?name=${userName || 'User'}&background=random`}
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
