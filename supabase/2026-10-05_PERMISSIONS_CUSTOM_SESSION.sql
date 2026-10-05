-- شاشة صلاحيات الموظفين لنظام تسجيل الدخول المخصص (بدون Supabase Auth)
create table if not exists public.employee_permissions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  screen_key text not null,
  created_at timestamptz not null default now(),
  unique(profile_id, screen_key)
);

create index if not exists idx_employee_permissions_profile on public.employee_permissions(profile_id);

-- التطبيق يستخدم جلسة الموظف المخصصة، لذلك لا تعتمد هذه الشاشة على auth.uid().
alter table public.employee_permissions disable row level security;

notify pgrst, 'reload schema';
