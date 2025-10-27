import React, { useEffect, useState, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const API_URL = 'http://localhost:5000/api/auth/settings/confirm-name';

const ConfirmNameChangePage = () => {
    const [status, setStatus] = useState('Confirming your new username...');
    const location = useLocation();
    const navigate = useNavigate();
    const { updateUser } = useContext(AuthContext);

    useEffect(() => {
        const token = new URLSearchParams(location.search).get('token');

        if (!token) {
            setStatus('Error: No confirmation token found. Please try again.');
            return;
        }

        const confirmName = async () => {
            try {
                // The backend expects a POST request with the token in the body
                const response = await axios.post(API_URL, { token });

                // On success, the backend sends back the updated user object and a new JWT
                const { user, message } = response.data;
                
                // Update the global user state and local storage with the new details
                updateUser(user, true); // `true` forces a full user object replacement

                setStatus(message);

                // Redirect to the settings page after a short delay
                setTimeout(() => {
                    navigate('/settings');
                }, 3000);

            } catch (error) {
                const errorMessage = error.response?.data?.message || 'An unknown error occurred.';
                setStatus(`Error: ${errorMessage}`);
            }
        };

        confirmName();
    }, [location, navigate, updateUser]);

    const containerStyle = {
        maxWidth: '600px',
        margin: '50px auto',
        padding: '20px',
        textAlign: 'center',
        border: '1px solid #CCC',
        borderRadius: '8px',
        backgroundColor: 'white',
    };

    return (
        <div style={containerStyle}>
            <h2>Username Change Confirmation</h2>
            <p>{status}</p>
        </div>
    );
};

export default ConfirmNameChangePage;