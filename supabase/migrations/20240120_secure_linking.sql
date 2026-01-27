
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
