-- =============================================================
-- إنشاء/تجهيز حساب مسؤول الإرشاد
-- لا يستخدم Supabase Auth أو auth.users.
-- بيانات الدخول بعد تنفيذ الملف:
-- اسم المستخدم: irshad_admin
-- كلمة المرور:  Irshad@1
-- =============================================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS password_hash text;

CREATE UNIQUE INDEX IF NOT EXISTS uq_profiles_username_ci
  ON public.profiles(lower(trim(username)))
  WHERE username IS NOT NULL AND trim(username) <> '';

DO $$
DECLARE
  v_id uuid;
BEGIN
  SELECT id INTO v_id
  FROM public.profiles
  WHERE lower(trim(coalesce(username,''))) = 'irshad_admin'
  LIMIT 1;

  IF v_id IS NULL THEN
    SELECT id INTO v_id
    FROM public.profiles
    WHERE role = 'MINISTRY'
    ORDER BY created_at NULLS FIRST
    LIMIT 1;
  END IF;

  IF v_id IS NULL THEN
    INSERT INTO public.profiles
      (full_name, role, job_title, is_active, username, password_hash)
    VALUES
      ('مسؤول الإرشاد التربوي', 'MINISTRY', 'مسؤول الإرشاد', true,
       'irshad_admin', crypt('Irshad@1', gen_salt('bf', 12)))
    RETURNING id INTO v_id;
  ELSE
    UPDATE public.profiles
    SET full_name = 'مسؤول الإرشاد التربوي',
        role = 'MINISTRY',
        job_title = 'مسؤول الإرشاد',
        is_active = true,
        username = 'irshad_admin',
        password_hash = crypt('Irshad@1', gen_salt('bf', 12)),
        updated_at = now()
    WHERE id = v_id;
  END IF;
END $$;

-- التأكد من إمكانية استدعاء دالة تسجيل الدخول من التطبيق.
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.employee_login(text,text) TO anon, authenticated;
