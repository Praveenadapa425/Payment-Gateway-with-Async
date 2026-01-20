import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Webhooks from './pages/Webhooks';
import Refunds from './pages/Refunds';
import SdkDemo from './pages/SdkDemo';
import PrivateRoute from './components/PrivateRoute';

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        } />
        <Route path="/dashboard/transactions" element={
          <PrivateRoute>
            <Transactions />
          </PrivateRoute>
        } />
        <Route path="/dashboard/webhooks" element={
          <PrivateRoute>
            <Webhooks />
          </PrivateRoute>
        } />
        <Route path="/dashboard/refunds" element={
          <PrivateRoute>
            <Refunds />
          </PrivateRoute>
        } />
        <Route path="/dashboard/sdk-demo" element={
          <PrivateRoute>
            <SdkDemo />
          </PrivateRoute>
        } />
        <Route path="/" element={<Login />} />
        <Route path="/*" element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        } />
      </Routes>
    </div>
  );
}

export default App;