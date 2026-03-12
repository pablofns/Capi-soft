import { v4 as uuidv4 } from 'uuid';
import { supabase, pingSupabase, inspectClientsSchema } from './supabase';

/* Types (kept similar to previous definitions) */
export interface Supplier { id: string; name: string; website: string; fundamentalData: string; }
export interface Category { id: string; name: string; }
export interface Product { id: string; supplierId: string; categoryIds: string[]; name: string; details: string; imageUrls: string[]; purchaseLink: string; price?: number; }
export interface Client { id: string; name: string; address: string; schedule: string; contactName: string; productHistory: string; mapLink: string; phone?: string; }

export interface PurchaseItem { productId: string; quantity: number; unitCost: number; salePrice: number; finalUnitCost?: number; }
export interface Purchase { id: string; supplierId: string; date: string; shippingCost: number; items: PurchaseItem[]; totalAmount: number; }

export interface SaleItem { productId: string; quantity: number; unitPrice: number; }
export interface Sale { id: string; clientId: string; date: string; items: SaleItem[]; totalAmount: number; }

/* Quotes */
export type QuoteStatus = 'borrador' | 'enviado' | 'aprobado' | 'rechazado';
export interface QuoteItem { productId: string; quantity: number; unitPrice: number; }
export interface Quote { id: string; clientId: string; date: string; validUntil: string; status: QuoteStatus; items: QuoteItem[]; totalAmount: number; notes: string; }

/* LocalStorage keys for fallback */
const SUPPLIERS_KEY = 'capi_suppliers';
const PRODUCTS_KEY = 'capi_products';
const CLIENTS_KEY = 'capi_clients';
const CATEGORIES_KEY = 'capi_categories';
const PURCHASES_KEY = 'capi_purchases';
const SALES_KEY = 'capi_sales';
const QUOTES_KEY = 'capi_quotes';

/* ---------- TRANSACCIONAL: helpers que usan Supabase (await) ---------- */
/* Ahora readLocal / writeLocal son transaccionales: esperan la respuesta de Supabase.
   En caso de error, lanzan excepción para que la llamada superior la maneje. */
// const readLocal = async (key: string): Promise<any[]> => {
//   // intenta leer la key desde la tabla app_kv en Supabase
//   const { data, error } = await supabase.from('app_kv').select('value').eq('key', key).single();
//   if (error) {
//     throw error;
//   }
//   return data?.value ?? [];
// };

// const writeLocal = async (key: string, data: any): Promise<void> => {
//   // upsert en Supabase (espera respuesta antes de retornar)
//   const { error } = await supabase.from('app_kv').upsert({ key, value: data }).select();
//   if (error) {
//     throw error;
//   }
// };

/* Mapping helpers between DB columns (snake_case) and frontend (camelCase) */
const mapSupplierFromDB = (r: any): Supplier => ({
  id: r.id,
  name: r.name,
  website: r.website,
  fundamentalData: r.fundamental_data ?? r.fundamentalData ?? ''
});
const mapSupplierToDB = (s: Omit<Supplier, 'id'>) => ({
  name: s.name,
  website: s.website,
  fundamental_data: s.fundamentalData
});

const mapProductFromDB = (r: any): Product => ({
  id: r.id,
  supplierId: r.supplier_id,
  name: r.name,
  details: r.details,
  imageUrls: r.image_urls ?? r.imageUrls ?? [],
  categoryIds: r.category_ids ?? r.categoryIds ?? [],
  purchaseLink: r.purchase_link ?? r.purchaseLink ?? '',
  price: r.price ?? 0
});
const mapProductToDB = (p: Omit<Product, 'id'>) => ({
  supplier_id: p.supplierId,
  name: p.name,
  details: p.details,
  image_urls: p.imageUrls,
  category_ids: p.categoryIds,
  purchase_link: p.purchaseLink,
  price: p.price ?? 0
});

