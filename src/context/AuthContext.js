import React, { createContext, useReducer } from 'react';
import axios from 'axios';

const AUTH_API_URL = 'https://finsafe-tracker-api.onrender.com/api/auth'; 

const initialState = {
    user: JSON.parse(localStorage.getItem('user')) || null,
    isLoading: false,
    error: null,
};

const authReducer = (state, action) => {
    // ... (authReducer remains the same) ...
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
        case 'USER_UPDATE':
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
            const response = await axios.post(AUTH_API_URL + '/register', userData);
            localStorage.setItem('user', JSON.stringify(response.data));
            dispatch({ type: 'AUTH_SUCCESS', payload: response.data });
        } catch (error) {
            dispatch({ type: 'AUTH_FAIL', payload: error.response?.data?.message || error.message });
        }
    };

    const login = async (username, password) => {
        dispatch({ type: 'AUTH_START' });
        try {
            // ✅ FIX 4: Correct login payload: map username input to backend's 'name' field
            const response = await axios.post(AUTH_API_URL + '/login', { name: username, password: password }); 
            if (response.status !== 200) {
                throw new Error(response.data.message || 'Login failed');
            }
            localStorage.setItem('user', JSON.stringify(response.data));
            dispatch({ type: 'AUTH_SUCCESS', payload: response.data });
            return true;
        } catch (error) {
            dispatch({ type: 'AUTH_FAIL', payload: error.response?.data?.message || error.message });
            return false;
        }
    };

    const logout = () => {
        localStorage.removeItem('user');
        dispatch({ type: 'LOGOUT' });
    };

    const updateUser = async (userData) => {
        dispatch({ type: 'AUTH_START' });
        try {
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

            const res = await axios.put(AUTH_API_URL + '/settings', userData, config);

            dispatch({ type: 'UPDATE_SUCCESS', payload: res.data });
            return true;
        } catch (error) {
            const message = error.response?.data?.message || error.message || 'Update failed';
            dispatch({ type: 'AUTH_FAIL', payload: message });
            console.error('Update user error:', message);
            return false;
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
