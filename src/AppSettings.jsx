// AppSettings.jsx
import React, { useEffect, useState } from 'react';

const AppSettings = () => {
    const [darkMode, setDarkMode] = useState(false);
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        // Load settings from localStorage on mount
        const storedDarkMode = localStorage.getItem('darkMode');
        const storedNotifications = localStorage.getItem('notificationsEnabled');

        if (storedDarkMode !== null) {
            setDarkMode(storedDarkMode === 'true');
        }
        if (storedNotifications !== null) {
            setNotificationsEnabled(storedNotifications === 'true');
        }

        setLoading(false);
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        setSaving(true);

        // Save to localStorage
        localStorage.setItem('darkMode', darkMode);
        localStorage.setItem('notificationsEnabled', notificationsEnabled);

        setTimeout(() => {
            alert('Settings updated successfully!');
            setSaving(false);
        }, 500);
    };

    if (loading) {
        return <p className="p-6">Loading settings...</p>;
    }

    return (
        <div className="p-6">
            <h1 className="text-2xl font-semibold mb-4">Application Settings</h1>
            <form onSubmit={handleSubmit} className="max-w-md bg-white p-6 rounded shadow">
                {/* Dark Mode */}
                <div className="mb-4">
                    <label className="block mb-1 font-medium">Theme Mode</label>
                    <select
                        value={darkMode ? 'true' : 'false'}
                        onChange={(e) => setDarkMode(e.target.value === 'true')}
                        className="w-full border rounded p-2"
                    >
                        <option value="false">Light Mode</option>
                        <option value="true">Dark Mode</option>
                    </select>
                </div>

                {/* Notifications */}
                <div className="mb-4">
                    <label className="block mb-1 font-medium">Notifications</label>
                    <select
                        value={notificationsEnabled ? 'true' : 'false'}
                        onChange={(e) => setNotificationsEnabled(e.target.value === 'true')}
                        className="w-full border rounded p-2"
                    >
                        <option value="true">Enabled</option>
                        <option value="false">Disabled</option>
                    </select>
                </div>

                <button
                    type="submit"
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                    disabled={saving}
                >
                    {saving ? 'Saving...' : 'Save Settings'}
                </button>
            </form>
        </div>
    );
};

export default AppSettings;
