import { createClient, SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!url || !anonKey) {
  throw new Error('Faltan las variables de entorno de Supabase');
}

export const supabase: SupabaseClient = createClient(url, anonKey);

// Verifica conexión haciendo una consulta ligera a una tabla existente.
// Devuelve { ok: true } o { ok: false, error: 'mensaje' }.
export const pingSupabase = async (): Promise<{ ok: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from('suppliers')
      .select('id')
      .limit(1)
      .maybeSingle();
    if (error) return { ok: false, error: error.message ?? String(error) };
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.message ?? String(err) };
  }
};

/* Diagnostic helpers: list table columns and inspect clients schema */
export const getTableColumns = async (tableName: string): Promise<{ ok: boolean; columns?: string[]; error?: string }> => {
  try {
    // Try to read information_schema.columns for diagnostics. May require permissions.
    const { data, error } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', tableName);
    if (error) return { ok: false, error: error.message ?? String(error) };
    const cols = (data ?? []).map((r: any) => r.column_name);
    return { ok: true, columns: cols };
  } catch (err: any) {
    return { ok: false, error: err?.message ?? String(err) };
  }
};

export const inspectClientsSchema = async (): Promise<{ ok: boolean; columns?: string[]; message?: string }> => {
  try {
    const res = await getTableColumns('clients');
    if (!res.ok) return { ok: false, message: res.error ?? 'No se pudo obtener esquema' };
    const hasContactName = (res.columns ?? []).includes('contact_name');
    return {
      ok: hasContactName,
      columns: res.columns,
      message: hasContactName ? 'contact_name encontrado en clients' : 'contact_name NO encontrado en clients'
    };
  } catch (err: any) {
    return { ok: false, message: err?.message ?? String(err) };
  }
};