const mapClientFromDB = (r: any): Client => ({
  id: r.id,
  name: r.name,
  address: r.address,
  schedule: r.schedule,
  contactName: r.contact_name ?? r.contactName ?? '',
  productHistory: r.product_history ?? r.productHistory ?? '',
  mapLink: r.map_link ?? r.mapLink ?? '',
  phone: r.phone ?? r.phone_number ?? ''
});
const mapClientToDB = (c: Omit<Client, 'id'>) => ({
  name: c.name,
  address: c.address,
  schedule: c.schedule,
  contact_name: c.contactName,
  product_history: c.productHistory,
  map_link: c.mapLink,
  phone: c.phone ?? null
});

/* ---------- Suppliers ---------- */
export const getSuppliers = async (): Promise<Supplier[]> => {
  try {
    const { data, error } = await supabase.from('suppliers').select('*');
    if (error) throw error;
    return (data ?? []).map(mapSupplierFromDB);
  } catch (e) {
    console.warn('getSuppliers fallback to localStorage', e);
    // fallback síncrono: leer localStorage directamente
    return JSON.parse(localStorage.getItem(SUPPLIERS_KEY) || '[]');
  }
};

export const saveSupplier = async (supplier: Omit<Supplier, 'id'>): Promise<Supplier> => {
  try {
    const dbObj = mapSupplierToDB(supplier);
    const { data, error } = await supabase.from('suppliers').insert(dbObj).select().single();
    if (error) throw error;
    return mapSupplierFromDB(data);
  } catch (e) {
    console.warn('saveSupplier fallback to localStorage', e);
    // fallback síncrono: persistir en localStorage
    const suppliers = JSON.parse(localStorage.getItem(SUPPLIERS_KEY) || '[]');
    const newSupplier = { ...supplier, id: uuidv4() };
    suppliers.push(newSupplier);
    localStorage.setItem(SUPPLIERS_KEY, JSON.stringify(suppliers));
    return newSupplier;
  }
};

export const deleteSupplier = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase.from('suppliers').delete().eq('id', id);
    if (error) throw error;
  } catch (e) {
    console.warn('deleteSupplier fallback to localStorage', e);
    const suppliers = JSON.parse(localStorage.getItem(SUPPLIERS_KEY) || '[]').filter((s: any) => s.id !== id);
    localStorage.setItem(SUPPLIERS_KEY, JSON.stringify(suppliers));
  }
};

export const getSupplierById = async (id: string): Promise<Supplier | undefined> => {
  try {
    const { data, error } = await supabase.from('suppliers').select('*').eq('id', id).single();
    if (error) throw error;
    return mapSupplierFromDB(data);
  } catch (e) {
    const list = JSON.parse(localStorage.getItem(SUPPLIERS_KEY) || '[]');
    return list.find((s: Supplier) => s.id === id);
  }
};

/* ---------- Categories ---------- */
export const getCategories = async (): Promise<Category[]> => {
  try {
    const { data, error } = await supabase.from('categories').select('*');
    if (error) throw error;
    return (data ?? []).map((r: any) => ({ id: r.id, name: r.name }));
  } catch (e) {
    console.warn('getCategories fallback', e);
    return JSON.parse(localStorage.getItem(CATEGORIES_KEY) || '[]');
  }
};

export const saveCategory = async (name: string): Promise<Category> => {
  try {
    const { data, error } = await supabase.from('categories').insert({ name }).select().single();
    if (error) throw error;
    return { id: data.id, name: data.name };
  } catch (e) {
    console.warn('saveCategory fallback', e);
    const cats = JSON.parse(localStorage.getItem(CATEGORIES_KEY) || '[]');
    const newCat = { id: uuidv4(), name };
    cats.push(newCat);
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(cats));
    return newCat;
  }
};

