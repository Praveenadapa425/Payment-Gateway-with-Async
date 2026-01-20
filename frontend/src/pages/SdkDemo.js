import React, { useState } from 'react';

function SdkDemo() {
  const [orderId, setOrderId] = useState('');
  const [apiKey, setApiKey] = useState('key_test_abc123');
  const [paymentResult, setPaymentResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load the SDK script dynamically
  const loadSdkScript = () => {
    if (typeof window.PaymentGateway !== 'undefined') {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'http://localhost:3002/dist/checkout.js'; // Assuming SDK is served from checkout-widget
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  };

  const handlePayment = async () => {
    if (!orderId) {
      alert('Please enter an order ID');
      return;
    }

    setIsLoading(true);
    setPaymentResult(null);

    try {
      await loadSdkScript();

      const gateway = new window.PaymentGateway({
        key: apiKey,
        orderId: orderId,
        onSuccess: (data) => {
          console.log('Payment successful:', data);
          setPaymentResult({ success: true, data });
          setIsLoading(false);
        },
        onFailure: (error) => {
          console.log('Payment failed:', error);
          setPaymentResult({ success: false, error });
          setIsLoading(false);
        },
        onClose: () => {
          console.log('Modal closed');
          setIsLoading(false);
        }
      });

      gateway.open();
    } catch (error) {
      console.error('Error loading SDK:', error);
      setIsLoading(false);
      alert('Failed to load payment SDK. Please try again.');
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Payment Gateway SDK Demo</h1>
      
      <div style={{ maxWidth: '500px', margin: '0 auto', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
        <h2>Try the Embedded Payment SDK</h2>
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            API Key:
          </label>
          <input
            type="text"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter your API key"
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          />
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Order ID:
          </label>
          <input
            type="text"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            placeholder="Enter order ID to pay"
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          />
        </div>
        
        <button
          onClick={handlePayment}
          disabled={isLoading || !orderId}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: isLoading || !orderId ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '16px',
            cursor: isLoading || !orderId ? 'not-allowed' : 'pointer'
          }}
        >
          {isLoading ? 'Processing...' : 'Pay with Embedded SDK'}
        </button>
        
        {paymentResult && (
          <div 
            style={{ 
              marginTop: '15px', 
              padding: '10px', 
              borderRadius: '4px',
              backgroundColor: paymentResult.success ? '#d4edda' : '#f8d7da',
              border: `1px solid ${paymentResult.success ? '#c3e6cb' : '#f5c6cb'}`,
              color: paymentResult.success ? '#155724' : '#721c24'
            }}
          >
            <strong>
              {paymentResult.success ? 'Success!' : 'Failed!'} 
            </strong>
            <br />
            {paymentResult.success 
              ? `Payment ID: ${paymentResult.data.paymentId}` 
              : `Error: ${paymentResult.error}`
            }
          </div>
        )}
      </div>
      
      <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
        <h3>How to Use the SDK</h3>
        <pre style={{ 
          backgroundColor: '#f1f1f1', 
          padding: '15px', 
          borderRadius: '4px', 
          overflowX: 'auto',
          fontFamily: 'monospace',
          fontSize: '14px'
        }}>
{`<!-- Include the SDK script -->
<script src="http://your-domain.com/sdk/checkout.js"></script>

<!-- Use the SDK in your code -->
const gateway = new PaymentGateway({
  key: 'your_api_key',
  orderId: 'order_id_to_pay',
  onSuccess: function(data) {
    console.log('Payment successful:', data);
  },
  onFailure: function(error) {
    console.log('Payment failed:', error);
  },
  onClose: function() {
    console.log('Modal closed');
  }
});

gateway.open();`}
        </pre>
      </div>
    </div>
  );
}

export default SdkDemo;