-- =============================================================
-- نظام الدخول النهائي: اسم مستخدم + كلمة مرور فقط
-- بدون Supabase Auth وبدون auth.users في حسابات الموظفين.
-- يتضمن أيضًا إنشاء حساب مسؤول الإرشاد الجاهز للدخول.
-- =============================================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- إزالة أي ارتباط قديم بين profiles و auth.users.
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid='public.profiles'::regclass
      AND confrelid='auth.users'::regclass
  LOOP
    EXECUTE format('ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS %I',r.conname);
  END LOOP;
END $$;

ALTER TABLE public.profiles ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS password_hash text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS national_id text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS employee_number text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gender text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS supervisor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profile_edit_count integer NOT NULL DEFAULT 0;

ALTER TABLE public.counselor_registry DROP COLUMN IF EXISTS auth_user_id CASCADE;
DROP TABLE IF EXISTS public.employee_sessions CASCADE;
DROP TABLE IF EXISTS public.employee_credentials CASCADE;

CREATE UNIQUE INDEX IF NOT EXISTS uq_profiles_username_ci
  ON public.profiles(lower(trim(username)))
  WHERE username IS NOT NULL AND trim(username) <> '';

-- تخزين كلمة المرور كبصمة bcrypt.
CREATE OR REPLACE FUNCTION public.employee_set_password(p_profile_id uuid, p_password text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,extensions
AS $$
BEGIN
  IF p_password IS NULL OR length(p_password) < 8 OR length(p_password) > 10 THEN
    RAISE EXCEPTION 'كلمة المرور يجب أن تكون من 8 إلى 10 أحرف.';
  END IF;

  UPDATE public.profiles
  SET password_hash = crypt(p_password, gen_salt('bf', 12)),
      updated_at = now()
  WHERE id = p_profile_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'الموظف غير موجود.';
  END IF;

  RETURN jsonb_build_object('success',true);
END $$;

-- تسجيل الدخول باسم المستخدم وكلمة المرور فقط.
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

  IF p.id IS NULL OR p.password_hash IS NULL
     OR crypt(p_password, p.password_hash) <> p.password_hash THEN
    RETURN jsonb_build_object(
      'success',false,
      'message','اسم المستخدم أو كلمة المرور غير صحيحة.'
    );
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

-- تجهيز حساب مسؤول الإرشاد.
-- اسم المستخدم: irshad_admin
-- كلمة المرور:  Irshad@1
DO $$
DECLARE v_id uuid;
BEGIN
  SELECT id INTO v_id
  FROM public.profiles
  WHERE lower(trim(coalesce(username,'')))='irshad_admin'
  LIMIT 1;

  IF v_id IS NULL THEN
    SELECT id INTO v_id
    FROM public.profiles
    WHERE role='MINISTRY'
    ORDER BY created_at NULLS FIRST
    LIMIT 1;
  END IF;

  IF v_id IS NULL THEN
    INSERT INTO public.profiles
      (full_name,role,job_title,is_active,username,password_hash)
    VALUES
      ('مسؤول الإرشاد التربوي','MINISTRY','مسؤول الإرشاد',true,
       'irshad_admin',crypt('Irshad@1',gen_salt('bf',12)))
    RETURNING id INTO v_id;
  ELSE
    UPDATE public.profiles
    SET full_name='مسؤول الإرشاد التربوي',
        role='MINISTRY',
        job_title='مسؤول الإرشاد',
        is_active=true,
        username='irshad_admin',
        password_hash=crypt('Irshad@1',gen_salt('bf',12)),
        updated_at=now()
    WHERE id=v_id;
  END IF;
END $$;

-- التطبيق يعمل مباشرة من الجداول بدون RLS/Auth.
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
