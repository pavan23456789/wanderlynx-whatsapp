# Wanderlynx Platform - Role Permissions & Access Control V1

This document defines the official roles and permission levels for the Wanderlynx Messaging Platform. All backend authentication and authorization logic must adhere to this contract. Its purpose is to ensure a clear separation of duties, enhance security, and prevent accidental high-impact actions.

---

## 1. Role: Admin

- **Purpose**: Full system control. Intended for founders, lead engineers, or senior management. This role has the authority to perform irreversible actions.
- **Audience**: A very limited number of trusted users (1-2 per organization).

#### Capabilities by Module

| Module      | Permissions                                                                                                         |
|-------------|---------------------------------------------------------------------------------------------------------------------|
| **Inbox**       | View all conversations, reply to any conversation, assign/reassign, mark as resolved, and reopen conversations.       |
| **Campaigns**   | Full CRUD: Create, edit, schedule, `Send Now`, pause, resume, and cancel campaigns. Can view all reports and archive. |
| **Contacts**    | Full CRUD: Create, edit, and **delete** individual contacts. Can bulk upload via CSV.                               |
| **Templates**   | View all templates synced from WhatsApp Business Manager.                                                            |
| **Settings**    | Full access. Can manage user accounts, change system settings, and configure automations.                         |

#### High-Risk Actions (Admin Only)
-   `Send Now` on a campaign.
-   Deleting a contact.
-   Deleting or archiving a campaign.

---

## 2. Role: Customer Support

- **Purpose**: Focused entirely on customer interaction. This role is designed to handle day-to-day conversations within the Inbox safely and efficiently.
- **Audience**: The primary user group for the platform (support agents, operations staff).

#### Capabilities by Module

| Module      | Permissions                                                                                                                             |
|-------------|-----------------------------------------------------------------------------------------------------------------------------------------|
| **Inbox**       | View assigned and unassigned conversations. Can reply, add internal notes, and mark conversations as resolved.                       |
| **Campaigns**   | **No Access**. This module should ideally be hidden from the UI for this role to prevent confusion and accidental actions.                 |
| **Contacts**    | View all contacts. Can edit basic fields (e.g., name, tags) but **cannot delete** contacts or perform bulk uploads.                    |
| **Templates**   | View-only access to see available templates for use in the Inbox.                                                                     |
| **Settings**    | **No Access**. This role has no permission to change any system, user, or automation settings.                                       |

---

## 3. Role: Marketing

- **Purpose**: Manages one-to-many communication. This role is responsible for creating and preparing campaigns, but requires Admin approval for execution.
- **Audience**: Marketing managers, content creators.

#### Capabilities by Module

| Module      | Permissions                                                                                                                              |
|-------------|------------------------------------------------------------------------------------------------------------------------------------------|
| **Inbox**       | **No Access**. This role is firewalled from one-on-one customer conversations to maintain a clear separation of duties.                   |
| **Campaigns**   | Can create and edit `Draft` campaigns. Can `Schedule` campaigns for a future date. **Cannot `Send Now`** or pause live campaigns.         |
| **Contacts**    | View all contacts. Can upload new contacts via CSV for campaign audiences. **Cannot delete** or edit individual contact details.         |
| **Templates**   | View-only access to select approved templates for campaigns.                                                                           |
| **Settings**    | **No Access**.                                                                                                                           |

---

## Key Policy Decisions & Assumptions

1.  **Admin is the Ultimate Gatekeeper**: Only the `Admin` role can execute irreversible or high-impact actions like immediate campaign sending and contact deletion. This is a core safety principle.
2.  **Separation of Duties**: The `Customer Support` role is firewalled from bulk messaging (Campaigns), and the `Marketing` role is firewalled from individual conversations (Inbox). This is a non-negotiable separation.
3.  **Read-Only is Better Than Hidden**: For non-accessible but non-sensitive modules (e.g., Campaigns for a Support user), the UI should clearly show the module as disabled with a tooltip, rather than hiding it entirely. This prevents confusion about feature availability.
4.  **No "Approval" Workflow (Yet)**: The current model assumes a manual approval process (e.g., a Marketing user telling an Admin via Slack, "The campaign is ready"). There is no in-app "Request Approval" feature yet.

---

## Intentionally Out of Scope (For V1)

-   **Granular Permissions**: No concept of custom roles or fine-grained permissions (e.g., "can view contacts but not edit tags"). The three defined roles are the only ones supported.
-   **Team-Based Access**: The system does not yet support isolating contacts or conversations to specific teams within an organization.
-   **In-App Template Management**: All WhatsApp template creation and approval happens externally in the Meta Business Manager.
-   **Automated Approval Flows**: There is no system for a Marketing user to submit a campaign for an Admin's approval within the app.
