import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Suppliers } from './pages/Suppliers';
import { Products } from './pages/Products';
import { Clients } from './pages/Clients';
import { Stock } from './pages/Stock';
import { Quotes } from './pages/Quotes';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="suppliers" element={<Suppliers />} />
          <Route path="products" element={<Products />} />
          <Route path="clients" element={<Clients />} />
          <Route path="stock" element={<Stock />} />
          <Route path="quotes" element={<Quotes />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
