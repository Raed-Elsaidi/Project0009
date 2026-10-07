-- استعادة كلمة مرور الموظف عبر اسم المستخدم + رقم الهوية + رقم الجوال.
-- شغّل هذا الملف مرة واحدة في Supabase SQL Editor قبل استخدام الميزة.
-- يعتمد على الدالة الموجودة في المشروع employee_set_password(profile_id, password).

create or replace function public.employee_verify_identity(
  p_username text,
  p_national_id text,
  p_phone text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile_id uuid;
begin
  if nullif(trim(p_username), '') is null
     or nullif(trim(p_national_id), '') is null
     or nullif(trim(p_phone), '') is null then
    return jsonb_build_object('success', false, 'message', 'البيانات المدخلة غير صحيحة.');
  end if;

  select id into v_profile_id
  from public.profiles
  where lower(trim(username)) = lower(trim(p_username))
    and trim(coalesce(national_id, '')) = trim(p_national_id)
    and trim(coalesce(phone, '')) = trim(p_phone)
    and is_active = true
    and role <> 'PROGRAMMER'
  limit 1;

  if v_profile_id is null then
    return jsonb_build_object('success', false, 'message', 'البيانات المدخلة غير صحيحة.');
  end if;

  return jsonb_build_object('success', true);
end;
$$;

create or replace function public.employee_reset_password(
  p_username text,
  p_national_id text,
  p_phone text,
  p_password text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile_id uuid;
begin
  if p_password is null
     or length(p_password) < 8
     or length(p_password) > 10
     or p_password !~ '[a-z]'
     or p_password !~ '[A-Z]'
     or p_password !~ '[0-9]'
     or p_password !~ '[^A-Za-z0-9]' then
    return jsonb_build_object('success', false, 'message', 'كلمة المرور يجب أن تكون من 8–10 أحرف وتحتوي على حرف كبير وحرف صغير ورقم ورمز.');
  end if;

  select id into v_profile_id
  from public.profiles
  where lower(trim(username)) = lower(trim(p_username))
    and trim(coalesce(national_id, '')) = trim(p_national_id)
    and trim(coalesce(phone, '')) = trim(p_phone)
    and is_active = true
    and role <> 'PROGRAMMER'
  limit 1;

  if v_profile_id is null then
    return jsonb_build_object('success', false, 'message', 'البيانات المدخلة غير صحيحة.');
  end if;

  perform public.employee_set_password(v_profile_id, p_password);
  return jsonb_build_object('success', true);
end;
$$;

revoke all on function public.employee_verify_identity(text,text,text) from public;
revoke all on function public.employee_reset_password(text,text,text,text) from public;
grant execute on function public.employee_verify_identity(text,text,text) to anon, authenticated;
grant execute on function public.employee_reset_password(text,text,text,text) to anon, authenticated;
