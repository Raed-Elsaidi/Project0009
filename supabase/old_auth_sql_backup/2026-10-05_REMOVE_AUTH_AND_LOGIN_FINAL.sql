-- =============================================================
-- NO SUPABASE AUTH + USERNAME/PASSWORD LOGIN
-- =============================================================
-- لا يستخدم التطبيق auth.users ولا Supabase Auth.
-- حسابات الموظفين موجودة في public.profiles، وكلمة المرور تحفظ كـ bcrypt hash.
-- شغّل بعده: 2026-10-05_USERNAME_PASSWORD_LOGIN.sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT conname FROM pg_constraint
    WHERE conrelid='public.profiles'::regclass AND confrelid='auth.users'::regclass
  LOOP EXECUTE format('ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS %I',r.conname); END LOOP;
END $$;

ALTER TABLE public.profiles ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS password_hash text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS national_id text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS employee_number text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gender text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS supervisor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profile_edit_count integer NOT NULL DEFAULT 0;
CREATE UNIQUE INDEX IF NOT EXISTS uq_profiles_username_ci ON public.profiles(lower(trim(username))) WHERE username IS NOT NULL AND trim(username)<>'';

ALTER TABLE public.counselor_registry DROP COLUMN IF EXISTS auth_user_id CASCADE;
DROP TABLE IF EXISTS public.employee_sessions CASCADE;
DROP TABLE IF EXISTS public.employee_credentials CASCADE;

DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT tablename FROM pg_tables WHERE schemaname='public' LOOP
    EXECUTE format('ALTER TABLE public.%I DISABLE ROW LEVEL SECURITY',r.tablename);
    EXECUTE format('GRANT SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER ON TABLE public.%I TO anon',r.tablename);
    EXECUTE format('GRANT SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER ON TABLE public.%I TO authenticated',r.tablename);
  END LOOP;
END $$;
GRANT USAGE ON SCHEMA public TO anon,authenticated;
GRANT USAGE,SELECT,UPDATE ON ALL SEQUENCES IN SCHEMA public TO anon,authenticated;

-- دوال الدخول موجودة في الملف التالي لتسهيل تشغيلها أو إعادة تشغيلها:
-- 2026-10-05_USERNAME_PASSWORD_LOGIN.sql
