-- إصلاح حساب رئيس القسم section_head_01 في Supabase Auth
-- شغّل هذا الملف مرة واحدة في SQL Editor ثم جرّب تسجيل الدخول.
create extension if not exists pgcrypto;

do $$
declare
  v_instance uuid;
begin
  select instance_id into v_instance
  from auth.users
  where lower(email) = 'admin@counselor.local'
  limit 1;

  if v_instance is null then
    select instance_id into v_instance
    from auth.users
    where instance_id is not null
    limit 1;
  end if;

  update auth.users
  set
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
  where lower(email) = 'section_head_01@counselor.local';

  if not found then
    raise exception 'لم يتم العثور على section_head_01@counselor.local في auth.users';
  end if;
end $$;

-- تأكيد أن كلمة المرور صحيحة وأن الحساب مفعّل.
select
  u.email,
  u.aud,
  u.role as auth_role,
  u.email_confirmed_at is not null as email_confirmed,
  u.banned_until,
  u.deleted_at,
  crypt('Sec@2026', u.encrypted_password) = u.encrypted_password as password_is_correct,
  p.username,
  p.role as profile_role,
  p.is_active
from auth.users u
left join public.profiles p on p.id = u.id
where lower(u.email) = 'section_head_01@counselor.local';

notify pgrst, 'reload schema';
