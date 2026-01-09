import React, { useState, useEffect } from 'react';

function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // API credentials for test merchant
  const apiCredentials = {
    apiKey: 'key_test_abc123',
    apiSecret: 'secret_test_xyz789'
  };

  // Fetch transactions from API
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/v1/payments', {
          method: 'GET',
          headers: {
            'X-Api-Key': apiCredentials.apiKey,
            'X-Api-Secret': apiCredentials.apiSecret,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          
          // Transform data to match our table format
          const transformedTransactions = data.map(payment => ({
            id: payment.id,
            orderId: payment.order_id,
            amount: payment.amount,
            method: payment.method,
            status: payment.status,
            createdAt: payment.created_at || payment.createdAt
          }));
          
          setTransactions(transformedTransactions);
        } else {
          const errorData = await response.json();
          setError(errorData.error?.description || 'Failed to fetch transactions');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTransactions();
  }, []);

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
          <h2>Loading transactions...</h2>
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
          }}>Transactions</h1>
          <p style={{
            color: '#6c757d',
            marginTop: '8px'
          }}>View all payment transactions</p>
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
        
        <div style={{
          backgroundColor: 'white',
          padding: '25px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px'
          }}>
            <h2 style={{
              margin: 0,
              color: '#495057',
              fontSize: '1.5rem'
            }}>Transaction History</h2>
            <span style={{
              color: '#6c757d',
              fontSize: '0.9rem'
            }}>{transactions.length} records</span>
          </div>
          
          <div style={{ overflowX: 'auto' }}>
            <table data-test-id="transactions-table" style={{
              width: '100%',
              borderCollapse: 'collapse',
              minWidth: '800px'
            }}>
              <thead>
                <tr style={{
                  backgroundColor: '#f8f9fa',
                  borderBottom: '2px solid #e9ecef'
                }}>
                  <th style={{
                    padding: '15px 10px',
                    textAlign: 'left',
                    fontWeight: '600',
                    color: '#495057'
                  }}>Payment ID</th>
                  <th style={{
                    padding: '15px 10px',
                    textAlign: 'left',
                    fontWeight: '600',
                    color: '#495057'
                  }}>Order ID</th>
                  <th style={{
                    padding: '15px 10px',
                    textAlign: 'right',
                    fontWeight: '600',
                    color: '#495057'
                  }}>Amount</th>
                  <th style={{
                    padding: '15px 10px',
                    textAlign: 'left',
                    fontWeight: '600',
                    color: '#495057'
                  }}>Method</th>
                  <th style={{
                    padding: '15px 10px',
                    textAlign: 'left',
                    fontWeight: '600',
                    color: '#495057'
                  }}>Status</th>
                  <th style={{
                    padding: '15px 10px',
                    textAlign: 'left',
                    fontWeight: '600',
                    color: '#495057'
                  }}>Created</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length > 0 ? (
                  transactions.map((transaction) => (
                    <tr 
                      key={transaction.id} 
                      data-test-id="transaction-row" 
                      data-payment-id={transaction.id}
                      style={{
                        borderBottom: '1px solid #e9ecef',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseOver={(e) => e.target.style.backgroundColor = '#f8f9fa'}
                      onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                    >
                      <td data-test-id="payment-id" style={{
                        padding: '15px 10px',
                        color: '#495057'
                      }}>{transaction.id}</td>
                      <td data-test-id="order-id" style={{
                        padding: '15px 10px',
                        color: '#495057'
                      }}>{transaction.orderId}</td>
                      <td data-test-id="amount" style={{
                        padding: '15px 10px',
                        color: '#28a745',
                        fontWeight: '500',
                        textAlign: 'right'
                      }}>₹{(transaction.amount / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td data-test-id="method" style={{
                        padding: '15px 10px',
                        color: '#6c757d'
                      }}>{transaction.method.toUpperCase()}</td>
                      <td data-test-id="status" style={{
                        padding: '15px 10px',
                        color: transaction.status === 'success' ? '#28a745' : transaction.status === 'failed' ? '#dc3545' : '#ffc107',
                        fontWeight: '500'
                      }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '12px',
                          backgroundColor: transaction.status === 'success' ? 'rgba(40, 167, 69, 0.1)' : transaction.status === 'failed' ? 'rgba(220, 53, 69, 0.1)' : 'rgba(255, 193, 7, 0.1)',
                          marginRight: '8px'
                        }}></span>
                        {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                      </td>
                      <td data-test-id="created-at" style={{
                        padding: '15px 10px',
                        color: '#6c757d'
                      }}>{transaction.createdAt}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" style={{
                      padding: '30px',
                      textAlign: 'center',
                      color: '#6c757d'
                    }}>
                      No transactions found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Transactions;