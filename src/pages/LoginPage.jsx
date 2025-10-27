import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/finsafe-vault.png'; // Import the logo
import styles from './AuthForm.module.css'; // Import shared auth form styles

const LoginPage = () => {
  const [name, setName] = useState('');
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
    login({ name, password }); // ⬅️ FIX: Pass credentials as an object
  };

  return (
    <div className={styles.authContainer} style={{ backgroundImage: `url(${logo})` }}>
      <div className={styles.formBox}>
        <h2>Sign in to FinSafe</h2>
        {error && <div className={styles.error}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className={styles.inputGroup}>
            <label>Username</label> 
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
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