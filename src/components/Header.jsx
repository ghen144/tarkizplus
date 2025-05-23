import React, { useEffect, useState } from 'react';
import { Search, Globe } from 'lucide-react';
import DropdownMenu from './DropdownMenu.jsx';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/firebase/firebase.jsx';
import { useTranslation } from 'react-i18next';

const Header = () => {
    const {t} = useTranslation();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [userName, setUserName] = useState('User');
    const [searchQuery, setSearchQuery] = useState('');
    const auth = getAuth();

    const role = localStorage.getItem('userRole');

    const [isLangOpen, setIsLangOpen] = useState(false);
    const toggleLangDropdown = () => setIsLangOpen((prev) => !prev);
    const closeLangDropdown = () => setIsLangOpen(false);
    const {i18n} = useTranslation();

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
        <header className="fixed top-0 left-64 right-0 z-40 bg-white p-4 border-b shadow-sm flex justify-between items-center">
            {/* Left: Search */}
            <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400"/>
                <input
                    type="text"
                    placeholder={t("Search Everything")}
                    value={searchQuery}
                    onChange={handleSearch}
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>

            <div className="flex items-center gap-4 ml-auto relative">
                {/* Language Globe */}
                <div className="relative" onMouseLeave={closeLangDropdown}>
                    <button
                        onClick={toggleLangDropdown}
                        className="text-gray-600 hover:text-blue-500 focus:outline-none"
                    >
                        <Globe className="h-6 w-6"/>
                    </button>

                    {isLangOpen && (
                        <div className="absolute right-0 top-full w-28 bg-white border rounded-md shadow-lg z-50">
                            {['en', 'ar', 'he'].map((lng) => (
                                <button
                                    key={lng}
                                    onClick={() => {
                                        i18n.changeLanguage(lng);
                                        closeLangDropdown();
                                    }}
                                    className={`block w-full text-left px-4 py-2 text-sm transition ${
                                        i18n.language === lng
                                            ? 'bg-blue-100 text-blue-700 font-semibold'
                                            : 'text-gray-700 hover:bg-gray-100'
                                    }`}
                                >
                                    {lng.toUpperCase()}
                                </button>
                            ))}
                        </div>
                    )}
                </div>


                {/* Avatar */}
                <div className="relative">
                    <button
                        onClick={toggleDropdown}
                        className="flex items-center gap-2 text-gray-600 hover:text-blue-500 focus:outline-none"
                    >
                        <img
                            src={`https://ui-avatars.com/api/?name=${userName || 'User'}&background=random`}
                            alt="User"
                            className="h-10 w-10 rounded-full transition-transform hover:scale-105"
                        />
                    </button>
                    {isDropdownOpen && <DropdownMenu onClose={closeDropdown}/>}
                </div>
            </div>


        </header>

        );
        };

        export default Header;
