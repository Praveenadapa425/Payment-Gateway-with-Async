import React, { useState, useEffect } from 'react';
import OrderCreator from '../components/OrderCreator';

function Dashboard() {
  const [apiCredentials] = useState({
    apiKey: 'key_test_abc123',
    apiSecret: 'secret_test_xyz789'
  });
  
  const [stats, setStats] = useState({
    totalTransactions: 0,
    totalAmount: 0,
    successRate: 0
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch stats from API
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        // Get orders to calculate stats
        const response = await fetch('/api/v1/orders', {
          method: 'GET',
          headers: {
            'X-Api-Key': apiCredentials.apiKey,
            'X-Api-Secret': apiCredentials.apiSecret,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          
          // Calculate stats from fetched orders
          const totalTransactions = data.length;
          const totalAmount = data.reduce((sum, order) => sum + order.amount, 0);
          
          // For success rate, we'd need to fetch payments as well
          const paymentResponse = await fetch('/api/v1/payments', {
            method: 'GET',
            headers: {
              'X-Api-Key': apiCredentials.apiKey,
              'X-Api-Secret': apiCredentials.apiSecret,
              'Content-Type': 'application/json'
            }
          });
          
          if (paymentResponse.ok) {
            const payments = await paymentResponse.json();
            const successfulPayments = payments.filter(p => p.status === 'success').length;
            const successRate = payments.length > 0 ? Math.round((successfulPayments / payments.length) * 100) : 0;
            
            // Calculate total amount from successful payments only (as per requirements)
            const totalAmountFromPayments = payments
              .filter(p => p.status === 'success')
              .reduce((sum, payment) => sum + (payment.amount || 0), 0);
            
            setStats({
              totalTransactions: payments.length, // Total transactions should be from payments, not orders
              totalAmount: totalAmountFromPayments,
              successRate: successRate
            });
          } else {
            setStats({
              totalTransactions: totalTransactions,
              totalAmount: totalAmount,
              successRate: 0
            });
          }
        } else {
          const errorData = await response.json();
          setError(errorData.error?.description || 'Failed to fetch stats');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
  }, [apiCredentials]);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        padding: '20px'
      }}>
        <div style={{
          textAlign: 'center',
          color: '#6c757d'
        }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '4px solid rgba(0, 123, 255, 0.2)',
            borderTop: '4px solid #007bff',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }}></div>
          <h2>Loading dashboard...</h2>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: '#f8f9fa',
      minHeight: '100vh',
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <header style={{
          marginBottom: '30px',
          padding: '20px 0',
          borderBottom: '1px solid #e9ecef'
        }}>
          <h1 style={{
            margin: 0,
            fontSize: '2rem',
            color: '#343a40'
          }}>Dashboard</h1>
          <p style={{
            color: '#6c757d',
            marginTop: '8px'
          }}>Welcome to your payment gateway dashboard</p>
        </header>
        
        {error && (
          <div data-test-id="error-message" style={{
            padding: '15px',
            backgroundColor: '#f8d7da',
            color: '#721c24',
            border: '1px solid #f5c6cb',
            borderRadius: '6px',
            marginBottom: '20px'
          }}>
            <strong>Error:</strong> {error}
          </div>
        )}
        
        <div data-test-id="dashboard">
          {/* API Credentials Section */}
          <div data-test-id="api-credentials" style={{
            backgroundColor: 'white',
            padding: '25px',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            marginBottom: '30px'
          }}>
            <h3 style={{
              margin: '0 0 15px 0',
              color: '#495057',
              fontSize: '1.3rem'
            }}>API Credentials</h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'auto 1fr',
              gap: '15px',
              alignItems: 'center'
            }}>
              <label style={{
                fontWeight: '500',
                color: '#495057'
              }}>API Key:</label>
              <div style={{
                position: 'relative'
              }}>
                <span data-test-id="api-key" style={{
                  backgroundColor: '#f8f9fa',
                  padding: '10px 15px',
                  borderRadius: '6px',
                  border: '1px solid #e9ecef',
                  fontFamily: 'monospace',
                  fontSize: '0.9rem',
                  wordBreak: 'break-all'
                }}>{apiCredentials.apiKey}</span>
              </div>
              <label style={{
                fontWeight: '500',
                color: '#495057'
              }}>API Secret:</label>
              <div style={{
                position: 'relative'
              }}>
                <span data-test-id="api-secret" style={{
                  backgroundColor: '#f8f9fa',
                  padding: '10px 15px',
                  borderRadius: '6px',
                  border: '1px solid #e9ecef',
                  fontFamily: 'monospace',
                  fontSize: '0.9rem',
                  wordBreak: 'break-all'
                }}>{apiCredentials.apiSecret}</span>
              </div>
            </div>
          </div>
          
          {/* Stats Container */}
          <div data-test-id="stats-container" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '20px',
            marginBottom: '30px'
          }}>
            <div data-test-id="total-transactions" style={{
              backgroundColor: 'white',
              padding: '25px',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '2.5rem',
                fontWeight: 'bold',
                color: '#007bff',
                marginBottom: '10px'
              }}>
                {stats.totalTransactions}
              </div>
              <h4 style={{
                margin: 0,
                color: '#495057',
                fontSize: '1rem'
              }}>Total Transactions</h4>
            </div>
            <div data-test-id="total-amount" style={{
              backgroundColor: 'white',
              padding: '25px',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '2.5rem',
                fontWeight: 'bold',
                color: '#28a745',
                marginBottom: '10px'
              }}>
                ₹{(stats.totalAmount / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <h4 style={{
                margin: 0,
                color: '#495057',
                fontSize: '1rem'
              }}>Total Amount</h4>
            </div>
            <div data-test-id="success-rate" style={{
              backgroundColor: 'white',
              padding: '25px',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '2.5rem',
                fontWeight: 'bold',
                color: '#ffc107',
                marginBottom: '10px'
              }}>
                {stats.successRate}%
              </div>
              <h4 style={{
                margin: 0,
                color: '#495057',
                fontSize: '1rem'
              }}>Success Rate</h4>
            </div>
          </div>
          
          <div style={{
            display: 'flex',
            gap: '15px',
            marginBottom: '30px',
            flexWrap: 'wrap'
          }}>
            <a href="/dashboard/transactions" style={{
              padding: '12px 24px',
              backgroundColor: '#007bff',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '6px',
              fontWeight: '500',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#0069d9'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#007bff'}>
              View Transactions
            </a>
            <a href="/dashboard" style={{
              padding: '12px 24px',
              backgroundColor: '#6c757d',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '6px',
              fontWeight: '500',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#5a6268'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#6c757d'}>
              Refresh Data
            </a>
          </div>
          
          <div style={{
            backgroundColor: 'white',
            padding: '25px',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{
              margin: '0 0 20px 0',
              color: '#495057',
              fontSize: '1.3rem'
            }}>Create New Order</h3>
            <OrderCreator apiCredentials={apiCredentials} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;