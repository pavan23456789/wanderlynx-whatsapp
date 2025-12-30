// 🔒 SECURE DATABASE LOGGER (A-Z FIX)
// Replaced file-based system with Supabase to resolve Vercel ENOENT errors.
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase with Service Role to bypass RLS for background logging
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export type LogEntry = {
  timestamp: string;
  idempotencyKey: string;
  type: 'booking' | 'invoice';
  status: 'SUCCESS' | 'FAILURE' | 'SKIPPED';
  event: string;
  recipient: string;
  details: any;
  error?: string;
};

/**
 * Checks if a bookingId has already been processed in the database.
 */
export async function hasProcessedBookingId(bookingId: string): Promise<boolean> {
  const { data } = await supabase
    .from('event_logs')
    .select('id')
    .eq('idempotencyKey', bookingId)
    .eq('type', 'booking')
    .eq('status', 'SUCCESS')
    .maybeSingle();
  
  return !!data;
}

/**
 * Checks if an invoiceId has already been processed in the database.
 */
export async function hasProcessedInvoiceId(invoiceId: string): Promise<boolean> {
  const { data } = await supabase
    .from('event_logs')
    .select('id')
    .eq('idempotencyKey', invoiceId)
    .eq('type', 'invoice')
    .eq('status', 'SUCCESS')
    .maybeSingle();

  return !!data;
}

/**
 * Logs a message event to Supabase. 
 * Replaces the old local file writing logic.
 */
export async function logMessageEvent(logEntry: Omit<LogEntry, 'timestamp'>) {
  try {
    const newLog = {
      timestamp: new Date().toISOString(),
      ...logEntry,
    };

    // 1. Insert the new log entry into the database
    const { error } = await supabase.from('event_logs').insert(newLog);
    if (error) throw error;

    // 2. Housekeeping: Limit log size to 1000 entries (A-Z consistency)
    // We only keep the most recent 1000 logs to keep queries fast.
    const { data: oldestLogs } = await supabase
      .from('event_logs')
      .select('id')
      .order('timestamp', { ascending: false })
      .range(1000, 1010);

    if (oldestLogs && oldestLogs.length > 0) {
      const idsToDelete = oldestLogs.map(l => l.id);
      await supabase.from('event_logs').delete().in('id', idsToDelete);
    }

  } catch (error: any) {
    console.error('[Logger] Failed to save log to Supabase:', error.message);
  }
}

/**
 * Retrieves the message logs for the Event Logs UI.
 */
export async function getEventLogs(): Promise<LogEntry[]> {
  try {
    const { data, error } = await supabase
      .from('event_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(1000);

    if (error) throw error;
    return data || [];
  } catch (error: any) {
    console.error('[Logger] Failed to fetch logs:', error.message);
    return [];
  }
}