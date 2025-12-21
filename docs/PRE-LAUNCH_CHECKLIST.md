# Wanderlynx - Pre-Launch Go-Live Checklist

Use this checklist top to bottom.
If most boxes are ✅, you are ready.

---

### 1️⃣ CORE SYSTEM HEALTH

- [ ] **App builds without errors**: The `npm run build` command completes successfully.
- [ ] **No red screens in dashboard**: All pages in the dashboard load without throwing a full-page crash.
- [ ] **No console errors on page load**: The browser's developer console is clean when navigating the dashboard.
- [ ] **API routes respond (no 500 errors)**: Key API endpoints return valid JSON responses.
  - _Minimum required: `/dashboard` loads cleanly & `/api/conversations` returns data._

---

### 2️⃣ WHATSAPP CONNECTION

- [ ] **WhatsApp Cloud API credentials set correctly**: `.env.local` has valid `WHATSAPP_ACCESS_TOKEN` and `WHATSAPP_PHONE_NUMBER_ID`.
- [ ] **Webhook verified in Meta dashboard**: The `/api/whatsapp/webhook` endpoint is successfully verified in the Meta for Developers portal.
- [ ] **Incoming WhatsApp messages reach the system**: A message sent to the business number is processed by the webhook.
- [ ] **Outgoing WhatsApp messages are delivered**: A reply sent from the Inbox is received on the user's phone.
  - _Test once: Send a message from your phone → see it appear in the Inbox. Reply from the Inbox → receive it on your phone._

---

### 3️⃣ INBOX (PHASE 2 CORE)

- [ ] **Incoming messages appear in Inbox**: New messages show up after the polling interval.
- [ ] **Conversations persist after refresh**: The conversation history is still present after reloading the page.
- [ ] **Contact auto-created for new phone numbers**: A new contact appears in `contacts.json` when a message is received from an unknown number.
- [ ] **Contact name shown instead of raw number**: The Inbox UI displays the contact's name.
- [ ] **Message status updates visible**: The `sent` / `delivered` / `read` status on outgoing messages updates correctly.

#### WhatsApp Rules Compliance
- [ ] **24-hour window tracked correctly**: The system correctly identifies when the customer service window is open or closed.
- [ ] **Free-text disabled outside window**: The text input is replaced by the template picker when the window is closed.
- [ ] **Template picker shown when required**: The template selection UI appears correctly.
- [ ] **Template variables must be filled**: The UI requires variables to be filled before sending a template.

---

### 4️⃣ TEMPLATES (STABILITY & COMPLIANCE)

- [ ] **Templates page loads without errors**: `/dashboard/templates` is stable.
- [ ] **Templates are read-only**: The UI does not allow creating or editing templates.
- [ ] **Only approved templates visible for sending**: The Inbox and Campaigns UIs filter out pending/rejected templates.
- [ ] **Pending / rejected templates cannot be used**: Confirmed that non-approved templates are not available for selection.
- [ ] **Inbox and Campaigns use same template data**: Both features are pulling from the same source of truth.
  - _Important: The Templates page should feel boring and static. That’s correct._

---

### 5️⃣ CAMPAIGNS (TRUTHFUL STATE)

- [ ] **/dashboard/campaigns loads without crashing**: The page and detail view are stable.
- [ ] **Campaign list is fetched from backend**: The list is not using mock data.
- [ ] **Campaign status is backend-driven**: The status (e.g., "Sending") reflects the real backend state.
- [ ] **Sent / Failed / Audience counts are real**: Numbers are based on actual API calls.
- [ ] **Progress bar reflects real sending state**: The progress bar updates as the campaign runs.
- [ ] **Only approved templates allowed**: The creation flow only lists approved templates.
- [ ] **Archive / Duplicate actions do not break state**: These actions are safely disabled.
  - _Not required yet: Scheduling, CSV upload, automation._

---

### 6️⃣ LOGS & VISIBILITY

- [ ] **Event logs page loads**: `/dashboard/logs` shows recent activity.
- [ ] **Incoming messages are logged**: Webhook events appear in `events.json`.
- [ ] **Outgoing messages are logged**: API calls for outgoing messages are recorded.
- [ ] **Failures are visible (not silent)**: Errors from the WhatsApp API are logged with a `FAILURE` status.
- [ ] **Duplicate events are skipped safely**: The system correctly identifies and skips duplicate `bookingId`s or `invoiceId`s.

---

### 7️⃣ DATA SAFETY (KNOWN LIMITS)

- [ ] **You understand data is stored in JSON files**: Acknowledge that `conversations.json`, `contacts.json`, etc., are the persistence layer.
- [ ] **This is OK for pilot / low volume**: Accept the risk for initial, limited use.
- [ ] **You will migrate to database before scale**: Commit to replacing the JSON files with a database before high-volume usage.
- [ ] **You are NOT using this for heavy traffic yet**: Confirm this is for a controlled pilot.

---

### 8️⃣ OPERATOR SAFETY

- [ ] **UI clearly disables invalid actions**: Buttons that shouldn't be clicked are `disabled`.
- [ ] **No buttons that “look working but aren’t”**: All interactive elements are either functional or clearly marked as not implemented.
- [ ] **Errors are shown clearly, not silently ignored**: The UI uses toasts or error messages to inform the operator of failures.
- [ ] **One operator usage is safe**: Acknowledge that the system is designed for a single concurrent user.

---

### 9️⃣ DEPLOYMENT READINESS (PILOT)

- [ ] **Hosted on HTTPS**: The app is deployed to a live, secure URL.
- [ ] **Environment variables set**: Live credentials and webhook tokens are configured in the hosting environment.
- [ ] **Webhook URL points to live domain**: The Meta App is configured with the production webhook URL.
- [ ] **Test message works on live deployment**: A full end-to-end message loop is tested on the deployed version.

---

### 🔟 FINAL GO / NO-GO DECISION

- **✅ GO if**:
  - The Inbox works end-to-end flawlessly.
  - Templates are stable and read-only.
  - Campaigns reflect truthful data (even if not fully featured).
  - Logs show real activity and failures.
  - A single operator can safely use the tool without causing data conflicts.

- **❌ NO-GO if**:
  - The Inbox drops messages or fails to send replies.
  - The Templates page crashes or shows incorrect data.
  - Campaign data is still fake or causes the app to crash.
  - Build errors or critical runtime errors still exist.

---

#### ONE-LINE FINAL VERDICT RULE

**If the Inbox, Templates, and Logs modules are solid, you are safe to begin a controlled, internal pilot. Campaigns can mature gradually, but the Inbox must never break.**
