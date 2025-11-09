import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/finsafe-vault.png'; 
import styles from './AuthForm.module.css'; 

const LoginPage = () => {
  const [username, setUsername] = useState(''); // Use username state for login
  const [password, setPassword] = useState('');
  const { login, user, error, isLoading } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard'); // Redirect if already logged in
    }
  }, [user, navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    login(username, password); // ✅ FIX: Pass credentials as separate arguments
  };

  return (
    <div className={styles.authContainer} style={{ backgroundImage: `url(${logo})` }}>
      <div className={styles.formBox}>
        <h2>Sign in to FinSafe</h2>
        {error && <div className={styles.error}>{error.message || error}</div>} {/* Ensure error message is displayed */}
        <form onSubmit={handleSubmit}>
        <div className={styles.inputGroup}>
            <label>Username</label> {/* Change label to Username */}
            <input
              type="text" // Change input type to text
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)} // Update username state
              className={styles.input}
            />
          </div>
          <div className={styles.inputGroup}>
            <label>Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={styles.input}
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className={styles.button}
          >
            {isLoading ? 'Loading...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;