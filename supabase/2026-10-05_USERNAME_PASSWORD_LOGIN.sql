-- =============================================================
-- USERNAME + PASSWORD ONLY (NO SUPABASE AUTH)
-- Passwords are stored only as bcrypt hashes inside public.profiles.
-- No auth.users, no custom session table, no Supabase Auth dependency.
-- =============================================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS password_hash text;
CREATE UNIQUE INDEX IF NOT EXISTS uq_profiles_username_ci
  ON public.profiles(lower(trim(username)))
  WHERE username IS NOT NULL AND trim(username)<>'';

CREATE OR REPLACE FUNCTION public.employee_set_password(p_profile_id uuid, p_password text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,extensions
AS $$
BEGIN
  IF p_password IS NULL OR length(p_password) < 8 OR length(p_password) > 10 THEN
    RAISE EXCEPTION 'كلمة المرور يجب أن تكون من 8 إلى 10 أحرف.';
  END IF;
  UPDATE public.profiles
  SET password_hash = crypt(p_password, gen_salt('bf', 12)), updated_at = now()
  WHERE id = p_profile_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'الموظف غير موجود.'; END IF;
  RETURN jsonb_build_object('success',true);
END $$;

CREATE OR REPLACE FUNCTION public.employee_login(p_username text, p_password text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,extensions
AS $$
DECLARE p public.profiles%ROWTYPE;
BEGIN
  SELECT * INTO p
  FROM public.profiles
  WHERE lower(trim(username)) = lower(trim(p_username))
    AND is_active = true
  LIMIT 1;

  IF p.id IS NULL OR p.password_hash IS NULL OR crypt(p_password, p.password_hash) <> p.password_hash THEN
    RETURN jsonb_build_object('success',false,'message','اسم المستخدم أو كلمة المرور غير صحيحة.');
  END IF;

  RETURN jsonb_build_object(
    'success',true,
    'profile_id',p.id,
    'full_name',p.full_name,
    'role',p.role,
    'username',p.username
  );
END $$;

REVOKE ALL ON FUNCTION public.employee_set_password(uuid,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.employee_login(text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.employee_set_password(uuid,text) TO anon,authenticated;
GRANT EXECUTE ON FUNCTION public.employee_login(text,text) TO anon,authenticated;