export const deleteCategory = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) throw error;
  } catch (e) {
    const cats = JSON.parse(localStorage.getItem(CATEGORIES_KEY) || '[]').filter((c: any) => c.id !== id);
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(cats));
  }
};

/* ---------- Products ---------- */
export const getProducts = async (): Promise<Product[]> => {
  try {
    const { data, error } = await supabase.from('products').select('*');
    if (error) throw error;
    return (data ?? []).map(mapProductFromDB);
  } catch (e) {
    console.warn('getProducts fallback', e);
    const data = JSON.parse(localStorage.getItem(PRODUCTS_KEY) || '[]');
    return data.map((p: any) => ({ ...p, imageUrls: p.imageUrls || p.image_urls || (p.photoUrl ? [p.photoUrl] : []), categoryIds: p.categoryIds || p.category_ids || [] }));
  }
};

export const saveProduct = async (product: Omit<Product, 'id'>): Promise<Product> => {
  try {
    const dbObj = mapProductToDB(product);
    const { data, error } = await supabase.from('products').insert(dbObj).select().single();
    if (error) throw error;
    return mapProductFromDB(data);
  } catch (e) {
    console.warn('saveProduct fallback', e);
    const prods = JSON.parse(localStorage.getItem(PRODUCTS_KEY) || '[]');
    const newP = { ...product, id: uuidv4() };
    prods.push(newP);
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(prods));
    return newP;
  }
};

export const deleteProduct = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw error;
  } catch (e) {
    const prods = JSON.parse(localStorage.getItem(PRODUCTS_KEY) || '[]').filter((p: any) => p.id !== id);
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(prods));
  }
};

/* ---------- Clients ---------- */
export const getClients = async (): Promise<Client[]> => {
  try {
    const { data, error } = await supabase.from('clients').select('*');
    if (error) throw error;
    return (data ?? []).map(mapClientFromDB);
  } catch (e) {
    console.warn('getClients fallback', e);
    return JSON.parse(localStorage.getItem(CLIENTS_KEY) || '[]');
  }
};

export const saveClient = async (client: Omit<Client, 'id'>): Promise<Client> => {
  try {
    const dbObj = mapClientToDB(client);
    const { data, error } = await supabase.from('clients').insert(dbObj).select().single();
    if (error) throw error;
    return mapClientFromDB(data);
  } catch (e) {
    console.warn('saveClient fallback', e);
    const clients = JSON.parse(localStorage.getItem(CLIENTS_KEY) || '[]');
    const newC = { ...client, id: uuidv4() };
    clients.push(newC);
    localStorage.setItem(CLIENTS_KEY, JSON.stringify(clients));
    return newC;
  }
};

export const deleteClient = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase.from('clients').delete().eq('id', id);
    if (error) throw error;
  } catch (e) {
    const clients = JSON.parse(localStorage.getItem(CLIENTS_KEY) || '[]').filter((c: any) => c.id !== id);
    localStorage.setItem(CLIENTS_KEY, JSON.stringify(clients));
  }
};

/* ---------- Purchases (header + items) ---------- */
export const getPurchases = async (): Promise<Purchase[]> => {
  try {
    // fetch purchases with nested items
    const { data, error } = await supabase.from('purchases').select('*, purchase_items(*)');
    if (error) throw error;
    const rows = data ?? [];
    return rows.map((r: any) => ({
      id: r.id,
      supplierId: r.supplier_id,
      date: r.date,
      shippingCost: parseFloat(r.shipping_cost) || 0,
      totalAmount: parseFloat(r.total_amount) || 0,
      items: (r.purchase_items ?? []).map((it: any) => ({
        productId: it.product_id,
        quantity: it.quantity,
        unitCost: parseFloat(it.unit_cost) || 0,
        salePrice: parseFloat(it.sale_price) || 0,
        finalUnitCost: it.final_unit_cost != null ? parseFloat(it.final_unit_cost) : undefined
      }))
    }));
  } catch (e) {
    console.warn('getPurchases fallback', e);
    return JSON.parse(localStorage.getItem(PURCHASES_KEY) || '[]');
  }
};

