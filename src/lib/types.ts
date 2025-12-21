// Type definitions for API payloads and shared data structures

/**
 * Payload for the `booking_confirmed` event, as per EVENT_CONTRACT.md.
 */
export type BookingConfirmedPayload = {
  contact: {
    name: string;
    phone: string; // E.164 format
    email?: string;
  };
  trip: {
    bookingId: string;
    name: string;
    destination: string;
    startDate: string; // YYYY-MM-DD format
  };
};

/**
 * Payload for the `payment_pending` event, as per EVENT_CONTRACT.md.
 */
export type PaymentPendingPayload = {
  contact: {
    phone: string; // E.164 format
  };
  payment: {
    amount: number;
    currency: string;
    dueDate: string; // YYYY-MM-DD format
    invoiceId?: string;
  };
};

/**
 * Payload for the `payment_received` event, as per EVENT_CONTRACT.md.
 */
export type PaymentReceivedPayload = {
  contact: {
    phone: string; // E.164 format
  };
  payment: {
    amount: number;
    currency: string;
    receiptId?: string;
  };
};

/**
 * Payload for the `trip_reminder` event, as per EVENT_CONTRACT.md.
 */
export type TripReminderPayload = {
  contact: {
    phone: string; // E.164 format
  };
  trip: {
    name: string;
    startDate: string; // YYYY-MM-DD format
    destination: string;
  };
};


/**
 * Payload for sending a WhatsApp template message via Meta Cloud API.
 */
export type WhatsAppMessagePayload = {
  messaging_product: 'whatsapp';
  to: string;
  type: 'template';
  template: {
    name: string;
    language: {
      code: string;
    };
    components: {
      type: 'body' | 'header' | 'button';
      parameters: {
        type: 'text' | 'currency' | 'date_time' | 'image' | 'document';
        text?: string;
        // Add other parameter types as needed
      }[];
    }[];
  };
};
