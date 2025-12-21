# Wanderlynx - WhatsApp Cloud API Setup Guide

This guide provides a complete, beginner-friendly walkthrough for setting up the Meta WhatsApp Cloud API from scratch. Follow these steps in order to connect the Wanderlynx platform to WhatsApp.

---

### Step 1: Create a Meta Developer Account

Before you can do anything, you need a developer account.

1.  **Go to the Meta for Developers website**: [https://developers.facebook.com/](https://developers.facebook.com/)
2.  **Log In**: Use your personal or business Facebook account to log in.
3.  **Get Started**: Click the "Get Started" button. You will be guided through a short registration process. This will create your developer account.

---

### Step 2: Create a New Meta App

Next, you need to create an "app" which will act as the container for your WhatsApp integration.

1.  **Navigate to "My Apps"**: In the top right corner, click on "My Apps".
2.  **Create App**: Click the green "Create App" button.
3.  **Choose App Type**: A window will pop up asking for an app type.
    -   Select **"Other"**.
    -   Click **"Next"**.
4.  **Select Business Type**:
    -   Select **"Business"**. This type is required for accessing the WhatsApp Business Platform.
    -   Click **"Next"**.
5.  **Configure App Details**:
    -   **App Name**: Give your app a descriptive name (e.g., "Wanderlynx Messaging").
    -   **App Contact Email**: Your email should be pre-filled.
    -   **Business Account**: This is optional but recommended. If you have a Meta Business Account, select it from the dropdown. If not, you can skip this for now.
    -   Click **"Create App"**. You may be asked to re-enter your Facebook password.

You will now be redirected to your new app's dashboard.

---

### Step 3: Enable the WhatsApp Cloud API

Now, you'll add the WhatsApp product to your new app.

1.  **Find WhatsApp**: On the app dashboard, scroll down until you see the "Add products to your app" section. Find "WhatsApp" and click **"Set up"**.
2.  **Configure API**:
    -   You will be taken to the "WhatsApp Business Platform" API configuration screen.
    -   Meta will automatically create a **test business account** and a **test phone number** for you. This is perfect for development. You can find this information under the "Test Number" section.

You now have a temporary access token and a test phone number ready to use!

---

### Step 4: Add and Verify a Recipient Phone Number

For security, the API can only send messages to numbers that you have explicitly verified.

1.  **Navigate to the API Setup Page**: You should still be on the WhatsApp "API Setup" page.
2.  **Select Sender**: The test phone number created in the previous step should be selected in the "From" dropdown.
3.  **Add Recipient Number**: In the "To" dropdown field, click **"Manage phone number list"**.
    -   A dialog will appear. Make sure your country code is correct.
    -   Enter the WhatsApp phone number you want to send test messages to (e.g., your personal mobile number).
    -   Click **"Next"**.
4.  **Verify the Number**: A verification code will be sent to the number you just added via WhatsApp. Enter that code in the dialog to complete the verification.

> **Common Mistake**: Forgetting to add and verify a recipient number. If you skip this, your API calls will fail with a "Recipient phone number not whitelisted" error.

---

### Step 5: Send Your First Test Message

Meta provides a simple tool to send your first message directly from their dashboard. This confirms that your test number and access token are working.

1.  **Open the Send Tool**: On the "API Setup" page, the form under "Step 2: Send messages with the API" is ready to use.
2.  **Confirm Recipient**: The phone number you just verified should be selected in the "To" field.
3.  **Click "Send Message"**: The command on the right shows the `curl` request that is being made. Click the "Send Message" button.

Within a few seconds, you should receive a "Hello World" template message on the WhatsApp account associated with your verified phone number.

**If this works, your core WhatsApp API setup is correct!**

---

### Step 6: Configure the Webhook for Receiving Messages

The webhook is how Meta tells **your application** about incoming messages or status updates.

1.  **Find Webhook Settings**: On the "API Setup" page, scroll down to "Step 3: Configure webhooks". Click the **"Edit"** button.
2.  **Configure the Webhook**:
    -   **Callback URL**: This is the most important part. You must provide the **public URL** of your deployed Wanderlynx application, followed by `/api/whatsapp/webhook`.
        -   Example for a live app: `https://your-wanderlynx-app-url.com/api/whatsapp/webhook`
        -   **Note**: `localhost` will NOT work because the Meta servers cannot reach it. You must deploy the application to a public HTTPS server (like Vercel, Netlify, or Firebase App Hosting) to test webhooks.
    -   **Verify Token**: This is a secret password that you create. It ensures that only Meta can send requests to your webhook URL.
        -   Create a long, random string (e.g., `RANDOM_SECRET_STRING_12345`).
        -   You will need to set this **exact same string** in your application's `.env.local` file as `WHATSAPP_VERIFY_TOKEN`.
3.  **Save and Verify**: Click **"Verify and Save"**. Meta will immediately send a request to your Callback URL. If your application is running and the verify tokens match, it will succeed.

4.  **Subscribe to Events**: After verifying, a "Webhook fields" table will appear. Click **"Manage"**. In the dialog that opens, scroll down and subscribe to all events under `messages`. This tells Meta to notify you of new messages, status updates, etc. Click **"Done"**.

---

### Step 7: Get Your Permanent Access Token and IDs

The initial "temporary" token expires after 24 hours. For a real application, you need a permanent one, along with your official IDs.

1.  **Get Your IDs**:
    -   **Phone Number ID**: On the "API Setup" page, under "Step 1", you can find the `Phone number ID`. Copy this.
    -   **WhatsApp Business Account ID**: Directly above the Phone Number ID, you can find the `WhatsApp Business Account ID`. Copy this.

2.  **Generate a Permanent Token**:
    -   Navigate to your Business Settings: `https://business.facebook.com/settings/`
    -   In the left sidebar, go to **Users > System Users**.
    -   Add a new System User if you don't have one. Give it an "Admin" role.
    -   **Assign Assets**: Select the new system user, click "Assign Assets," select "Apps," choose your Wanderlynx app, and enable the `whatsapp_business_messaging` permission.
    -   **Generate Token**: Click "Generate New Token" for that system user. Select your app, and choose the `whatsapp_business_messaging` and `whatsapp_business_management` permissions. Set the token expiration to "Never".
    -   Copy the generated token. This is your **permanent access token**.

    > **CRITICAL**: Store this token securely. You will not be able to see it again after you close the dialog.

---

### Final Step: Update Your Application's Environment Variables

You now have all the pieces. Create a `.env.local` file in the root of your Wanderlynx project and add the following, replacing the placeholder values:

```
# From Step 7
WHATSAPP_ACCESS_TOKEN="YOUR_PERMANENT_ACCESS_TOKEN"
WHATSAPP_PHONE_NUMBER_ID="YOUR_PHONE_NUMBER_ID"

# From Step 6
WHATSAPP_VERIFY_TOKEN="YOUR_SECRET_VERIFY_TOKEN"
```

Once these variables are set and your application is running on a public URL, your setup is complete. You will be able to send messages via the API and receive incoming messages at your webhook endpoint.
