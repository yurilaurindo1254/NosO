-- 1. PROFILES TABLE
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  partner_id UUID REFERENCES auth.users ON DELETE SET NULL,
  couple_id UUID,
  relationship_start_date DATE,
  relationship_status TEXT DEFAULT 'Namorando',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 2. TASKS TABLE
CREATE TABLE tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  title TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'done')),
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  category TEXT,
  recurring BOOLEAN DEFAULT false,
  couple_id UUID NOT NULL -- Logic to group the couple
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- 3. TRANSACTIONS TABLE
CREATE TABLE transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  type TEXT CHECK (type IN ('income', 'expense')),
  category TEXT,
  date DATE DEFAULT CURRENT_DATE,
  payer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  couple_id UUID NOT NULL
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- 4. GOALS TABLE
CREATE TABLE goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  title TEXT NOT NULL,
  target_amount NUMERIC NOT NULL,
  current_amount NUMERIC DEFAULT 0,
  deadline DATE,
  image_url TEXT,
  couple_id UUID NOT NULL
);

ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

-- 5. WISHLIST_ITEMS TABLE
CREATE TABLE wishlist_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  product_url TEXT,
  title TEXT NOT NULL,
  price NUMERIC,
  image_url TEXT,
  priority_level INTEGER DEFAULT 1,
  created_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
  couple_id UUID NOT NULL
);

ALTER TABLE wishlist_items ENABLE ROW LEVEL SECURITY;

-- 6. VIBE_CHECK TABLE
CREATE TABLE vibe_check (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  mood_status TEXT NOT NULL, -- e.g., 'happy', 'tired', 'loved', etc.
  couple_id UUID NOT NULL
);

ALTER TABLE vibe_check ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES

-- Simple policy: users can see their own profile and their partner's profile
CREATE POLICY "Users can view own and partner profile" ON profiles
  FOR SELECT USING (
    auth.uid() = id OR auth.uid() = partner_id
  );

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- For other tables, we use a helper function or direct matching
-- Function to get the current user's partner_id
CREATE OR REPLACE FUNCTION get_partner_id() 
RETURNS UUID AS $$
  SELECT partner_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- =============================================
-- LOVE COUNTER SYSTEM
-- =============================================

-- =============================================
-- MEAL PLANNER SYSTEM
-- =============================================
CREATE TABLE IF NOT EXISTS recipes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  title TEXT NOT NULL,
  ingredients TEXT,
  instructions TEXT,
  image_url TEXT,
  category TEXT DEFAULT 'Geral',
  couple_id UUID NOT NULL
);

CREATE TABLE IF NOT EXISTS meal_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  meal_type TEXT CHECK (meal_type IN ('almoco', 'jantar')),
  recipe_id UUID REFERENCES recipes(id) ON DELETE SET NULL,
  custom_text TEXT,
  couple_id UUID NOT NULL
);

ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Couple access recipes" ON recipes FOR ALL USING (
  couple_id IN (SELECT id FROM profiles WHERE id = auth.uid() OR partner_id = auth.uid()) OR couple_id = auth.uid() -- fallback for safety
);

CREATE POLICY "Couple access meal_plans" ON meal_plans FOR ALL USING (
  couple_id IN (SELECT id FROM profiles WHERE id = auth.uid() OR partner_id = auth.uid()) OR couple_id = auth.uid()
);

-- Tasks Policies
CREATE POLICY "Couples can manage their tasks" ON tasks
  FOR ALL USING (
    assigned_to = auth.uid() OR 
    assigned_to = (SELECT partner_id FROM profiles WHERE id = auth.uid()) OR
    couple_id IN (
      SELECT id FROM profiles WHERE id = auth.uid() OR partner_id = auth.uid()
    )
  );

-- Transactions Policies
CREATE POLICY "Couples can manage their transactions" ON transactions
  FOR ALL USING (
    couple_id IN (
      SELECT id FROM profiles WHERE id = auth.uid() OR partner_id = auth.uid()
    )
  );

-- Goals Policies
CREATE POLICY "Couples can manage their goals" ON goals
  FOR ALL USING (
    couple_id IN (
      SELECT id FROM profiles WHERE id = auth.uid() OR partner_id = auth.uid()
    )
  );

-- Wishlist Policies
CREATE POLICY "Couples can manage their wishlist" ON wishlist_items
  FOR ALL USING (
    couple_id IN (
      SELECT id FROM profiles WHERE id = auth.uid() OR partner_id = auth.uid()
    )
  );

