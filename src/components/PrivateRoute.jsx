import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const PrivateRoute = () => {
  const { user, isLoading } = useContext(AuthContext);

  if (isLoading) {
    return <div style={{ textAlign: 'center', marginTop: '50px', fontSize: '20px' }}>Loading...</div>;
  }

  // If user exists, render the child routes, otherwise redirect to login
  return user ? <Outlet /> : <Navigate to="/login" />;
};

export default PrivateRoute;