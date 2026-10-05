-- ============================================================
-- إصلاح نهائي لتسجيل الدخول لجميع الموظفين
-- الحسابات:
-- programmer      / Prg@2026
-- admin           / Adm@2026
-- section_head_01 / Sec@2026
-- supervisor_01   / Sup@2026
-- counselor_01    / Cns@2026
--
-- شغّل الملف مرة واحدة في Supabase SQL Editor.
-- ============================================================

create extension if not exists pgcrypto;

do $$
declare
  v_instance uuid;
begin
  -- نأخذ instance_id صحيحاً من أي مستخدم موجود.
  select instance_id into v_instance
  from auth.users
  where instance_id is not null
  limit 1;

  if v_instance is null then
    raise exception 'لم يتم العثور على instance_id في auth.users';
  end if;

  -- PROGRAMMER
  update auth.users set
    instance_id = coalesce(instance_id, v_instance),
    aud = 'authenticated',
    role = 'authenticated',
    encrypted_password = crypt('Prg@2026', gen_salt('bf', 8)),
    email_confirmed_at = coalesce(email_confirmed_at, now()),
    confirmation_token = '',
    recovery_token = '',
    email_change = '',
    email_change_token_new = '',
    phone_change = '',
    phone_change_token = '',
    banned_until = null,
    deleted_at = null,
    is_sso_user = false,
    is_anonymous = false,
    updated_at = now()
  where lower(email)='programmer@counselor.local';

  -- MINISTRY
  update auth.users set
    instance_id = coalesce(instance_id, v_instance),
    aud = 'authenticated',
    role = 'authenticated',
    encrypted_password = crypt('Adm@2026', gen_salt('bf', 8)),
    email_confirmed_at = coalesce(email_confirmed_at, now()),
    confirmation_token = '',
    recovery_token = '',
    email_change = '',
    email_change_token_new = '',
    phone_change = '',
    phone_change_token = '',
    banned_until = null,
    deleted_at = null,
    is_sso_user = false,
    is_anonymous = false,
    updated_at = now()
  where lower(email)='admin@counselor.local';

  -- DIRECTORATE / رئيس القسم
  update auth.users set
    instance_id = coalesce(instance_id, v_instance),
    aud = 'authenticated',
    role = 'authenticated',
    encrypted_password = crypt('Sec@2026', gen_salt('bf', 8)),
    email_confirmed_at = coalesce(email_confirmed_at, now()),
    confirmation_token = '',
    recovery_token = '',
    email_change = '',
    email_change_token_new = '',
    phone_change = '',
    phone_change_token = '',
    banned_until = null,
    deleted_at = null,
    is_sso_user = false,
    is_anonymous = false,
    updated_at = now()
  where lower(email)='section_head_01@counselor.local';

  -- PRINCIPAL / المشرف التربوي
  update auth.users set
    instance_id = coalesce(instance_id, v_instance),
    aud = 'authenticated',
    role = 'authenticated',
    encrypted_password = crypt('Sup@2026', gen_salt('bf', 8)),
    email_confirmed_at = coalesce(email_confirmed_at, now()),
    confirmation_token = '',
    recovery_token = '',
    email_change = '',
    email_change_token_new = '',
    phone_change = '',
    phone_change_token = '',
    banned_until = null,
    deleted_at = null,
    is_sso_user = false,
    is_anonymous = false,
    updated_at = now()
  where lower(email)='head@counselor.local';

  -- COUNSELOR / المرشد التربوي
  update auth.users set
    instance_id = coalesce(instance_id, v_instance),
    aud = 'authenticated',
    role = 'authenticated',
    encrypted_password = crypt('Cns@2026', gen_salt('bf', 8)),
    email_confirmed_at = coalesce(email_confirmed_at, now()),
    confirmation_token = '',
    recovery_token = '',
    email_change = '',
    email_change_token_new = '',
    phone_change = '',
    phone_change_token = '',
    banned_until = null,
    deleted_at = null,
    is_sso_user = false,
    is_anonymous = false,
    updated_at = now()
  where lower(email)='counselor_01@counselor.local';
end $$;

-- فحص شامل للحسابات الخمسة والربط مع profiles.
select
  u.email,
  u.aud,
  u.role as auth_role,
  (u.email_confirmed_at is not null) as email_confirmed,
  u.banned_until,
  u.deleted_at,
  case
    when lower(u.email)='programmer@counselor.local' then crypt('Prg@2026',u.encrypted_password)=u.encrypted_password
    when lower(u.email)='admin@counselor.local' then crypt('Adm@2026',u.encrypted_password)=u.encrypted_password
    when lower(u.email)='section_head_01@counselor.local' then crypt('Sec@2026',u.encrypted_password)=u.encrypted_password
    when lower(u.email)='head@counselor.local' then crypt('Sup@2026',u.encrypted_password)=u.encrypted_password
    when lower(u.email)='counselor_01@counselor.local' then crypt('Cns@2026',u.encrypted_password)=u.encrypted_password
  end as password_is_correct,
  p.username,
  p.role as profile_role,
  p.is_active,
  (p.id is not null) as profile_linked
from auth.users u
left join public.profiles p on p.id=u.id
where lower(u.email) in (
 'programmer@counselor.local',
 'admin@counselor.local',
 'section_head_01@counselor.local',
 'head@counselor.local',
 'counselor_01@counselor.local'
)
order by u.email;

notify pgrst, 'reload schema';
