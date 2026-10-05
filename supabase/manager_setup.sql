-- إعداد حساب المدير الأول بعد إنشاءه في Supabase Authentication.
-- غيّر القيم بين الأقواس بحسب بياناتك.
-- كلمة المرور تُدار من Supabase Auth ولا تُخزّن هنا.

DO $$
DECLARE
  v_user_id uuid;
  v_directorate_id uuid;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'manager@counselor.local' LIMIT 1;
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'أنشئ أولاً مستخدم Auth بالبريد manager@counselor.local';
  END IF;

  INSERT INTO public.directorates(name, code)
  VALUES ('مديرية التربية والتعليم', 'DIRECTORATE-001')
  ON CONFLICT(code) DO UPDATE SET name=EXCLUDED.name
  RETURNING id INTO v_directorate_id;

  INSERT INTO public.profiles(id, full_name, username, role, directorate_id, job_title, is_active, profile_edit_count)
  VALUES(v_user_id, 'مدير', 'manager', 'DIRECTORATE', v_directorate_id, 'مدير', true, 0)
  ON CONFLICT(id) DO UPDATE SET
    full_name='مدير', username='manager', role='DIRECTORATE', directorate_id=v_directorate_id,
    job_title='مدير', is_active=true;
END $$;
