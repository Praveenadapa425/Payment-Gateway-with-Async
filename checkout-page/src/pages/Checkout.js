import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

function Checkout() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('order_id');
  
  const [order, setOrder] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState(''); // 'upi' or 'card'
  const [upiId, setUpiId] = useState('');
  const [cardDetails, setCardDetails] = useState({
    number: '',
    expiry: '', // Format: MM/YY
    cvv: '',
    holderName: ''
  });
  const [paymentStatus, setPaymentStatus] = useState(''); // 'idle', 'processing', 'success', 'error'
  const [paymentId, setPaymentId] = useState('');
  const [error, setError] = useState('');
  
  // Fetch order details when component mounts
  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId]);
  
  // Polling function to check payment status
  const pollPaymentStatus = async (paymentId) => {
    const poll = async () => {
      try {
        // Use the public endpoint for checking payment status
        const response = await fetch(`/api/v1/payments/${paymentId}/public`);
        const data = await response.json();
        
        if (response.ok) {
          if (data.status === 'success') {
            setPaymentStatus('success');
          } else if (data.status === 'failed') {
            setPaymentStatus('error');
            setError(data.error_description || 'Payment failed');
          } else {
            // Continue polling if status is still processing
            setTimeout(poll, 2000); // Poll every 2 seconds
          }
        } else {
          setPaymentStatus('error');
          setError(data.error?.description || 'Failed to check payment status');
        }
      } catch (err) {
        setPaymentStatus('error');
        setError('Failed to check payment status');
      }
    };
    
    poll();
  };

  const fetchOrderDetails = async () => {
    try {
      // Call the public API to get order details
      const response = await fetch(`/api/v1/orders/${orderId}/public`);
      const data = await response.json();
      
      if (response.ok) {
        setOrder(data);
      } else {
        setError(data.error?.description || 'Failed to fetch order details');
        setPaymentStatus('error');
      }
    } catch (err) {
      setError('Failed to fetch order details');
      setPaymentStatus('error');
    }
  };

  const showUPIForm = () => {
    setPaymentMethod('upi');
  };

  const showCardForm = () => {
    setPaymentMethod('card');
  };

  const handleUpiSubmit = async (e) => {
    e.preventDefault();
    
    if (!upiId) {
      setError('Please enter UPI ID');
      return;
    }

    setPaymentStatus('processing');
    setError('');

    try {
      const response = await fetch('/api/v1/payments/public', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          order_id: orderId,
          method: 'upi',
          vpa: upiId
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setPaymentId(data.id);
        // Start polling for payment status
        pollPaymentStatus(data.id);
      } else {
        setPaymentStatus('error');
        setError(data.error?.description || 'Payment failed');
      }
    } catch (err) {
      setError('Payment failed');
      setPaymentStatus('error');
    }
  };

  const handleCardSubmit = async (e) => {
    e.preventDefault();
    
    if (!cardDetails.number || !cardDetails.expiry || !cardDetails.cvv || !cardDetails.holderName) {
      setError('Please fill in all card details');
      return;
    }

    setPaymentStatus('processing');
    setError('');

    try {
      // Parse expiry date
      const [expiryMonth, expiryYear] = cardDetails.expiry.split('/').map(part => part.trim());
      
      const response = await fetch('/api/v1/payments/public', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          order_id: orderId,
          method: 'card',
          card: {
            number: cardDetails.number,
            expiry_month: expiryMonth,
            expiry_year: expiryYear,
            cvv: cardDetails.cvv,
            holder_name: cardDetails.holderName
          }
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setPaymentId(data.id);
        // Start polling for payment status
        pollPaymentStatus(data.id);
      } else {
        setPaymentStatus('error');
        setError(data.error?.description || 'Payment failed');
      }
    } catch (err) {
      setError('Payment failed');
      setPaymentStatus('error');
    }
  };

  if (!orderId) {
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
          textAlign: 'center',
          maxWidth: '400px',
          width: '100%'
        }}>
          <h2 style={{
            color: '#dc3545',
            marginBottom: '15px',
            fontSize: '1.5rem'
          }}>No order ID provided</h2>
          <p style={{
            color: '#6c757d',
            lineHeight: '1.6'
          }}>
            Please provide an order ID as a query parameter
            <br />
            <code style={{
              backgroundColor: '#f1f3f5',
              padding: '4px 8px',
              borderRadius: '4px',
              fontFamily: 'monospace',
              fontSize: '0.9rem',
              color: '#495057'
            }}>?order_id=xxx</code>
          </p>
        </div>
      </div>
    );
  }

  if (paymentStatus === 'success') {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#f8f9fa',
        padding: '20px'
      }}>
        <div data-test-id="success-state" style={{
          backgroundColor: 'white',
          padding: '40px',
          borderRadius: '10px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          textAlign: 'center',
          maxWidth: '400px',
          width: '100%'
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            backgroundColor: '#d4edda',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px'
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="#28a745" viewBox="0 0 16 16">
              <path d="M12.736 3.97a.733.733 0 0 1 1.047 0c.286.289.29.756.01 1.05L7.88 12.01a.733.733 0 0 1-1.065.02L3.217 8.384a.757.757 0 0 1 0-1.06.733.733 0 0 1 1.047 0l3.052 3.093 5.4-6.425a.247.247 0 0 1 .02-.022Z"/>
            </svg>
          </div>
          <h2 style={{
            color: '#155724',
            marginBottom: '15px',
            fontSize: '1.5rem'
          }}>Payment Successful!</h2>
          <div style={{
            backgroundColor: '#f8f9fa',
            padding: '10px',
            borderRadius: '5px',
            marginBottom: '15px',
            textAlign: 'left'
          }}>
            <strong>Payment ID:</strong> <span data-test-id="payment-id" style={{ color: '#495057' }}>{paymentId}</span>
          </div>
          <p data-test-id="success-message" style={{
            color: '#6c757d',
            marginBottom: '25px',
            lineHeight: '1.6'
          }}>
            Your payment has been processed successfully
          </p>
          <button 
            onClick={() => window.location.href = '/'} 
            style={{
              padding: '12px 24px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              borderRadius: '6px',
              fontWeight: '500',
              fontSize: '1rem',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#218838'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#28a745'}
          >
            New Payment
          </button>
        </div>
      </div>
    );
  }

  if (paymentStatus === 'error') {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#f8f9fa',
        padding: '20px'
      }}>
        <div data-test-id="error-state" style={{
          backgroundColor: 'white',
          padding: '40px',
          borderRadius: '10px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          textAlign: 'center',
          maxWidth: '400px',
          width: '100%'
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            backgroundColor: '#f8d7da',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px'
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="#dc3545" viewBox="0 0 16 16">
              <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
            </svg>
          </div>
          <h2 style={{
            color: '#721c24',
            marginBottom: '15px',
            fontSize: '1.5rem'
          }}>Payment Failed</h2>
          <p data-test-id="error-message" style={{
            color: '#6c757d',
            marginBottom: '25px',
            lineHeight: '1.6'
          }}>
            {error || 'Payment could not be processed'}
          </p>
          <button 
            data-test-id="retry-button"
            onClick={() => setPaymentStatus('idle')}
            style={{
              padding: '12px 24px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              borderRadius: '6px',
              fontWeight: '500',
              fontSize: '1rem',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#0069d9'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#007bff'}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'flex-start',
      minHeight: '100vh',
      backgroundColor: '#f8f9fa',
      padding: '20px',
      paddingTop: '60px'
    }}>
      <div data-test-id="checkout-container" style={{
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '10px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        maxWidth: '500px',
        width: '100%'
      }}>
        {/* Order Summary */}
        <div data-test-id="order-summary" style={{
          marginBottom: '25px',
          padding: '20px',
          border: '1px solid #e9ecef',
          borderRadius: '8px',
          backgroundColor: '#f8f9fa'
        }}>
          <h2 style={{
            margin: '0 0 15px 0',
            fontSize: '1.4rem',
            color: '#495057'
          }}>Complete Payment</h2>
          {order ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '10px', alignItems: 'center' }}>
              <span style={{ fontWeight: '500', color: '#495057' }}>Amount:</span>
              <span data-test-id="order-amount" style={{
                fontSize: '1.3rem',
                fontWeight: 'bold',
                color: '#28a745'
              }}>
                ₹{(order.amount / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span style={{ fontWeight: '500', color: '#495057' }}>Order ID:</span>
              <span data-test-id="order-id" style={{
                color: '#6c757d',
                fontFamily: 'monospace',
                fontSize: '0.9rem'
              }}>{order.id}</span>
            </div>
          ) : (
            <p style={{ margin: 0, color: '#6c757d' }}>Loading order details...</p>
          )}
        </div>

        {/* Payment Method Selection */}
        <div data-test-id="payment-methods" style={{
          marginBottom: '25px',
          display: 'flex',
          gap: '10px'
        }}>
          <button
            data-test-id="method-upi"
            data-method="upi"
            onClick={showUPIForm}
            style={{
              flex: 1,
              padding: '12px 15px',
              backgroundColor: paymentMethod === 'upi' ? '#007bff' : '#f8f9fa',
              color: paymentMethod === 'upi' ? 'white' : '#495057',
              border: '1px solid #dee2e6',
              cursor: 'pointer',
              borderRadius: '6px',
              fontWeight: paymentMethod === 'upi' ? '500' : 'normal',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => {
              if (paymentMethod !== 'upi') e.target.style.borderColor = '#adb5bd';
            }}
            onMouseOut={(e) => {
              if (paymentMethod !== 'upi') e.target.style.borderColor = '#dee2e6';
            }}
          >
            UPI
          </button>
          <button
            data-test-id="method-card"
            data-method="card"
            onClick={showCardForm}
            style={{
              flex: 1,
              padding: '12px 15px',
              backgroundColor: paymentMethod === 'card' ? '#007bff' : '#f8f9fa',
              color: paymentMethod === 'card' ? 'white' : '#495057',
              border: '1px solid #dee2e6',
              cursor: 'pointer',
              borderRadius: '6px',
              fontWeight: paymentMethod === 'card' ? '500' : 'normal',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => {
              if (paymentMethod !== 'card') e.target.style.borderColor = '#adb5bd';
            }}
            onMouseOut={(e) => {
              if (paymentMethod !== 'card') e.target.style.borderColor = '#dee2e6';
            }}
          >
            Card
          </button>
        </div>

        {/* UPI Payment Form */}
        {paymentMethod === 'upi' && (
          <form data-test-id="upi-form" onSubmit={handleUpiSubmit} style={{ marginBottom: '20px' }}>
            <div style={{ marginBottom: '15px' }}>
              <label style={{
                display: 'block',
                marginBottom: '6px',
                fontWeight: '500',
                color: '#495057'
              }}>UPI ID</label>
              <input
                data-test-id="vpa-input"
                placeholder="username@bank"
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
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
              data-test-id="pay-button"
              type="submit"
              style={{
                width: '100%',
                padding: '14px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
                borderRadius: '6px',
                fontWeight: '500',
                fontSize: '1.1rem',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#218838'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#28a745'}
            >
              Pay ₹{(order?.amount / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </button>
          </form>
        )}

        {/* Card Payment Form */}
        {paymentMethod === 'card' && (
          <form data-test-id="card-form" onSubmit={handleCardSubmit} style={{ marginBottom: '20px' }}>
            <div style={{ marginBottom: '15px' }}>
              <label style={{
                display: 'block',
                marginBottom: '6px',
                fontWeight: '500',
                color: '#495057'
              }}>Card Number</label>
              <input
                data-test-id="card-number-input"
                placeholder="Card Number"
                type="text"
                value={cardDetails.number}
                onChange={(e) => setCardDetails({...cardDetails, number: e.target.value})}
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontWeight: '500',
                  color: '#495057'
                }}>Expiry (MM/YY)</label>
                <input
                  data-test-id="expiry-input"
                  placeholder="MM/YY"
                  type="text"
                  value={cardDetails.expiry}
                  onChange={(e) => setCardDetails({...cardDetails, expiry: e.target.value})}
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
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontWeight: '500',
                  color: '#495057'
                }}>CVV</label>
                <input
                  data-test-id="cvv-input"
                  placeholder="CVV"
                  type="password"
                  value={cardDetails.cvv}
                  onChange={(e) => setCardDetails({...cardDetails, cvv: e.target.value})}
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
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{
                display: 'block',
                marginBottom: '6px',
                fontWeight: '500',
                color: '#495057'
              }}>Cardholder Name</label>
              <input
                data-test-id="cardholder-name-input"
                placeholder="Name on Card"
                type="text"
                value={cardDetails.holderName}
                onChange={(e) => setCardDetails({...cardDetails, holderName: e.target.value})}
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
              data-test-id="pay-button"
              type="submit"
              style={{
                width: '100%',
                padding: '14px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
                borderRadius: '6px',
                fontWeight: '500',
                fontSize: '1.1rem',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#218838'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#28a745'}
            >
              Pay ₹{(order?.amount / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </button>
          </form>
        )}

        {/* Processing State */}
        {paymentStatus === 'processing' && (
          <div data-test-id="processing-state" style={{
            textAlign: 'center',
            padding: '30px 0',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}>
            <div className="spinner" style={{
              width: '50px',
              height: '50px',
              border: '4px solid rgba(0, 123, 255, 0.2)',
              borderTop: '4px solid #007bff',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              marginBottom: '15px'
            }}></div>
            <span data-test-id="processing-message" style={{
              color: '#6c757d',
              fontSize: '1.1rem'
            }}>
              Processing payment...
            </span>
          </div>
        )}

        {error && (
          <div style={{
            marginTop: '15px',
            padding: '12px',
            backgroundColor: '#f8d7da',
            color: '#721c24',
            border: '1px solid #f5c6cb',
            borderRadius: '6px',
            fontSize: '0.9rem'
          }}>
            {error}
          </div>
        )}

        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          }
        `}</style>
      </div>
    </div>
  );
}

export default Checkout;