export const savePurchase = async (purchase: Omit<Purchase, 'id'>): Promise<Purchase> => {
  try {
    const { supplierId, date, shippingCost, items, totalAmount } = purchase;
    const { data: pData, error: pErr } = await supabase.from('purchases').insert({
      supplier_id: supplierId,
      date,
      shipping_cost: shippingCost,
      total_amount: totalAmount
    }).select().single();
    if (pErr) throw pErr;
    const purchaseId = pData.id;
    if ((items ?? []).length > 0) {
      const itemsToInsert = items.map(it => ({
        purchase_id: purchaseId,
        product_id: it.productId,
        quantity: it.quantity,
        unit_cost: it.unitCost,
        sale_price: it.salePrice,
        final_unit_cost: it.finalUnitCost
      }));
      const { error: itemsErr } = await supabase.from('purchase_items').insert(itemsToInsert);
      if (itemsErr) throw itemsErr;
    }
    // return full object
    return { ...purchase, id: purchaseId };
  } catch (e) {
    console.warn('savePurchase fallback', e);
    const purchases = JSON.parse(localStorage.getItem(PURCHASES_KEY) || '[]');
    const newP = { ...purchase, id: uuidv4() };
    purchases.push(newP);
    localStorage.setItem(PURCHASES_KEY, JSON.stringify(purchases));
    return newP;
  }
};

/* ---------- Sales ---------- */
export const getSales = async (): Promise<Sale[]> => {
  try {
    const { data, error } = await supabase.from('sales').select('*, sale_items(*)');
    if (error) throw error;
    const rows = data ?? [];
    return rows.map((r: any) => ({
      id: r.id,
      clientId: r.client_id,
      date: r.date,
      totalAmount: parseFloat(r.total_amount) || 0,
      items: (r.sale_items ?? []).map((it: any) => ({
        productId: it.product_id,
        quantity: it.quantity,
        unitPrice: parseFloat(it.unit_price) || 0
      }))
    }));
  } catch (e) {
    console.warn('getSales fallback', e);
    return JSON.parse(localStorage.getItem(SALES_KEY) || '[]');
  }
};

export const saveSale = async (sale: Omit<Sale, 'id'>): Promise<Sale> => {
  try {
    const { clientId, date, items, totalAmount } = sale;
    const { data: sData, error: sErr } = await supabase.from('sales').insert({
      client_id: clientId,
      date,
      total_amount: totalAmount
    }).select().single();
    if (sErr) throw sErr;
    const saleId = sData.id;
    if ((items ?? []).length > 0) {
      const itemsToInsert = items.map(it => ({
        sale_id: saleId,
        product_id: it.productId,
        quantity: it.quantity,
        unit_price: it.unitPrice
      }));
      const { error: itemsErr } = await supabase.from('sale_items').insert(itemsToInsert);
      if (itemsErr) throw itemsErr;
    }
    return { ...sale, id: saleId };
  } catch (e) {
    console.warn('saveSale fallback', e);
    const sales = JSON.parse(localStorage.getItem(SALES_KEY) || '[]');
    const newS = { ...sale, id: uuidv4() };
    sales.push(newS);
    localStorage.setItem(SALES_KEY, JSON.stringify(sales));
    return newS;
  }
};

/* ---------- Inventory Logic ---------- */
export const getProductStock = async (productId: string): Promise<number> => {
  try {
    // sum quantities from purchase_items and sale_items
    const { data: pData, error: pErr } = await supabase.from('purchase_items').select('quantity').eq('product_id', productId);
    if (pErr) throw pErr;
    const { data: sData, error: sErr } = await supabase.from('sale_items').select('quantity').eq('product_id', productId);
    if (sErr) throw sErr;
    const bought = (pData ?? []).reduce((acc: number, r: any) => acc + (r.quantity ?? 0), 0);
    const sold = (sData ?? []).reduce((acc: number, r: any) => acc + (r.quantity ?? 0), 0);
    return bought - sold;
  } catch (e) {
    console.warn('getProductStock fallback', e);
    return 0;
  }
};

