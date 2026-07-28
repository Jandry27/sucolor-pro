import { supabase } from './clienteSupabase';

export async function registrarAccion(
  action: string,
  tableName: string,
  recordId?: string,
  details?: Record<string, unknown>
) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    await supabase.from('audit_log').insert({
      user_id: user.id,
      action,
      table_name: tableName,
      record_id: recordId,
      details,
    });
  } catch (e) {
    console.error('Error registrando auditoría:', e);
  }
}
