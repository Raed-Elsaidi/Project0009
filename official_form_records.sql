-- جدول حفظ نماذج اجتماعات المدير والمعلمين وأولياء الأمور
-- يشغّل مرة واحدة في Supabase SQL Editor.
-- وصول التطبيق يتم عبر السيرفر بعد التحقق من Custom JWT، وليس من المتصفح مباشرة.

create extension if not exists pgcrypto;

create table if not exists public.official_form_records (
    id uuid primary key default gen_random_uuid(),
    form_id text not null check (form_id in (
        'meeting-principal','meeting-teacher','meeting-parents',
        'group-session-details','group-session-summary','group-counseling-plan'
    )),
    counselor_id uuid not null,
    school_id uuid,
    school_year_id uuid,
    semester_id uuid,
    form_data jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists official_form_records_owner_idx
    on public.official_form_records (counselor_id);

create index if not exists official_form_records_lookup_idx
    on public.official_form_records
       (form_id, counselor_id, school_year_id, semester_id);

-- لا نفتح صلاحيات anon/authenticated؛ السيرفر وحده يستخدم Service Role
-- بعد التحقق من توقيع Custom JWT وصلاحية الحساب.
alter table public.official_form_records enable row level security;

drop policy if exists "Counselors can read their own official forms"
    on public.official_form_records;
drop policy if exists "Counselors can insert their own official forms"
    on public.official_form_records;
drop policy if exists "Counselors can update their own official forms"
    on public.official_form_records;
drop policy if exists "Counselors can delete their own official forms"
    on public.official_form_records;
