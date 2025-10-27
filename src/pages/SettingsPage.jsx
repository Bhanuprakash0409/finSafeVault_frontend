import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import styles from './SettingsPage.module.css';

const SettingsPage = () => {
  const { user, updateMinBalance, isLoading, error } = useContext(AuthContext);
  
  // Initialize state from user context, ensuring it's not null
  const [minBalance, setMinBalance] = useState(user?.minBalance ?? 0);
  const [successMessage, setSuccessMessage] = useState('');

  // If the user object updates (e.g., after login), sync the local state
  useEffect(() => {
    if (user) {
      setMinBalance(user.minBalance ?? 0);
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage(''); // Clear previous success message
    const success = await updateMinBalance(minBalance);
    if (success) {
      setSuccessMessage('Settings saved successfully!');
      // Hide message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  return (
    <div className={styles.settingsContainer}>
      <h1 className={styles.header}>Account Settings</h1>
      <div className={styles.settingsCard}>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label htmlFor="minBalance">Minimum Balance Alert (₹)</label>
            <p style={{ fontSize: '14px', color: '#7f8c8d', margin: '0 0 10px 0' }}>
              Receive an email alert when your net balance falls below this amount.
            </p>
            <input
              id="minBalance"
              type="number"
              min="0"
              value={minBalance}
              onChange={(e) => setMinBalance(Number(e.target.value))}
              className={styles.input}
            />
          </div>
          <button type="submit" disabled={isLoading} className={styles.button}>
            {isLoading ? 'Saving...' : 'Save Settings'}
          </button>
          {error && <p className={styles.message} style={{ color: '#e74c3c' }}>{error}</p>}
          {successMessage && <p className={styles.message} style={{ color: '#2ecc71' }}>{successMessage}</p>}
        </form>
      </div>
    </div>
  );
};

export default SettingsPage;