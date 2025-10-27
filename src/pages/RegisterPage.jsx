import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/finsafe-vault.png'; // Import the logo
import styles from './AuthForm.module.css'; // Import shared auth form styles

const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [minBalance, setMinBalance] = useState(0); // ⬅️ NEW STATE
  const { register, user, error, isLoading } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    // ⬅️ FIX: Pass user data as a single object for consistency
    register({ name, email, password, minBalance }); 
  };

  return (
    <div className={styles.authContainer} style={{ backgroundImage: `url(${logo})` }}>
      <div className={styles.formBox}>
        <h2>Create Your FinSafe Account</h2>
        {error && <div className={styles.error}>{error}</div>}
        <form onSubmit={handleSubmit}>          
          <div className={styles.inputGroup}>
            <label>Name</label>
            <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className={styles.input} />
          </div>
          <div className={styles.inputGroup}>
            <label>Email address</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={styles.input} />
          </div>
          
          {/* ⬅️ NEW: Minimum Balance Input */}
          <div className={styles.inputGroup}>
            <label>Min Balance Alert (₹)</label>
            <input
              type="number"
              min="0"
              step="1"
              value={minBalance}
              onChange={(e) => setMinBalance(Number(e.target.value))}
              className={styles.input}
              placeholder="Set email alert threshold (e.g., 500)"
            />
          </div>
          
          <div className={styles.inputGroup}>
            <label>Password</label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className={styles.input} />
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className={styles.button}
          >
            {isLoading ? 'Loading...' : 'Register'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;