import React, { useState, useContext } from 'react';
import { TransactionContext } from '../context/TransactionContext';
import { AuthContext } from '../context/AuthContext'; // ⬅️ 1. IMPORT AuthContext
import styles from './AddTransactionModal.module.css'; // Import CSS module

const AddTransactionModal = ({ onClose }) => {
  const { addTransaction, isLoading, error } = useContext(TransactionContext);
  const { user } = useContext(AuthContext); // ⬅️ 2. GET the user object
  const [formData, setFormData] = useState({
    type: 'expense',
    amount: '', // Must be a string for input field
    category: 'Food',
    date: new Date().toISOString().split('T')[0],
    note: '',
  });

  const categories = {
    income: ['Salary', 'Freelance', 'Investment', 'Other Income'],
    expense: ['Food', 'Housing', 'Transport', 'Utilities', 'Entertainment', 'Other Expense'],
  };
  
  // 1. CRITICAL FIX: Ensure all inputs update the state correctly
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Ensure amount is stored as a number type when setting state if needed, 
    // but typically it's fine as a string until submission.
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 2. Add validation check for amount
    if (!formData.amount || !formData.category || !formData.date) {
        // Optional visual feedback here
        return;
    }

    // ✅ FIX: Pass only the formData object as expected by the context function.
    const success = await addTransaction(formData);
    
    if (success) {
      onClose();
    }
  };

  return (
    <div className={styles.modalBackground} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <h3>Add New Transaction</h3>
        {error && <p className={styles.error}>{error}</p>}
        <form onSubmit={handleSubmit} className={styles.form}>
          
          <div className={styles.radioGroup}>
            <input type="radio" id="expense" name="type" value="expense" checked={formData.type === 'expense'} onChange={handleChange} className={styles.radioInput} />
            <label htmlFor="expense" className={styles.radioLabel}>Expense</label>
            
            <input type="radio" id="income" name="type" value="income" checked={formData.type === 'income'} onChange={handleChange} className={styles.radioInput} />
            <label htmlFor="income" className={styles.radioLabel}>Income</label>
          </div>
          
          <div className={styles.inputGroup}>
            <label>Amount (₹)</label>
            <input 
              type="number" // MUST BE type="number"
              name="amount" 
              value={formData.amount} 
              onChange={handleChange} // CRITICAL: Ensure this is called
              required
              className={styles.input} 
            />
          </div>
          
          <div className={styles.inputGroup}>
            <label>Category</label>
            <select name="category" value={formData.category} onChange={handleChange} required className={styles.select}>
              {categories[formData.type].map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          
          <div className={styles.inputGroup}>
            <label>Date</label>
            <input type="date" name="date" value={formData.date} onChange={handleChange} required className={styles.input} />
          </div>

          <div className={styles.inputGroup}>
            <label>Note (Optional)</label>
            <textarea name="note" value={formData.note} onChange={handleChange} rows="2" maxLength="100" className={styles.textarea} />
          </div>

          <div className={styles.buttonGroup}>
            <button type="button" onClick={onClose} className={`${styles.button} ${styles.cancelButton}`}>
              Cancel
            </button>
            <button type="submit" disabled={isLoading} className={`${styles.button} ${styles.saveButton}`}>
              {isLoading ? 'Saving...' : 'Save Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTransactionModal;