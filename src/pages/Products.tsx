import React, { useState, useEffect } from 'react';
import type { Product, Supplier, Category } from '../lib/store';
import { 
  getProducts, saveProduct, deleteProduct, 
  getSuppliers, getCategories, saveCategory, deleteCategory 
} from '../lib/store';
import { Modal } from '../components/ui/Modal';
import { 
  Trash2, Link as LinkIcon, Image as ImageIcon, 
  Tag, ChevronLeft, ChevronRight, Plus
} from 'lucide-react';

export const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | 'all'>('all');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  const [formData, setFormData] = useState({ 
    supplierId: '', 
    categoryIds: [] as string[], 
    name: '', 
    details: '', 
    price: 0, 
    imageUrls: [] as string[], 
    purchaseLink: '' 
  });
  
  const [currentImageUrl, setCurrentImageUrl] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setProducts(getProducts());
    setSuppliers(getSuppliers());
    setCategories(getCategories());
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    saveCategory(newCatName.trim());
    setNewCatName('');
    setCategories(getCategories());
  };

  const handleDeleteCategory = (id: string) => {
    if (confirm('¿Eliminar esta categoría? Los productos dejarán de tener este tag.')) {
      deleteCategory(id);
      setCategories(prev => prev.filter(c => c.id !== id));
    }
  };

  const handleAddImage = () => {
    if (currentImageUrl.trim()) {
      setFormData({
        ...formData,
        imageUrls: [...formData.imageUrls, currentImageUrl.trim()]
      });
      setCurrentImageUrl('');
    }
  };

  const removeImage = (index: number) => {
    setFormData({
      ...formData,
      imageUrls: formData.imageUrls.filter((_, i) => i !== index)
    });
  };

  const toggleCategory = (catId: string) => {
    const current = formData.categoryIds;
    if (current.includes(catId)) {
      setFormData({ ...formData, categoryIds: current.filter(id => id !== catId) });
    } else {
      setFormData({ ...formData, categoryIds: [...current, catId] });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.imageUrls.length === 0 && currentImageUrl.trim()) {
      // Si hay algo en el input pero no se añadió a la lista, lo añadimos automáticamente
      const finalImages = [currentImageUrl.trim()];
      saveProduct({ ...formData, imageUrls: finalImages });
    } else {
      saveProduct(formData);
    }
    loadData();
    setIsModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({ 
      supplierId: '', 
      categoryIds: [], 
      name: '', 
      details: '', 
      price: 0, 
      imageUrls: [], 
      purchaseLink: '' 
    });
    setCurrentImageUrl('');
  };

  const handleDeleteProduct = (id: string) => {
    if (confirm('¿Estás seguro de eliminar este producto?')) {
      deleteProduct(id);
      setProducts(prev => prev.filter(p => p.id !== id));
    }
  };

  const getSupplierName = (id: string) => {
    const s = suppliers.find(s => s.id === id);
    return s ? s.name : 'Desconocido';
  };

  const filteredProducts = selectedCategoryId === 'all' 
    ? products 
    : products.filter(p => p.categoryIds?.includes(selectedCategoryId));

  const formattedPrice = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="page-title">Catálogo de Productos</h1>
          <p className="page-subtitle" style={{ marginBottom: 0 }}>Gestiona tus artículos, categorías y proveedores.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            onClick={() => setIsCategoryModalOpen(true)}
            style={{ 
              background: 'rgba(255,255,255,0.05)', 
              color: 'white', 
              border: '1px solid var(--surface-border)', 
              padding: '0.75rem 1.25rem', 
              borderRadius: 'var(--radius-md)', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <Tag size={18} /> Categorías
          </button>
          <button 
            onClick={() => {
              if (suppliers.length === 0) {
                alert("Primero debes añadir un proveedor.");
                return;
              }
              setIsModalOpen(true);
            }}
            style={{ 
              background: 'var(--primary-color)', 
              color: 'white', 
              border: 'none', 
              padding: '0.75rem 1.5rem', 
              borderRadius: 'var(--radius-md)', 
              cursor: 'pointer', 
              fontWeight: 600 
            }}
          >
            + Nuevo Producto
          </button>
        </div>
      </div>

      {/* Categories Toolbar */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
        <button
          onClick={() => setSelectedCategoryId('all')}
          style={{
            padding: '0.5rem 1.25rem',
            borderRadius: '20px',
            border: 'none',
            background: selectedCategoryId === 'all' ? 'var(--primary-color)' : 'rgba(255,255,255,0.05)',
            color: 'white',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            transition: 'all 0.2s'
          }}
        >
          Todos
        </button>
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategoryId(cat.id)}
            style={{
              padding: '0.5rem 1.25rem',
              borderRadius: '20px',
              border: 'none',
              background: selectedCategoryId === cat.id ? 'var(--primary-color)' : 'rgba(255,255,255,0.05)',
              color: 'white',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s'
            }}
          >
            {cat.name}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
        {filteredProducts.length === 0 ? (
          <div className="glass-panel" style={{ gridColumn: '1 / -1', padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <p>No se encontraron productos en esta sección.</p>
          </div>
        ) : (
          filteredProducts.map(product => (
            <ProductCard 
              key={product.id} 
              product={product} 
              onDelete={handleDeleteProduct}
              supplierName={getSupplierName(product.supplierId)}
              categories={categories}
              formattedPrice={formattedPrice}
            />
          ))
        )}
      </div>

      {/* Product Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nuevo Producto">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Proveedor</label>
              <select 
                required
                value={formData.supplierId}
                onChange={(e) => setFormData({...formData, supplierId: e.target.value})}
                style={{ width: '100%', padding: '0.8rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--surface-border)', background: 'rgba(0,0,0,0.3)', color: 'white', outline: 'none' }}
              >
                <option value="" disabled>Seleccionar...</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Precio al Público</label>
              <input 
                required
                type="number" 
                value={formData.price || ''}
                onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value)})}
                style={{ width: '100%', padding: '0.8rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--surface-border)', background: 'rgba(0,0,0,0.3)', color: 'white', outline: 'none' }}
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Título del Producto</label>
            <input 
              required
              type="text" 
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              style={{ width: '100%', padding: '0.8rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--surface-border)', background: 'rgba(0,0,0,0.3)', color: 'white', outline: 'none' }}
              placeholder="Ej. Mancuerna Hexagonal 10kg"
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Descripción / Detalles</label>
            <textarea 
              required
              rows={3}
              value={formData.details}
              onChange={(e) => setFormData({...formData, details: e.target.value})}
              style={{ width: '100%', padding: '0.8rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--surface-border)', background: 'rgba(0,0,0,0.3)', color: 'white', outline: 'none', resize: 'vertical' }}
              placeholder="Detalles técnicos, material, color..."
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Imágenes (URLs)</label>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <input 
                type="text" 
                value={currentImageUrl}
                onChange={(e) => setCurrentImageUrl(e.target.value)}
                style={{ flex: 1, padding: '0.8rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--surface-border)', background: 'rgba(0,0,0,0.3)', color: 'white', outline: 'none' }}
                placeholder="https://..."
              />
              <button 
                type="button"
                onClick={handleAddImage}
                style={{ padding: '0.8rem', background: 'var(--surface-border)', border: 'none', borderRadius: 'var(--radius-md)', color: 'white', cursor: 'pointer' }}
              >
                <Plus size={20} />
              </button>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {formData.imageUrls.map((url, i) => (
                <div key={i} style={{ position: 'relative', width: '60px', height: '60px', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--surface-border)' }}>
                  <img src={url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                  <button 
                    onClick={() => removeImage(i)}
                    style={{ position: 'absolute', top: 0, right: 0, background: 'rgba(0,0,0,0.7)', color: 'white', border: 'none', fontSize: '10px', width: '15px', height: '15px', padding: 0, cursor: 'pointer' }}
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Seleccionar Categorías</label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => toggleCategory(cat.id)}
                  style={{
                    padding: '0.4rem 0.8rem',
                    borderRadius: '15px',
                    border: '1px solid var(--surface-border)',
                    background: formData.categoryIds.includes(cat.id) ? 'var(--primary-color)' : 'transparent',
                    color: 'white',
                    fontSize: '0.8rem',
                    cursor: 'pointer'
                  }}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Enlace de Compra (Proveedor)</label>
            <input 
              required
              type="text" 
              value={formData.purchaseLink}
              onChange={(e) => setFormData({...formData, purchaseLink: e.target.value})}
              style={{ width: '100%', padding: '0.8rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--surface-border)', background: 'rgba(0,0,0,0.3)', color: 'white', outline: 'none' }}
              placeholder="https://..."
            />
          </div>

          <button 
            type="submit"
            style={{ width: '100%', background: 'var(--primary-color)', color: 'white', border: 'none', padding: '1rem', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 700 }}
          >
            Publicar Producto
          </button>
        </form>
      </Modal>

      {/* Category Modal */}
      <Modal isOpen={isCategoryModalOpen} onClose={() => setIsCategoryModalOpen(false)} title="Gestionar Categorías">
        <form onSubmit={handleAddCategory} style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input 
              type="text" 
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              placeholder="Nueva categoría..."
              style={{ flex: 1, padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--surface-border)', background: 'rgba(0,0,0,0.3)', color: 'white', outline: 'none' }}
            />
            <button 
              type="submit" 
              style={{ padding: '0.75rem 1.5rem', background: 'var(--primary-color)', border: 'none', borderRadius: 'var(--radius-md)', color: 'white', fontWeight: 600, cursor: 'pointer' }}
            >
              Añadir
            </button>
          </div>
        </form>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {categories.map(cat => (
            <div key={cat.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)', border: '1px solid var(--surface-border)' }}>
              <span>{cat.name}</span>
              <button 
                onClick={() => handleDeleteCategory(cat.id)}
                style={{ background: 'none', border: 'none', color: 'var(--danger-color)', cursor: 'pointer' }}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
};

// Subcomponent for Product Card with Gallery
const ProductCard: React.FC<{ 
  product: Product, 
  onDelete: (id: string) => void,
  supplierName: string,
  categories: Category[],
  formattedPrice: Intl.NumberFormat
}> = ({ product, onDelete, supplierName, categories, formattedPrice }) => {
  const [currentImgIdx, setCurrentImgIdx] = useState(0);
  const images = product.imageUrls && product.imageUrls.length > 0 ? product.imageUrls : [];

  const nextImg = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImgIdx((prev) => (prev + 1) % images.length);
  };

  const prevImg = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImgIdx((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="glass-panel animate-fade-in" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100%', gap: 0 }}>
      {/* Image Gallery */}
      <div style={{ height: '220px', background: 'rgba(0,0,0,0.2)', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {images.length > 0 ? (
          <>
            <img src={images[currentImgIdx]} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            {images.length > 1 && (
              <>
                <button onClick={prevImg} style={{ position: 'absolute', left: '0.5rem', background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', color: 'white', padding: '0.2rem', cursor: 'pointer', display: 'flex' }}><ChevronLeft size={18} /></button>
                <button onClick={nextImg} style={{ position: 'absolute', right: '0.5rem', background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', color: 'white', padding: '0.2rem', cursor: 'pointer', display: 'flex' }}><ChevronRight size={18} /></button>
                <div style={{ position: 'absolute', bottom: '0.5rem', display: 'flex', gap: '4px' }}>
                  {images.map((_, i) => (
                    <div key={i} style={{ width: '6px', height: '6px', borderRadius: '50%', background: i === currentImgIdx ? 'var(--primary-color)' : 'rgba(255,255,255,0.4)' }} />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div style={{ color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
            <ImageIcon size={40} />
            <span>Sin fotos</span>
          </div>
        )}
        <button 
          onClick={(e) => { e.stopPropagation(); onDelete(product.id); }}
          style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', background: 'rgba(255,59,48,0.2)', color: 'var(--danger-color)', border: 'none', padding: '0.5rem', borderRadius: '50%', cursor: 'pointer', backdropFilter: 'blur(4px)', zIndex: 20 }}
        >
          <Trash2 size={16} />
        </button>
      </div>

      <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Tags */}
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
          {product.categoryIds?.map(catId => {
            const cat = categories.find(c => c.id === catId);
            return cat ? (
              <span key={catId} style={{ fontSize: '0.7rem', background: 'rgba(255,255,255,0.05)', color: 'var(--primary-color)', padding: '2px 8px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)' }}>
                {cat.name}
              </span>
            ) : null;
          })}
        </div>

        <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>{product.name}</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem', flex: 1, lineHeight: 1.4 }}>{product.details}</p>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 'auto' }}>
          <div>
            <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '2px' }}>Precio Público</span>
            <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary-color)' }}>{formattedPrice.format(product.price)}</span>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)' }}>Prov: {supplierName}</span>
            <a 
              href={product.purchaseLink.startsWith('http') ? product.purchaseLink : `https://${product.purchaseLink}`} 
              target="_blank" 
              rel="noreferrer"
              style={{ color: 'white', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', textDecoration: 'none', marginTop: '0.3rem' }}
            >
              <LinkIcon size={12} /> Info Compra
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
