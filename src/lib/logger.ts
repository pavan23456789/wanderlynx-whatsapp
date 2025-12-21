// A simple file-based logger for persisting event and message data.
// In a production environment, this should be replaced with a robust
// logging service and a scalable database (e.g., Firestore, Cloud Logging).

import * as fs from 'fs/promises';
import * as path from 'path';

const LOG_FILE_PATH = path.join(process.cwd(), 'logs', 'events.json');

type LogData = {
  processedBookingIds: string[];
  processedInvoiceIds: string[];
  messageLog: Record<string, any>[];
};

/**
 * Ensures the log directory and file exist, and returns the log data.
 */
async function getLogData(): Promise<LogData> {
  try {
    await fs.mkdir(path.dirname(LOG_FILE_PATH), { recursive: true });
    const data = await fs.readFile(LOG_FILE_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      // File doesn't exist, create it with default structure
      const defaultData: LogData = {
        processedBookingIds: [],
        processedInvoiceIds: [],
        messageLog: [],
      };
      await fs.writeFile(LOG_FILE_PATH, JSON.stringify(defaultData, null, 2));
      return defaultData;
    }
    console.error('[Logger] Failed to read log file:', error);
    // Return default structure in case of other errors
    return {
      processedBookingIds: [],
      processedInvoiceIds: [],
      messageLog: [],
    };
  }
}

/**
 * Writes the provided data to the log file.
 */
async function writeLogData(data: LogData): Promise<void> {
  try {
    await fs.writeFile(LOG_FILE_PATH, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('[Logger] Failed to write to log file:', error);
  }
}

/**
 * Checks if a bookingId has already been processed.
 */
export async function hasProcessedBookingId(bookingId: string): Promise<boolean> {
  const logs = await getLogData();
  return logs.processedBookingIds.includes(bookingId);
}

/**
 * Checks if an invoiceId has already been processed.
 */
export async function hasProcessedInvoiceId(invoiceId: string): Promise<boolean> {
  const logs = await getLogData();
  return logs.processedInvoiceIds.includes(invoiceId);
}

/**
 * Logs a message event and marks the corresponding ID as processed.
 */
export async function logMessageEvent(logEntry: {
  idempotencyKey: string;
  type: 'booking' | 'invoice';
  status: 'SUCCESS' | 'FAILURE' | 'SKIPPED';
  event: string;
  recipient: string;
  details: any;
  error?: string;
}) {
  const logs = await getLogData();
  const newLog = {
    timestamp: new Date().toISOString(),
    ...logEntry,
  };
  logs.messageLog.unshift(newLog); // Add to the beginning of the array

  // Only add the key if the message was sent successfully
  if (logEntry.status === 'SUCCESS') {
    if (logEntry.type === 'booking' && !logs.processedBookingIds.includes(logEntry.idempotencyKey)) {
      logs.processedBookingIds.push(logEntry.idempotencyKey);
    } else if (logEntry.type === 'invoice' && !logs.processedInvoiceIds.includes(logEntry.idempotencyKey)) {
      logs.processedInvoiceIds.push(logEntry.idempotencyKey);
    }
  }

  // Limit log size to prevent the file from growing indefinitely
  if (logs.messageLog.length > 1000) {
    logs.messageLog = logs.messageLog.slice(0, 1000);
  }

  await writeLogData(logs);
}
