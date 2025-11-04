import React, { createContext, useReducer, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from './AuthContext';
const API_URL = 'https://finsafe-tracker-api.onrender.com/api/transactions'; // ✅ FIX: Removed trailing slash

const initialState = {
  transactions: [],
  // files: [], // ⬅️ REMOVED
  balance: { // ⬅️ NEW: State for overall balance
    totalIncome: 0,
    totalExpense: 0,
    netBalance: 0,
  },
  analytics: { categoryData: [], monthlyData: [] },
  currentPage: 1, // ⬅️ NEW
  totalPages: 1,  // ⬅️ NEW
  isLoading: false,
  error: null,
};

const transactionReducer = (state, action) => {
  switch (action.type) {
    case 'FETCH_START':
    case 'ADD_START':
      return { ...state, isLoading: true, error: null };
    case 'FETCH_SUCCESS':
      // The backend now sends an object with the transactions array and pagination info
      return { 
        ...state, 
        // ⬅️ CRITICAL CHANGE: Always replace the transactions array for pagination
        transactions: action.payload.transactions, 
        currentPage: action.payload.page, 
        totalPages: action.payload.pages,
        balance: action.payload.balance, // ⬅️ NEW: Update balance from API
        isLoading: false 
      };
    case 'ADD_SUCCESS': // ✅ FIX: This case now only signals the end of the 'add' loading state.
      // The transaction list is updated by the subsequent 'getTransactions' call.
      return { ...state, isLoading: false };

    case 'FETCH_ANALYTICS_SUCCESS':
      return { ...state, analytics: action.payload, isLoading: false };
    case 'FETCH_FAIL':
    case 'ADD_FAIL':
      return { ...state, isLoading: false, error: action.payload };
    default:
      return state;
  }
};

export const TransactionContext = createContext(initialState);

export const TransactionProvider = ({ children }) => {
  const [state, dispatch] = useReducer(transactionReducer, initialState);
  const { user } = useContext(AuthContext);

  // 1. Fetch Transactions
  const getTransactions = async (page = 1) => { // ⬅️ ACCEPTS PAGE PARAMETER
    if (!user) return;
    // ✅ FIX: Use the user object from context to ensure the token is fresh.
    const config = { headers: { Authorization: `Bearer ${user.token}` } }; 
    dispatch({ type: 'FETCH_START' }); 
    try {
      const res = await axios.get(API_URL + `?page=${page}`, config); // Now correctly forms /api/transactions?page=...
      // ✅ FIX: Ensure the payload structure is consistent and what the reducer expects,
      // providing default values for all expected properties to prevent crashes.
      const payload = {
        transactions: res.data.transactions || [],
        balance: res.data.balance || { totalIncome: 0, totalExpense: 0, netBalance: 0 },
        page: res.data.page || page, // Use the requested page or default
        pages: res.data.pages || 1,
      };
      dispatch({ type: 'FETCH_SUCCESS', payload });
    } catch (error) {
      // More detailed error logging
      const message = error.response?.data?.message || error.message || 'Failed to fetch transactions';
      console.error('getTransactions Error:', message);
      dispatch({ type: 'FETCH_FAIL', payload: message });
    }
  };

  // 2. Add Transaction
  const addTransaction = async (formData) => {
    dispatch({ type: 'ADD_START' });
    
    // ⬅️ NEW: Debugging log
    console.log('API Payload:', formData); 
    
    try {
      // ✅ FIX: Create config with the LATEST token right before the API call.
      const config = { 
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${user.token}`,
        },
      };
      const res = await axios.post(API_URL, formData, config);
      dispatch({ type: 'ADD_SUCCESS' }); // Dispatch success to turn off loading state.
      
      // ⬅️ NEW: Debugging log
      console.log('API Success Response:', res.data); 
      
      // ✅ FIX: Refetch the first page of transactions to ensure the list is up-to-date.
      getTransactions(1);

      return true;
    } catch (error) {
      // ⬅️ CRITICAL: Log the detailed error
      console.error('API Error during addTransaction:', error.response?.data || error.message);
      dispatch({ type: 'ADD_FAIL', payload: error.response?.data?.message || 'Failed to add transaction' });
      return false;
    }
  };

  // 3. Fetch Analytics Data
  const getAnalyticsData = async (year) => { // ⬅️ ACCEPTS YEAR
    if (!user) return;
    dispatch({ type: 'FETCH_START' });
    try {
        // Define config here to ensure the latest token is used
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        // ⬅️ Pass year to the API
        const res = await axios.get(`${API_URL}/analytics?year=${year}`, config); // ✅ FIX: Correctly forms /api/transactions/analytics
        dispatch({ type: 'FETCH_ANALYTICS_SUCCESS', payload: res.data });
    } catch (error) {
        const message = error.response?.data?.message || error.message || 'Failed to fetch analytics';
        dispatch({ 
            type: 'FETCH_FAIL', // ✅ FIX: Use the generic 'FETCH_FAIL' type for consistency
            payload: message 
        });
    }
  };
  
  // ⬅️ NEW FUNCTION: Filter Transactions by Date
  const getTransactionsByDate = async (date) => {
      if (!user) return;
      dispatch({ type: 'FETCH_START' });
      try {
          const config = { headers: { Authorization: `Bearer ${user.token}` } }; 
          // Send date to the backend filtering endpoint
          const res = await axios.get(API_URL + `?date=${date}`, config); // Now correctly forms /api/transactions?date=...
          // ✅ FIX: Ensure the payload structure is consistent and what the reducer expects,
          // providing default values for all expected properties to prevent crashes.
          dispatch({ type: 'FETCH_SUCCESS', payload: {
            transactions: res.data.transactions || [],
            balance: res.data.balance || { totalIncome: 0, totalExpense: 0, netBalance: 0 },
            page: 1, // Filtered results typically reset to page 1
            pages: res.data.pages || 1,
          }});
      } catch (error) {
          dispatch({ type: 'FETCH_FAIL', payload: error.response?.data?.message || 'Failed to fetch transactions for date' });
      }
  };
  
  // ➡️ NEW FUNCTION: Fetches all data needed for a monthly report
  const getMonthlyReportData = async (year, month) => {
      if (!user) return;
      dispatch({ type: 'FETCH_START' });
      try {
          const config = { headers: { Authorization: `Bearer ${user.token}` } };

          // Fetch both transactions and analytics in parallel for the given month
          const [transactionsRes, analyticsRes] = await Promise.all([
              axios.get(API_URL + `?year=${year}&month=${month}`, config),
              axios.get(`${API_URL}/analytics?year=${year}&month=${month}`, config) // ✅ FIX: Correctly forms /api/transactions/analytics
          ]);

          // Dispatch actions to update state with the new data
          dispatch({
            type: 'FETCH_SUCCESS',
            payload: {
              transactions: transactionsRes.data.transactions || [],
              balance: transactionsRes.data.balance || { totalIncome: 0, totalExpense: 0, netBalance: 0 },
              page: 1, // Assuming monthly report always shows page 1
              pages: transactionsRes.data.pages || 1,
            }
          });
          dispatch({ type: 'FETCH_ANALYTICS_SUCCESS', payload: analyticsRes.data });
      } catch (error) {
          dispatch({ type: 'FETCH_FAIL', payload: error.response?.data?.message || 'Failed to fetch monthly report data' });
      }
  };
  // 4. File management functions removed.

  return (
    <TransactionContext.Provider 
      value={{ 
        ...state, 
        getTransactions, 
        addTransaction,
        getAnalyticsData,
        getTransactionsByDate, // ⬅️ NEW EXPORT
        getMonthlyReportData,  // ➡️ NEW EXPORT
        // Files/Vault functions removed from export
      }}
    >
      {children}
    </TransactionContext.Provider>
  );
};