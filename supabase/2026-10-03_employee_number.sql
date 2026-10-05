-- إضافة الرقم الوظيفي إلى حسابات الموظفين
-- شغّل هذا الملف مرة واحدة على قاعدة educational-counselor

alter table public.profiles add column if not exists employee_number text;
alter table public.profiles drop constraint if exists profiles_employee_number_required_check;
alter table public.profiles add constraint profiles_employee_number_required_check
  check (employee_number is null or length(trim(employee_number)) between 1 and 50);

create unique index if not exists profiles_employee_number_unique_idx
  on public.profiles (employee_number)
  where employee_number is not null and trim(employee_number) <> '';

alter table public.counselor_registry add column if not exists employee_number text;
alter table public.counselor_registry drop constraint if exists counselor_registry_employee_number_check;
alter table public.counselor_registry add constraint counselor_registry_employee_number_check
  check (employee_number is null or length(trim(employee_number)) between 1 and 50);

create unique index if not exists counselor_registry_employee_number_unique_idx
  on public.counselor_registry (employee_number)
  where employee_number is not null and trim(employee_number) <> '';
