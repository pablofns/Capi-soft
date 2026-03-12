-- Extensión para generar UUIDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Tipo para estado de presupuesto
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'quote_status') THEN
    CREATE TYPE quote_status AS ENUM ('borrador', 'enviado', 'aprobado', 'rechazado');
  END IF;
END$$;

-- Proveedores
CREATE TABLE IF NOT EXISTS suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  website text,
  fundamental_data text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Categorías
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Productos
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid REFERENCES suppliers(id) ON DELETE SET NULL,
  name text NOT NULL,
  details text,
  image_urls jsonb DEFAULT '[]'::jsonb,
  category_ids uuid[] DEFAULT ARRAY[]::uuid[],
  purchase_link text,
  price numeric(12,2) DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_supplier_id ON products(supplier_id);

-- Clientes
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text,
  schedule text,
  contact_name text,
  phone text,
  product_history text,
  map_link text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Asegurar que la columna contact_name exista en clients (no altera si ya existe)
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS contact_name text;
-- Asegurar que la columna phone exista en clients (no altera si ya existe)
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS phone text;

-- Compras (encabezado)
CREATE TABLE IF NOT EXISTS purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid REFERENCES suppliers(id) ON DELETE SET NULL,
  date date NOT NULL,
  shipping_cost numeric(12,2) DEFAULT 0,
  total_amount numeric(12,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_purchases_supplier_id ON purchases(supplier_id);

-- Ítems de compra (relacional)
CREATE TABLE IF NOT EXISTS purchase_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id uuid REFERENCES purchases(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  quantity integer NOT NULL DEFAULT 1,
  unit_cost numeric(12,2) NOT NULL DEFAULT 0,
  sale_price numeric(12,2) DEFAULT 0,
  final_unit_cost numeric(12,2),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_purchase_items_purchase_id ON purchase_items(purchase_id);
CREATE INDEX IF NOT EXISTS idx_purchase_items_product_id ON purchase_items(product_id);

-- Ventas (encabezado)
CREATE TABLE IF NOT EXISTS sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  date date NOT NULL,
  total_amount numeric(12,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sales_client_id ON sales(client_id);

-- Ítems de venta
CREATE TABLE IF NOT EXISTS sale_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid REFERENCES sales(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric(12,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_product_id ON sale_items(product_id);

-- Presupuestos (quotes)
CREATE TABLE IF NOT EXISTS quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  date date NOT NULL,
  valid_until date,
  status quote_status NOT NULL DEFAULT 'borrador',
  total_amount numeric(12,2) NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_quotes_client_id ON quotes(client_id);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);

-- Ítems de presupuesto
CREATE TABLE IF NOT EXISTS quote_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id uuid REFERENCES quotes(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric(12,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_quote_items_quote_id ON quote_items(quote_id);
CREATE INDEX IF NOT EXISTS idx_quote_items_product_id ON quote_items(product_id);

-- Tabla opcional para almacenamiento key/value (sincronización de fallback)
CREATE TABLE IF NOT EXISTS app_kv (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_app_kv_key ON app_kv(key);

-- Opcional: vista simplificada de stock (ejemplo)
CREATE MATERIALIZED VIEW IF NOT EXISTS product_stock AS
SELECT
  p.id AS product_id,
  COALESCE(SUM(pi.quantity)     FILTER (WHERE pi.id IS NOT NULL), 0) AS total_bought,
  COALESCE(SUM(si.quantity)     FILTER (WHERE si.id IS NOT NULL), 0) AS total_sold,
  COALESCE(SUM(pi.quantity)     FILTER (WHERE pi.id IS NOT NULL), 0)
    - COALESCE(SUM(si.quantity) FILTER (WHERE si.id IS NOT NULL), 0) AS stock
FROM products p
LEFT JOIN purchase_items pi ON pi.product_id = p.id
LEFT JOIN sale_items si ON si.product_id = p.id
GROUP BY p.id;

-- Para actualizar la vista materializada manualmente:
-- REFRESH MATERIALIZED VIEW CONCURRENTLY product_stock;
