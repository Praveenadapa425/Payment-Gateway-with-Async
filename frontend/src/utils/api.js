// API utility functions for the payment gateway

export const makeAuthenticatedRequest = async (url, method = 'GET', data = null, credentials = null) => {
  // Use provided credentials or fallback to localStorage
  const apiCredentials = credentials || {
    apiKey: localStorage.getItem('apiKey'),
    apiSecret: localStorage.getItem('apiSecret')
  };

  // Check if credentials are available
  if (!apiCredentials.apiKey || !apiCredentials.apiSecret) {
    throw new Error('API credentials not found. Please log in.');
  }

  const config = {
    method,
    headers: {
      'X-Api-Key': apiCredentials.apiKey,
      'X-Api-Secret': apiCredentials.apiSecret,
      'Content-Type': 'application/json'
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