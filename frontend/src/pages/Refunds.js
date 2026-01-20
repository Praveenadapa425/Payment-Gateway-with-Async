import React, { useState, useEffect } from 'react';
import { getRefunds, getRefund } from '../utils/api';

function Refunds() {
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // API credentials from localStorage
  const apiCredentials = {
    apiKey: localStorage.getItem('apiKey') || 'key_test_abc123',
    apiSecret: localStorage.getItem('apiSecret') || 'secret_test_xyz789'
  };

  // Fetch refunds from API
  useEffect(() => {
    const fetchRefunds = async () => {
      try {
        setLoading(true);
        const result = await getRefunds(apiCredentials);
        
        if (result.success) {
          // Transform data to match our table format
          // The API returns an object with a 'data' property containing the refunds array
          const refundsArray = Array.isArray(result.data.data) ? result.data.data : [];
          const transformedRefunds = refundsArray.map(refund => ({
            id: refund.id,
            paymentId: refund.paymentId, // Changed from refund.payment_id to refund.paymentId
            amount: refund.amount,
            reason: refund.reason,
            status: refund.status,
            createdAt: refund.created_at || refund.createdAt, // Handle both possible field names
            processedAt: refund.processed_at || refund.processedAt // Handle both possible field names
          }));
          
          setRefunds(transformedRefunds);
        } else {
          // Handle error case
          const errorObj = result.data?.error || result.data;
          setError(errorObj?.description || errorObj?.message || 'Failed to fetch refunds');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchRefunds();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('apiKey');
    localStorage.removeItem('apiSecret');
    window.location.href = '/login';
  };

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
          <h2>Loading refunds...</h2>
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
            }}>Refunds</h1>
            <p style={{
              color: '#6c757d',
              marginTop: '8px'
            }}>View all refund transactions</p>
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
            }}>Refund History</h2>
            <span style={{
              color: '#6c757d',
              fontSize: '0.9rem'
            }}>{refunds.length} refunds</span>
          </div>
          
          <div style={{ overflowX: 'auto' }}>
            <table data-test-id="refunds-table" style={{
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
                  }}>Refund ID</th>
                  <th style={{
                    padding: '15px 10px',
                    textAlign: 'left',
                    fontWeight: '600',
                    color: '#495057'
                  }}>Payment ID</th>
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
                  }}>Reason</th>
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
                  }}>Processed</th>
                  <th style={{
                    padding: '15px 10px',
                    textAlign: 'left',
                    fontWeight: '600',
                    color: '#495057'
                  }}>Created</th>
                </tr>
              </thead>
              <tbody>
                {refunds.length > 0 ? (
                  refunds.map((refund) => (
                    <tr 
                      key={refund.id}
                      data-test-id="refund-row"
                      data-refund-id={refund.id}
                      style={{
                        borderBottom: '1px solid #e9ecef',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseOver={(e) => e.target.style.backgroundColor = '#f8f9fa'}
                      onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                    >
                      <td data-test-id="refund-id" style={{
                        padding: '15px 10px',
                        color: '#495057',
                        fontFamily: 'monospace',
                        fontSize: '0.9em'
                      }}>{refund.id}</td>
                      <td data-test-id="payment-id" style={{
                        padding: '15px 10px',
                        color: '#495057',
                        fontFamily: 'monospace',
                        fontSize: '0.9em'
                      }}>{refund.paymentId}</td>
                      <td data-test-id="amount" style={{
                        padding: '15px 10px',
                        color: '#dc3545',
                        fontWeight: '500',
                        textAlign: 'right'
                      }}>₹{(refund.amount / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td data-test-id="reason" style={{
                        padding: '15px 10px',
                        color: '#6c757d'
                      }}>{refund.reason}</td>
                      <td data-test-id="status" style={{
                        padding: '15px 10px',
                        color: refund.status === 'processed' ? '#28a745' : refund.status === 'failed' ? '#dc3545' : '#ffc107',
                        fontWeight: '500'
                      }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '12px',
                          backgroundColor: refund.status === 'processed' ? 'rgba(40, 167, 69, 0.1)' : refund.status === 'failed' ? 'rgba(220, 53, 69, 0.1)' : 'rgba(255, 193, 7, 0.1)',
                          marginRight: '8px'
                        }}></span>
                        {refund.status.charAt(0).toUpperCase() + refund.status.slice(1)}
                      </td>
                      <td data-test-id="processed-at" style={{
                        padding: '15px 10px',
                        color: '#6c757d',
                        fontSize: '0.9em'
                      }}>{refund.processedAt || '-'}</td>
                      <td data-test-id="created-at" style={{
                        padding: '15px 10px',
                        color: '#6c757d',
                        fontSize: '0.9em'
                      }}>{refund.createdAt}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" style={{
                      padding: '30px',
                      textAlign: 'center',
                      color: '#6c757d'
                    }}>
                      No refunds found
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

export default Refunds;