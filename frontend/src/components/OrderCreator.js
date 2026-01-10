import React, { useState } from 'react';
import { createOrder } from '../utils/api';

function OrderCreator({ apiCredentials }) {
  const [orderData, setOrderData] = useState({
    amount: '',
    currency: 'INR',
    receipt: '',
    notes: {}
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

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
      
      {result && result.success && (
        <div data-test-id="order-success" style={{ marginTop: '15px', padding: '10px', backgroundColor: '#d4edda', border: '1px solid #c3e6cb', borderRadius: '4px' }}>
          <strong>Success:</strong> {result.message}
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