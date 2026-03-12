import React, { useState, useEffect } from 'react';
import type { Product, Supplier } from '../lib/store';
import { getProducts, saveProduct, deleteProduct, getSuppliers } from '../lib/store';
import { Modal } from '../components/ui/Modal';
import { Trash2, Link as LinkIcon, Image as ImageIcon } from 'lucide-react';

export const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ supplierId: '', name: '', details: '', price: 0, photoUrl: '', purchaseLink: '' });

  useEffect(() => {
    setProducts(getProducts());
    setSuppliers(getSuppliers());
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newProduct = saveProduct(formData);
    setProducts([...products, newProduct]);
    setIsModalOpen(false);
    setFormData({ supplierId: '', name: '', details: '', price: 0, photoUrl: '', purchaseLink: '' });
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Estás seguro de eliminar este producto?')) {
      deleteProduct(id);
      setProducts(products.filter(p => p.id !== id));
    }
  };

  const getSupplierName = (id: string) => {
    const s = suppliers.find(s => s.id === id);
    return s ? s.name : 'Desconocido';
  };

  const formattedPrice = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 className="page-title">Productos</h1>
          <p className="page-subtitle" style={{ marginBottom: 0 }}>Inventario de elementos de gimnasio para reventa.</p>
        </div>
        <button 
          onClick={() => {
            if (suppliers.length === 0) {
              alert("Primero debes añadir un proveedor.");
              return;
            }
            setIsModalOpen(true);
          }}
          style={{ background: 'var(--primary-color)', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 600, transition: 'background 0.2s' }}
          onMouseOver={(e) => e.currentTarget.style.background = 'var(--primary-hover)'}
          onMouseOut={(e) => e.currentTarget.style.background = 'var(--primary-color)'}
        >
          + Nuevo Producto
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
        {products.length === 0 ? (
          <div className="glass-panel" style={{ gridColumn: '1 / -1', padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <p>No hay productos registrados. {suppliers.length === 0 ? "Empieza añadiendo proveedores en el menú lateral." : "Añade tu primer producto."}</p>
          </div>
        ) : (
          products.map(product => (
            <div key={product.id} className="glass-panel animate-fade-in" style={{ border: '1px solid var(--surface-border)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ height: '180px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                {product.photoUrl ? (
                  <img src={product.photoUrl} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                    <ImageIcon size={32} />
                    <span>Sin foto</span>
                  </div>
                )}
                <button 
                  onClick={() => handleDelete(product.id)}
                  style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: 'rgba(0,0,0,0.5)', padding: '0.5rem', border: 'none', borderRadius: '50%', color: 'var(--danger-color)', cursor: 'pointer', display: 'flex' }}
                  title="Eliminar Producto"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ marginBottom: '0.25rem', color: 'var(--text-main)', fontSize: '1.1rem' }}>{product.name}</h3>
                <p style={{ color: 'var(--primary-color)', fontWeight: 'bold', fontSize: '1.3rem', marginBottom: '0.5rem' }}>
                  {formattedPrice.format(product.price)}
                </p>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem', background: 'rgba(255,255,255,0.05)', display: 'inline-block', padding: '0.2rem 0.5rem', borderRadius: '4px', alignSelf: 'flex-start' }}>
                  Proveedor: {getSupplierName(product.supplierId)}
                </div>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', flex: 1, marginBottom: '1rem', lineHeight: 1.5 }}>{product.details}</p>
                
                <a href={product.purchaseLink.startsWith('http') ? product.purchaseLink : `https://${product.purchaseLink}`} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: 'auto', color: 'var(--text-main)', fontSize: '0.9rem', background: 'var(--surface-border)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', transition: 'background 0.2s', justifyContent: 'center' }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'var(--surface-border)'}
                 >
                  <LinkIcon size={16} /> Enlace de compra
                </a>
              </div>
            </div>
          ))
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Añadir Producto">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Proveedor</label>
            <select 
              required
              value={formData.supplierId}
              onChange={(e) => setFormData({...formData, supplierId: e.target.value})}
              style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--surface-border)', background: 'rgba(0,0,0,0.5)', color: 'white', outline: 'none', appearance: 'none' }}
            >
              <option value="" disabled>Selecciona un proveedor</option>
              {suppliers.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ flex: 2 }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Nombre del Producto</label>
              <input 
                required
                type="text" 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--surface-border)', background: 'rgba(0,0,0,0.2)', color: 'white', outline: 'none' }}
                placeholder="Ej. Disco Bumper 20kg"
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Precio</label>
              <input 
                required
                type="number" 
                min="0"
                step="0.01"
                value={formData.price || ''}
                onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value)})}
                style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--surface-border)', background: 'rgba(0,0,0,0.2)', color: 'white', outline: 'none' }}
                placeholder="15000"
              />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Enlace de Compra</label>
            <input 
              required
              type="text" 
              value={formData.purchaseLink}
              onChange={(e) => setFormData({...formData, purchaseLink: e.target.value})}
              style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--surface-border)', background: 'rgba(0,0,0,0.2)', color: 'white', outline: 'none' }}
              placeholder="https://proveedor.com/producto"
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>URL de Foto (Opcional)</label>
            <input 
              type="text" 
              value={formData.photoUrl}
              onChange={(e) => setFormData({...formData, photoUrl: e.target.value})}
              style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--surface-border)', background: 'rgba(0,0,0,0.2)', color: 'white', outline: 'none' }}
              placeholder="https://ejemplo.com/foto.jpg"
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Detalle / Especificaciones</label>
            <textarea 
              required
              rows={3}
              value={formData.details}
              onChange={(e) => setFormData({...formData, details: e.target.value})}
              style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--surface-border)', background: 'rgba(0,0,0,0.2)', color: 'white', outline: 'none', resize: 'vertical' }}
              placeholder="Goma vulcanizada, anillo de acero inoxidable..."
            />
          </div>
          <button 
            type="submit"
            style={{ marginTop: '0.5rem', width: '100%', background: 'var(--primary-color)', color: 'white', border: 'none', padding: '0.75rem', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 600 }}
          >
            Guardar Producto
          </button>
        </form>
      </Modal>
    </div>
  );
};
