-- تشخيص نهائي لحساب section_head_01
select
  u.id,
  u.email,
  u.aud,
  u.role as auth_role,
  u.email_confirmed_at,
  u.banned_until,
  u.deleted_at,
  p.username,
  p.role as profile_role,
  p.is_active
from auth.users u
left join public.profiles p on p.id=u.id
where lower(u.email)='section_head_01@counselor.local';
