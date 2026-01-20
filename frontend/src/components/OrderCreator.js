import React, { useState } from 'react';
import { createOrder, createPayment } from '../utils/api';

function OrderCreator({ apiCredentials }) {
  const [orderData, setOrderData] = useState({
    amount: '',
    currency: 'INR',
    receipt: '',
    notes: {}
  });
  const [idempotencyKey, setIdempotencyKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentData, setPaymentData] = useState({
    vpa: '',
    card: {
      number: '',
      expiry_month: '',
      expiry_year: '',
      cvv: '',
      holder_name: ''
    }
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      // Prepare order data
      const requestData = {
        amount: parseInt(orderData.amount),
        currency: orderData.currency,
        receipt: orderData.receipt || undefined
      };

      // Add notes if they exist
      if (Object.keys(orderData.notes).length > 0) {
        requestData.notes = orderData.notes;
      }

      const result = await createOrder(requestData, apiCredentials);

      if (result.success) {
        setResult({
          success: true,
          orderId: result.data.id,
          amount: result.data.amount,
          message: `Order created successfully! Order ID: ${result.data.id}`
        });
        
        // If idempotency key is provided, create payment immediately
        if (idempotencyKey) {
          setShowPaymentOptions(true);
        }
      } else {
        setError(result.data.error?.description || 'Failed to create order');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setOrderData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNotesChange = (e) => {
    const { name, value } = e.target;
    setOrderData(prev => ({
      ...prev,
      notes: {
        ...prev.notes,
        [name]: value
      }
    }));
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const paymentRequest = {
        order_id: result.orderId,
        method: paymentMethod,
        ...(paymentMethod === 'upi' && { vpa: paymentData.vpa }),
        ...(paymentMethod === 'card' && { card: paymentData.card })
      };
      
      const paymentResult = await createPayment(paymentRequest, apiCredentials, { 'Idempotency-Key': idempotencyKey });
      
      if (paymentResult.success) {
        setResult(prev => ({
          ...prev,
          success: true,
          paymentId: paymentResult.data.id,
          paymentStatus: paymentResult.data.status,
          message: `Order and Payment created successfully! Order ID: ${result.orderId}, Payment ID: ${paymentResult.data.id}`
        }));
      } else {
        setError(paymentResult.data.error?.description || 'Failed to create payment');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handlePaymentMethodChange = (method) => {
    setPaymentMethod(method);
  };
  
  const handlePaymentDataChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setPaymentData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setPaymentData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };
  
  return (
    <div data-test-id="order-creator" style={{ marginTop: '30px', padding: '20px', border: '1px solid #ddd', borderRadius: '5px' }}>
      <h3>Create New Order</h3>
      
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label>Amount (paise): </label>
          <input
            data-test-id="amount-input"
            type="number"
            name="amount"
            value={orderData.amount}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
          <small>Enter amount in paise (e.g., 50000 for ₹500)</small>
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <label>Currency: </label>
          <select
            data-test-id="currency-select"
            name="currency"
            value={orderData.currency}
            onChange={handleChange}
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          >
            <option value="INR">INR</option>
          </select>
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <label>Receipt: </label>
          <input
            data-test-id="receipt-input"
            type="text"
            name="receipt"
            value={orderData.receipt}
            onChange={handleChange}
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <label>Idempotency Key (optional): </label>
          <input
            data-test-id="idempotency-key-input"
            type="text"
            value={idempotencyKey}
            onChange={(e) => setIdempotencyKey(e.target.value)}
            placeholder="Leave empty to disable idempotency"
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
          <small>Provide an idempotency key to ensure safe retries</small>
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <label>Notes (JSON format):</label>
          <div style={{ marginTop: '5px' }}>
            <input
              data-test-id="notes-product-input"
              type="text"
              name="product_name"
              placeholder="Product name"
              onChange={handleNotesChange}
              style={{ width: '45%', padding: '8px', marginRight: '5%' }}
            />
            <input
              data-test-id="notes-customer-input"
              type="text"
              name="customer_id"
              placeholder="Customer ID"
              onChange={handleNotesChange}
              style={{ width: '45%', padding: '8px' }}
            />
          </div>
        </div>
        
        <button
          data-test-id="create-order-button"
          type="submit"
          disabled={loading}
          style={{ 
            padding: '10px 20px', 
            backgroundColor: loading ? '#ccc' : '#28a745', 
            color: 'white', 
            border: 'none', 
            cursor: loading ? 'not-allowed' : 'pointer',
            width: '100%'
          }}
        >
          {loading ? 'Creating Order...' : 'Create Order'}
        </button>
      </form>
      
      {showPaymentOptions && result.success && (
        <div style={{ marginTop: '20px', padding: '20px', border: '1px solid #ddd', borderRadius: '5px', backgroundColor: '#f8f9fa' }}>
          <h4>Create Payment for Order</h4>
          <form onSubmit={handlePaymentSubmit}>
            <div style={{ marginBottom: '15px' }}>
              <label>Payment Method: </label>
              <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
                <button
                  type="button"
                  onClick={() => handlePaymentMethodChange('upi')}
                  style={{
                    flex: 1,
                    padding: '8px',
                    backgroundColor: paymentMethod === 'upi' ? '#007bff' : '#f8f9fa',
                    color: paymentMethod === 'upi' ? 'white' : '#495057',
                    border: '1px solid #dee2e6',
                    cursor: 'pointer',
                    borderRadius: '4px'
                  }}
                >
                  UPI
                </button>
                <button
                  type="button"
                  onClick={() => handlePaymentMethodChange('card')}
                  style={{
                    flex: 1,
                    padding: '8px',
                    backgroundColor: paymentMethod === 'card' ? '#007bff' : '#f8f9fa',
                    color: paymentMethod === 'card' ? 'white' : '#495057',
                    border: '1px solid #dee2e6',
                    cursor: 'pointer',
                    borderRadius: '4px'
                  }}
                >
                  Card
                </button>
              </div>
            </div>
            
            {paymentMethod === 'upi' && (
              <div style={{ marginBottom: '15px' }}>
                <label>UPI ID: </label>
                <input
                  type="text"
                  value={paymentData.vpa}
                  onChange={(e) => handlePaymentDataChange('vpa', e.target.value)}
                  placeholder="example@upi"
                  style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                  required
                />
              </div>
            )}
            
            {paymentMethod === 'card' && (
              <div style={{ marginBottom: '15px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label>Card Number: </label>
                    <input
                      type="text"
                      value={paymentData.card.number}
                      onChange={(e) => handlePaymentDataChange('card.number', e.target.value)}
                      placeholder="1234 5678 9012 3456"
                      style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                      required
                    />
                  </div>
                  <div>
                    <label>Holder Name: </label>
                    <input
                      type="text"
                      value={paymentData.card.holder_name}
                      onChange={(e) => handlePaymentDataChange('card.holder_name', e.target.value)}
                      placeholder="John Doe"
                      style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                      required
                    />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginTop: '10px' }}>
                  <div>
                    <label>Expiry Month: </label>
                    <input
                      type="text"
                      value={paymentData.card.expiry_month}
                      onChange={(e) => handlePaymentDataChange('card.expiry_month', e.target.value)}
                      placeholder="MM"
                      style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                      required
                    />
                  </div>
                  <div>
                    <label>Expiry Year: </label>
                    <input
                      type="text"
                      value={paymentData.card.expiry_year}
                      onChange={(e) => handlePaymentDataChange('card.expiry_year', e.target.value)}
                      placeholder="YY"
                      style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                      required
                    />
                  </div>
                  <div>
                    <label>CVV: </label>
                    <input
                      type="password"
                      value={paymentData.card.cvv}
                      onChange={(e) => handlePaymentDataChange('card.cvv', e.target.value)}
                      placeholder="123"
                      style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                      required
                    />
                  </div>
                </div>
              </div>
            )}
            
            <button
              type="submit"
              disabled={loading}
              style={{ 
                padding: '10px 20px', 
                backgroundColor: loading ? '#ccc' : '#007bff', 
                color: 'white', 
                border: 'none', 
                cursor: loading ? 'not-allowed' : 'pointer',
                width: '100%'
              }}
            >
              {loading ? 'Creating Payment...' : 'Create Payment'}
            </button>
          </form>
        </div>
      )}
      
      {result && result.success && (
        <div data-test-id="order-success" style={{ marginTop: '15px', padding: '10px', backgroundColor: '#d4edda', border: '1px solid #c3e6cb', borderRadius: '4px' }}>
          <strong>Success:</strong> {result.message}
          {result.paymentId && (
            <div style={{ marginTop: '5px' }}>
              Payment Status: <span style={{ fontWeight: 'bold' }}>{result.paymentStatus}</span>
            </div>
          )}
          {!showPaymentOptions && (
            <>
              <br />
              <a 
                href={`http://localhost:3001/checkout?order_id=${result.orderId}`} 
                target="_blank"
                rel="noopener noreferrer"
                style={{ 
                  marginTop: '10px', 
                  display: 'inline-block', 
                  padding: '8px 15px', 
                  backgroundColor: '#007bff', 
                  color: 'white', 
                  textDecoration: 'none', 
                  borderRadius: '4px' 
                }}
              >
                Go to Checkout
              </a>
            </>
          )}
        </div>
      )}
      
      {error && (
        <div data-test-id="order-error" style={{ marginTop: '15px', padding: '10px', backgroundColor: '#f8d7da', border: '1px solid #f5c6cb', borderRadius: '4px', color: '#721c24' }}>
          <strong>Error:</strong> {error}
        </div>
      )}
    </div>
  );
}

export default OrderCreator;