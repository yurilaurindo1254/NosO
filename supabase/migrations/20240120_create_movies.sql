
-- 7. MOVIES TABLE (Cineclube)
CREATE TABLE IF NOT EXISTS movies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  title TEXT NOT NULL,
  platform TEXT,
  genre TEXT,
  image_url TEXT,
  rating NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'watchlist' CHECK (status IN ('watchlist', 'watched')),
  couple_id UUID NOT NULL
);

ALTER TABLE movies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Couples can manage their movies" ON movies
  FOR ALL USING (
    couple_id IN (
      SELECT id FROM profiles WHERE id = auth.uid() OR partner_id = auth.uid()
    )
  );
