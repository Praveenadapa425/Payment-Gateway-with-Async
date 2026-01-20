import React, { useState, useEffect } from 'react';
import { getWebhooks, createWebhook, getWebhookLogs } from '../utils/api';

function Webhooks() {
  const [webhooks, setWebhooks] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newWebhook, setNewWebhook] = useState({
    url: '',
    events: ['payment.success']
  });
  const [showForm, setShowForm] = useState(false);

  // API credentials from localStorage
  const apiCredentials = {
    apiKey: localStorage.getItem('apiKey') || 'key_test_abc123',
    apiSecret: localStorage.getItem('apiSecret') || 'secret_test_xyz789'
  };

  // Fetch webhooks and logs from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [webhooksResult, logsResult] = await Promise.all([
          getWebhooks(apiCredentials),
          getWebhookLogs(apiCredentials)
        ]);

        if (webhooksResult.success) {
          setWebhooks(webhooksResult.data);
        } else {
          setError(webhooksResult.data.error?.description || 'Failed to fetch webhooks');
        }

        if (logsResult.success) {
          // Extract logs from the response (the webhook endpoint returns both configs and logs)
          // Since the endpoint returns webhook logs, we use the data directly
          setLogs(Array.isArray(logsResult.data.data) ? logsResult.data.data : []);
        } else {
          console.error('Failed to fetch webhook logs:', logsResult.data.error?.description);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleCreateWebhook = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const result = await createWebhook(newWebhook, apiCredentials);
      if (result.success) {
        alert('Webhook created successfully!');
        setNewWebhook({ url: '', events: ['payment.success'] });
        setShowForm(false);
        // Refresh data
        const webhooksResult = await getWebhooks(apiCredentials);
        if (webhooksResult.success) {
          setWebhooks(webhooksResult.data);
        }
      } else {
        setError(result.data.error?.description || 'Failed to create webhook');
      }
    } catch (err) {
      setError(err.message);
    }
  };

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
          <h2>Loading webhooks...</h2>
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
            }}>Webhook Management</h1>
            <p style={{
              color: '#6c757d',
              marginTop: '8px'
            }}>Manage webhook endpoints and view delivery logs</p>
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
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          marginBottom: '30px'
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
            }}>Webhook Endpoints</h2>
            <button
              onClick={() => setShowForm(!showForm)}
              style={{
                padding: '10px 16px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              {showForm ? 'Cancel' : 'Create Webhook'}
            </button>
          </div>
          
          {showForm && (
            <form onSubmit={handleCreateWebhook} style={{
              marginBottom: '20px',
              padding: '20px',
              backgroundColor: '#f8f9fa',
              borderRadius: '6px'
            }}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                  Webhook URL:
                </label>
                <input
                  type="text"
                  value={newWebhook.url}
                  onChange={(e) => setNewWebhook({...newWebhook, url: e.target.value})}
                  placeholder="https://your-domain.com/webhook"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    fontSize: '1rem'
                  }}
                  required
                />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                  Events:
                </label>
                <select
                  multiple
                  value={newWebhook.events}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions, option => option.value);
                    setNewWebhook({...newWebhook, events: selected});
                  }}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    fontSize: '1rem'
                  }}
                >
                  <option value="payment.success">Payment Success</option>
                  <option value="payment.failed">Payment Failed</option>
                  <option value="payment.pending">Payment Pending</option>
                  <option value="refund.processed">Refund Processed</option>
                  <option value="refund.failed">Refund Failed</option>
                </select>
                <small style={{ color: '#6c757d', display: 'block', marginTop: '5px' }}>
                  Hold Ctrl/Cmd to select multiple events
                </small>
              </div>
              <button
                type="submit"
                style={{
                  padding: '10px 16px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Create Webhook
              </button>
            </form>
          )}
          
          <div style={{ overflowX: 'auto' }}>
            <table style={{
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
                  }}>ID</th>
                  <th style={{
                    padding: '15px 10px',
                    textAlign: 'left',
                    fontWeight: '600',
                    color: '#495057'
                  }}>URL</th>
                  <th style={{
                    padding: '15px 10px',
                    textAlign: 'left',
                    fontWeight: '600',
                    color: '#495057'
                  }}>Events</th>
                  <th style={{
                    padding: '15px 10px',
                    textAlign: 'left',
                    fontWeight: '600',
                    color: '#495057'
                  }}>Active</th>
                  <th style={{
                    padding: '15px 10px',
                    textAlign: 'left',
                    fontWeight: '600',
                    color: '#495057'
                  }}>Created</th>
                </tr>
              </thead>
              <tbody>
                {webhooks.length > 0 ? (
                  webhooks.map((webhook) => (
                    <tr 
                      key={webhook.id}
                      style={{
                        borderBottom: '1px solid #e9ecef',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseOver={(e) => e.target.style.backgroundColor = '#f8f9fa'}
                      onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                    >
                      <td style={{
                        padding: '15px 10px',
                        color: '#495057',
                        fontFamily: 'monospace',
                        fontSize: '0.9em'
                      }}>{webhook.id}</td>
                      <td style={{
                        padding: '15px 10px',
                        color: '#007bff'
                      }}>{webhook.url}</td>
                      <td style={{
                        padding: '15px 10px',
                        color: '#6c757d'
                      }}>
                        {Array.isArray(webhook.events) ? webhook.events.join(', ') : webhook.events}
                      </td>
                      <td style={{
                        padding: '15px 10px',
                        color: webhook.active ? '#28a745' : '#dc3545',
                        fontWeight: '500'
                      }}>
                        {webhook.active ? 'Yes' : 'No'}
                      </td>
                      <td style={{
                        padding: '15px 10px',
                        color: '#6c757d'
                      }}>{webhook.created_at}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" style={{
                      padding: '30px',
                      textAlign: 'center',
                      color: '#6c757d'
                    }}>
                      No webhooks configured
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{
          backgroundColor: 'white',
          padding: '25px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{
            margin: '0 0 20px 0',
            color: '#495057',
            fontSize: '1.5rem'
          }}>Recent Webhook Logs</h2>
          
          <div style={{ overflowX: 'auto' }}>
            <table style={{
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
                  }}>Event</th>
                  <th style={{
                    padding: '15px 10px',
                    textAlign: 'left',
                    fontWeight: '600',
                    color: '#495057'
                  }}>URL</th>
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
                  }}>Attempts</th>
                  <th style={{
                    padding: '15px 10px',
                    textAlign: 'left',
                    fontWeight: '600',
                    color: '#495057'
                  }}>Created</th>
                </tr>
              </thead>
              <tbody>
                {logs.slice(0, 10).length > 0 ? (  // Show only last 10 logs
                  logs.slice(0, 10).map((log, index) => (
                    <tr 
                      key={index}
                      style={{
                        borderBottom: '1px solid #e9ecef',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseOver={(e) => e.target.style.backgroundColor = '#f8f9fa'}
                      onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                    >
                      <td style={{
                        padding: '15px 10px',
                        color: '#495057'
                      }}>{log.event}</td>
                      <td style={{
                        padding: '15px 10px',
                        color: '#007bff',
                        fontSize: '0.9em'
                      }}>{webhooks[0]?.url || 'N/A'}</td>
                      <td style={{
                        padding: '15px 10px',
                        color: log.status === 'delivered' ? '#28a745' : log.status === 'failed' ? '#dc3545' : '#ffc107',
                        fontWeight: '500'
                      }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '12px',
                          backgroundColor: log.status === 'delivered' ? 'rgba(40, 167, 69, 0.1)' : log.status === 'failed' ? 'rgba(220, 53, 69, 0.1)' : 'rgba(255, 193, 7, 0.1)',
                          marginRight: '8px'
                        }}></span>
                        {log.status.charAt(0).toUpperCase() + log.status.slice(1)}
                      </td>
                      <td style={{
                        padding: '15px 10px',
                        color: '#6c757d'
                      }}>{log.attempts}</td>
                      <td style={{
                        padding: '15px 10px',
                        color: '#6c757d'
                      }}>{log.created_at}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" style={{
                      padding: '30px',
                      textAlign: 'center',
                      color: '#6c757d'
                    }}>
                      No webhook logs available
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

export default Webhooks;