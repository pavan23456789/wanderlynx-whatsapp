-- Create a custom type for user roles to ensure data consistency.
CREATE TYPE app_role AS ENUM ('Super Admin', 'Internal Staff');

-- Create the users table to store your internal team members.
-- This table links to Supabase's built-in auth.users via the id (UUID).
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role app_role NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE users IS 'Stores user profiles and application-specific roles, linked to Supabase auth.';

-- Create the contacts table to store customer information.
CREATE TABLE contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone TEXT NOT NULL UNIQUE,
    name TEXT,
    email TEXT,
    trip_details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_contacts_phone ON contacts(phone);
COMMENT ON TABLE contacts IS 'Stores unique customer contact information.';

-- Create the conversations table to manage WhatsApp chats.
CREATE TYPE conversation_status AS ENUM ('Open', 'Pending', 'Resolved');

CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    status conversation_status NOT NULL DEFAULT 'Open',
    last_message_at TIMESTAMPTZ,
    last_message_preview TEXT,
    is_window_open BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_conversations_status ON conversations(status);
CREATE INDEX idx_conversations_assigned_to ON conversations(assigned_to);
CREATE INDEX idx_conversations_last_message_at ON conversations(last_message_at DESC);
COMMENT ON TABLE conversations IS 'Manages conversation threads with contacts.';


-- Create the messages table to store individual messages.
CREATE TYPE message_direction AS ENUM ('inbound', 'outbound');
CREATE TYPE message_status AS ENUM ('sent', 'delivered', 'read', 'failed', 'pending');

CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    direction message_direction NOT NULL,
    body TEXT,
    status message_status,
    sent_by UUID REFERENCES users(id) ON DELETE SET NULL, -- agent who sent it
    wamid TEXT, -- WhatsApp Message ID
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
COMMENT ON TABLE messages IS 'Stores all individual inbound and outbound messages.';


-- Create the campaigns table for broadcast messaging.
CREATE TYPE campaign_status AS ENUM ('Draft', 'Sending', 'Completed', 'Failed', 'Archived', 'Scheduled');

CREATE TABLE campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    template_name TEXT NOT NULL,
    status campaign_status NOT NULL DEFAULT 'Draft',
    audience_count INT DEFAULT 0,
    sent_count INT DEFAULT 0,
    failed_count INT DEFAULT 0,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    scheduled_at TIMESTAMPTZ
);

CREATE INDEX idx_campaigns_status ON campaigns(status);
COMMENT ON TABLE campaigns IS 'Manages broadcast messaging campaigns.';


-- Create the events table to log incoming webhooks from Travonex.
CREATE TYPE event_status AS ENUM ('SUCCESS', 'FAILURE', 'SKIPPED');

CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    idempotency_key TEXT NOT NULL UNIQUE,
    event_name TEXT NOT NULL,
    status event_status NOT NULL,
    payload JSONB,
    details TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_events_event_name ON events(event_name);
COMMENT ON TABLE events IS 'Logs incoming webhook events from the Travonex backend for auditing.';
