// Type definitions for API payloads and shared data structures

/**
 * Payload for the `booking-confirmed` event.
 * Sent from Travonex to Wanderlynx when a new trip is confirmed.
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
    startDate: string; // ISO 8601 format
  };
};

/**
 * Payload for the `payment-reminder` event.
 * Sent from Travonex to Wanderlynx to trigger a payment reminder.
 */
export type PaymentReminderPayload = {
  contact: {
    phone: string; // E.164 format
  };
  payment: {
    amount: number;
    currency: string;
    dueDate: string; // ISO 8601 format
    invoiceId: string;
  };
};
