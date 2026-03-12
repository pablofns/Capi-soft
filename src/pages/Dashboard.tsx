import React, { useEffect, useState } from 'react';
import { getSuppliers, getProducts } from '../lib/store';
import { Users, Package, TrendingUp } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState({ suppliers: 0, products: 0, totalValue: 0 });

  useEffect(() => {
    const suppliers = getSuppliers();
    const products = getProducts();
    
    const value = products.reduce((acc, curr) => acc + curr.price, 0);

    setStats({
      suppliers: suppliers.length,
      products: products.length,
      totalValue: value
    });
  }, []);

  const formattedValue = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
  }).format(stats.totalValue);

  return (
    <div>
      <h1 className="page-title">Dashboard</h1>
      <p className="page-subtitle">Bienvenido al panel de administración de Capi Sport.</p>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="glass-panel animate-fade-in" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem', borderLeft: '4px solid var(--primary-color)' }}>
          <div style={{ background: 'rgba(255, 87, 34, 0.2)', padding: '1rem', borderRadius: 'var(--radius-md)', color: 'var(--primary-color)' }}>
            <Users size={32} />
          </div>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.25rem' }}>Total Proveedores</p>
            <h3 style={{ fontSize: '1.5rem', margin: 0 }}>{stats.suppliers}</h3>
          </div>
        </div>

        <div className="glass-panel animate-fade-in" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem', borderLeft: '4px solid #3b82f6', animationDelay: '0.1s' }}>
          <div style={{ background: 'rgba(59, 130, 246, 0.2)', padding: '1rem', borderRadius: 'var(--radius-md)', color: '#3b82f6' }}>
            <Package size={32} />
          </div>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.25rem' }}>Total Productos</p>
            <h3 style={{ fontSize: '1.5rem', margin: 0 }}>{stats.products}</h3>
          </div>
        </div>

        <div className="glass-panel animate-fade-in" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem', borderLeft: '4px solid #10b981', animationDelay: '0.2s' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.2)', padding: '1rem', borderRadius: 'var(--radius-md)', color: '#10b981' }}>
            <TrendingUp size={32} />
          </div>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.25rem' }}>Valor Inventario</p>
            <h3 style={{ fontSize: '1.5rem', margin: 0 }}>{formattedValue}</h3>
          </div>
        </div>
      </div>

      <div className="glass-panel animate-fade-in" style={{ padding: '2rem', animationDelay: '0.3s' }}>
        <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>Acciones Rápidas</h2>
        <p style={{ color: 'var(--text-muted)' }}>Mueve a través del menú lateral para gestionar tus entidades.</p>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
          <a href="/suppliers" style={{ padding: '0.75rem 1.5rem', background: 'var(--surface-border)', borderRadius: 'var(--radius-md)', color: 'white', transition: 'background 0.2s' }}
             onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
             onMouseOut={(e) => e.currentTarget.style.background = 'var(--surface-border)'}
          >Ver Proveedores</a>
          <a href="/products" style={{ padding: '0.75rem 1.5rem', background: 'var(--surface-border)', borderRadius: 'var(--radius-md)', color: 'white', transition: 'background 0.2s' }}
             onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
             onMouseOut={(e) => e.currentTarget.style.background = 'var(--surface-border)'}
          >Ver Productos</a>
        </div>
      </div>
    </div>
  );
};
