import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);

  const navStyle = {
    backgroundColor: '#333',
    padding: '15px',
    color: 'white',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
  };
  const containerStyle = {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  };
  const linkStyle = {
    color: 'white',
    textDecoration: 'none',
    padding: '0 10px',
    fontWeight: '500'
  };
  const logoutButtonStyle = {
    backgroundColor: '#D9534F',
    color: 'white',
    border: 'none',
    padding: '8px 12px',
    borderRadius: '4px',
    cursor: 'pointer',
    marginLeft: '15px'
  };

  return (
    <nav style={navStyle}>
      <div style={containerStyle}>
        <Link to="/" style={{ ...linkStyle, fontSize: '24px', color: '#4CAF50', fontWeight: 'bold' }}>
          FinSafe Expense Tracker
        </Link>
        <div>
          {user ? (
            <>
              <Link to="/dashboard" style={linkStyle}>
                Dashboard
              </Link>
              {/* REMOVED: Vault Link */}
              <Link to="/settings" style={linkStyle}>
                Settings
              </Link>
              <button onClick={logout} style={logoutButtonStyle}>
                Logout ({user.name.split(' ')[0]})
              </button>
            </>
          ) : (
            <>
              <Link to="/login" style={linkStyle}>
                Login
              </Link>
              <Link to="/register" style={linkStyle}>
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;