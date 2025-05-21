import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

const AppSettings = () => {
    const { t } = useTranslation();
    const [darkMode, setDarkMode] = useState(false);
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
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

        localStorage.setItem('darkMode', darkMode);
        localStorage.setItem('notificationsEnabled', notificationsEnabled);

        setTimeout(() => {
            alert(t('settings_updated'));
            setSaving(false);
        }, 500);
    };

    if (loading) {
        return <p className="p-6">{t('loading_settings')}</p>;
    }

    return (
        <div className="p-6">
            <h1 className="text-2xl font-semibold mb-4">{t('app_settings')}</h1>
            <form onSubmit={handleSubmit} className="max-w-md bg-white p-6 rounded shadow">
                <div className="mb-4">
                    <label className="block mb-1 font-medium">{t('theme_mode')}</label>
                    <select
                        value={darkMode ? 'true' : 'false'}
                        onChange={(e) => setDarkMode(e.target.value === 'true')}
                        className="w-full border rounded p-2"
                    >
                        <option value="false">{t('light_mode')}</option>
                        <option value="true">{t('dark_mode')}</option>
                    </select>
                </div>

                <div className="mb-4">
                    <label className="block mb-1 font-medium">{t('notifications')}</label>
                    <select
                        value={notificationsEnabled ? 'true' : 'false'}
                        onChange={(e) => setNotificationsEnabled(e.target.value === 'true')}
                        className="w-full border rounded p-2"
                    >
                        <option value="true">{t('enabled')}</option>
                        <option value="false">{t('disabled')}</option>
                    </select>
                </div>

                <button
                    type="submit"
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                    disabled={saving}
                >
                    {saving ? t('saving') : t('save_settings')}
                </button>
            </form>
        </div>
    );
};

export default AppSettings;