import React, { createContext, useReducer } from 'react';
import axios from 'axios';

const AUTH_API_URL = 'https://finsafe-tracker-api.onrender.com/api/'; // ✅ CORRECTED

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
    case 'USER_UPDATE':
        // Merge existing user data with new payload data
        return { ...state, user: { ...state.user, ...action.payload }, isLoading: false };
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

  const login = async (userData) => {
    dispatch({ type: 'AUTH_START' });
    try {
      const response = await axios.post(AUTH_API_URL + 'auth/login', userData);
      localStorage.setItem('user', JSON.stringify(response.data));
      dispatch({ type: 'AUTH_SUCCESS', payload: response.data });
    } catch (error) {
      dispatch({ type: 'AUTH_FAIL', payload: error.response?.data?.message || error.message });
    }
  };

  const logout = () => {
    localStorage.removeItem('user');
    dispatch({ type: 'LOGOUT' });
  };

  // ⬅️ NEW FUNCTION: Updates local state and localStorage
  const updateUser = (data) => {
      // 1. Update localStorage
      const updatedUser = { ...state.user, ...data };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      // 2. Update global state
      dispatch({ type: 'USER_UPDATE', payload: data });
  };

  return (
    // ⬅️ EXPORT NEW FUNCTION
    <AuthContext.Provider value={{ ...state, register, login, logout, updateUser }}>
        {children}
    </AuthContext.Provider>
  );
};