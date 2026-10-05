-- ============================================================
-- إنشاء الموظفين بدون Edge Function
-- التسلسل:
-- رئيس القسم (DIRECTORATE) هو الذي ينشئ:
--   1) المشرف التربوي PRINCIPAL
--   2) المرشد التربوي COUNSELOR
-- مسؤول الإرشاد/البرمجيات لا يستخدمان شاشة إضافة الموظفين العادية.
-- ============================================================

create extension if not exists pgcrypto;

create or replace function public.create_employee_account(
  p_full_name text,
  p_username text,
  p_password text,
  p_national_id text default null,
  p_employee_number text default null,
  p_phone text default null,
  p_gender text default null,
  p_role public.app_role default 'COUNSELOR',
  p_job_title text default null,
  p_directorate_id uuid default null,
  p_school_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_caller_role public.app_role;
  v_caller_directorate uuid;
  v_username text := lower(trim(coalesce(p_username,'')));
  v_email text;
  v_user_id uuid := gen_random_uuid();
  v_instance_id uuid;
  v_job_title text;
begin
  select role, directorate_id
    into v_caller_role, v_caller_directorate
  from public.profiles
  where id = auth.uid();

  if v_caller_role <> 'DIRECTORATE' then
    raise exception 'إضافة المشرفين والمرشدين متاحة لرئيس القسم فقط';
  end if;

  if p_role not in ('PRINCIPAL','COUNSELOR') then
    raise exception 'رئيس القسم يمكنه إضافة المشرف التربوي والمرشد التربوي فقط';
  end if;

  if p_directorate_id is null then
    p_directorate_id := v_caller_directorate;
  end if;

  if p_directorate_id is distinct from v_caller_directorate then
    raise exception 'لا يمكنك إنشاء موظف خارج مديريتك';
  end if;

  if v_username !~ '^[A-Za-z0-9._-]{3,40}$' then
    raise exception 'اسم المستخدم غير صالح';
  end if;

  if length(coalesce(p_password,'')) < 8
     or length(p_password) > 10
     or p_password !~ '[a-z]'
     or p_password !~ '[A-Z]'
     or p_password !~ '[0-9]'
     or p_password !~ '[^A-Za-z0-9]' then
    raise exception 'كلمة المرور يجب أن تكون من 8 إلى 10 أحرف وتحتوي حرفًا كبيرًا وصغيرًا ورقمًا ورمزًا';
  end if;

  if p_national_id is null or trim(p_national_id) !~ '^[0-9]{9}$' then
    raise exception 'رقم الهوية يجب أن يتكون من 9 أرقام فقط';
  end if;

  if p_phone is null or trim(p_phone) !~ '^[0-9]{10}$' then
    raise exception 'رقم الهاتف يجب أن يتكون من 10 أرقام فقط';
  end if;

  if p_employee_number is null or length(trim(p_employee_number)) = 0 then
    raise exception 'الرقم الوظيفي مطلوب';
  end if;

  if exists (select 1 from public.profiles where lower(trim(username)) = v_username) then
    raise exception 'اسم المستخدم مستخدم مسبقًا';
  end if;

  if exists (
    select 1 from public.profiles
    where employee_number = trim(p_employee_number)
  ) then
    raise exception 'الرقم الوظيفي مستخدم مسبقًا';
  end if;

  v_email := v_username || '@counselor.local';

  if exists (select 1 from auth.users where lower(email) = lower(v_email)) then
    raise exception 'حساب المستخدم موجود مسبقًا';
  end if;

  if p_school_id is not null and not exists (
    select 1 from public.schools
    where id = p_school_id and directorate_id = p_directorate_id
  ) then
    raise exception 'المدرسة لا تتبع مديريتك';
  end if;

  v_job_title := case p_role
    when 'PRINCIPAL' then 'المشرف التربوي'
    when 'COUNSELOR' then 'المرشد التربوي'
    else null
  end;

  select instance_id into v_instance_id from auth.users limit 1;
  if v_instance_id is null then
    raise exception 'تعذر تحديد إعدادات Supabase Auth';
  end if;

  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, confirmation_token, recovery_token,
    email_change_token_new, email_change, is_sso_user, is_anonymous
  ) values (
    v_user_id, v_instance_id, 'authenticated', 'authenticated',
    v_email, crypt(p_password, gen_salt('bf', 8)),
    now(),
    jsonb_build_object('provider','email','providers',jsonb_build_array('email')),
    jsonb_build_object('username',v_username,'full_name',trim(p_full_name),'role',p_role::text),
    now(), now(), '', '', '', '', false, false
  );

  insert into public.profiles (
    id, full_name, username, national_id, employee_number, phone,
    gender, role, directorate_id, school_id, job_title, is_active
  ) values (
    v_user_id, trim(p_full_name), v_username,
    trim(p_national_id), trim(p_employee_number), trim(p_phone),
    nullif(trim(p_gender),''), p_role, p_directorate_id, p_school_id,
    v_job_title, true
  );

  return jsonb_build_object(
    'user_id',v_user_id,'id',v_user_id,'username',v_username,
    'email',v_email,'role',p_role,'job_title',v_job_title
  );
end;
$$;

revoke all on function public.create_employee_account(text,text,text,text,text,text,text,public.app_role,text,uuid,uuid) from public;
grant execute on function public.create_employee_account(text,text,text,text,text,text,text,public.app_role,text,uuid,uuid) to authenticated;
