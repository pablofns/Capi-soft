import React, { useState, useEffect, useRef } from 'react';
import {
  getClients, getProducts, getQuotes, saveQuote, updateQuote, updateQuoteStatus, deleteQuote,
  getProductLatestSalePrice,
  type Client, type Product, type Quote, type QuoteStatus
} from '../lib/store';
import { Modal } from '../components/ui/Modal';
import {
  FileText, Plus, Trash2, CheckCircle, XCircle,
  Send, Clock, Printer, Pencil
} from 'lucide-react';

const STATUS_CONFIG: Record<QuoteStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  borrador: { label: 'Borrador', color: '#aaa', bg: 'rgba(170,170,170,0.1)', icon: <Clock size={14} /> },
  enviado: { label: 'Enviado', color: '#2196f3', bg: 'rgba(33,150,243,0.1)', icon: <Send size={14} /> },
  aprobado: { label: 'Aprobado', color: '#4caf50', bg: 'rgba(76,175,80,0.1)', icon: <CheckCircle size={14} /> },
  rechazado: { label: 'Rechazado', color: '#ff3b30', bg: 'rgba(255,59,48,0.1)', icon: <XCircle size={14} /> },
};

export const Quotes: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewQuote, setViewQuote] = useState<Quote | null>(null);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    clientId: '',
    date: new Date().toISOString().split('T')[0],
    validUntil: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    notes: '',
    items: [{ productId: '', quantity: 1, unitPrice: 0 }]
  });

  useEffect(() => { (async () => { await loadData(); })(); }, []);

  const loadData = async () => {
    const [c, p, q] = await Promise.all([getClients(), getProducts(), getQuotes()]);
    setClients(c);
    setProducts(p);
    setQuotes(q);
  };

  const handleAddItem = () => {
    setFormData({ ...formData, items: [...formData.items, { productId: '', quantity: 1, unitPrice: 0 }] });
  };

  const handleRemoveItem = (idx: number) => {
    setFormData({ ...formData, items: formData.items.filter((_, i) => i !== idx) });
  };

  const handleProductSelect = async (idx: number, productId: string) => {
    const newItems = [...formData.items];
    const price = await getProductLatestSalePrice(productId);
    newItems[idx] = { ...newItems[idx], productId, unitPrice: price };
    setFormData({ ...formData, items: newItems });
  };

  const SHIPPING_THRESHOLD = 25000;
  const SHIPPING_COST = 2000;

  const subtotal = formData.items.reduce((acc, i) => acc + (i.unitPrice * i.quantity), 0);
  const shippingAmount = subtotal >= SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
  const total = subtotal + shippingAmount;
  const freeShipping = subtotal >= SHIPPING_THRESHOLD;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const quoteData = {
      clientId: formData.clientId,
      date: formData.date,
      validUntil: formData.validUntil,
      status: editingQuote?.status ?? 'borrador' as QuoteStatus,
      items: formData.items,
      totalAmount: total,
      notes: formData.notes
    };
    if (editingQuote) {
      await updateQuote(editingQuote.id, quoteData);
      setViewQuote({ ...quoteData, id: editingQuote.id });
    } else {
      await saveQuote(quoteData);
    }
    setIsModalOpen(false);
    setEditingQuote(null);
    await loadData();
    setFormData({
      clientId: '', date: new Date().toISOString().split('T')[0],
      validUntil: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      notes: '', items: [{ productId: '', quantity: 1, unitPrice: 0 }]
    });
  };

  const handleEdit = (q: Quote) => {
    setEditingQuote(q);
    setFormData({
      clientId: q.clientId,
      date: q.date,
      validUntil: q.validUntil,
      notes: q.notes,
      items: q.items
    });
    setIsModalOpen(true);
  };

  const handleStatusChange = async (id: string, status: QuoteStatus) => {
    await updateQuoteStatus(id, status);
    setQuotes(prev => prev.map(q => q.id === id ? { ...q, status } : q));
    if (viewQuote?.id === id) setViewQuote(prev => prev ? { ...prev, status } : null);
  };

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (confirm('¿Eliminar este presupuesto?')) {
      await deleteQuote(id);
      setQuotes(prev => prev.filter(q => q.id !== id));
      if (viewQuote?.id === id) setViewQuote(null);
    }
  };

  const handlePrint = () => {
    if (!printRef.current) return;
    const printContent = printRef.current.innerHTML;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <html><head><title>Presupuesto</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 2rem; color: #111; }
        table { width: 100%; border-collapse: collapse; margin-top: 1.5rem; }
        th { background: #f5f5f5; padding: 0.75rem; text-align: left; font-size: 0.85rem; }
        td { padding: 0.75rem; border-bottom: 1px solid #eee; }
        .total { font-size: 1.5rem; font-weight: bold; }
        .header { display: flex; justify-content: space-between; margin-bottom: 2rem; }
        h1 { font-size: 1.8rem; margin: 0; }
        .label { color: #666; font-size: 0.8rem; }
      </style></head><body>${printContent}</body></html>
    `);
    win.document.close();
    win.print();
  };

  const fmtPrice = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' });
  const fmtDate = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('es-AR');

  const getClientName = (id: string) => clients.find(c => c.id === id)?.name || 'Desconocido';
  const getProductName = (id: string) => products.find(p => p.id === id)?.name || 'Desconocido';

  return (
    <div style={{ display: 'flex', gap: '2rem', height: '100%' }}>
      {/* Left: List */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 className="page-title">Presupuestos</h1>
            <p className="page-subtitle" style={{ marginBottom: 0 }}>Creá y gestioná cotizaciones para tus clientes.</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            style={{ background: 'var(--primary-color)', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Plus size={18} /> Nuevo Presupuesto
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {quotes.length === 0 ? (
            <div className="glass-panel" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <FileText size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
              <p>No hay presupuestos todavía. Creá el primero.</p>
            </div>
          ) : (
            [...quotes].reverse().map(q => {
              const statusCfg = STATUS_CONFIG[q.status];
              return (
                <div
                  key={q.id}
                  onClick={() => setViewQuote(q)}
                  className="glass-panel animate-fade-in"
                  style={{ padding: '1.25rem 1.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '1rem', transition: 'all 0.2s', border: viewQuote?.id === q.id ? '1px solid var(--primary-color)' : '1px solid transparent' }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, marginBottom: '0.2rem' }}>{getClientName(q.clientId)}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{fmtDate(q.date)} · {q.items.length} ítem{q.items.length !== 1 ? 's' : ''}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, color: 'var(--primary-color)' }}>{fmtPrice.format(q.totalAmount)}</div>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '4px', padding: '2px 8px', borderRadius: '10px', background: statusCfg.bg, color: statusCfg.color, fontSize: '0.75rem' }}>
                      {statusCfg.icon} {statusCfg.label}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right: Detail Panel */}
      {viewQuote && (() => {
        const q = viewQuote;
        const cfg = STATUS_CONFIG[q.status];
        return (
          <div className="glass-panel" style={{ width: '420px', flexShrink: 0, padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', maxHeight: 'calc(100vh - 8rem)', overflowY: 'auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h2 style={{ fontSize: '1.3rem', marginBottom: '0.2rem' }}>{getClientName(q.clientId)}</h2>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Emitido: {fmtDate(q.date)} · Válido hasta: {fmtDate(q.validUntil)}
                </div>
              </div>
              <button onClick={() => handleDelete(q.id)} style={{ background: 'none', border: 'none', color: 'var(--danger-color)', cursor: 'pointer', padding: '0.3rem' }}>
                <Trash2 size={18} />
              </button>
            </div>

            {/* Status selector */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Estado</label>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {(Object.keys(STATUS_CONFIG) as QuoteStatus[]).map(s => {
                  const c = STATUS_CONFIG[s];
                  return (
                    <button
                      key={s}
                      onClick={() => handleStatusChange(q.id, s)}
                      style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '0.3rem 0.75rem', borderRadius: '20px', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: q.status === s ? 700 : 400, background: q.status === s ? c.bg : 'rgba(255,255,255,0.04)', color: q.status === s ? c.color : 'var(--text-muted)', outline: q.status === s ? `1px solid ${c.color}` : 'none' }}
                    >
                      {c.icon} {c.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Items table */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>Detalle de Ítems</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {q.items.map((item, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)' }}>
                    <div>
                      <div style={{ fontWeight: 500, fontSize: '0.95rem' }}>{getProductName(item.productId)}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.quantity} u. × {fmtPrice.format(item.unitPrice)}</div>
                    </div>
                    <div style={{ fontWeight: 700 }}>{fmtPrice.format(item.unitPrice * item.quantity)}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Envío + Total */}
            {(() => {
              const qSubtotal = q.items.reduce((acc, i) => acc + (i.unitPrice * i.quantity), 0);
              const qShipping = q.totalAmount - qSubtotal;
              const qFreeShipping = qShipping === 0;
              return (
                <div style={{ borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,90,0,0.2)', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 1rem', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,90,0,0.1)' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Subtotal</span>
                    <span style={{ fontWeight: 600 }}>{fmtPrice.format(qSubtotal)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 1rem', background: qFreeShipping ? 'rgba(76,175,80,0.06)' : 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,90,0,0.1)' }}>
                    <span style={{ fontSize: '0.85rem', color: qFreeShipping ? '#4caf50' : 'var(--text-muted)' }}>
                      🚚 Envío {qFreeShipping ? '(bonificado)' : ''}
                    </span>
                    <span style={{ fontWeight: 600, color: qFreeShipping ? '#4caf50' : 'inherit' }}>
                      {qFreeShipping ? '$ 0,00' : fmtPrice.format(qShipping)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: 'rgba(255,90,0,0.08)' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>TOTAL</span>
                    <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary-color)' }}>{fmtPrice.format(q.totalAmount)}</span>
                  </div>
                </div>
              );
            })()}

            {q.notes && (
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Notas</label>
                <p style={{ fontSize: '0.9rem', background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: 'var(--radius-md)', whiteSpace: 'pre-wrap' }}>{q.notes}</p>
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => handleEdit(q)}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.85rem', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--surface-border)', borderRadius: 'var(--radius-md)', color: 'white', cursor: 'pointer', fontWeight: 600 }}
              >
                <Pencil size={18} /> Editar
              </button>
              <button
                onClick={handlePrint}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.85rem', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--surface-border)', borderRadius: 'var(--radius-md)', color: 'white', cursor: 'pointer', fontWeight: 600 }}
              >
                <Printer size={18} /> Imprimir
              </button>
            </div>

            {/* Hidden printable version */}
            <div ref={printRef} style={{ display: 'none' }}>
              <div className="header">
                <div>
                  <h1>Presupuesto</h1>
                  <p className="label">Fecha: {fmtDate(q.date)} · Válido hasta: {fmtDate(q.validUntil)}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <strong>Cliente:</strong><br />
                  {getClientName(q.clientId)}
                </div>
              </div>
              <table>
                <thead><tr><th>Producto</th><th>Cantidad</th><th>Precio Unit.</th><th>Subtotal</th></tr></thead>
                <tbody>
                  {q.items.map((item, i) => (
                    <tr key={i}>
                      <td>{getProductName(item.productId)}</td>
                      <td>{item.quantity}</td>
                      <td>{fmtPrice.format(item.unitPrice)}</td>
                      <td>{fmtPrice.format(item.unitPrice * item.quantity)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ marginTop: '2rem', textAlign: 'right' }}>
                <p className="label">TOTAL</p>
                <p className="total">{fmtPrice.format(q.totalAmount)}</p>
              </div>
              {q.notes && <p style={{ marginTop: '2rem', fontSize: '0.85rem', color: '#666' }}><strong>Notas:</strong> {q.notes}</p>}
            </div>
          </div>
        );
      })()}

      {/* New Quote Modal */}
      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingQuote(null); setFormData({ clientId: '', date: new Date().toISOString().split('T')[0], validUntil: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0], notes: '', items: [{ productId: '', quantity: 1, unitPrice: 0 }] }); }} title={editingQuote ? 'Editar Presupuesto' : 'Nuevo Presupuesto'}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ flex: 2 }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Cliente</label>
              <select required className="q-input" value={formData.clientId} onChange={e => setFormData({ ...formData, clientId: e.target.value })}>
                <option value="" disabled>Seleccionar cliente...</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Fecha</label>
              <input required type="date" className="q-input" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Válido hasta</label>
              <input required type="date" className="q-input" value={formData.validUntil} onChange={e => setFormData({ ...formData, validUntil: e.target.value })} />
            </div>
          </div>

          <div>
            <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              Ítems
              <button type="button" onClick={handleAddItem} style={{ color: 'var(--primary-color)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem' }}>+ Agregar Ítem</button>
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {formData.items.map((item, idx) => {
                const subtotal = item.unitPrice * item.quantity;
                return (
                  <div key={idx} style={{ background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--surface-border)' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.4rem' }}>
                      <select
                        required
                        className="q-input"
                        value={item.productId}
                        onChange={e => handleProductSelect(idx, e.target.value)}
                        style={{ flex: 2 }}
                      >
                        <option value="" disabled>Producto...</option>
                        {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                      <input
                        required type="number" min="1" className="q-input"
                        placeholder="Cant." style={{ flex: 0.7 }}
                        value={item.quantity}
                        onChange={e => {
                          const newItems = [...formData.items];
                          newItems[idx].quantity = parseInt(e.target.value) || 1;
                          setFormData({ ...formData, items: newItems });
                        }}
                      />
                      <input
                        required type="number" className="q-input"
                        placeholder="Precio unit." style={{ flex: 1.2 }}
                        value={item.unitPrice || ''}
                        onChange={e => {
                          const newItems = [...formData.items];
                          newItems[idx].unitPrice = parseFloat(e.target.value) || 0;
                          setFormData({ ...formData, items: newItems });
                        }}
                      />
                      <button type="button" onClick={() => handleRemoveItem(idx)} style={{ background: 'none', border: 'none', color: 'var(--danger-color)', cursor: 'pointer', flexShrink: 0 }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                    {subtotal > 0 && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', paddingLeft: '0.25rem' }}>
                        Subtotal: <strong style={{ color: 'white' }}>{fmtPrice.format(subtotal)}</strong>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Notas / Condiciones</label>
            <textarea
              className="q-input" rows={3}
              placeholder="Forma de pago, tiempos de entrega, condiciones especiales..."
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              style={{ resize: 'vertical' }}
            />
          </div>

          {/* Envío y Total */}
          <div style={{ borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,90,0,0.2)', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,90,0,0.1)' }}>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Subtotal productos</span>
              <span style={{ fontWeight: 600 }}>{fmtPrice.format(subtotal)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: freeShipping ? 'rgba(76,175,80,0.06)' : 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,90,0,0.1)' }}>
              <span style={{ fontSize: '0.9rem', color: freeShipping ? '#4caf50' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                🚚 Envío a domicilio
                {freeShipping
                  ? <span style={{ fontSize: '0.75rem', background: 'rgba(76,175,80,0.15)', color: '#4caf50', padding: '1px 6px', borderRadius: '8px' }}>¡BONIFICADO!</span>
                  : <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>(pedidos menores a {fmtPrice.format(SHIPPING_THRESHOLD)})</span>
                }
              </span>
              <span style={{ fontWeight: 600, color: freeShipping ? '#4caf50' : 'inherit' }}>
                {freeShipping ? '$ 0,00' : fmtPrice.format(SHIPPING_COST)}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(255,90,0,0.08)' }}>
              <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>TOTAL PRESUPUESTO</span>
              <span style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary-color)' }}>{fmtPrice.format(total)}</span>
            </div>
          </div>

          <button
            type="submit"
            style={{
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
            Guardar Presupuesto
          </button>
        </form>
      </Modal>

      <style>{`
        .q-input { width: 100%; padding: 0.75rem; border-radius: var(--radius-md); border: 1px solid var(--surface-border); background: rgba(0,0,0,0.3); color: white; outline: none; transition: border-color 0.2s; box-sizing: border-box; }
        .q-input:focus { border-color: var(--primary-color); }
      `}</style>
    </div>
  );
};
