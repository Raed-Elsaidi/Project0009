-- صلاحيات الشاشات لكل موظف
create table if not exists public.employee_permissions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  screen_key text not null,
  created_at timestamptz not null default now(),
  unique(profile_id, screen_key)
);
create index if not exists idx_employee_permissions_profile on public.employee_permissions(profile_id);

alter table public.employee_permissions enable row level security;

drop policy if exists employee_permissions_select on public.employee_permissions;
drop policy if exists employee_permissions_insert on public.employee_permissions;
drop policy if exists employee_permissions_delete on public.employee_permissions;

create policy employee_permissions_select on public.employee_permissions
for select using (
  profile_id = auth.uid()
  or public.my_role()::text in ('PROGRAMMER','MINISTRY')
  or (public.my_role()::text='DIRECTORATE' and exists(select 1 from public.profiles p where p.id=employee_permissions.profile_id and p.directorate_id=public.my_directorate_id()))
);

create policy employee_permissions_insert on public.employee_permissions
for insert with check (
  public.my_role()::text in ('PROGRAMMER','MINISTRY')
  or (public.my_role()::text='DIRECTORATE' and exists(select 1 from public.profiles p where p.id=employee_permissions.profile_id and p.directorate_id=public.my_directorate_id()))
);

create policy employee_permissions_delete on public.employee_permissions
for delete using (
  public.my_role()::text in ('PROGRAMMER','MINISTRY')
  or (public.my_role()::text='DIRECTORATE' and exists(select 1 from public.profiles p where p.id=employee_permissions.profile_id and p.directorate_id=public.my_directorate_id()))
);

-- تحقق إضافي من بيانات الموظفين: الهوية 9 أرقام والهاتف 10 أرقام عند وجودهما.
do $$ begin
  if not exists(select 1 from pg_constraint where conname='profiles_national_id_9_digits') then
    alter table public.profiles add constraint profiles_national_id_9_digits check (national_id is null or national_id ~ '^[0-9]{9}$');
  end if;
  if not exists(select 1 from pg_constraint where conname='profiles_phone_10_digits') then
    alter table public.profiles add constraint profiles_phone_10_digits check (phone is null or phone ~ '^[0-9]{10}$');
  end if;
end $$;

notify pgrst, 'reload schema';
