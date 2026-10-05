-- =============================================================
-- إزالة المصادقة من نظام الإرشاد التربوي
-- =============================================================
-- هذا الملف يحول النظام إلى وضع تشغيل مباشر بدون تسجيل دخول.
-- الحسابات لم تعد Auth accounts؛ الموظفون يصبحون بيانات في profiles.
-- =============================================================

-- 1) فك ارتباط profiles عن auth.users حتى يمكن إنشاء بيانات موظفين
--    بدون إنشاء حساب Supabase Auth.
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.profiles'::regclass
      AND confrelid = 'auth.users'::regclass
  LOOP
    EXECUTE format('ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS %I', r.conname);
  END LOOP;
END $$;

-- 2) الحقول المطلوبة لبيانات الموظف.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS national_id text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS employee_number text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gender text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS supervisor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profile_edit_count integer NOT NULL DEFAULT 0;

CREATE UNIQUE INDEX IF NOT EXISTS uq_profiles_username_ci
  ON public.profiles (lower(trim(username)))
  WHERE username IS NOT NULL;

-- 3) النظام الآن يعمل كواجهة داخلية مباشرة. لا توجد سياسات RLS تعتمد على auth.uid().
--    تحذير: هذا يعني أن بيانات قاعدة البيانات ستكون قابلة للوصول عبر anon key.
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT tablename FROM pg_tables WHERE schemaname='public' LOOP
    EXECUTE format('ALTER TABLE public.%I DISABLE ROW LEVEL SECURITY', r.tablename);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON TABLE public.%I TO anon', r.tablename);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON TABLE public.%I TO authenticated', r.tablename);
  END LOOP;
END $$;

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- 4) السماح بتخزين مرفقات المراسلات بدون جلسة Auth.
-- إذا كان bucket غير موجود فلن يؤثر هذا الجزء على بقية الترحيل.
DO $outer$
BEGIN
  IF EXISTS (SELECT 1 FROM storage.buckets WHERE id='message-attachments') THEN
    EXECUTE 'DROP POLICY IF EXISTS "anon_message_attachments_all" ON storage.objects';
    EXECUTE $policy$CREATE POLICY "anon_message_attachments_all" ON storage.objects
      FOR ALL TO anon
      USING (bucket_id = 'message-attachments')
      WITH CHECK (bucket_id = 'message-attachments')$policy$;
  END IF;
EXCEPTION WHEN undefined_table THEN NULL;
END $outer$;

-- =============================================================
-- بعد تشغيل هذا الملف: افتح الموقع مباشرة من /administration.
-- =============================================================
