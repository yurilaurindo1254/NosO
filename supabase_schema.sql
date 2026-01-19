-- 1. PROFILES TABLE
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  partner_id UUID REFERENCES auth.users ON DELETE SET NULL,
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
