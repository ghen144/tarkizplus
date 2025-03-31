// LoginPage.jsx
import React, { useState } from 'react';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import Logo from './Logo'; // Import the logo component

const LoginPage = () => {
    const [loginType, setLoginType] = useState('teacher'); // 'teacher' or 'admin'
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const auth = getAuth();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            if (loginType === 'admin') {
                navigate('/admin/dashboard');
            } else {
                navigate('/');
            }
        } catch (err) {
            console.error(err);
            setError('Login failed. Please check your credentials.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="w-full max-w-md bg-white p-8 rounded shadow">
                {/* Logo and Brand */}
                <div className="flex flex-col items-center mb-6">
                    <Logo />
                </div>

                {/* Login Type Tabs */}
                <div className="flex justify-center mb-6">
                    <button
                        onClick={() => setLoginType('teacher')}
                        className={`px-4 py-2 ${
                            loginType === 'teacher'
                                ? 'border-b-2 border-blue-500 font-semibold'
                                : 'text-gray-500'
                        }`}
                    >
                        Teacher Login
                    </button>
                    <button
                        onClick={() => setLoginType('admin')}
                        className={`px-4 py-2 ml-4 ${
                            loginType === 'admin'
                                ? 'border-b-2 border-blue-500 font-semibold'
                                : 'text-gray-500'
                        }`}
                    >
                        Admin Login
                    </button>
                </div>

                {/* Login Form */}
                <form onSubmit={handleLogin}>
                    {error && <p className="text-red-500 mb-4">{error}</p>}
                    <div className="mb-4">
                        <label className="block text-gray-700 mb-1">Email</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="mb-6">
                        <label className="block text-gray-700 mb-1">Password</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
                    >
                        Log In
                    </button>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;
