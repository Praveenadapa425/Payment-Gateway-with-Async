import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Checkout from './pages/Checkout';

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/*" element={<Checkout />} />
      </Routes>
    </div>
  );
}

export default App;