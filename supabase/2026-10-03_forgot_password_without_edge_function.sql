-- ============================================================
-- فقدان كلمة المرور للموظفين - بدون Edge Function
-- التحقق: اسم المستخدم + رقم الهوية + رقم الهاتف
-- ثم توليد كلمة مرور جديدة 8-10 أحرف وفق السياسة.
--
-- ملاحظة أمنية:
-- Supabase Auth يعتمد على bcrypt. نستخدم bcrypt cost=8
-- (gen_salt('bf', 8)) بدل "تشفير كلمة المرور 8 مرات".
-- تكرار التجزئة 8 مرات سيمنع Supabase Auth من التحقق من كلمة المرور.
-- ============================================================

create extension if not exists pgcrypto;

create table if not exists public.password_change_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  created_at timestamptz not null default now()
);

create or replace function public.reset_password_public(
  p_username text,
  p_national_id text,
  p_phone text
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_user_id uuid;
  v_password text := '';
  v_upper text := 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  v_lower text := 'abcdefghijkmnopqrstuvwxyz';
  v_digits text := '23456789';
  v_symbols text := '!@#$%&*';
  v_all text := 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*';
  v_chars text[];
  v_i int;
  v_pos int;
begin
  if trim(coalesce(p_username,'')) = ''
     or trim(coalesce(p_national_id,'')) = ''
     or trim(coalesce(p_phone,'')) = '' then
    raise exception 'أدخل اسم المستخدم ورقم الهوية ورقم الهاتف المسجل في النظام';
  end if;

  if trim(p_national_id) !~ '^[0-9]{9}$' then
    raise exception 'رقم الهوية يجب أن يتكون من 9 أرقام فقط';
  end if;

  if trim(p_phone) !~ '^[0-9]{10}$' then
    raise exception 'رقم الهاتف يجب أن يتكون من 10 أرقام فقط';
  end if;

  select p.id
    into v_user_id
  from public.profiles p
  where lower(trim(p.username)) = lower(trim(p_username))
    and trim(coalesce(p.national_id,'')) = trim(p_national_id)
    and trim(coalesce(p.phone,'')) = trim(p_phone)
    and coalesce(p.is_active,true) = true
  limit 1;

  if v_user_id is null then
    raise exception 'البيانات المدخلة لا تطابق البيانات المسجلة في النظام';
  end if;

  -- Four mandatory character classes.
  v_chars := array[
    substr(v_upper, 1 + floor(random()*length(v_upper))::int, 1),
    substr(v_lower, 1 + floor(random()*length(v_lower))::int, 1),
    substr(v_digits, 1 + floor(random()*length(v_digits))::int, 1),
    substr(v_symbols, 1 + floor(random()*length(v_symbols))::int, 1)
  ];

  while array_length(v_chars,1) < 10 loop
    v_chars := array_append(
      v_chars,
      substr(v_all, 1 + floor(random()*length(v_all))::int, 1)
    );
  end loop;

  -- Shuffle.
  for v_i in reverse 10..2 loop
    v_pos := 1 + floor(random()*v_i)::int;
    declare
      v_tmp text;
    begin
      v_tmp := v_chars[v_i];
      v_chars[v_i] := v_chars[v_pos];
      v_chars[v_pos] := v_tmp;
    end;
  end loop;

  v_password := array_to_string(v_chars,'');

  -- Supabase Auth-compatible bcrypt hash, cost 8.
  update auth.users
     set encrypted_password = crypt(v_password, gen_salt('bf', 8)),
         updated_at = now(),
         recovery_token = ''
   where id = v_user_id;

  if not found then
    raise exception 'تعذر تحديث كلمة المرور';
  end if;

  insert into public.password_change_logs(user_id) values (v_user_id);

  return jsonb_build_object(
    'ok', true,
    'password', v_password
  );
end;
$$;

revoke all on function public.reset_password_public(text,text,text) from public;
grant execute on function public.reset_password_public(text,text,text) to anon, authenticated;

-- لا نسمح بقراءة سجل تغيير كلمات المرور من الواجهة العامة.
alter table public.password_change_logs enable row level security;
revoke all on public.password_change_logs from anon, authenticated;
