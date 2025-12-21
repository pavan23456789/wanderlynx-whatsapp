import { NextResponse } from 'next/server';
import { getEventLogs } from '@/lib/logger';

/**
 * API route handler to fetch event logs.
 * This is for internal operational visibility.
 */
export async function GET(request: Request) {
  try {
    const logs = await getEventLogs();
    return NextResponse.json(logs);
  } catch (error: any) {
    console.error('[API Logs] Failed to retrieve logs:', error);
    return NextResponse.json(
      { success: false, message: 'An internal server error occurred while fetching logs.' },
      { status: 500 }
    );
  }
}
