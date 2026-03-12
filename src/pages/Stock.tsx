import React, { useState, useEffect } from 'react';
import { 
  getProducts, getSuppliers, getClients, 
  getPurchases, savePurchase, getSales, saveSale,
  getProductStock, type Product, type Supplier, type Client 
} from '../lib/store';
import { Modal } from '../components/ui/Modal';
import { 
  Package, TrendingUp, TrendingDown, Truck
} from 'lucide-react';

export const Stock: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);

  // Form states
  const [purchaseForm, setPurchaseForm] = useState({
    supplierId: '',
    date: new Date().toISOString().split('T')[0],
    shippingCost: 0,
    items: [{ productId: '', quantity: 1, unitCost: 0 }]
  });

  const [saleForm, setSaleForm] = useState({
    clientId: '',
    date: new Date().toISOString().split('T')[0],
    items: [{ productId: '', quantity: 1, unitPrice: 0 }]
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setProducts(getProducts());
    setSuppliers(getSuppliers());
    setClients(getClients());
  };

  const handleAddPurchaseItem = () => {
    setPurchaseForm({
      ...purchaseForm,
      items: [...purchaseForm.items, { productId: '', quantity: 1, unitCost: 0 }]
    });
  };

  const handleAddSaleItem = () => {
    setSaleForm({
      ...saleForm,
      items: [...saleForm.items, { productId: '', quantity: 1, unitPrice: 0 }]
    });
  };

  const handleSavePurchase = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prorrateo de envío por valor
    const itemsTotalValue = purchaseForm.items.reduce((acc, item) => acc + (item.unitCost * item.quantity), 0);
    const shipping = purchaseForm.shippingCost;
    
    const prorratedItems = purchaseForm.items.map(item => {
      const itemTotal = item.unitCost * item.quantity;
      const proportion = itemsTotalValue > 0 ? (itemTotal / itemsTotalValue) : (1 / purchaseForm.items.length);
      const itemShippingPortion = (shipping * proportion) / item.quantity;
      return {
        ...item,
        finalUnitCost: item.unitCost + itemShippingPortion
      };
    });

    savePurchase({
      supplierId: purchaseForm.supplierId,
      date: purchaseForm.date,
      shippingCost: shipping,
      items: prorratedItems,
      totalAmount: itemsTotalValue + shipping
    });

    setIsPurchaseModalOpen(false);
    loadData();
    setPurchaseForm({
      supplierId: '',
      date: new Date().toISOString().split('T')[0],
      shippingCost: 0,
      items: [{ productId: '', quantity: 1, unitCost: 0 }]
    });
  };

  const handleSaveSale = (e: React.FormEvent) => {
    e.preventDefault();
    const total = saleForm.items.reduce((acc, item) => acc + (item.unitPrice * item.quantity), 0);
    
    saveSale({
      clientId: saleForm.clientId,
      date: saleForm.date,
      items: saleForm.items,
      totalAmount: total
    });

    setIsSaleModalOpen(false);
    loadData();
    setSaleForm({
      clientId: '',
      date: new Date().toISOString().split('T')[0],
      items: [{ productId: '', quantity: 1, unitPrice: 0 }]
    });
  };

  const formattedPrice = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="page-title">Gestión de Stock</h1>
          <p className="page-subtitle" style={{ marginBottom: 0 }}>Control de inventario, compras y ventas.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            onClick={() => setIsPurchaseModalOpen(true)}
            style={{ background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid var(--surface-border)', padding: '0.75rem 1.25rem', borderRadius: 'var(--radius-md)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <TrendingUp size={18} color="#4caf50" /> Ingreso (Compra)
          </button>
          <button 
            onClick={() => setIsSaleModalOpen(true)}
            style={{ background: 'var(--primary-color)', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <TrendingDown size={18} /> Egreso (Venta)
          </button>
        </div>
      </div>

      {/* Stock Overview Table */}
      <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Package size={20} /> Inventario Actual
        </h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--surface-border)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '1rem' }}>Producto</th>
                <th style={{ padding: '1rem' }}>Stock</th>
                <th style={{ padding: '1rem' }}>P. Venta Público</th>
                <th style={{ padding: '1rem' }}>Último Movimiento</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No hay productos configurados en el catálogo.
                  </td>
                </tr>
              ) : (
                products.map(p => {
                  const stock = getProductStock(p.id);
                  return (
                    <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '1rem' }}>{p.name}</td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{ 
                          padding: '0.2rem 0.6rem', 
                          borderRadius: '10px', 
                          background: stock <= 0 ? 'rgba(255,59,48,0.2)' : 'rgba(76,175,80,0.2)',
                          color: stock <= 0 ? '#ff3b30' : '#4caf50',
                          fontSize: '0.85rem'
                        }}>
                          {stock} unidades
                        </span>
                      </td>
                      <td style={{ padding: '1rem' }}>{formattedPrice.format(p.price)}</td>
                      <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>---</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Purchase Entry Modal */}
      <Modal isOpen={isPurchaseModalOpen} onClose={() => setIsPurchaseModalOpen(false)} title="Registrar Compra a Proveedor">
        <form onSubmit={handleSavePurchase} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ flex: 1 }}>
              <label className="label">Proveedor</label>
              <select 
                required
                className="input" 
                value={purchaseForm.supplierId}
                onChange={(e) => setPurchaseForm({...purchaseForm, supplierId: e.target.value})}
                style={{ appearance: 'none' }}
              >
                <option value="" disabled>Seleccionar...</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label className="label">Fecha</label>
              <input 
                required
                type="date" 
                className="input" 
                value={purchaseForm.date}
                onChange={(e) => setPurchaseForm({...purchaseForm, date: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label className="label">Gastos de Envío (Total Factura)</label>
            <div style={{ position: 'relative' }}>
              <Truck size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="number" 
                className="input" 
                style={{ paddingLeft: '2.75rem' }}
                value={purchaseForm.shippingCost || ''}
                onChange={(e) => setPurchaseForm({...purchaseForm, shippingCost: parseFloat(e.target.value)})}
                placeholder="0.00"
              />
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
              Este valor se prorrateará proporcionalmente al costo de cada ítem cargado abajo.
            </p>
          </div>

          <div>
            <label className="label" style={{ display: 'flex', justifyContent: 'space-between' }}>
              Ítems de la Factura
              <button type="button" onClick={handleAddPurchaseItem} style={{ color: 'var(--primary-color)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem' }}>+ Agregar Ítem</button>
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {purchaseForm.items.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <select 
                    required
                    className="input" 
                    value={item.productId}
                    onChange={(e) => {
                      const newItems = [...purchaseForm.items];
                      newItems[idx].productId = e.target.value;
                      setPurchaseForm({...purchaseForm, items: newItems});
                    }}
                    style={{ flex: 2 }}
                  >
                    <option value="" disabled>Producto...</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  <input 
                    required
                    type="number" 
                    className="input" 
                    placeholder="Cant" 
                    style={{ flex: 0.8 }}
                    value={item.quantity}
                    onChange={(e) => {
                      const newItems = [...purchaseForm.items];
                      newItems[idx].quantity = parseInt(e.target.value);
                      setPurchaseForm({...purchaseForm, items: newItems});
                    }}
                  />
                  <input 
                    required
                    type="number" 
                    className="input" 
                    placeholder="Costo" 
                    style={{ flex: 1.2 }}
                    value={item.unitCost || ''}
                    onChange={(e) => {
                      const newItems = [...purchaseForm.items];
                      newItems[idx].unitCost = parseFloat(e.target.value);
                      setPurchaseForm({...purchaseForm, items: newItems});
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          <button type="submit" className="button-primary">Confirmar Ingreso de Stock</button>
        </form>
      </Modal>

      {/* Sale Modal */}
      <Modal isOpen={isSaleModalOpen} onClose={() => setIsSaleModalOpen(false)} title="Registrar Venta a Cliente">
        <form onSubmit={handleSaveSale} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ flex: 1 }}>
              <label className="label">Cliente</label>
              <select 
                required
                className="input" 
                value={saleForm.clientId}
                onChange={(e) => setSaleForm({...saleForm, clientId: e.target.value})}
              >
                <option value="" disabled>Seleccionar...</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label className="label">Fecha</label>
              <input required type="date" className="input" value={saleForm.date} onChange={(e) => setSaleForm({...saleForm, date: e.target.value})} />
            </div>
          </div>

          <div>
            <label className="label" style={{ display: 'flex', justifyContent: 'space-between' }}>
              Productos Vendidos
              <button type="button" onClick={handleAddSaleItem} style={{ color: 'var(--primary-color)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem' }}>+ Agregar</button>
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {saleForm.items.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <select 
                    required
                    className="input" 
                    value={item.productId}
                    onChange={(e) => {
                      const newItems = [...saleForm.items];
                      newItems[idx].productId = e.target.value;
                      // Auto-fill price from product catalog
                      const p = products.find(prod => prod.id === e.target.value);
                      if (p) newItems[idx].unitPrice = p.price;
                      setSaleForm({...saleForm, items: newItems});
                    }}
                    style={{ flex: 2 }}
                  >
                    <option value="" disabled>Producto...</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  <input 
                    required
                    type="number" 
                    className="input" 
                    placeholder="Q" 
                    style={{ flex: 0.6 }}
                    value={item.quantity}
                    onChange={(e) => {
                      const newItems = [...saleForm.items];
                      newItems[idx].quantity = parseInt(e.target.value);
                      setSaleForm({...saleForm, items: newItems});
                    }}
                  />
                  <input 
                    required
                    type="number" 
                    className="input" 
                    placeholder="P. Venta" 
                    style={{ flex: 1 }}
                    value={item.unitPrice || ''}
                    onChange={(e) => {
                      const newItems = [...saleForm.items];
                      newItems[idx].unitPrice = parseFloat(e.target.value);
                      setSaleForm({...saleForm, items: newItems});
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          <button type="submit" className="button-primary">Registrar Venta</button>
        </form>
      </Modal>

      <style>{`
        .label { display: block; margin-bottom: 0.5rem; font-size: 0.9rem; color: var(--text-muted); }
        .input { width: 100%; padding: 0.75rem; border-radius: var(--radius-md); border: 1px solid var(--surface-border); background: rgba(0,0,0,0.3); color: white; outline: none; transition: border-color 0.2s; }
        .input:focus { border-color: var(--primary-color); }
        .button-primary { width: 100%; background: var(--primary-color); color: white; border: none; padding: 1rem; border-radius: var(--radius-md); cursor: pointer; font-weight: 700; margin-top: 0.5rem; }
      `}</style>
    </div>
  );
};
