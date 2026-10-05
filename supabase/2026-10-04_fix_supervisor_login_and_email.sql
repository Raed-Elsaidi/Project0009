-- ============================================================
-- 2026-10-04: إصلاح تسجيل دخول المشرف التربوي وتوحيد بريد الحسابات
-- ============================================================
-- السبب: اسم المستخدم supervisor_01 كان مربوطًا بحساب Auth قديم
-- بريده head@counselor.local، بينما التطبيق يحول اسم المستخدم
-- إلى supervisor_01@counselor.local.
--
-- شغّل هذا الملف مرة واحدة في Supabase SQL Editor.
-- ============================================================

create extension if not exists pgcrypto;

do $$
declare
  v_uid uuid;
  v_conflict uuid;
begin
  -- نبحث عن حساب المشرف الحالي بأي من البريدين.
  select id into v_uid
  from auth.users
  where lower(email) in ('head@counselor.local','supervisor_01@counselor.local')
  order by case when lower(email)='head@counselor.local' then 0 else 1 end
  limit 1;

  if v_uid is null then
    raise exception 'لم يتم العثور على حساب supervisor_01 / head@counselor.local';
  end if;

  -- نتأكد أن البريد المطلوب غير مستخدم من حساب آخر.
  select id into v_conflict
  from auth.users
  where lower(email)='supervisor_01@counselor.local'
    and id <> v_uid
  limit 1;

  if v_conflict is not null then
    raise exception 'البريد supervisor_01@counselor.local مستخدم من حساب Auth آخر';
  end if;

  update auth.users
  set
    email='supervisor_01@counselor.local',
    aud='authenticated',
    role='authenticated',
    encrypted_password=crypt('Sup@2026', gen_salt('bf', 8)),
    email_confirmed_at=coalesce(email_confirmed_at, now()),
    confirmation_token='',
    recovery_token='',
    email_change='',
    email_change_token_new='',
    phone_change='',
    phone_change_token='',
    banned_until=null,
    deleted_at=null,
    is_sso_user=false,
    is_anonymous=false,
    updated_at=now()
  where id=v_uid;

  update public.profiles
  set username='supervisor_01',
      role='PRINCIPAL',
      is_active=true,
      updated_at=now()
  where id=v_uid;

  raise notice 'تم توحيد حساب supervisor_01 بنجاح: %', v_uid;
end $$;

-- فحص النتيجة
select
  u.id,
  u.email,
  u.aud,
  u.role as auth_role,
  (u.email_confirmed_at is not null) as email_confirmed,
  (u.banned_until is null) as not_banned,
  (u.deleted_at is null) as not_deleted,
  crypt('Sup@2026',u.encrypted_password)=u.encrypted_password as password_is_correct,
  p.username,
  p.role as profile_role,
  p.is_active,
  (p.id is not null) as profile_linked
from auth.users u
left join public.profiles p on p.id=u.id
where lower(u.email)='supervisor_01@counselor.local';

notify pgrst, 'reload schema';
