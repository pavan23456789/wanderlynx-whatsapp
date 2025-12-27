import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with the service role key for backend operations
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TRAVONEX_API_KEY = process.env.TRAVONEX_API_KEY;

/**
 * API route to handle incoming events from the Travonex backend.
 *
 * Security:
 * This endpoint is protected by a static API key that must be sent
 * in the `x-api-key` header of the request.
 */
export async function POST(req: NextRequest) {
  // 1. Security Check: Validate the API key
  const apiKey = req.headers.get('x-api-key');
  if (!TRAVONEX_API_KEY || apiKey !== TRAVONEX_API_KEY) {
    console.warn('[API/Events] Unauthorized: Invalid or missing API key.');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();

    // 2. Payload Validation
    const { event_name, phone, payload } = body;
    if (!event_name || !phone || !payload) {
      return NextResponse.json(
        { error: 'Bad Request: Missing required fields (event_name, phone, payload).' },
        { status: 400 }
      );
    }

    // 3. Store the event in the database
    const { error: insertError } = await supabase.from('events').insert({
      event_name,
      phone,
      payload,
      status: 'received', // Default status upon reception
    });

    if (insertError) {
      console.error('[API/Events] Failed to store event:', insertError);
      return NextResponse.json(
        { error: 'Internal Server Error', details: insertError.message },
        { status: 500 }
      );
    }

    // 4. Return success response
    return NextResponse.json({ success: true, message: 'Event received.' }, { status: 200 });

  } catch (error: any) {
    console.error('[API/Events] Critical error processing event:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Example `curl` request to test this endpoint:
 *
 * curl -X POST http://localhost:3000/api/events \
 * -H "Content-Type: application/json" \
 * -H "x-api-key: YOUR_TRAVONEX_API_KEY" \
 * -d '{
 *   "event_name": "booking_confirmed",
 *   "phone": "+14155552671",
 *   "payload": {
 *     "bookingId": "BK-2024-98A6F",
 *     "customerName": "Olivia Martin",
 *     "tripName": "10-Day Bali Adventure"
 *   }
 * }'
 *
 * Example Success Response (200 OK):
 * {
 *   "success": true,
 *   "message": "Event received."
 * }
 */
