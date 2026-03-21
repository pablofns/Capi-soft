import React, { useState, useEffect } from 'react';
import type { Client } from '../lib/store';
import { getClients, saveClient, deleteClient, updateClient } from '../lib/store';
import { Modal } from '../components/ui/Modal';
import { Trash2, MapPin, Clock, User, History, Search, Edit2 } from 'lucide-react';

export const Clients: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClientId, setEditingClientId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    schedule: '',
    contactName: '',
    productHistory: '',
    mapLink: '',
    phone: ''
  });

  useEffect(() => {
    (async () => {
      const c = await getClients();
      setClients(c);
    })();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingClientId) {
      const updatedClient = await updateClient(editingClientId, formData);
      setClients(clients.map(c => c.id === editingClientId ? updatedClient : c));
    } else {
      const newClient = await saveClient(formData);
      setClients([...clients, newClient]);
    }
    
    handleCloseModal();
  };

  const handleEdit = (client: Client) => {
    setEditingClientId(client.id);
    setFormData({
      name: client.name,
      address: client.address,
      schedule: client.schedule,
      contactName: client.contactName,
      productHistory: client.productHistory,
      mapLink: client.mapLink,
      phone: client.phone || ''
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingClientId(null);
    setFormData({
      name: '',
      address: '',
      schedule: '',
      contactName: '',
      productHistory: '',
      mapLink: '',
      phone: ''
    });
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar este cliente?')) {
      await deleteClient(id);
      setClients(prevClients => prevClients.filter(c => c.id !== id));
    }
  };

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', gap: '2rem', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '300px' }}>
          <h1 className="page-title">Clientes</h1>
          <p className="page-subtitle" style={{ marginBottom: '1rem' }}>Administra tus gimnasios y salas de pilates asociados.</p>

          <div style={{ position: 'relative', maxWidth: '400px' }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Buscar por nombre o dirección..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 1rem 0.75rem 2.75rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--surface-border)',
                background: 'rgba(255,255,255,0.05)',
                color: 'white',
                outline: 'none',
                transition: 'all 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--primary-color)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--surface-border)'}
            />
          </div>
        </div>
        <button
          onClick={() => { setEditingClientId(null); setIsModalOpen(true); }}
          style={{
            background: 'var(--primary-color)',
            color: 'white',
            border: 'none',
            padding: '0.75rem 1.5rem',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
            fontWeight: 600,
            transition: 'all 0.2s',
            alignSelf: 'flex-start'
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          + Nuevo Cliente
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
        {filteredClients.length === 0 ? (
          <div className="glass-panel" style={{ gridColumn: '1 / -1', padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <p>{searchTerm ? 'No se encontraron clientes que coincidan con la búsqueda.' : 'No hay clientes registrados. Añade tu primer gimnasio o sala de pilates.'}</p>
          </div>
        ) : (
          filteredClients.map(client => (
            <div key={client.id} className="glass-panel animate-fade-in" style={{ padding: '1.5rem', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '1rem', right: '1rem', display: 'flex', gap: '0.5rem', zIndex: 10 }}>
                <button
                  onClick={(e) => { e.stopPropagation(); handleEdit(client); }}
                  style={{ background: 'rgba(57,144,255,0.1)', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', padding: '0.5rem', borderRadius: '50%', display: 'flex' }}
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(client.id); }}
                  style={{ background: 'rgba(255,59,48,0.1)', border: 'none', color: 'var(--danger-color)', cursor: 'pointer', padding: '0.5rem', borderRadius: '50%', display: 'flex' }}
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <h3 style={{ fontSize: '1.4rem', color: 'var(--primary-color)', marginBottom: '1rem', paddingRight: '2rem' }}>{client.name}</h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', fontSize: '0.95rem' }}>
                  <MapPin size={18} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                  <div>
                    <span style={{ display: 'block' }}>{client.address}</span>
                    {client.mapLink && (
                      <a
                        href={client.mapLink.startsWith('http') ? client.mapLink : `https://${client.mapLink}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: 'var(--primary-color)', fontSize: '0.85rem', textDecoration: 'underline' }}
                      >
                        Ver en el mapa
                      </a>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.95rem' }}>
                  <Clock size={18} style={{ color: 'var(--text-muted)' }} />
                  <span>{client.schedule}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.95rem' }}>
                  <User size={18} style={{ color: 'var(--text-muted)' }} />
                  <span>Contacto: {client.contactName}{client.phone ? ` · ${client.phone}` : ''}</span>
                </div>

                <div style={{
                  marginTop: '0.5rem',
                  padding: '1rem',
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--surface-border)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    <History size={16} />
                    <strong>Historial de Compras:</strong>
                  </div>
                  <p style={{ fontSize: '0.9rem', whiteSpace: 'pre-wrap' }}>{client.productHistory || 'Sin registros.'}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingClientId ? "Editar Cliente" : "Registrar Cliente"}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Nombre del Gimnasio / Sala</label>
            <input
              required
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              style={{ width: '100%', padding: '0.8rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--surface-border)', background: 'rgba(0,0,0,0.3)', color: 'white', outline: 'none' }}
              placeholder="Ej. Olimpo Fitness"
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Contacto</label>
              <input
                required
                type="text"
                value={formData.contactName}
                onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                style={{ width: '100%', padding: '0.8rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--surface-border)', background: 'rgba(0,0,0,0.3)', color: 'white', outline: 'none' }}
                placeholder="Nombre del dueño/encargado"
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Teléfono</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                style={{ width: '100%', padding: '0.8rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--surface-border)', background: 'rgba(0,0,0,0.3)', color: 'white', outline: 'none' }}
                placeholder="Ej. +54 9 11 1234 5678"
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Horarios</label>
              <input
                required
                type="text"
                value={formData.schedule}
                onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
                style={{ width: '100%', padding: '0.8rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--surface-border)', background: 'rgba(0,0,0,0.3)', color: 'white', outline: 'none' }}
                placeholder="Lun a Vie 8:00 - 22:00"
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Dirección</label>
            <input
              required
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              style={{ width: '100%', padding: '0.8rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--surface-border)', background: 'rgba(0,0,0,0.3)', color: 'white', outline: 'none' }}
              placeholder="Calle y número, Ciudad"
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Enlace al Mapa (Google Maps)</label>
            <input
              type="text"
              value={formData.mapLink}
              onChange={(e) => setFormData({ ...formData, mapLink: e.target.value })}
              style={{ width: '100%', padding: '0.8rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--surface-border)', background: 'rgba(0,0,0,0.3)', color: 'white', outline: 'none' }}
              placeholder="https://goo.gl/maps/..."
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Historial de Productos / Notas</label>
            <textarea
              rows={4}
              value={formData.productHistory}
              onChange={(e) => setFormData({ ...formData, productHistory: e.target.value })}
              style={{ width: '100%', padding: '0.8rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--surface-border)', background: 'rgba(0,0,0,0.3)', color: 'white', outline: 'none', resize: 'vertical' }}
              placeholder="Listado de compras previas o preferencias del cliente..."
            />
          </div>

          <button
            type="submit"
            style={{
              marginTop: '0.5rem',
              width: '100%',
              background: 'var(--primary-color)',
              color: 'white',
              border: 'none',
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '1rem'
            }}
          >
            Guardar Cliente
          </button>
        </form>
      </Modal>
    </div>
  );
};
