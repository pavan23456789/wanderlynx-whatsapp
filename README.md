# Wanderlynx Messaging Platform

## What It Does

The Wanderlynx Messaging Platform is a specialized service designed to handle all WhatsApp-based communication for the Travonex travel platform. Its sole responsibility is to send and receive WhatsApp messages, manage message templates, and provide a central inbox for customer conversations.

This system acts as the "communications arm" for Travonex, ensuring customers receive timely and relevant updates about their travel plans.

## Problem It Solves

This platform solves the challenge of automating critical customer communication at scale. By connecting directly to the Travonex backend, it ensures that key events—like a new booking or an upcoming payment—trigger immediate and accurate WhatsApp messages.

This eliminates the need for manual follow-ups, reduces errors, and provides a professional, consistent communication channel with customers, directly on the messaging app they use most.

## How It Integrates with Travonex

The integration is based on a simple but powerful **event-driven (webhook) architecture**.

1.  **Travonex Initiates Events**: When a significant action occurs in the Travonex system (e.g., a booking is finalized), Travonex sends a secure HTTP POST request to a specific endpoint on this platform.
2.  **Wanderlynx Receives Events**: The Wanderlynx backend listens for these incoming events via its API routes (e.g., `/api/events/booking-confirmed`).
3.  **Wanderlynx Takes Action**: Upon receiving a valid event, Wanderlynx triggers the appropriate action, such as sending a pre-defined WhatsApp template message to the customer.

**Key Principle**: Travonex is the single source of truth for all business data (bookings, payments, etc.). Wanderlynx never modifies this data; it only acts on the information it receives.

---

## Technical Overview

-   **Framework**: Next.js (React)
-   **Backend**: Next.js API Routes
-   **Messaging**: Meta WhatsApp Cloud API

For detailed setup instructions, please see the guides below:
- [**WhatsApp API Setup Guide**](./docs/WHATSAPP_SETUP_GUIDE.md) (Start here if you are new)
- [**Operations Guide**](./docs/OPERATIONS_GUIDE.md) (For testing and daily operations)
