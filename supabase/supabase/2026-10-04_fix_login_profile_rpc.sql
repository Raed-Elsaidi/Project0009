-- ============================================================
-- إصلاح تسجيل الدخول: قراءة ملف الموظف عبر SECURITY DEFINER RPC
-- شغّل هذا الملف مرة واحدة في Supabase SQL Editor.
-- لا يغيّر كلمات المرور ولا بيانات الموظفين.
-- ============================================================

create or replace function public.get_my_profile()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select to_jsonb(p)
  from public.profiles p
  where p.id = auth.uid()
  limit 1;
$$;

revoke all on function public.get_my_profile() from public;
grant execute on function public.get_my_profile() to authenticated;

-- اختبار بعد تسجيل الدخول:
-- select public.get_my_profile();

notify pgrst, 'reload schema';
