-- 2026-10-04 Employee view/edit/delete actions
-- UUID-based profiles database

create or replace function public.update_employee_profile(
  p_employee_id uuid,
  p_full_name text,
  p_national_id text,
  p_employee_number text,
  p_phone text,
  p_gender text,
  p_school_id uuid default null
)
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
    raise exception 'ليس لديك صلاحية تعديل الموظفين.';
  end if;
  select * into target from public.profiles where id = p_employee_id;
  if target.id is null then raise exception 'الموظف غير موجود.'; end if;
  if target.role = 'PROGRAMMER' then raise exception 'لا يمكن تعديل حساب المبرمج.'; end if;
  if actor.role='DIRECTORATE' and target.directorate_id is distinct from actor.directorate_id then
    raise exception 'لا يمكنك تعديل موظف خارج مديريتك.';
  end if;
  if p_full_name is null or btrim(p_full_name)='' then raise exception 'الاسم الكامل مطلوب.'; end if;
  if p_national_id !~ '^[0-9]{9}$' then raise exception 'رقم الهوية يجب أن يتكون من 9 أرقام.'; end if;
  if p_phone !~ '^[0-9]{10}$' then raise exception 'رقم الهاتف يجب أن يتكون من 10 أرقام.'; end if;
  if p_employee_number is null or btrim(p_employee_number)='' then raise exception 'الرقم الوظيفي مطلوب.'; end if;
  update public.profiles
  set full_name=btrim(p_full_name),
      national_id=btrim(p_national_id),
      employee_number=btrim(p_employee_number),
      phone=btrim(p_phone),
      gender=p_gender,
      school_id=case when target.role='COUNSELOR' then p_school_id else target.school_id end
  where id=p_employee_id
  returning * into target;
  return jsonb_build_object('success',true,'employee_id',target.id);
end;
$$;

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

  -- حذف الموظف من الحسابات النشطة وتعطيل دخوله مع الحفاظ على السجلات
  -- المرتبطة به (الطلاب/الحالات/الرسائل/السجل الإداري) حتى لا تفشل العملية
  -- بسبب قيود العلاقات المرجعية في قاعدة البيانات.
  update public.profiles
  set is_active=false
  where id=p_employee_id;

  return jsonb_build_object('success',true,'employee_id',p_employee_id,'deleted',true);
end;
$$;

revoke all on function public.update_employee_profile(uuid,text,text,text,text,text,uuid) from public;
grant execute on function public.update_employee_profile(uuid,text,text,text,text,text,uuid) to authenticated;
revoke all on function public.delete_employee_account(uuid) from public;
grant execute on function public.delete_employee_account(uuid) to authenticated;