-- Vibe Check Policies
CREATE POLICY "Couples can view vibe checks" ON vibe_check
  FOR SELECT USING (
    couple_id IN (
      SELECT id FROM profiles WHERE id = auth.uid() OR partner_id = auth.uid()
    )
  );

CREATE POLICY "Individuals can insert vibe checks" ON vibe_check
  FOR INSERT WITH CHECK (auth.uid() = profile_id);

-- =============================================
-- 7. LINKING SYSTEM (MIGRATION)
-- =============================================

-- 1. Add column to store pending connection requests
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS incoming_connection_request_from UUID REFERENCES auth.users(id);

-- 2. Function to Send Connection Request
CREATE OR REPLACE FUNCTION send_connection_request(partner_email TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  partner_profile RECORD;
  current_user_id UUID;
BEGIN
  current_user_id := auth.uid();
  
  -- Find partner by email
  SELECT * INTO partner_profile FROM profiles WHERE email = partner_email LIMIT 1;
  
  IF partner_profile IS NULL THEN
    RETURN '{"success": false, "message": "Email não encontrado. Peça para seu amor criar uma conta primeiro!"}'::JSONB;
  END IF;

  IF partner_profile.id = current_user_id THEN
    RETURN '{"success": false, "message": "Você não pode se vincular a si mesmo!"}'::JSONB;
  END IF;

  IF partner_profile.partner_id IS NOT NULL THEN
     RETURN '{"success": false, "message": "Este usuário já tem um parceiro vinculado."}'::JSONB;
  END IF;

  -- Set the request on the partner's profile
  UPDATE profiles 
  SET incoming_connection_request_from = current_user_id
  WHERE id = partner_profile.id;

  RETURN '{"success": true, "message": "Convite enviado! Peça para el(a) aceitar nas Configurações dele(a)."}'::JSONB;
END;
$$;

-- 3. Function to Accept Connection Request
CREATE OR REPLACE FUNCTION accept_connection_request()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id UUID;
  requester_id UUID;
  requester_profile RECORD;
BEGIN
  current_user_id := auth.uid();
  
  -- Get the requester ID
  SELECT incoming_connection_request_from INTO requester_id FROM profiles WHERE id = current_user_id;

  IF requester_id IS NULL THEN
     RETURN '{"success": false, "message": "Nenhum convite pendente."}'::JSONB;
  END IF;

  SELECT * INTO requester_profile FROM profiles WHERE id = requester_id;

  -- Perform linking logic (similar to old link_partner but bidirectional and robust)
  
  -- Update MY profile (I accept, so I join their couple_id if they have one, or we use requester's ID)
  -- Logic: The requester becomes the "lead" for the ID if neither has one, simpler to stick to requester's ID for consistency.
  
  -- Update Requester
  UPDATE profiles 
  SET partner_id = current_user_id, 
      couple_id = requester_id,
      incoming_connection_request_from = NULL -- Clear request
  WHERE id = requester_id;

  -- Update Me (Accepter)
  UPDATE profiles 
  SET partner_id = requester_id, 
      couple_id = requester_id,
      incoming_connection_request_from = NULL -- Clear request
  WHERE id = current_user_id;

  -- Migrate data
  -- Move my stuff to the shared ID (requester_id)
  UPDATE tasks SET couple_id = requester_id WHERE couple_id = current_user_id;
  UPDATE transactions SET couple_id = requester_id WHERE couple_id = current_user_id;
  UPDATE goals SET couple_id = requester_id WHERE couple_id = current_user_id;
  UPDATE wishlist_items SET couple_id = requester_id WHERE couple_id = current_user_id;

  RETURN '{"success": true, "message": "Convite aceito! Vocês agora estão conectados. ❤️"}'::JSONB;
END;
$$;

-- 4. Function to Reject Connection Request
CREATE OR REPLACE FUNCTION reject_connection_request()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE profiles 
  SET incoming_connection_request_from = NULL 
  WHERE id = auth.uid();
  
  RETURN '{"success": true, "message": "Convite recusado."}'::JSONB;
END;
$$;

 - -   8 .   M E A L   P L A N N E R   U P G R A D E S   ( T a g s ) 
 A L T E R   T A B L E   r e c i p e s 
 A D D   C O L U M N   I F   N O T   E X I S T S   t a g s   T E X T [ ] ;   - -   A r r a y   o f   s t r i n g s 
  
 