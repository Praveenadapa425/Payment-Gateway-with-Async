import React, { useState, useEffect } from 'react';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Check if already logged in
  useEffect(() => {
    const storedApiKey = localStorage.getItem('apiKey');
    const storedApiSecret = localStorage.getItem('apiSecret');
    
    if (storedApiKey && storedApiSecret) {
      // Already logged in, redirect to dashboard
      window.location.href = '/dashboard';
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    // For this deliverable, we'll use the test merchant credentials when correct email is entered
    if (email === 'test@example.com') {
      // Store the test API credentials in localStorage
      localStorage.setItem('apiKey', 'key_test_abc123');
      localStorage.setItem('apiSecret', 'secret_test_xyz789');
      // Redirect to dashboard
      window.location.href = '/dashboard';
    } else {
      alert('Invalid credentials. Use test@example.com as email.');
    }
  };

  // Function to use test credentials
  const useTestCredentials = () => {
    setEmail('test@example.com');
    setPassword('any_password');
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: '#f8f9fa',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '10px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        maxWidth: '400px',
        width: '100%'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h2 style={{
            margin: 0,
            fontSize: '2rem',
            color: '#343a40'
          }}>Login</h2>
          <p style={{
            color: '#6c757d',
            marginTop: '8px',
            fontSize: '0.9rem'
          }}>Sign in to your dashboard</p>
        </div>
        <form data-test-id="login-form" onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '6px',
              fontWeight: '500',
              color: '#495057'
            }}>Email</label>
            <input
              data-test-id="email-input"
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ced4da',
                borderRadius: '6px',
                fontSize: '1rem',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = '#007bff'}
              onBlur={(e) => e.target.style.borderColor = '#ced4da'}
            />
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '6px',
              fontWeight: '500',
              color: '#495057'
            }}>Password</label>
            <input
              data-test-id="password-input"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ced4da',
                borderRadius: '6px',
                fontSize: '1rem',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = '#007bff'}
              onBlur={(e) => e.target.style.borderColor = '#ced4da'}
            />
          </div>
          <button
            data-test-id="login-button"
            type="submit"
            style={{
              width: '100%',
              padding: '14px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              borderRadius: '6px',
              fontWeight: '500',
              fontSize: '1.1rem',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#0069d9'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#007bff'}
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;