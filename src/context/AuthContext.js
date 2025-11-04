import React, { createContext, useReducer } from 'react';
import axios from 'axios';

const AUTH_API_URL = 'https://finsafe-tracker-api.onrender.com/api/'; // ✅ CORRECTED
const USER_API_URL = 'https://finsafe-tracker-api.onrender.com/api/users'; // ✅ NEW: Define USER_API_URL for profile updates

const initialState = {
  user: JSON.parse(localStorage.getItem('user')) || null,
  isLoading: false,
  error: null,
};

const authReducer = (state, action) => {
  switch (action.type) {
    case 'AUTH_START':
      return { ...state, isLoading: true, error: null };
    case 'AUTH_SUCCESS':
      return { ...state, user: action.payload, isLoading: false, error: null };
    case 'UPDATE_SUCCESS':
      localStorage.setItem('user', JSON.stringify(action.payload));
      return { ...state, user: action.payload, isLoading: false, error: null };
    case 'AUTH_FAIL':
      return { ...state, user: null, isLoading: false, error: action.payload };
    case 'LOGOUT':
      return { ...state, user: null, isLoading: false, error: null };
    // ⬅️ NEW CASE: To handle settings updates
    // The 'USER_UPDATE' case is removed as 'UPDATE_SUCCESS' will handle the state update after API call.
    default:
      return state;
  }
};

export const AuthContext = createContext(initialState);

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const register = async (userData) => {
    dispatch({ type: 'AUTH_START' });
    try {
      const response = await axios.post(AUTH_API_URL + 'auth/register', userData);
      localStorage.setItem('user', JSON.stringify(response.data));
      dispatch({ type: 'AUTH_SUCCESS', payload: response.data });
    } catch (error) {
      dispatch({ type: 'AUTH_FAIL', payload: error.response?.data?.message || error.message });
    }
  };

  const login = async (username, password) => {
    dispatch({ type: 'AUTH_START' });
    try {

      const response = await axios.post(AUTH_API_URL + 'auth/login', { username, password });
      if (response.status !== 200) {
        throw new Error(response.data.message || 'Login failed');
      }
      localStorage.setItem('user', JSON.stringify(response.data));
      dispatch({ type: 'AUTH_SUCCESS', payload: response.data });
      return true; // ✅ FIX: Return true on success
    } catch (error) {
      dispatch({ type: 'AUTH_FAIL', payload: error.response?.data?.message || error.message });
      return false; // ✅ FIX: Return false on failure
    }
  };

  const logout = () => {
    localStorage.removeItem('user');
    dispatch({ type: 'LOGOUT' });
  };

  const updateUser = async (userData) => {
    dispatch({ type: 'AUTH_START' });
    try {
      // Get the most recent user data directly from localStorage to ensure the token is fresh.
      const currentUser = JSON.parse(localStorage.getItem('user'));
      if (!currentUser || !currentUser.token) {
        throw new Error('Not authorized. No token found.');
      }

      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentUser.token}`,
        },
      };

      // ✅ FIX: Use USER_API_URL and make an actual API call
      const res = await axios.put(USER_API_URL + '/profile', userData, config);

      dispatch({ type: 'UPDATE_SUCCESS', payload: res.data });
      return true; // Indicate success
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Update failed';
      dispatch({ type: 'AUTH_FAIL', payload: message });
      console.error('Update user error:', message);
      return false; // Indicate failure
    }
  };

  return (
    <AuthContext.Provider
      value={{ ...state, register, login, logout, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};