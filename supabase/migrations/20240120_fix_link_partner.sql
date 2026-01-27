
-- Fix link_partner function to use correct columns for data migration
CREATE OR REPLACE FUNCTION link_partner(partner_email TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  partner_profile RECORD;
  current_user_id UUID;
BEGIN
  current_user_id := auth.uid();
  
  -- Find partner
  SELECT * INTO partner_profile FROM profiles WHERE email = partner_email LIMIT 1;
  
  IF partner_profile IS NULL THEN
    RETURN '{"success": false, "message": "Email não encontrado. Peça para seu amor criar uma conta primeiro!"}'::JSONB;
  END IF;

  IF partner_profile.id = current_user_id THEN
    RETURN '{"success": false, "message": "Você não pode se vincular a si mesmo!"}'::JSONB;
  END IF;

  -- Update MY profile (I join their "couple_id" usually, or we pick one. 
  -- The original logic seemed to pick partner_profile.id as the couple_id. 
  -- Let's stick to that to minimize change, although usually a new UUID is better. 
  -- But here profiles.id IS the couple_id for single users, so merging means picking one ID.)
  
  -- Update MY profile
  UPDATE profiles 
  SET partner_id = partner_profile.id, 
      couple_id = partner_profile.id 
  WHERE id = current_user_id;

  -- Update THEIR profile
  UPDATE profiles 
  SET partner_id = current_user_id, 
      couple_id = partner_profile.id 
  WHERE id = partner_profile.id;

  -- Migrate data to new couple_id
  -- We migrate everything that was previously associated with "ME" (couple_id = my_id)
  -- to the new shared "US" (couple_id = partner_id)
  
  UPDATE tasks SET couple_id = partner_profile.id WHERE couple_id = current_user_id;
  UPDATE transactions SET couple_id = partner_profile.id WHERE couple_id = current_user_id;
  UPDATE goals SET couple_id = partner_profile.id WHERE couple_id = current_user_id;
  UPDATE wishlist_items SET couple_id = partner_profile.id WHERE couple_id = current_user_id;

  RETURN '{"success": true, "message": "Casal vinculado com sucesso! Agora é só love."}'::JSONB;
END;
$$;
