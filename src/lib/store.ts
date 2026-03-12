import { v4 as uuidv4 } from 'uuid';

export interface Supplier {
  id: string;
  name: string;
  website: string;
  fundamentalData: string;
}

export interface Product {
  id: string;
  supplierId: string;
  name: string;
  details: string;
  price: number;
  photoUrl: string;
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

const SUPPLIERS_KEY = 'capi_suppliers';
const PRODUCTS_KEY = 'capi_products';
const CLIENTS_KEY = 'capi_clients';

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
  const suppliers = getSuppliers().filter(s => s.id !== id);
  localStorage.setItem(SUPPLIERS_KEY, JSON.stringify(suppliers));
};

export const getSupplierById = (id: string): Supplier | undefined => {
  return getSuppliers().find(s => s.id === id);
};

// Products
export const getProducts = (): Product[] => {
  const data = localStorage.getItem(PRODUCTS_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveProduct = (product: Omit<Product, 'id'>) => {
  const products = getProducts();
  const newProduct = { ...product, id: uuidv4() };
  products.push(newProduct);
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
  return newProduct;
};

export const deleteProduct = (id: string) => {
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
  const clients = getClients().filter(c => c.id !== id);
  localStorage.setItem(CLIENTS_KEY, JSON.stringify(clients));
};
