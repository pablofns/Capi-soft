import { v4 as uuidv4 } from 'uuid';

export interface Supplier {
  id: string;
  name: string;
  website: string;
  fundamentalData: string;
}

export interface Category {
  id: string;
  name: string;
}

export interface Product {
  id: string;
  supplierId: string;
  categoryIds: string[];
  name: string;
  details: string;
  imageUrls: string[];
  purchaseLink: string;
}

export interface Client {
  id: string;
  name: string;
  address: string;
  schedule: string;
  contactName: string;
  productHistory: string;
  mapLink: string;
}

export interface PurchaseItem {
  productId: string;
  quantity: number;
  unitCost: number; // Precio de compra base
  salePrice: number; // Precio de venta al público
  finalUnitCost?: number; // Precio de compra con envío prorrateado
}

export interface Purchase {
  id: string;
  supplierId: string;
  date: string;
  shippingCost: number;
  items: PurchaseItem[];
  totalAmount: number;
}

export interface SaleItem {
  productId: string;
  quantity: number;
  unitPrice: number;
}

export interface Sale {
  id: string;
  clientId: string;
  date: string;
  items: SaleItem[];
  totalAmount: number;
}

const SUPPLIERS_KEY = 'capi_suppliers';
const PRODUCTS_KEY = 'capi_products';
const CLIENTS_KEY = 'capi_clients';
const CATEGORIES_KEY = 'capi_categories';
const PURCHASES_KEY = 'capi_purchases';
const SALES_KEY = 'capi_sales';

// Suppliers
export const getSuppliers = (): Supplier[] => {
  const data = localStorage.getItem(SUPPLIERS_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveSupplier = (supplier: Omit<Supplier, 'id'>) => {
  const suppliers = getSuppliers();
  const newSupplier = { ...supplier, id: uuidv4() };
  suppliers.push(newSupplier);
  localStorage.setItem(SUPPLIERS_KEY, JSON.stringify(suppliers));
  return newSupplier;
};

export const deleteSupplier = (id: string) => {
  console.log('Eliminando proveedor:', id);
  const suppliers = getSuppliers().filter(s => s.id !== id);
  localStorage.setItem(SUPPLIERS_KEY, JSON.stringify(suppliers));
};

export const getSupplierById = (id: string): Supplier | undefined => {
  return getSuppliers().find(s => s.id === id);
};

// Categories
export const getCategories = (): Category[] => {
  const data = localStorage.getItem(CATEGORIES_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveCategory = (name: string) => {
  const categories = getCategories();
  const newCategory = { id: uuidv4(), name };
  categories.push(newCategory);
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
  return newCategory;
};

export const deleteCategory = (id: string) => {
  console.log('Eliminando categoría:', id);
  const categories = getCategories().filter(c => c.id !== id);
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
};

// Products
export const getProducts = (): Product[] => {
  const data = localStorage.getItem(PRODUCTS_KEY);
  if (!data) return [];
  const products = JSON.parse(data);
  return products.map((p: any) => ({
    ...p,
    imageUrls: p.imageUrls || (p.photoUrl ? [p.photoUrl] : []),
    categoryIds: p.categoryIds || []
  }));
};

export const saveProduct = (product: Omit<Product, 'id'>) => {
  const products = getProducts();
  const newProduct = { ...product, id: uuidv4() };
  products.push(newProduct);
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
  return newProduct;
};

export const deleteProduct = (id: string) => {
  console.log('Eliminando producto:', id);
  const products = getProducts().filter(p => p.id !== id);
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
};

// Clients
export const getClients = (): Client[] => {
  const data = localStorage.getItem(CLIENTS_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveClient = (client: Omit<Client, 'id'>) => {
  const clients = getClients();
  const newClient = { ...client, id: uuidv4() };
  clients.push(newClient);
  localStorage.setItem(CLIENTS_KEY, JSON.stringify(clients));
  return newClient;
};

export const deleteClient = (id: string) => {
  console.log('Eliminando cliente:', id);
  const clients = getClients().filter(c => c.id !== id);
  localStorage.setItem(CLIENTS_KEY, JSON.stringify(clients));
};

// Purchases
export const getPurchases = (): Purchase[] => {
  const data = localStorage.getItem(PURCHASES_KEY);
  return data ? JSON.parse(data) : [];
};

export const savePurchase = (purchase: Omit<Purchase, 'id'>) => {
  const purchases = getPurchases();
  const newPurchase = { ...purchase, id: uuidv4() };
  purchases.push(newPurchase);
  localStorage.setItem(PURCHASES_KEY, JSON.stringify(purchases));
  return newPurchase;
};

// Sales
export const getSales = (): Sale[] => {
  const data = localStorage.getItem(SALES_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveSale = (sale: Omit<Sale, 'id'>) => {
  const sales = getSales();
  const newSale = { ...sale, id: uuidv4() };
  sales.push(newSale);
  localStorage.setItem(SALES_KEY, JSON.stringify(sales));
  return newSale;
};

// Inventory Logic
export const getProductStock = (productId: string): number => {
  const purchases = getPurchases();
  const sales = getSales();

  const bought = purchases.reduce((acc, p) => {
    const item = p.items.find(i => i.productId === productId);
    return acc + (item ? item.quantity : 0);
  }, 0);

  const sold = sales.reduce((acc, s) => {
    const item = s.items.find(i => i.productId === productId);
    return acc + (item ? item.quantity : 0);
  }, 0);

  return bought - sold;
};

// Helper: obtiene el último precio de venta cargado para un producto
export const getProductLatestSalePrice = (productId: string): number => {
  const purchases = getPurchases();
  let latestPrice = 0;
  let latestDate = '';
  for (const purchase of purchases) {
    const item = purchase.items.find(i => i.productId === productId);
    if (item && item.salePrice > 0) {
      if (!latestDate || purchase.date >= latestDate) {
        latestDate = purchase.date;
        latestPrice = item.salePrice;
      }
    }
  }
  return latestPrice;
};

// Quotes (Presupuestos)
export type QuoteStatus = 'borrador' | 'enviado' | 'aprobado' | 'rechazado';

export interface QuoteItem {
  productId: string;
  quantity: number;
  unitPrice: number;
}

export interface Quote {
  id: string;
  clientId: string;
  date: string;
  validUntil: string;
  status: QuoteStatus;
  items: QuoteItem[];
  totalAmount: number;
  notes: string;
}

const QUOTES_KEY = 'capi_quotes';

export const getQuotes = (): Quote[] => {
  const data = localStorage.getItem(QUOTES_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveQuote = (quote: Omit<Quote, 'id'>) => {
  const quotes = getQuotes();
  const newQuote = { ...quote, id: uuidv4() };
  quotes.push(newQuote);
  localStorage.setItem(QUOTES_KEY, JSON.stringify(quotes));
  return newQuote;
};

export const updateQuote = (id: string, quote: Omit<Quote, 'id'>) => {
  const quotes = getQuotes().map(q => q.id === id ? { ...quote, id } : q);
  localStorage.setItem(QUOTES_KEY, JSON.stringify(quotes));
};

export const updateQuoteStatus = (id: string, status: QuoteStatus) => {
  const quotes = getQuotes().map(q => q.id === id ? { ...q, status } : q);
  localStorage.setItem(QUOTES_KEY, JSON.stringify(quotes));
};

export const deleteQuote = (id: string) => {
  const quotes = getQuotes().filter(q => q.id !== id);
  localStorage.setItem(QUOTES_KEY, JSON.stringify(quotes));
};

