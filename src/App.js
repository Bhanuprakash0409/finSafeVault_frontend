import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';

// Import Pages
import LoginPage from './pages/LoginPage'; 
import RegisterPage from './pages/RegisterPage'; 
import DashboardPage from './pages/DashboardPage'; 
import SettingsPage from './pages/SettingsPage'; // Ensure this is imported
import logo from './assets/finsafe-vault.png'; // Import the logo
// import VaultPage from './pages/VaultPage'; // ⬅️ REMOVED

function App() {
  return (
    <Router>
      <Navbar />
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={
            <div style={{
              backgroundImage: `url(${logo})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              borderRadius: '12px',
              textAlign: 'center',
              color: 'white',
              marginTop: '20px',
              minHeight: 'calc(100vh - 120px)', // Adjust height to fill screen
              display: 'flex', // Center content vertically
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <div style={{ 
                display: 'inline-block',
                backgroundColor: 'rgba(0, 20, 40, 0.75)',
                padding: '25px 40px',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                fontSize: '32px', 
                fontWeight: 'bold',
                textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)'
              }}>Welcome to FinSafe Expense Tracker!</div>
            </div>
          } />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Private Routes (Requires login) */}
          <Route element={<PrivateRoute />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/settings" element={<SettingsPage />} /> {/* Settings kept */}
            {/* REMOVED: Vault Route */}
          </Route>
        </Routes>
      </main>
    </Router>
  );
}

export default App;