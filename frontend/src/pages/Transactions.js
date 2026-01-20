import React, { useState, useEffect } from 'react';
import { fetchPayments, capturePayment, createRefund, getHealth } from '../utils/api';

function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0); // State to trigger refresh
  const [actionLoading, setActionLoading] = useState({}); // Track loading state for individual actions
  const [actionErrors, setActionErrors] = useState({}); // Track errors for individual actions
  const [healthStatus, setHealthStatus] = useState(null); // Health status of the system
  
  // API credentials from localStorage
  const apiCredentials = {
    apiKey: localStorage.getItem('apiKey') || 'key_test_abc123',
    apiSecret: localStorage.getItem('apiSecret') || 'secret_test_xyz789'
  };

  // Fetch transactions from API
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        const result = await fetchPayments(apiCredentials);
        
        if (result.success) {
          // Transform data to match our table format
          const transformedTransactions = result.data.map(payment => ({
            id: payment.id,
            orderId: payment.order_id,
            amount: payment.amount,
            currency: payment.currency,
            method: payment.method,
            status: payment.status,
            vpa: payment.vpa,
            card_network: payment.card_network,
            card_last4: payment.card_last4,
            captured: payment.captured,
            error_code: payment.error_code,
            error_description: payment.error_description,
            createdAt: payment.created_at || payment.createdAt,
            updatedAt: payment.updated_at
          }));
          
          setTransactions(transformedTransactions);
        } else {
          setError(result.data.error?.description || 'Failed to fetch transactions');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    const fetchHealthStatus = async () => {
      try {
        const result = await getHealth();
        if (result.success) {
          setHealthStatus(result.data);
        }
      } catch (err) {
        console.error('Failed to fetch health status:', err);
      }
    };
    
    fetchTransactions();
    fetchHealthStatus(); // Fetch health status on initial load
  }, [refreshTrigger]); // Include refreshTrigger in dependency array

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

  const handleLogout = () => {
    localStorage.removeItem('apiKey');
    localStorage.removeItem('apiSecret');
    window.location.href = '/login';
  };
  
  // Handler for capture action
  const handleCapture = async (paymentId) => {
    setActionLoading(prev => ({ ...prev, [paymentId]: true }));
    setActionErrors(prev => ({ ...prev, [paymentId]: null }));
    
    try {
      const result = await capturePayment(paymentId, apiCredentials);
      if (result.success) {
        alert(`Payment ${paymentId} captured successfully!`);
        // Refresh the transactions list
        setRefreshTrigger(prev => prev + 1);
      } else {
        setActionErrors(prev => ({ ...prev, [paymentId]: result.data.error?.description || 'Failed to capture payment' }));
      }
    } catch (error) {
      setActionErrors(prev => ({ ...prev, [paymentId]: error.message }));
    } finally {
      setActionLoading(prev => ({ ...prev, [paymentId]: false }));
    }
  };
  
  // Handler for refund action
  const handleRefund = async (paymentId) => {
    const amountStr = prompt('Enter refund amount (in smallest currency unit, e.g., paise for INR):', '500');
    if (!amountStr) return; // User cancelled
    
    const amount = parseInt(amountStr, 10);
    if (isNaN(amount) || amount <= 0) {
      setActionErrors(prev => ({ ...prev, [paymentId]: 'Invalid amount entered' }));
      return;
    }
    
    const reason = prompt('Enter refund reason (optional):', 'Customer request');
    
    setActionLoading(prev => ({ ...prev, [paymentId]: true }));
    setActionErrors(prev => ({ ...prev, [paymentId]: null }));
    
    try {
      const refundData = { amount, reason: reason || 'Customer request' };
      const result = await createRefund(paymentId, refundData, apiCredentials);
      if (result.success) {
        alert(`Refund created successfully for payment ${paymentId}!`);
        // Refresh the transactions list
        setRefreshTrigger(prev => prev + 1);
      } else {
        setActionErrors(prev => ({ ...prev, [paymentId]: result.data.error?.description || 'Failed to create refund' }));
      }
    } catch (error) {
      setActionErrors(prev => ({ ...prev, [paymentId]: error.message }));
    } finally {
      setActionLoading(prev => ({ ...prev, [paymentId]: false }));
    }
  };
  
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
          borderBottom: '1px solid #e9ecef',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h1 style={{
              margin: 0,
              fontSize: '2rem',
              color: '#343a40'
            }}>Transactions</h1>
            <p style={{
              color: '#6c757d',
              marginTop: '8px'
            }}>View all payment transactions</p>
            {healthStatus && (
              <div style={{
                display: 'inline-block',
                marginTop: '10px',
                padding: '5px 10px',
                borderRadius: '12px',
                backgroundColor: healthStatus.status === 'healthy' ? 'rgba(40, 167, 69, 0.1)' : 'rgba(220, 53, 69, 0.1)',
                color: healthStatus.status === 'healthy' ? '#28a745' : '#dc3545',
                fontSize: '0.8rem',
                fontWeight: '500'
              }}>
                System Status: {healthStatus.status} | DB: {healthStatus.database} | Redis: {healthStatus.redis} | Worker: {healthStatus.worker}
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            style={{
              padding: '8px 16px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.9rem'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#c82333'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#dc3545'}
          >
            Logout
          </button>
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
                  }}>Captured</th>
                  <th style={{
                    padding: '15px 10px',
                    textAlign: 'left',
                    fontWeight: '600',
                    color: '#495057'
                  }}>Actions</th>
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
                        color: '#495057',
                        fontFamily: 'monospace',
                        fontSize: '0.9em'
                      }}>{transaction.id}</td>
                      <td data-test-id="order-id" style={{
                        padding: '15px 10px',
                        color: '#495057',
                        fontFamily: 'monospace',
                        fontSize: '0.9em'
                      }}>{transaction.orderId}</td>
                      <td data-test-id="amount" style={{
                        padding: '15px 10px',
                        color: '#28a745',
                        fontWeight: '500',
                        textAlign: 'right'
                      }}>₹{(transaction.amount / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}<br />
                      <small style={{color: '#6c757d'}}>{transaction.currency}</small>
                      </td>
                      <td data-test-id="method" style={{
                        padding: '15px 10px',
                        color: '#6c757d'
                      }}>{transaction.method.toUpperCase()}<br />
                      {transaction.method === 'card' && transaction.card_network && (
                        <small style={{color: '#6c757d'}}>Card: {transaction.card_network} ****{transaction.card_last4}</small>
                      )}
                      {transaction.method === 'upi' && transaction.vpa && (
                        <small style={{color: '#6c757d'}}>VPA: {transaction.vpa}</small>
                      )}
                      </td>
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
                        {transaction.error_code && (
                          <div style={{fontSize: '0.8em', color: '#dc3545', marginTop: '4px'}}>
                            {transaction.error_code}: {transaction.error_description}
                          </div>
                        )}
                      </td>
                      <td data-test-id="captured" style={{
                        padding: '15px 10px',
                        color: transaction.captured ? '#28a745' : '#6c757d',
                        fontWeight: transaction.captured ? '500' : 'normal'
                      }}>
                        {transaction.captured ? 'Yes' : 'No'}
                      </td>
                      <td data-test-id="actions" style={{
                        padding: '15px 10px'
                      }}>
                        {actionErrors[transaction.id] && (
                          <div style={{color: '#dc3545', fontSize: '0.8em', marginBottom: '5px'}}>
                            {actionErrors[transaction.id]}
                          </div>
                        )}
                        {transaction.status === 'pending' && (
                          <button
                            onClick={() => handleCapture(transaction.id)}
                            disabled={actionLoading[transaction.id]}
                            style={{
                              padding: '6px 12px',
                              backgroundColor: '#28a745',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '0.8rem',
                              marginRight: '5px',
                              opacity: actionLoading[transaction.id] ? 0.6 : 1
                            }}
                          >
                            {actionLoading[transaction.id] ? 'Capturing...' : 'Capture'}
                          </button>
                        )}
                        {(transaction.status === 'success' || transaction.status === 'captured') && (
                          <button
                            onClick={() => handleRefund(transaction.id)}
                            disabled={actionLoading[transaction.id]}
                            style={{
                              padding: '6px 12px',
                              backgroundColor: '#ffc107',
                              color: '#212529',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '0.8rem',
                              opacity: actionLoading[transaction.id] ? 0.6 : 1
                            }}
                          >
                            {actionLoading[transaction.id] ? 'Processing...' : 'Refund'}
                          </button>
                        )}
                      </td>
                      <td data-test-id="created-at" style={{
                        padding: '15px 10px',
                        color: '#6c757d',
                        fontSize: '0.9em'
                      }}>{transaction.createdAt}<br />
                      <small>{transaction.updatedAt !== transaction.createdAt ? `Updated: ${transaction.updatedAt}` : ''}</small>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" style={{
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