/* Helper: obtiene el último precio de venta cargado para un producto (from purchases items) */
export const getProductLatestSalePrice = async (productId: string): Promise<number> => {
  try {
    // fetch purchase_items joined with purchases by getting purchase_items then purchases dates
    const { data: items, error: itemsErr } = await supabase.from('purchase_items').select('sale_price, purchase_id').eq('product_id', productId).gt('sale_price', 0);
    if (itemsErr) throw itemsErr;
    if (!items || items.length === 0) return 0;
    // fetch purchases for those ids to get dates
    const purchaseIds = Array.from(new Set(items.map((it: any) => it.purchase_id)));
    const { data: purchases, error: pErr } = await supabase.from('purchases').select('id, date').in('id', purchaseIds);
    if (pErr) throw pErr;
    // merge to find latest by date
    const withDate = items.map((it: any) => {
      const p = (purchases ?? []).find((x: any) => x.id === it.purchase_id);
      return { sale_price: parseFloat(it.sale_price ?? 0), date: p?.date ?? null };
    }).filter((x: any) => x.sale_price > 0 && x.date);
    if (withDate.length === 0) return 0;
    withDate.sort((a: any, b: any) => (a.date > b.date ? -1 : 1));
    return withDate[0].sale_price;
  } catch (e) {
    console.warn('getProductLatestSalePrice fallback', e);
    // fallback compute from local purchases if present (leer localStorage síncrono)
    const purchases = JSON.parse(localStorage.getItem(PURCHASES_KEY) || '[]');
    let latestPrice = 0;
    let latestDate = '';
    for (const purchase of purchases) {
      const item = (purchase.items ?? []).find((i: any) => i.productId === productId);
      if (item && item.salePrice > 0) {
        if (!latestDate || purchase.date >= latestDate) {
          latestDate = purchase.date;
          latestPrice = item.salePrice;
        }
      }
    }
    return latestPrice;
  }
};

/* ---------- Quotes (encabezado + items) ---------- */
export const getQuotes = async (): Promise<Quote[]> => {
  try {
    const { data, error } = await supabase.from('quotes').select('*, quote_items(*)');
    if (error) throw error;
    const rows = data ?? [];
    return rows.map((r: any) => ({
      id: r.id,
      clientId: r.client_id,
      date: r.date,
      validUntil: r.valid_until,
      status: r.status as QuoteStatus,
      totalAmount: parseFloat(r.total_amount) || 0,
      notes: r.notes ?? '',
      items: (r.quote_items ?? []).map((it: any) => ({
        productId: it.product_id,
        quantity: it.quantity,
        unitPrice: parseFloat(it.unit_price) || 0
      }))
    }));
  } catch (e) {
    console.warn('getQuotes fallback', e);
    return JSON.parse(localStorage.getItem(QUOTES_KEY) || '[]');
  }
};

export const saveQuote = async (quote: Omit<Quote, 'id'>): Promise<Quote> => {
  try {
    const { clientId, date, validUntil, status, items, totalAmount, notes } = quote;
    const { data: qData, error: qErr } = await supabase.from('quotes').insert({
      client_id: clientId,
      date,
      valid_until: validUntil,
      status,
      total_amount: totalAmount,
      notes
    }).select().single();
    if (qErr) throw qErr;
    const quoteId = qData.id;
    if ((items ?? []).length > 0) {
      const itemsToInsert = items.map(it => ({
        quote_id: quoteId,
        product_id: it.productId,
        quantity: it.quantity,
        unit_price: it.unitPrice
      }));
      const { error: itemsErr } = await supabase.from('quote_items').insert(itemsToInsert);
      if (itemsErr) throw itemsErr;
    }
    return { ...quote, id: quoteId };
  } catch (e) {
    console.warn('saveQuote fallback', e);
    const quotes = JSON.parse(localStorage.getItem(QUOTES_KEY) || '[]');
    const newQ = { ...quote, id: uuidv4() };
    quotes.push(newQ);
    localStorage.setItem(QUOTES_KEY, JSON.stringify(quotes));
    return newQ;
  }
};

