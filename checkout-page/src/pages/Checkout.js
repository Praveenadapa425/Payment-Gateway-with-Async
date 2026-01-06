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
      // In a real implementation, this would call the public API
      // For now, we'll simulate a payment
      setTimeout(() => {
        const success = Math.random() > 0.1; // 90% success rate
        if (success) {
          setPaymentStatus('success');
          setPaymentId('pay_' + Math.random().toString(36).substr(2, 16));
        } else {
          setPaymentStatus('error');
          setError('Payment failed');
        }
      }, 3000);
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
      // In a real implementation, this would call the public API
      // For now, we'll simulate a payment
      setTimeout(() => {
        const success = Math.random() > 0.05; // 95% success rate
        if (success) {
          setPaymentStatus('success');
          setPaymentId('pay_' + Math.random().toString(36).substr(2, 16));
        } else {
          setPaymentStatus('error');
          setError('Payment failed');
        }
      }, 3000);
    } catch (err) {
      setError('Payment failed');
      setPaymentStatus('error');
    }
  };

  if (!orderId) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>No order ID provided</h2>
        <p>Please provide an order ID as a query parameter (?order_id=xxx)</p>
      </div>
    );
  }

  if (paymentStatus === 'success') {
    return (
      <div data-test-id="success-state" style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Payment Successful!</h2>
        <div>
          <span>Payment ID: </span>
          <span data-test-id="payment-id">{paymentId}</span>
        </div>
        <span data-test-id="success-message">
          Your payment has been processed successfully
        </span>
        <div style={{ marginTop: '20px' }}>
          <button 
            onClick={() => window.location.href = '/'} 
            style={{ padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', cursor: 'pointer' }}
          >
            New Payment
          </button>
        </div>
      </div>
    );
  }

  if (paymentStatus === 'error') {
    return (
      <div data-test-id="error-state" style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Payment Failed</h2>
        <span data-test-id="error-message">
          {error || 'Payment could not be processed'}
        </span>
        <div style={{ marginTop: '20px' }}>
          <button 
            data-test-id="retry-button"
            onClick={() => setPaymentStatus('idle')}
            style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', cursor: 'pointer' }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div data-test-id="checkout-container" style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      {/* Order Summary */}
      <div data-test-id="order-summary" style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '5px' }}>
        <h2>Complete Payment</h2>
        {order ? (
          <>
            <div>
              <span>Amount: </span>
              <span data-test-id="order-amount">
                ₹{(order.amount / 100).toFixed(2)}
              </span>
            </div>
            <div>
              <span>Order ID: </span>
              <span data-test-id="order-id">{order.id}</span>
            </div>
          </>
        ) : (
          <p>Loading order details...</p>
        )}
      </div>

      {/* Payment Method Selection */}
      <div data-test-id="payment-methods" style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <button
          data-test-id="method-upi"
          data-method="upi"
          onClick={showUPIForm}
          style={{
            padding: '10px 15px',
            backgroundColor: paymentMethod === 'upi' ? '#007bff' : '#f8f9fa',
            color: paymentMethod === 'upi' ? 'white' : '#333',
            border: '1px solid #ddd',
            cursor: 'pointer',
            borderRadius: '4px'
          }}
        >
          UPI
        </button>
        <button
          data-test-id="method-card"
          data-method="card"
          onClick={showCardForm}
          style={{
            padding: '10px 15px',
            backgroundColor: paymentMethod === 'card' ? '#007bff' : '#f8f9fa',
            color: paymentMethod === 'card' ? 'white' : '#333',
            border: '1px solid #ddd',
            cursor: 'pointer',
            borderRadius: '4px'
          }}
        >
          Card
        </button>
      </div>

      {/* UPI Payment Form */}
      {paymentMethod === 'upi' && (
        <form data-test-id="upi-form" onSubmit={handleUpiSubmit} style={{ marginBottom: '20px' }}>
          <div style={{ marginBottom: '15px' }}>
            <input
              data-test-id="vpa-input"
              placeholder="username@bank"
              type="text"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              style={{ width: '100%', padding: '10px', marginBottom: '10px' }}
            />
          </div>
          <button
            data-test-id="pay-button"
            type="submit"
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              borderRadius: '4px'
            }}
          >
            Pay ₹{(order?.amount / 100).toFixed(2)}
          </button>
        </form>
      )}

      {/* Card Payment Form */}
      {paymentMethod === 'card' && (
        <form data-test-id="card-form" onSubmit={handleCardSubmit} style={{ marginBottom: '20px' }}>
          <div style={{ marginBottom: '15px' }}>
            <input
              data-test-id="card-number-input"
              placeholder="Card Number"
              type="text"
              value={cardDetails.number}
              onChange={(e) => setCardDetails({...cardDetails, number: e.target.value})}
              style={{ width: '100%', padding: '10px', marginBottom: '10px' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
            <input
              data-test-id="expiry-input"
              placeholder="MM/YY"
              type="text"
              value={cardDetails.expiry}
              onChange={(e) => setCardDetails({...cardDetails, expiry: e.target.value})}
              style={{ flex: 1, padding: '10px', marginBottom: '10px' }}
            />
            <input
              data-test-id="cvv-input"
              placeholder="CVV"
              type="text"
              value={cardDetails.cvv}
              onChange={(e) => setCardDetails({...cardDetails, cvv: e.target.value})}
              style={{ flex: 1, padding: '10px', marginBottom: '10px' }}
            />
          </div>
          <div style={{ marginBottom: '15px' }}>
            <input
              data-test-id="cardholder-name-input"
              placeholder="Name on Card"
              type="text"
              value={cardDetails.holderName}
              onChange={(e) => setCardDetails({...cardDetails, holderName: e.target.value})}
              style={{ width: '100%', padding: '10px', marginBottom: '10px' }}
            />
          </div>
          <button
            data-test-id="pay-button"
            type="submit"
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              borderRadius: '4px'
            }}
          >
            Pay ₹{(order?.amount / 100).toFixed(2)}
          </button>
        </form>
      )}

      {/* Processing State */}
      {paymentStatus === 'processing' && (
        <div data-test-id="processing-state" style={{ textAlign: 'center', padding: '20px' }}>
          <div className="spinner" style={{
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #007bff',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            animation: 'spin 2s linear infinite',
            margin: '0 auto 10px'
          }}></div>
          <span data-test-id="processing-message">
            Processing payment...
          </span>
        </div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default Checkout;