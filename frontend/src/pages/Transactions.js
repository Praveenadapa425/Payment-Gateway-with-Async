import React, { useState, useEffect } from 'react';

function Transactions() {
  const [transactions, setTransactions] = useState([]);

  // Simulate fetching transactions from API
  useEffect(() => {
    // In a real implementation, we would fetch this data from the backend
    // For now, we'll use mock data
    const mockTransactions = [
      { id: 'pay_123', orderId: 'order_456', amount: 50000, method: 'upi', status: 'success', createdAt: '2024-01-15 10:31:00' },
      { id: 'pay_456', orderId: 'order_789', amount: 25000, method: 'card', status: 'success', createdAt: '2024-01-15 10:32:00' },
      { id: 'pay_789', orderId: 'order_012', amount: 10000, method: 'upi', status: 'failed', createdAt: '2024-01-15 10:33:00' },
    ];
    setTransactions(mockTransactions);
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      <h1>Transactions</h1>
      
      <table data-test-id="transactions-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th>Payment ID</th>
            <th>Order ID</th>
            <th>Amount</th>
            <th>Method</th>
            <th>Status</th>
            <th>Created</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((transaction) => (
            <tr 
              key={transaction.id} 
              data-test-id="transaction-row" 
              data-payment-id={transaction.id}
              style={{ borderBottom: '1px solid #ddd' }}
            >
              <td data-test-id="payment-id">{transaction.id}</td>
              <td data-test-id="order-id">{transaction.orderId}</td>
              <td data-test-id="amount">{transaction.amount}</td>
              <td data-test-id="method">{transaction.method}</td>
              <td data-test-id="status">{transaction.status}</td>
              <td data-test-id="created-at">{transaction.createdAt}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Transactions;