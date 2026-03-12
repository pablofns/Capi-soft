import React, { useState, useEffect } from 'react';
import type { Supplier } from '../lib/store';
import { getSuppliers, saveSupplier, deleteSupplier } from '../lib/store';
import { Modal } from '../components/ui/Modal';
import { Trash2, ExternalLink } from 'lucide-react';

export const Suppliers: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', website: '', fundamentalData: '' });

  useEffect(() => {
    setSuppliers(getSuppliers());
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newSupplier = saveSupplier(formData);
    setSuppliers([...suppliers, newSupplier]);
    setIsModalOpen(false);
    setFormData({ name: '', website: '', fundamentalData: '' });
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Estás seguro de eliminar este proveedor?')) {
      deleteSupplier(id);
      setSuppliers(suppliers.filter(s => s.id !== id));
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 className="page-title">Proveedores</h1>
          <p className="page-subtitle" style={{ marginBottom: 0 }}>Gestiona la información de tus proveedores de gimnasio.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          style={{ background: 'var(--primary-color)', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 600, transition: 'background 0.2s' }}
          onMouseOver={(e) => e.currentTarget.style.background = 'var(--primary-hover)'}
          onMouseOut={(e) => e.currentTarget.style.background = 'var(--primary-color)'}
        >
          + Nuevo Proveedor
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {suppliers.length === 0 ? (
          <div className="glass-panel" style={{ gridColumn: '1 / -1', padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <p>No hay proveedores registrados. Añade uno nuevo para comenzar.</p>
          </div>
        ) : (
          suppliers.map(supplier => (
            <div key={supplier.id} className="glass-panel animate-fade-in" style={{ padding: '1.5rem', position: 'relative' }}>
              <button 
                onClick={() => handleDelete(supplier.id)}
                style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--danger-color)', cursor: 'pointer', opacity: 0.7 }}
                title="Eliminar Proveedor"
              >
                <Trash2 size={18} />
              </button>
              
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: 'var(--primary-color)', paddingRight: '2rem' }}>{supplier.name}</h3>
              
              <a href={supplier.website.startsWith('http') ? supplier.website : `https://${supplier.website}`} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-muted)', marginBottom: '1rem', fontSize: '0.9rem' }}>
                <ExternalLink size={14} /> {supplier.website}
              </a>
              
              <div style={{ fontSize: '0.95rem', lineHeight: 1.5, background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                <strong>Datos Fundamentales:</strong><br/>
                {supplier.fundamentalData}
              </div>
            </div>
          ))
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Añadir Proveedor">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Nombre del Proveedor</label>
            <input 
              required
              type="text" 
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--surface-border)', background: 'rgba(0,0,0,0.2)', color: 'white', outline: 'none' }}
              placeholder="Ej. Mega Gym Depot"
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Sitio Web / Enlace</label>
            <input 
              required
              type="text" 
              value={formData.website}
              onChange={(e) => setFormData({...formData, website: e.target.value})}
              style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--surface-border)', background: 'rgba(0,0,0,0.2)', color: 'white', outline: 'none' }}
              placeholder="www.megagym.com"
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Datos Fundamentales</label>
            <textarea 
              required
              rows={4}
              value={formData.fundamentalData}
              onChange={(e) => setFormData({...formData, fundamentalData: e.target.value})}
              style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--surface-border)', background: 'rgba(0,0,0,0.2)', color: 'white', outline: 'none', resize: 'vertical' }}
              placeholder="Cuentas bancarias, contacto de ventas, políticas de envío..."
            />
          </div>
          <button 
            type="submit"
            style={{ marginTop: '1rem', width: '100%', background: 'var(--primary-color)', color: 'white', border: 'none', padding: '0.75rem', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 600 }}
          >
            Guardar Proveedor
          </button>
        </form>
      </Modal>
    </div>
  );
};
