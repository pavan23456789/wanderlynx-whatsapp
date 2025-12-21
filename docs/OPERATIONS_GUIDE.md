# Wanderlynx - Setup & Operations Guide

This guide provides practical instructions for configuring, testing, and operating the Wanderlynx Messaging Platform.

---

## 1. Setup & Configuration

### Environment Variables

The platform requires the following environment variables to connect to the WhatsApp Cloud API. Create a `.env.local` file in the root of the project and add the following keys:

```
WHATSAPP_ACCESS_TOKEN="YOUR_WHATSAPP_ACCESS_TOKEN"
WHATSAPP_PHONE_NUMBER_ID="YOUR_PHONE_NUMBER_ID"
```

-   `WHATSAPP_ACCESS_TOKEN`: A temporary or permanent access token for your app from the Meta for Developers portal.
-   `WHATSAPP_PHONE_NUMBER_ID`: The ID of the phone number you have configured to send messages from.

### WhatsApp Cloud API Prerequisites

Before the platform can send messages, you must have the following configured in your [Meta for Developers account](https://developers.facebook.com/):

1.  **A Meta App**: Create an app with the "WhatsApp Business" product added.
2.  **A Business Phone Number**: Connect a phone number to your app. For testing, you can use the provided test number.
3.  **Approved Message Templates**: The system relies on pre-approved message templates. You must create and get approval for the following templates in your WhatsApp Manager:
    -   `booking_confirmation_v1`
    -   `payment_pending_v1`

    The content and variables for these templates must align with the official [Event Contract](./EVENT_CONTRACT.md).

---

## 2. Operations & Testing

### How to Trigger Test Events

You can test the backend event flow using a tool like `curl` or Postman. This simulates Travonex sending an event to Wanderlynx.

#### A. Test Booking Confirmation

This triggers the `booking_confirmed` event.

```bash
curl -X POST http://localhost:9002/api/events/booking-confirmed \
-H "Content-Type: application/json" \
-d '{
  "contact": {
    "name": "Olivia Martin",
    "phone": "YOUR_RECIPIENT_PHONE_NUMBER",
    "email": "olivia.martin@example.com"
  },
  "trip": {
    "bookingId": "BK-2024-98A6F",
    "name": "10-Day Bali Adventure",
    "destination": "Bali, Indonesia",
    "startDate": "2024-11-15"
  }
}'
```
**Note**: Replace `YOUR_RECIPIENT_PHONE_NUMBER` with a real phone number (in E.164 format) that is registered to receive messages from your test/business number.

#### B. Test Payment Pending

This triggers the `payment_pending` event.

```bash
curl -X POST http://localhost:9002/api/events/payment-pending \
-H "Content-Type: application/json" \
-d '{
  "contact": {
    "phone": "YOUR_RECIPIENT_PHONE_NUMBER"
  },
  "payment": {
    "amount": 750.00,
    "currency": "USD",
    "dueDate": "2024-09-01",
    "invoiceId": "INV-2024-105"
  }
}'
```

### How to Verify Message Delivery

There are two primary ways to verify that a message was sent successfully:

1.  **Check the Recipient's Phone**: The most direct way is to check the WhatsApp application on the recipient's device.
2.  **Check the Event Logs Page**: The internal dashboard includes a read-only view of all processed events.

### How to Use the Event Logs Page

The Event Logs page provides a real-time audit trail of all incoming events and the platform's response.

1.  **Access**: Log in as a `Super Admin` and navigate to the **Event Logs** tab in the sidebar.
2.  **Interpret the Status**:
    -   `SUCCESS`: The event was received, validated, and the WhatsApp API call was made successfully.
    -   `FAILURE`: The WhatsApp API call failed. The `Details` column will contain the error message from the API.
    -   `SKIPPED`: The event was a duplicate (based on its `bookingId` or `invoiceId`) and was intentionally ignored to prevent sending the same message twice.
3.  **Audit**: Use the table to trace a specific event by its `bookingId` or `invoiceId` and confirm whether a message was attempted, succeeded, or failed. This is the first place to look when debugging a missing message.
