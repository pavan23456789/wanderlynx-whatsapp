# Wanderlynx Messaging Platform - Event Contract V1

This document outlines the official contract for events sent from the Travonex backend to the Wanderlynx Messaging Platform. All communication must adhere to this contract.

This contract defines the data that Wanderlynx needs to send timely and accurate WhatsApp messages to customers based on actions that occur within the Travonex system.

---

## Event: `booking_confirmed`

This event is triggered when a customer's booking is successfully finalized in Travonex.

- **Event Name**: `booking_confirmed`
- **Trigger Condition**: Fired immediately after a customer successfully completes a new booking in Travonex and a `bookingId` is generated.
- **WhatsApp Message Intent**: **Confirmation**. To confirm the customer's new booking and provide essential details.
- **Required Template Category**: `Utility`

#### Payload Fields

- `contact` (object, **mandatory**)
    - `name` (string, **mandatory**) - The customer's full name.
    - `phone` (string, **mandatory**) - The customer's phone number in international E.164 format (e.g., `+14155552671`).
    - `email` (string, optional) - The customer's email address.
- `trip` (object, **mandatory**)
    - `bookingId` (string, **mandatory**) - The unique identifier for the booking.
    - `name` (string, **mandatory**) - The commercial name of the trip or package (e.g., "10-Day Bali Adventure").
    - `destination` (string, **mandatory**) - The primary destination of the trip.
    - `startDate` (string, **mandatory**) - The start date of the trip in `YYYY-MM-DD` format.

#### Example JSON Payload
```json
{
  "contact": {
    "name": "Olivia Martin",
    "phone": "+14155552671",
    "email": "olivia.martin@example.com"
  },
  "trip": {
    "bookingId": "BK-2024-98A6F",
    "name": "10-Day Bali Adventure",
    "destination": "Bali, Indonesia",
    "startDate": "2024-11-15"
  }
}
```

---

## Event: `payment_pending`

This event is triggered when a payment is due, prompting Wanderlynx to send a reminder.

- **Event Name**: `payment_pending`
- **Trigger Condition**: Fired when an upcoming payment deadline is approaching (e.g., 7 days before the due date) as determined by Travonex's internal logic.
- **WhatsApp Message Intent**: **Reminder**. To remind the customer about an upcoming payment.
- **Required Template Category**: `Utility`

#### Payload Fields
- `contact` (object, **mandatory**)
    - `phone` (string, **mandatory**) - The customer's phone number (E.164 format).
- `payment` (object, **mandatory**)
    - `amount` (number, **mandatory**) - The payment amount due.
    - `currency` (string, **mandatory**) - The currency code (e.g., "USD").
    - `dueDate` (string, **mandatory**) - The payment due date in `YYYY-MM-DD` format.
    - `invoiceId` (string, optional) - The associated invoice number.

#### Example JSON Payload
```json
{
  "contact": {
    "phone": "+14155552671"
  },
  "payment": {
    "amount": 750.00,
    "currency": "USD",
    "dueDate": "2024-09-01",
    "invoiceId": "INV-2024-105"
  }
}
```

---

## Event: `payment_received`

This event is triggered when a customer's payment is successfully processed in Travonex.

- **Event Name**: `payment_received`
- **Trigger Condition**: Fired immediately after a payment is successfully received and recorded in the Travonex system.
- **WhatsApp Message Intent**: **Confirmation**. To confirm receipt of the customer's payment.
- **Required Template Category**: `Utility`

#### Payload Fields
- `contact` (object, **mandatory**)
    - `phone` (string, **mandatory**) - The customer's phone number (E.164 format).
- `payment` (object, **mandatory**)
    - `amount` (number, **mandatory**) - The payment amount received.
    - `currency` (string, **mandatory**) - The currency code (e.g., "USD").
    - `receiptId` (string, optional) - The unique receipt or transaction number.

#### Example JSON Payload
```json
{
  "contact": {
    "phone": "+14155552671"
  },
  "payment": {
    "amount": 750.00,
    "currency": "USD",
    "receiptId": "TXN-7C8B9A2D"
  }
}
```

---

## Event: `trip_reminder` (V1.1 - Optional)

This event is triggered as a customer's trip departure date nears.

- **Event Name**: `trip_reminder`
- **Trigger Condition**: Fired a configurable number of days (e.g., 3 days) before the trip `startDate`, as determined by Travonex's scheduling logic.
- **WhatsApp Message Intent**: **Update**. To provide a friendly reminder and potentially offer last-minute information.
- **Required Template Category**: `Marketing` or `Utility`

#### Payload Fields
- `contact` (object, **mandatory**)
    - `phone` (string, **mandatory**) - The customer's phone number (E.164 format).
- `trip` (object, **mandatory**)
    - `name` (string, **mandatory**) - The commercial name of the trip.
    - `startDate` (string, **mandatory**) - The start date of the trip in `YYYY-MM-DD` format.
    - `destination` (string, **mandatory**) - The primary destination.

#### Example JSON Payload
```json
{
  "contact": {
    "phone": "+14155552671"
  },
  "trip": {
    "name": "10-Day Bali Adventure",
    "startDate": "2024-11-15",
    "destination": "Bali, Indonesia"
  }
}
```
