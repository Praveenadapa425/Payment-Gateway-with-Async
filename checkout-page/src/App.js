import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Checkout from './pages/Checkout';
import Success from './pages/Success';
import Failure from './pages/Failure';

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/success" element={<Success />} />
        <Route path="/failure" element={<Failure />} />
        <Route path="/" element={<Checkout />} />
      </Routes>
    </div>
  );
}

export default App;