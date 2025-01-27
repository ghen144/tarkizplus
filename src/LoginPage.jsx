import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { firebaseConfig } from './firebase.jsx';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';

import { getFirestore } from 'firebase/firestore';


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const LoginPage = () => {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isRegister, setIsRegister] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            if (isRegister) {
                // Register a new user
                await createUserWithEmailAndPassword(auth, username, password);
                alert('Account created successfully!');
                navigate('/'); // Redirect to homepage after registration
            } else {
                // Log in an existing user
                await signInWithEmailAndPassword(auth, username, password);
                navigate('/'); // Redirect to homepage after login
            }
        } catch (err) {
            setError(err.message);
        }
        setIsLoading(false);
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#f3f4f6',
            margin: 0,
            padding: 0,
            width: '100vw'
        }}>
            <div style={{
                padding: '2rem',
                backgroundColor: 'white',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                width: '100%',
                maxWidth: '400px'
            }}>
                <h1 style={{
                    textAlign: 'center',
                    marginBottom: '2rem',
                    color: '#1f2937'
                }}>TarkizPlus</h1>

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '0.5rem',
                            color: '#374151'
                        }}>
                            Email
                        </label>
                        <input
                            type="email"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.5rem',
                                border: '1px solid #d1d5db',
                                borderRadius: '4px',
                                fontSize: '16px'
                            }}
                            required
                        />
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '0.5rem',
                            color: '#374151'
                        }}>
                            Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.5rem',
                                border: '1px solid #d1d5db',
                                borderRadius: '4px',
                                fontSize: '16px'
                            }}
                            required
                            minLength={6}
                        />
                    </div>

                    {error && (
                        <div style={{
                            color: '#dc2626',
                            marginBottom: '1rem',
                            padding: '0.5rem',
                            backgroundColor: '#fee2e2',
                            borderRadius: '4px'
                        }}>
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        style={{
                            width: '100%',
                            padding: '0.5rem',
                            backgroundColor: '#2563eb',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: isLoading ? 'not-allowed' : 'pointer',
                            opacity: isLoading ? 0.7 : 1,
                            fontSize: '16px'
                        }}
                    >
                        {isLoading ? 'Please wait...' : (isRegister ? 'Register' : 'Log In')}
                    </button>

                    <button
                        type="button"
                        onClick={() => setIsRegister(!isRegister)}
                        style={{
                            width: '100%',
                            marginTop: '1rem',
                            padding: '0.5rem',
                            backgroundColor: 'transparent',
                            color: '#2563eb',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '14px'
                        }}
                    >
                        {isRegister ? 'Already have an account? Log in' : "Don't have an account? Register"}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;