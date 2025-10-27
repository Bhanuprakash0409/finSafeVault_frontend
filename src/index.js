// frontend/src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // Keep this for basic styles
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { TransactionProvider } from './context/TransactionContext';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AuthProvider>
      <TransactionProvider> {/* Nested inside AuthProvider */}
        <App />
      </TransactionProvider>
    </AuthProvider>
  </React.StrictMode>
);