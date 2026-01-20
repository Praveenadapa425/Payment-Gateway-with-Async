// API utility functions for the payment gateway

export const makeAuthenticatedRequest = async (url, method = 'GET', data = null, credentials = null, headers = {}) => {
  // Use provided credentials or fallback to localStorage
  let apiCredentials = credentials;
  
  if (!apiCredentials) {
    // Try localStorage first
    const storedApiKey = localStorage.getItem('apiKey');
    const storedApiSecret = localStorage.getItem('apiSecret');
    
    if (storedApiKey && storedApiSecret) {
      apiCredentials = {
        apiKey: storedApiKey,
        apiSecret: storedApiSecret
      };
    } else {
      // Fallback to default test credentials if none are stored
      apiCredentials = {
        apiKey: 'key_test_abc123',
        apiSecret: 'secret_test_xyz789'
      };
    }
  }

  // Check if credentials are available
  if (!apiCredentials.apiKey || !apiCredentials.apiSecret) {
    throw new Error('API credentials not found. Please log in.');
  }

  const config = {
    method,
    headers: {
      'X-Api-Key': apiCredentials.apiKey,
      'X-Api-Secret': apiCredentials.apiSecret,
      'Content-Type': 'application/json',
      ...headers
    }
  };

  if (data) {
    config.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, config);
    const responseData = await response.json();

    if (!response.ok) {
      // Throw error with message from API
      const errorMessage = responseData.error?.description || `HTTP error! status: ${response.status}`;
      throw new Error(errorMessage);
    }

    return { success: true, data: responseData };
  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Network error: Unable to connect to the server. Please check your connection.');
    }
    throw error;
  }
};

export const fetchOrders = async (credentials = null) => {
  return makeAuthenticatedRequest('/api/v1/orders', 'GET', null, credentials);
};

export const fetchPayments = async (credentials = null) => {
  return makeAuthenticatedRequest('/api/v1/payments', 'GET', null, credentials);
};

export const createOrder = async (orderData, credentials = null) => {
  return makeAuthenticatedRequest('/api/v1/orders', 'POST', orderData, credentials);
};

export const getOrder = async (orderId, credentials = null) => {
  return makeAuthenticatedRequest(`/api/v1/orders/${orderId}`, 'GET', null, credentials);
};

export const getPayment = async (paymentId, credentials = null) => {
  return makeAuthenticatedRequest(`/api/v1/payments/${paymentId}`, 'GET', null, credentials);
};

// Payment capture function
export const capturePayment = async (paymentId, credentials = null) => {
  return makeAuthenticatedRequest(`/api/v1/payments/${paymentId}/capture`, 'POST', {}, credentials);
};

// Refund functions
export const createRefund = async (paymentId, refundData, credentials = null) => {
  return makeAuthenticatedRequest(`/api/v1/payments/${paymentId}/refunds`, 'POST', refundData, credentials);
};

export const getRefund = async (refundId, credentials = null) => {
  return makeAuthenticatedRequest(`/api/v1/refunds/${refundId}`, 'GET', null, credentials);
};

// Webhook functions
export const createWebhook = async (webhookData, credentials = null) => {
  return makeAuthenticatedRequest('/api/v1/webhooks', 'POST', webhookData, credentials);
};

export const getWebhooks = async (credentials = null) => {
  return makeAuthenticatedRequest('/api/v1/webhooks', 'GET', null, credentials);
};

export const getWebhookLogs = async (credentials = null) => {
  return makeAuthenticatedRequest('/api/v1/webhooks', 'GET', null, credentials);
};

// Health check function
export const getHealth = async () => {
  try {
    const response = await fetch('/api/v1/health');
    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Create payment with idempotency key
export const createPayment = async (paymentData, idempotencyKey = null, credentials = null) => {
  const headers = {};
  if (idempotencyKey) {
    headers['Idempotency-Key'] = idempotencyKey;
  }
  return makeAuthenticatedRequest('/api/v1/payments', 'POST', paymentData, credentials, headers);
};

// Get all refunds
export const getRefunds = async (credentials = null) => {
  return makeAuthenticatedRequest('/api/v1/refunds', 'GET', null, credentials);
};

// Get webhook logs by payment ID
export const getWebhookLogsByPayment = async (paymentId, credentials = null) => {
  return makeAuthenticatedRequest(`/api/v1/webhooks/logs/${paymentId}`, 'GET', null, credentials);
};

// SDK Integration Functions
export const loadPaymentGatewaySDK = () => {
  return new Promise((resolve, reject) => {
    if (window.PaymentGateway) {
      resolve(window.PaymentGateway);
      return;
    }
    
    const script = document.createElement('script');
    script.src = `${process.env.REACT_APP_SDK_URL || 'http://localhost:3002/dist/checkout.js'}`;
    script.onload = () => {
      resolve(window.PaymentGateway);
    };
    script.onerror = (error) => {
      reject(error);
    };
    document.head.appendChild(script);
  });
};

export const initializePaymentWithSDK = async (options) => {
  try {
    const PaymentGateway = await loadPaymentGatewaySDK();
    return new PaymentGateway(options);
  } catch (error) {
    console.error('Failed to initialize payment SDK:', error);
    throw error;
  }
};