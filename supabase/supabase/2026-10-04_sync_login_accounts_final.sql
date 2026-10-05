-- ============================================================
-- مزامنة حسابات تسجيل الدخول للتجربة
-- شغّل هذا الملف مرة واحدة في Supabase SQL Editor.
-- ============================================================
create extension if not exists pgcrypto;

update auth.users
set
  encrypted_password = crypt('Prg@2026', gen_salt('bf', 8)),
  email_confirmed_at = coalesce(email_confirmed_at, now()),
  confirmation_token = '',
  recovery_token = '',
  updated_at = now()
where lower(email)='programmer@counselor.local';

update auth.users
set
  encrypted_password = crypt('Adm@2026', gen_salt('bf', 8)),
  email_confirmed_at = coalesce(email_confirmed_at, now()),
  confirmation_token = '',
  recovery_token = '',
  updated_at = now()
where lower(email)='admin@counselor.local';

update auth.users
set
  encrypted_password = crypt('Sec@2026', gen_salt('bf', 8)),
  email_confirmed_at = coalesce(email_confirmed_at, now()),
  confirmation_token = '',
  recovery_token = '',
  updated_at = now()
where lower(email)='section_head_01@counselor.local';

update auth.users
set
  encrypted_password = crypt('Sup@2026', gen_salt('bf', 8)),
  email_confirmed_at = coalesce(email_confirmed_at, now()),
  confirmation_token = '',
  recovery_token = '',
  updated_at = now()
where lower(email)='head@counselor.local';

update auth.users
set
  encrypted_password = crypt('Cns@2026', gen_salt('bf', 8)),
  email_confirmed_at = coalesce(email_confirmed_at, now()),
  confirmation_token = '',
  recovery_token = '',
  updated_at = now()
where lower(email)='counselor_01@counselor.local';

-- فحص النتيجة:
select email, email_confirmed_at, last_sign_in_at
from auth.users
where lower(email) in (
 'programmer@counselor.local',
 'admin@counselor.local',
 'section_head_01@counselor.local',
 'head@counselor.local',
 'counselor_01@counselor.local'
)
order by email;