export const updateQuote = async (id: string, quote: Omit<Quote, 'id'>): Promise<void> => {
  try {
    const { clientId, date, validUntil, status, items, totalAmount, notes } = quote;
    const { error: qErr } = await supabase.from('quotes').update({
      client_id: clientId,
      date,
      valid_until: validUntil,
      status,
      total_amount: totalAmount,
      notes
    }).eq('id', id);
    if (qErr) throw qErr;
    // For simplicity replace quote_items: delete existing and insert new
    const { error: delErr } = await supabase.from('quote_items').delete().eq('quote_id', id);
    if (delErr) throw delErr;
    if ((items ?? []).length > 0) {
      const itemsToInsert = items.map(it => ({
        quote_id: id,
        product_id: it.productId,
        quantity: it.quantity,
        unit_price: it.unitPrice
      }));
      const { error: itemsErr } = await supabase.from('quote_items').insert(itemsToInsert);
      if (itemsErr) throw itemsErr;
    }
  } catch (e) {
    console.warn('updateQuote fallback', e);
    const quotes = JSON.parse(localStorage.getItem(QUOTES_KEY) || '[]').map((q: any) => q.id === id ? { ...quote, id } : q);
    localStorage.setItem(QUOTES_KEY, JSON.stringify(quotes));
  }
};

export const updateQuoteStatus = async (id: string, status: QuoteStatus): Promise<void> => {
  try {
    const { error } = await supabase.from('quotes').update({ status }).eq('id', id);
    if (error) throw error;
  } catch (e) {
    console.warn('updateQuoteStatus fallback', e);
    const quotes = JSON.parse(localStorage.getItem(QUOTES_KEY) || '[]').map((q: any) => q.id === id ? { ...q, status } : q);
    localStorage.setItem(QUOTES_KEY, JSON.stringify(quotes));
  }
};

export const deleteQuote = async (id: string): Promise<void> => {
  try {
    // Borra el presupuesto; quote_items debería eliminarse por ON DELETE CASCADE en la DB
    const { error } = await supabase.from('quotes').delete().eq('id', id);
    if (error) throw error;
  } catch (e) {
    console.warn('deleteQuote fallback', e);
    const quotes = JSON.parse(localStorage.getItem(QUOTES_KEY) || '[]').filter((q: any) => q.id !== id);
    localStorage.setItem(QUOTES_KEY, JSON.stringify(quotes));
  }
};

// Nueva utilidad pública para verificar conexión y obtener detalle de error
export const checkDbConnection = async (): Promise<{ ok: boolean; message?: string }> => {
  try {
    const res = await pingSupabase();
    if (res.ok) return { ok: true, message: 'Conexión OK' };
    return { ok: false, message: res.error ?? 'Error desconocido al consultar Supabase' };
  } catch (err: any) {
    return { ok: false, message: err?.message ?? String(err) };
  }
};

// Nueva utilidad para verificar esquema de la tabla clients (usa inspectClientsSchema)
export const verifyClientsSchema = async (): Promise<{ ok: boolean; message: string; columns?: string[] }> => {
  try {
    const res = await inspectClientsSchema();
    return {
      ok: res.ok,
      message: res.message ?? (res.ok ? 'Schema OK' : 'Problema con schema'),
      columns: res.columns
    };
  } catch (err: any) {
    return { ok: false, message: err?.message ?? String(err) };
  }
};

