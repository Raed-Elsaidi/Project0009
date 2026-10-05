-- إضافة الجنس وفرض قيود بيانات الموظف
-- شغّل هذا الملف مرة واحدة على قاعدة educational-counselor

alter table public.profiles add column if not exists gender text;

alter table public.profiles drop constraint if exists profiles_gender_check;
alter table public.profiles add constraint profiles_gender_check
  check (gender is null or gender in ('MALE','FEMALE'));

alter table public.profiles drop constraint if exists profiles_national_id_9_digits_check;
alter table public.profiles add constraint profiles_national_id_9_digits_check
  check (national_id is null or national_id ~ '^[0-9]{9}$');

alter table public.profiles drop constraint if exists profiles_phone_10_digits_check;
alter table public.profiles add constraint profiles_phone_10_digits_check
  check (phone is null or phone ~ '^[0-9]{10}$');

alter table public.counselor_registry add column if not exists gender text;
alter table public.counselor_registry drop constraint if exists counselor_registry_gender_check;
alter table public.counselor_registry add constraint counselor_registry_gender_check
  check (gender is null or gender in ('MALE','FEMALE'));

alter table public.counselor_registry drop constraint if exists counselor_registry_national_id_9_digits_check;
alter table public.counselor_registry add constraint counselor_registry_national_id_9_digits_check
  check (national_id is null or national_id ~ '^[0-9]{9}$');

alter table public.counselor_registry drop constraint if exists counselor_registry_phone_10_digits_check;
alter table public.counselor_registry add constraint counselor_registry_phone_10_digits_check
  check (phone is null or phone ~ '^[0-9]{10}$');
