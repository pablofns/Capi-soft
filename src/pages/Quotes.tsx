import React, { useState, useEffect, useRef } from 'react';
import {
  getClients, getProducts, getQuotes, saveQuote, updateQuote, updateQuoteStatus, deleteQuote,
  getProductLatestSalePrice,
  type Client, type Product, type Quote, type QuoteStatus
} from '../lib/store';
import { Modal } from '../components/ui/Modal';
import {
  FileText, Plus, Trash2, CheckCircle, XCircle,
  Send, Clock, Printer, Pencil, MessageCircle
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Share } from '@capacitor/share';
import { Filesystem, Directory } from '@capacitor/filesystem';

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
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 2rem; color: #111; max-width: 800px; margin: 0 auto; }
        .print-header { display: flex; align-items: center; gap: 1.5rem; margin-bottom: 2rem; border-bottom: 2px solid #f0f0f0; padding-bottom: 1rem; }
        .logo-img { width: 80px; height: 80px; object-fit: contain; }
        .brand-info h1 { margin: 0; font-size: 1.8rem; color: #333; }
        .brand-info p { margin: 2px 0 0; color: #666; font-size: 0.9rem; }

        .quote-info { display: flex; justify-content: space-between; margin-bottom: 2rem; background: #f9f9f9; padding: 1rem; border-radius: 8px; }
        .info-block h3 { margin: 0 0 0.5rem; font-size: 0.8rem; text-transform: uppercase; color: #888; letter-spacing: 0.5px; }
        .info-block p { margin: 0; font-weight: 600; color: #333; }

        table { width: 100%; border-collapse: collapse; margin-top: 1.5rem; }
        th { background: #f5f5f5; padding: 0.75rem; text-align: left; font-size: 0.85rem; border-bottom: 2px solid #ddd; }
        td { padding: 0.75rem; border-bottom: 1px solid #eee; font-size: 0.95rem; }

        .totals-section { margin-top: 2rem; display: flex; justify-content: flex-end; }
        .totals-table { width: 250px; }
        .totals-table tr td:first-child { text-align: right; color: #666; font-size: 0.9rem; }
        .totals-table tr td:last-child { text-align: right; font-weight: 600; }
        .totals-table .total-row td { padding-top: 1rem; border-bottom: none; }
        .totals-table .total-row .total-val { font-size: 1.4rem; color: #e65100; font-weight: 800; }

        .notes-section { margin-top: 3rem; padding-top: 1.5rem; border-top: 1px solid #eee; }
        .notes-section h3 { font-size: 0.9rem; margin-bottom: 0.5rem; color: #555; }
        .notes-section p { font-size: 0.85rem; color: #666; line-height: 1.5; white-space: pre-wrap; }

        @media print {
          body { padding: 0; }
          .no-print { display: none; }
        }
      </style></head><body>${printContent}</body></html>
    `);
    win.document.close();
    win.print();
  };

  const handleWhatsAppShare = async () => {
    if (!viewQuote) return;
    const client = clients.find(c => c.id === viewQuote.clientId);
    if (!client) return;

    try {
      const q = viewQuote;
      const qSubtotal = q.items.reduce((acc, i) => acc + (i.unitPrice * i.quantity), 0);
      const qShipping = q.totalAmount - qSubtotal;

      const doc = new jsPDF();

      // Intentar cargar el logo
      try {
        const logoImg = new Image();
        logoImg.src = '/Capi-logo.png';
        await new Promise((resolve, reject) => {
          logoImg.onload = resolve;
          logoImg.onerror = reject;
        });
        doc.addImage(logoImg, 'PNG', 15, 10, 30, 30);
      } catch (e) {
        // Fallback si no hay logo
        doc.setFontSize(20);
        doc.setTextColor(255, 90, 0);
        doc.text('CAPI SPORT', 15, 25);
      }

      doc.setFontSize(16);
      doc.setTextColor(0, 0, 0);
      doc.text('Capi Sport Paraná', 50, 20);
      doc.setFontSize(10);
      doc.text('Elementos de entrenamiento y accesorios.', 50, 26);
      
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text(`Presupuesto: #${q.id.slice(0, 8)}`, 150, 20);
      doc.text(`Fecha: ${fmtDate(q.date)}`, 150, 25);
      doc.text(`Vence: ${fmtDate(q.validUntil)}`, 150, 30);

      // Info Cliente
      doc.setDrawColor(240, 240, 240);
      doc.line(15, 45, 195, 45);
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      doc.text('DATOS DEL CLIENTE', 15, 52);
      doc.setFontSize(10);
      doc.text(`Nombre: ${client.name}`, 15, 58);
      doc.text(`Teléfono: ${client.phone}`, 15, 63);

      // Tabla de items
      const tableData = q.items.map(item => [
        getProductName(item.productId),
        item.quantity,
        fmtPrice.format(item.unitPrice),
        fmtPrice.format(item.unitPrice * item.quantity)
      ]);

      autoTable(doc, {
        startY: 75,
        head: [['Detalle de Producto', 'Cant.', 'Precio Unit.', 'Subtotal']],
        body: tableData,
        foot: [
          ['', '', 'SUBTOTAL', fmtPrice.format(qSubtotal)],
          ['', '', 'ENVÍO', qShipping === 0 ? '$ 0,00' : fmtPrice.format(qShipping)],
          ['', '', 'TOTAL', fmtPrice.format(q.totalAmount)]
        ],
        headStyles: { fillColor: [255, 90, 0], textColor: [255, 255, 255], fontStyle: 'bold' },
        footStyles: { fillColor: [245, 245, 245], textColor: [0, 0, 0], fontStyle: 'bold' },
        columnStyles: {
          1: { halign: 'center' },
          2: { halign: 'right' },
          3: { halign: 'right' }
        },
        theme: 'grid',
        margin: { left: 15, right: 15 }
      });

      if (q.notes) {
        const finalY = (doc as any).lastAutoTable.finalY + 10;
        doc.setFontSize(10);
        doc.text('Notas:', 15, finalY);
        doc.setFontSize(9);
        doc.setTextColor(80, 80, 80);
        doc.text(q.notes, 15, finalY + 5, { maxWidth: 180 });
      }

      // Nombre del archivo: [cliente]-[fecha-hora].pdf
      const now = new Date();
      const timestamp = `${now.toLocaleDateString('es-AR').replace(/\//g, '-')}_${now.getHours()}-${now.getMinutes()}`;
      const fileName = `${client.name.replace(/\s+/g, '_')}-${timestamp}.pdf`;

      const pdfBase64 = doc.output('datauristring').split(',')[1];

      // Detect Capacitor
      const isPushEnabled = window.hasOwnProperty('Capacitor');

      if (isPushEnabled) {
        const savedFile = await Filesystem.writeFile({
          path: fileName,
          data: pdfBase64,
          directory: Directory.Cache,
        });

        await Share.share({
          title: 'Presupuesto Capi Sport',
          text: `Presupuesto para ${client.name}`,
          url: savedFile.uri,
          dialogTitle: 'Enviar por WhatsApp',
        });
      } else {
        // En web simplemente descargamos
        doc.save(fileName);
      }

      // Abrir chat de WhatsApp
      if (client.phone) {
        const cleanPhone = client.phone.replace(/[^0-9]/g, '');
        const whatsappUrl = `https://wa.me/${cleanPhone}`;
        window.open(whatsappUrl, '_blank');
      }

    } catch (err) {
      console.error('Error sharing PDF:', err);
      alert('Error al generar o compartir el PDF. Verifique los permisos.');
    }
  };

  const fmtPrice = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' });
  const fmtDate = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('es-AR');

  const getClientName = (id: string) => clients.find(c => c.id === id)?.name || 'Desconocido';
  const getProductName = (id: string) => products.find(p => p.id === id)?.name || 'Desconocido';

  return (
    <div className="quotes-container" style={{ display: 'flex', gap: '2rem', height: '100%' }}>
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
        const qSubtotal = q.items.reduce((acc, i) => acc + (i.unitPrice * i.quantity), 0);
        const qShipping = q.totalAmount - qSubtotal;
        return (
          <>
            {/* Backdrop for detail panel on mobile */}
            <div
              className="mobile-backdrop"
              onClick={() => setViewQuote(null)}
              aria-hidden="true"
            />
            <div className="glass-panel quote-detail-panel" style={{ width: '420px', flexShrink: 0, padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', maxHeight: 'calc(100vh - 8rem)', overflowY: 'auto' }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h2 style={{ fontSize: '1.3rem', marginBottom: '0.2rem' }}>{getClientName(q.clientId)}</h2>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Emitido: {fmtDate(q.date)} · Válido hasta: {fmtDate(q.validUntil)}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => handleDelete(q.id)} style={{ background: 'none', border: 'none', color: 'var(--danger-color)', cursor: 'pointer', padding: '0.3rem' }} title="Eliminar">
                    <Trash2 size={18} />
                  </button>
                  <button onClick={() => setViewQuote(null)} className="mobile-only" style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.3rem', borderRadius: 'var(--radius-md)' }}>
                    <XCircle size={18} />
                  </button>
                </div>
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
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 500, fontSize: '0.95rem' }}>{getProductName(item.productId)}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.quantity} u. × {fmtPrice.format(item.unitPrice)}</div>
                      </div>
                      <div style={{ fontWeight: 700, marginLeft: '1rem', whiteSpace: 'nowrap' }}>{fmtPrice.format(item.unitPrice * item.quantity)}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Envío + Total */}
              {(() => {
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

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '-0.5rem' }}>
                <button
                  onClick={handleWhatsAppShare}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.85rem', background: '#25D366', border: 'none', borderRadius: 'var(--radius-md)', color: 'white', cursor: 'pointer', fontWeight: 700 }}
                >
                  <MessageCircle size={18} /> Enviar WhatsApp
                </button>
              </div>

              {/* Hidden printable version */}
              <div ref={printRef} style={{ display: 'none' }}>
                <div className="print-header">
                  <img src="/Capi-logo.png" className="logo-img" alt="Logo" />
                  <div className="brand-info">
                    <h1>Capi Sport Paraná</h1>
                    <p>Elementos de entrenamiento y accesorios.</p>
                  </div>
                </div>

                <div className="quote-info">
                  <div className="info-block">
                    <h3>Cliente</h3>
                    <p>{getClientName(q.clientId)}</p>
                  </div>
                  <div className="info-block">
                    <h3>Fecha</h3>
                    <p>{fmtDate(q.date)}</p>
                  </div>
                  <div className="info-block">
                    <h3>Válido hasta</h3>
                    <p>{fmtDate(q.validUntil)}</p>
                  </div>
                </div>

                <table>
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th style={{ textAlign: 'center' }}>Cant.</th>
                      <th style={{ textAlign: 'right' }}>Precio Unit.</th>
                      <th style={{ textAlign: 'right' }}>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {q.items.map((item, i) => (
                      <tr key={i}>
                        <td>{getProductName(item.productId)}</td>
                        <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                        <td style={{ textAlign: 'right' }}>{fmtPrice.format(item.unitPrice)}</td>
                        <td style={{ textAlign: 'right' }}>{fmtPrice.format(item.unitPrice * item.quantity)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="totals-section">
                  <table className="totals-table">
                    <tbody>
                      <tr>
                        <td>Subtotal:</td>
                        <td>{fmtPrice.format(qSubtotal)}</td>
                      </tr>
                      <tr>
                        <td>Envío:</td>
                        <td>{qShipping === 0 ? '$ 0,00' : fmtPrice.format(qShipping)}</td>
                      </tr>
                      <tr className="total-row">
                        <td>TOTAL:</td>
                        <td className="total-val">{fmtPrice.format(q.totalAmount)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {q.notes && (
                  <div className="notes-section">
                    <h3>Notas y Condiciones</h3>
                    <p>{q.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </>
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

        .mobile-only { display: none; }
        .mobile-backdrop { display: none; }

        @media (max-width: 1024px) {
          .quotes-container { flex-direction: column !important; }
          .quote-detail-panel { 
            position: fixed !important;
            top: 50% !important;
            left: 50% !important;
            transform: translate(-50%, -50%) !important;
            width: 90% !important;
            height: auto !important;
            max-height: 85vh !important;
            z-index: 1000;
            border-radius: var(--radius-lg) !important;
            background: #1a1a1a !important;
            box-shadow: 0 10px 40px rgba(0,0,0,0.5) !important;
            border: 1px solid var(--surface-border) !important;
            animation: fade-in-scale 0.3s ease-out;
          }
          .mobile-only { display: flex; }
          .mobile-backdrop { 
            display: block;
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0,0,0,0.7);
            backdrop-filter: blur(4px);
            z-index: 999;
          }
        }

        @keyframes fade-in-scale {
          from { opacity: 0; transform: translate(-50%, -40%) scale(0.95); }
          to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
      `}</style>
    </div>
  );
};
