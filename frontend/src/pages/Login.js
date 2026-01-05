import React, { useState } from 'react';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // For this deliverable, we'll use the test merchant credentials
    if (email === 'test@example.com') {
      // Store mock authentication token
      localStorage.setItem('authToken', 'mock-token');
      // Redirect to dashboard
      window.location.href = '/dashboard';
    } else {
      alert('Invalid credentials. Use test@example.com as email.');
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '400px', margin: '100px auto' }}>
      <h2>Login</h2>
      <form data-test-id="login-form" onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <input
            data-test-id="email-input"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: '100%', padding: '10px', marginBottom: '10px' }}
          />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <input
            data-test-id="password-input"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: '100%', padding: '10px', marginBottom: '10px' }}
          />
        </div>
        <button
          data-test-id="login-button"
          type="submit"
          style={{ width: '100%', padding: '10px', backgroundColor: '#007bff', color: 'white', border: 'none', cursor: 'pointer' }}
        >
          Login
        </button>
      </form>
    </div>
  );
}

export default Login;