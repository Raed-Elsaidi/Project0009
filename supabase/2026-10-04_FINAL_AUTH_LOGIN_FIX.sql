-- ============================================================
-- الإصلاح النهائي لمسار تسجيل الدخول وإنشاء الموظفين
-- 1) يمنع استخدام create_employee_account القديم الذي كان ينشئ
--    auth.users مباشرة بدون auth.identities.
-- 2) الحسابات الجديدة يجب أن تمر عبر Edge Function create-employee
--    التي تستخدم Supabase Auth Admin API.
-- 3) يحافظ على resolve_login_email + get_my_profile لتسجيل الدخول
--    باسم المستخدم.
-- ============================================================

-- احذف دوال الإنشاء القديمة حتى لا يعود النظام لمسار SQL القديم.
drop function if exists public.create_employee_account(
  uuid,text,text,text,text,text,text,text,public.app_role,uuid,text
);

drop function if exists public.create_employee_account(
  text,text,text,text,text,text,text,public.app_role,text,uuid,uuid
);

notify pgrst, 'reload schema';

-- تشخيص: كل مستخدم فعال يجب أن تكون له هوية email.
select
  p.username,
  p.full_name,
  p.role,
  p.is_active,
  u.id as auth_user_id,
  u.email,
  (u.email_confirmed_at is not null) as email_confirmed,
  exists (
    select 1
    from auth.identities i
    where i.user_id = u.id
      and i.provider = 'email'
  ) as has_email_identity
from public.profiles p
left join auth.users u on u.id = p.id
order by p.created_at desc;
