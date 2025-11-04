import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { AuthContext } from '../context/AuthContext';

const LoginPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const { login, isLoading, error } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        // Sanitize the inputs before sending them to the server.
        const cleanUsername = DOMPurify.sanitize(username);
        const cleanPassword = DOMPurify.sanitize(password);
        e.preventDefault();
        // Pass credentials to the login function
        const success = await login(username, password);
        // ✅ FIX: Navigate on successful login.
        if (success) {
            navigate('/dashboard');
        }
    };

    const containerStyle = {
        maxWidth: '400px',
        margin: '50px auto',
        padding: '30px',
        border: '1px solid #e0e0e0',
        borderRadius: '8px',
        boxShadow: '0 4px 8px rgba(0,0,0,0.05)',
        backgroundColor: '#fff',
        fontFamily: 'sans-serif'
    };

    const inputStyle = {
        width: '100%',
        padding: '12px',
        marginBottom: '15px',
        border: '1px solid #ccc',
        borderRadius: '4px',
        boxSizing: 'border-box'
    };

    const buttonStyle = {
        width: '100%',
        padding: '12px',
        border: 'none',
        borderRadius: '4px',
        backgroundColor: '#4CAF50',
        color: 'white',
        fontSize: '16px',
        cursor: 'pointer',
        opacity: isLoading ? 0.6 : 1
    };

    const errorStyle = {
        color: 'red',
        backgroundColor: '#ffebee',
        padding: '10px',
        borderRadius: '4px',
        marginBottom: '15px',
        textAlign: 'center'
    };

    return (
        <div style={containerStyle}>
            <h2 style={{ textAlign: 'center', marginBottom: '25px' }}>Login</h2>
            <form onSubmit={handleSubmit}>
                {error && <p style={errorStyle}>{error}</p>}
                <input
                    type="text"
                    placeholder="User Name"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    style={inputStyle}
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={inputStyle}
                />
                <button type="submit" style={buttonStyle} disabled={isLoading}>
                    {isLoading ? 'Logging in...' : 'Login'}
                </button>
            </form>
            <p style={{ textAlign: 'center', marginTop: '20px' }}>
                Don't have an account? <Link to="/register">Register here</Link>
            </p>
        </div>
    );
};

export default LoginPage;