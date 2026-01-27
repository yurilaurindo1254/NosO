-- Create table to store the bank connections (Items)
CREATE TABLE IF NOT EXISTS bank_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    pluggy_item_id TEXT UNIQUE NOT NULL, -- The Item ID from Pluggy
    provider_name TEXT NOT NULL,         -- e.g. "Nubank", "Itaú"
    status TEXT DEFAULT 'active',        -- 'active', 'error', 'disconnected'
    last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add logic to Transactions to prevent duplicates and link to connection
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS pluggy_transaction_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS bank_connection_id UUID REFERENCES bank_connections(id);

-- Verify RLS (Row Level Security)
ALTER TABLE bank_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own connections" 
ON bank_connections FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own connections" 
ON bank_connections FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own connections" 
ON bank_connections FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own connections" 
ON bank_connections FOR DELETE 
USING (auth.uid() = user_id);
