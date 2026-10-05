-- Custom employee authentication: replaces Supabase Auth for application login.
create extension if not exists pgcrypto;

create table if not exists public.employee_credentials (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  username text not null unique,
  password_hash text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.employee_sessions (
  session_token uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 days'),
  revoked_at timestamptz
);
create index if not exists employee_sessions_profile_idx on public.employee_sessions(profile_id);

alter table public.employee_credentials disable row level security;
alter table public.employee_sessions disable row level security;

do $$ begin
  create unique index employee_credentials_username_lower_idx on public.employee_credentials(lower(username));
exception when duplicate_table then null; end $$;

create or replace function public.custom_create_employee_credential(p_profile_id uuid,p_username text,p_password text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_username text:=lower(trim(p_username));
begin
 if length(v_username)<3 then raise exception 'اسم المستخدم غير صالح'; end if;
 if p_password is null or length(p_password)<8 then raise exception 'كلمة المرور غير صالحة'; end if;
 insert into public.employee_credentials(profile_id,username,password_hash)
 values(p_profile_id,v_username,crypt(p_password,gen_salt('bf',12)))
 on conflict(profile_id) do update set username=excluded.username,password_hash=excluded.password_hash,updated_at=now();
 return jsonb_build_object('success',true);
end $$;

create or replace function public.custom_employee_login(p_username text,p_password text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare c public.employee_credentials%rowtype; p public.profiles%rowtype; t uuid; exp timestamptz;
begin
 select * into c from public.employee_credentials where lower(username)=lower(trim(p_username));
 if c.profile_id is null or c.password_hash <> crypt(p_password,c.password_hash) then
   return jsonb_build_object('success',false,'message','اسم المستخدم أو كلمة المرور غير صحيحة.');
 end if;
 select * into p from public.profiles where id=c.profile_id and is_active=true;
 if p.id is null then return jsonb_build_object('success',false,'message','هذا الحساب غير نشط.'); end if;
 update public.employee_sessions set revoked_at=now() where profile_id=p.id and revoked_at is null;
 insert into public.employee_sessions(profile_id) values(p.id) returning session_token,expires_at into t,exp;
 return jsonb_build_object('success',true,'session_token',t,'expires_at',exp,'profile_id',p.id,'full_name',p.full_name,'role',p.role);
end $$;

create or replace function public.custom_validate_employee_session(p_session_token uuid)
returns jsonb language plpgsql security definer set search_path=public as $$
declare s public.employee_sessions%rowtype; p public.profiles%rowtype;
begin
 select * into s from public.employee_sessions where session_token=p_session_token and revoked_at is null and expires_at>now();
 if s.session_token is null then return jsonb_build_object('valid',false); end if;
 select * into p from public.profiles where id=s.profile_id and is_active=true;
 if p.id is null then return jsonb_build_object('valid',false); end if;
 return jsonb_build_object('valid',true,'profile_id',p.id,'role',p.role);
end $$;

create or replace function public.custom_employee_logout(p_session_token uuid)
returns jsonb language plpgsql security definer set search_path=public as $$
begin update public.employee_sessions set revoked_at=now() where session_token=p_session_token; return jsonb_build_object('success',true); end $$;

revoke all on function public.custom_create_employee_credential(uuid,text,text) from public;
revoke all on function public.custom_employee_login(text,text) from public;
revoke all on function public.custom_validate_employee_session(uuid) from public;
revoke all on function public.custom_employee_logout(uuid) from public;
grant execute on function public.custom_create_employee_credential(uuid,text,text) to anon,authenticated;
grant execute on function public.custom_employee_login(text,text) to anon,authenticated;
grant execute on function public.custom_validate_employee_session(uuid) to anon,authenticated;
grant execute on function public.custom_employee_logout(uuid) to anon,authenticated;

-- Optional migration for existing employees: run once per existing employee with a temporary password.
-- select public.custom_create_employee_credential('PROFILE_UUID','username','TemporaryPassword!1');
