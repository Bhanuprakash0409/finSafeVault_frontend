import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/finsafe-vault.png'; // Import the logo
import styles from './AuthForm.module.css'; // Import shared auth form styles

const LoginPage = () => {
  const [email, setEmail] = useState(''); // ✅ FIX: Use email state for login
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
    login({ email, password }); // ✅ FIX: Pass email and password for login
  };

  return (
    <div className={styles.authContainer} style={{ backgroundImage: `url(${logo})` }}>
      <div className={styles.formBox}>
        <h2>Sign in to FinSafe</h2>
        {error && <div className={styles.error}>{error.message || error}</div>} {/* Ensure error message is displayed */}
        <form onSubmit={handleSubmit}>
          <div className={styles.inputGroup}>
            <label>Email</label> {/* ✅ FIX: Change label to Email */}
            <input
              type="email" // ✅ FIX: Change input type to email
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)} // ✅ FIX: Update email state
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