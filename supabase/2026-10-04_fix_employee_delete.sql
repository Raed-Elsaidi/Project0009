-- إصلاح حذف الموظف: تعطيل الحساب وإخفاؤه من بيانات الموظفين مع الحفاظ على السجلات المرتبطة
-- شغّل هذا الملف مرة واحدة في Supabase SQL Editor.

create or replace function public.delete_employee_account(p_employee_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  actor public.profiles%rowtype;
  target public.profiles%rowtype;
begin
  select * into actor from public.profiles where id = auth.uid();
  if actor.id is null then raise exception 'انتهت جلسة الدخول.'; end if;
  if actor.role not in ('MINISTRY','DIRECTORATE') then
    raise exception 'ليس لديك صلاحية حذف الموظفين.';
  end if;
  select * into target from public.profiles where id=p_employee_id;
  if target.id is null then raise exception 'الموظف غير موجود.'; end if;
  if target.role='PROGRAMMER' then raise exception 'لا يمكن حذف حساب المبرمج.'; end if;
  if actor.role='DIRECTORATE' and target.directorate_id is distinct from actor.directorate_id then
    raise exception 'لا يمكنك حذف موظف خارج مديريتك.';
  end if;

  update public.profiles set is_active=false where id=p_employee_id;
  return jsonb_build_object('success',true,'employee_id',p_employee_id,'deleted',true);
end;
$$;

revoke all on function public.delete_employee_account(uuid) from public;
grant execute on function public.delete_employee_account(uuid) to authenticated;
