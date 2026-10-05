
-- ============================================================
-- نظام المرشد التربوي - Supabase / PostgreSQL
-- Basis: ملفات المرشدين التربويين 2024
-- ============================================================
-- ملاحظات:
-- 1) المصادقة تتم بواسطة Supabase Auth (auth.users).
-- 2) profiles هو الملف الوظيفي للمستخدم.
-- 3) عزل بيانات المرشدين يتم بواسطة Row Level Security (RLS).
-- 4) لا يتم تخزين كلمات المرور في جداول التطبيق؛ Supabase Auth يديرها.
-- ============================================================

create extension if not exists pgcrypto;

-- =========================
-- ENUMS
-- =========================

do $$ begin
  create type public.app_role as enum (
    'SUPER_ADMIN',
    'MINISTRY',
    'DIRECTORATE',
    'PRINCIPAL',
    'COUNSELOR'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.semester_type as enum ('FIRST', 'SECOND');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.program_status as enum ('PLANNED', 'COMPLETED', 'NOT_COMPLETED', 'CANCELLED');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.case_status as enum ('OPEN', 'IN_PROGRESS', 'FOLLOW_UP', 'CLOSED');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.hot_case_status as enum (
    'DRAFT',
    'COUNSELOR_APPROVED',
    'PRINCIPAL_REVIEW',
    'SENT_TO_DIRECTORATE',
    'DIRECTORATE_REVIEW',
    'SENT_TO_MINISTRY',
    'FOLLOW_UP',
    'CLOSED'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.activity_type as enum (
    'VISIT',
    'NEWSLETTER',
    'RADIO',
    'SEMINAR',
    'LECTURE',
    'WORKSHOP',
    'WALL_MAGAZINE',
    'OTHER'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.consultation_type as enum (
    'EDUCATIONAL',
    'VOCATIONAL',
    'PSYCHOLOGICAL',
    'OTHER'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.note_priority as enum ('LOW', 'NORMAL', 'HIGH');
exception when duplicate_object then null;
end $$;

-- =========================
-- ORGANIZATION
-- =========================

create table if not exists public.directorates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.schools (
  id uuid primary key default gen_random_uuid(),
  directorate_id uuid not null references public.directorates(id) on delete restrict,
  name text not null,
  code text,
  address text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (directorate_id, name)
);

create table if not exists public.school_years (
  id uuid primary key default gen_random_uuid(),
  name text not null, -- مثال: 2026/2027
  start_date date,
  end_date date,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  unique(name)
);

create table if not exists public.semesters (
  id uuid primary key default gen_random_uuid(),
  school_year_id uuid not null references public.school_years(id) on delete cascade,
  type public.semester_type not null,
  name text not null,
  start_date date,
  end_date date,
  created_at timestamptz not null default now(),
  unique(school_year_id, type)
);

create table if not exists public.grades (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sort_order integer not null default 0,
  unique(name)
);

create table if not exists public.sections (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  grade_id uuid not null references public.grades(id) on delete restrict,
  name text not null,
  created_at timestamptz not null default now(),
  unique(school_id, grade_id, name)
);

-- =========================
-- USERS / ROLES
-- =========================

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  phone text,
  role public.app_role not null default 'COUNSELOR',
  directorate_id uuid references public.directorates(id) on delete restrict,
  school_id uuid references public.schools(id) on delete restrict,
  job_title text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- A user can be associated with more than one school if needed.
create table if not exists public.user_school_assignments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  school_id uuid not null references public.schools(id) on delete cascade,
  is_primary boolean not null default false,
  start_date date,
  end_date date,
  created_at timestamptz not null default now(),
  unique(user_id, school_id)
);

-- =========================
-- STUDENTS
-- =========================

create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete restrict,
  student_code text not null,
  full_name text not null,
  national_id text,
  gender text,
  date_of_birth date,
  residence_area text,
  grade_id uuid references public.grades(id) on delete restrict,
  section_id uuid references public.sections(id) on delete set null,
  enrollment_date date,
  is_active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(school_id, student_code)
);

-- This is the key table for: every counselor has his/her own students.
create table if not exists public.student_counselors (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  counselor_id uuid not null references public.profiles(id) on delete cascade,
  is_primary boolean not null default true,
  assigned_at timestamptz not null default now(),
  ended_at timestamptz,
  unique(student_id, counselor_id)
);

create table if not exists public.student_family (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null unique references public.students(id) on delete cascade,
  parents_marital_status text,
  family_size integer,
  siblings_count integer,
  birth_order integer,
  living_with text,
  economic_status text,
  father_job text,
  mother_job text,
  family_health text,
  student_health text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========================
-- CASE STUDY
-- =========================

create table if not exists public.case_studies (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  counselor_id uuid not null references public.profiles(id) on delete restrict,
  school_year_id uuid references public.school_years(id) on delete set null,
  referral_date date,
  referral_source text,
  reason_for_referral text,
  problem_onset text,
  problem_evolution text,
  sessions_count integer not null default 0,
  student_view text,
  parent_view text,
  principal_view text,
  teacher_view text,
  initial_diagnosis text,
  professional_description text,
  intervention_plan text,
  student_willingness text,
  support_resources text,
  follow_up_mechanism text,
  counselor_notes text,
  status public.case_status not null default 'OPEN',
  counselor_signed_at timestamptz,
  principal_signed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.case_sessions (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.case_studies(id) on delete cascade,
  counselor_id uuid not null references public.profiles(id) on delete restrict,
  session_date date not null,
  session_number integer,
  topic text,
  notes text,
  intervention text,
  result text,
  next_follow_up_date date,
  created_at timestamptz not null default now()
);

create table if not exists public.case_followups (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.case_studies(id) on delete cascade,
  counselor_id uuid not null references public.profiles(id) on delete restrict,
  follow_up_date date not null default current_date,
  action_taken text,
  result text,
  notes text,
  next_follow_up_date date,
  created_at timestamptz not null default now()
);

-- =========================
-- INTERVIEWS / CONSULTATIONS
-- =========================

create table if not exists public.interviews (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.students(id) on delete set null,
  counselor_id uuid not null references public.profiles(id) on delete restrict,
  school_id uuid not null references public.schools(id) on delete restrict,
  school_year_id uuid references public.school_years(id) on delete set null,
  semester_id uuid references public.semesters(id) on delete set null,
  interview_date date not null,
  grade_id uuid references public.grades(id) on delete set null,
  section_id uuid references public.sections(id) on delete set null,
  topic text,
  notes text,
  result text,
  created_at timestamptz not null default now()
);

create table if not exists public.consultations (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.students(id) on delete set null,
  counselor_id uuid not null references public.profiles(id) on delete restrict,
  school_id uuid not null references public.schools(id) on delete restrict,
  school_year_id uuid references public.school_years(id) on delete set null,
  semester_id uuid references public.semesters(id) on delete set null,
  consultation_date date not null,
  grade_id uuid references public.grades(id) on delete set null,
  section_id uuid references public.sections(id) on delete set null,
  type public.consultation_type not null,
  topic text,
  notes text,
  result text,
  created_at timestamptz not null default now()
);

-- =========================
-- ABSENCE / LATENESS / DROPOUT
-- =========================

create table if not exists public.absence_records (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  counselor_id uuid not null references public.profiles(id) on delete restrict,
  school_year_id uuid references public.school_years(id) on delete set null,
  semester_id uuid references public.semesters(id) on delete set null,
  month integer check (month between 1 and 12),
  absence_count integer not null default 0,
  reason text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.absence_followups (
  id uuid primary key default gen_random_uuid(),
  absence_record_id uuid not null references public.absence_records(id) on delete cascade,
  counselor_id uuid not null references public.profiles(id) on delete restrict,
  follow_up_date date not null default current_date,
  reasons text,
  actions text,
  result text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.lateness_records (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  counselor_id uuid not null references public.profiles(id) on delete restrict,
  school_year_id uuid references public.school_years(id) on delete set null,
  semester_id uuid references public.semesters(id) on delete set null,
  month integer check (month between 1 and 12),
  lateness_count integer not null default 0,
  reason text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.lateness_followups (
  id uuid primary key default gen_random_uuid(),
  lateness_record_id uuid not null references public.lateness_records(id) on delete cascade,
  counselor_id uuid not null references public.profiles(id) on delete restrict,
  follow_up_date date not null default current_date,
  reasons text,
  actions text,
  result text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.dropout_cases (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  counselor_id uuid not null references public.profiles(id) on delete restrict,
  school_year_id uuid references public.school_years(id) on delete set null,
  semester_id uuid references public.semesters(id) on delete set null,
  dropout_date date,
  reasons text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.dropout_followups (
  id uuid primary key default gen_random_uuid(),
  dropout_case_id uuid not null references public.dropout_cases(id) on delete cascade,
  counselor_id uuid not null references public.profiles(id) on delete restrict,
  follow_up_date date not null default current_date,
  student_view text,
  parent_view text,
  counselor_view text,
  actions text,
  result text,
  notes text,
  created_at timestamptz not null default now()
);

-- =========================
-- HOT CASES
-- =========================

create table if not exists public.hot_case_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text
);

create table if not exists public.hot_cases (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  counselor_id uuid not null references public.profiles(id) on delete restrict,
  category_id uuid references public.hot_case_categories(id) on delete set null,
  school_year_id uuid references public.school_years(id) on delete set null,
  referral_date date not null default current_date,
  referral_source text,
  problem text,
  procedures text,
  status public.hot_case_status not null default 'DRAFT',
  counselor_signed_at timestamptz,
  principal_reviewed_at timestamptz,
  directorate_reviewed_at timestamptz,
  ministry_sent_at timestamptz,
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hot_case_followups (
  id uuid primary key default gen_random_uuid(),
  hot_case_id uuid not null references public.hot_cases(id) on delete cascade,
  counselor_id uuid references public.profiles(id) on delete set null,
  follow_up_date date not null default current_date,
  action_taken text,
  result text,
  notes text,
  created_at timestamptz not null default now()
);

-- =========================
-- ACTIVITIES
-- =========================

create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  counselor_id uuid not null references public.profiles(id) on delete restrict,
  school_id uuid not null references public.schools(id) on delete restrict,
  school_year_id uuid references public.school_years(id) on delete set null,
  semester_id uuid references public.semesters(id) on delete set null,
  activity_type public.activity_type not null,
  activity_date date not null,
  title text,
  target_group text,
  participant_count integer,
  location text,
  objectives text,
  results text,
  recommendations text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.activity_participants (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.activities(id) on delete cascade,
  student_id uuid references public.students(id) on delete cascade,
  notes text,
  unique(activity_id, student_id)
);

-- =========================
-- GROUP COUNSELING
-- =========================

create table if not exists public.group_counseling_groups (
  id uuid primary key default gen_random_uuid(),
  counselor_id uuid not null references public.profiles(id) on delete restrict,
  school_id uuid not null references public.schools(id) on delete restrict,
  school_year_id uuid references public.school_years(id) on delete set null,
  name text not null,
  problem text,
  target_group text,
  objectives text,
  recommendations text,
  created_at timestamptz not null default now()
);

create table if not exists public.group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.group_counseling_groups(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  joined_at date default current_date,
  left_at date,
  unique(group_id, student_id)
);

create table if not exists public.group_sessions (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.group_counseling_groups(id) on delete cascade,
  session_date date not null,
  location text,
  topic text,
  objectives text,
  activities text,
  outputs text,
  notes text,
  next_topic text,
  created_at timestamptz not null default now()
);

-- =========================
-- COLLECTIVE GUIDANCE
-- =========================

create table if not exists public.guidance_sessions (
  id uuid primary key default gen_random_uuid(),
  counselor_id uuid not null references public.profiles(id) on delete restrict,
  school_id uuid not null references public.schools(id) on delete restrict,
  school_year_id uuid references public.school_years(id) on delete set null,
  semester_id uuid references public.semesters(id) on delete set null,
  grade_id uuid references public.grades(id) on delete set null,
  section_id uuid references public.sections(id) on delete set null,
  session_date date not null,
  period text,
  topic text not null,
  objectives text,
  activity_notes text,
  counselor_notes text,
  created_at timestamptz not null default now()
);

-- =========================
-- DAILY / WEEKLY PROGRAM
-- =========================

create table if not exists public.weekly_programs (
  id uuid primary key default gen_random_uuid(),
  counselor_id uuid not null references public.profiles(id) on delete restrict,
  school_id uuid not null references public.schools(id) on delete restrict,
  school_year_id uuid not null references public.school_years(id) on delete restrict,
  semester_id uuid not null references public.semesters(id) on delete restrict,
  week_start date not null,
  week_end date not null,
  title text,
  counselor_signature_at timestamptz,
  principal_signature_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (week_end >= week_start)
);

create table if not exists public.weekly_program_items (
  id uuid primary key default gen_random_uuid(),
  weekly_program_id uuid not null references public.weekly_programs(id) on delete cascade,
  day_date date not null,
  day_name text not null,
  period text,
  start_time time,
  end_time time,
  activity_type text not null,
  grade_id uuid references public.grades(id) on delete set null,
  section_id uuid references public.sections(id) on delete set null,
  student_id uuid references public.students(id) on delete set null,
  topic text,
  objectives text,
  notes text,
  status public.program_status not null default 'PLANNED',
  not_completed_reason text,
  created_at timestamptz not null default now()
);

-- =========================
-- ANNUAL PLANS
-- =========================

create table if not exists public.annual_plans (
  id uuid primary key default gen_random_uuid(),
  counselor_id uuid not null references public.profiles(id) on delete restrict,
  school_id uuid not null references public.schools(id) on delete restrict,
  school_year_id uuid not null references public.school_years(id) on delete restrict,
  title text,
  preparation_date date,
  start_date date,
  end_date date,
  counselor_signature_at timestamptz,
  principal_signature_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.plan_goals (
  id uuid primary key default gen_random_uuid(),
  annual_plan_id uuid not null references public.annual_plans(id) on delete cascade,
  goal text not null,
  notes text
);

create table if not exists public.plan_outputs (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references public.plan_goals(id) on delete cascade,
  output text not null
);

create table if not exists public.plan_activities (
  id uuid primary key default gen_random_uuid(),
  output_id uuid not null references public.plan_outputs(id) on delete cascade,
  month integer check (month between 1 and 12),
  activity text not null,
  achievement_status text,
  notes text
);

create table if not exists public.plan_indicators (
  id uuid primary key default gen_random_uuid(),
  output_id uuid not null references public.plan_outputs(id) on delete cascade,
  indicator text not null
);

-- =========================
-- SEMESTER REPORTS
-- =========================

create table if not exists public.semester_reports (
  id uuid primary key default gen_random_uuid(),
  counselor_id uuid not null references public.profiles(id) on delete restrict,
  school_id uuid not null references public.schools(id) on delete restrict,
  school_year_id uuid not null references public.school_years(id) on delete restrict,
  semester_id uuid not null references public.semesters(id) on delete restrict,
  introduction text,
  achievements text,
  analytical_presentation text,
  challenges text,
  opportunities text,
  next_semester_activities text,
  attachments_notes text,
  counselor_signature_at timestamptz,
  principal_signature_at timestamptz,
  section_head_signature_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(counselor_id, school_year_id, semester_id)
);

-- =========================
-- NOTEBOOK
-- =========================

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text,
  content text not null,
  priority public.note_priority not null default 'NORMAL',
  is_pinned boolean not null default false,
  reminder_at timestamptz,
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========================
-- NOTIFICATIONS
-- =========================

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  message text not null,
  type text,
  entity_type text,
  entity_id uuid,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

-- =========================
-- PASSWORD / AUDIT
-- =========================

-- Supabase Auth stores the actual password hash.
-- This table only records that a password-change event happened.
create table if not exists public.password_change_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  changed_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id bigint generated always as identity primary key,
  user_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  old_data jsonb,
  new_data jsonb,
  ip_address inet,
  created_at timestamptz not null default now()
);

-- =========================
-- INDEXES
-- =========================

create index if not exists idx_schools_directorate on public.schools(directorate_id);
create index if not exists idx_profiles_school on public.profiles(school_id);
create index if not exists idx_profiles_directorate on public.profiles(directorate_id);

create index if not exists idx_students_school on public.students(school_id);
create index if not exists idx_students_grade on public.students(grade_id);
create index if not exists idx_students_section on public.students(section_id);
create index if not exists idx_student_counselors_counselor on public.student_counselors(counselor_id);
create index if not exists idx_student_counselors_student on public.student_counselors(student_id);

create index if not exists idx_cases_counselor on public.case_studies(counselor_id);
create index if not exists idx_cases_student on public.case_studies(student_id);
create index if not exists idx_case_sessions_case on public.case_sessions(case_id);

create index if not exists idx_interviews_counselor on public.interviews(counselor_id);
create index if not exists idx_consultations_counselor on public.consultations(counselor_id);

create index if not exists idx_absence_student on public.absence_records(student_id);
create index if not exists idx_lateness_student on public.lateness_records(student_id);
create index if not exists idx_dropout_student on public.dropout_cases(student_id);

create index if not exists idx_hot_cases_counselor on public.hot_cases(counselor_id);
create index if not exists idx_hot_cases_student on public.hot_cases(student_id);
create index if not exists idx_hot_cases_status on public.hot_cases(status);

create index if not exists idx_activities_counselor on public.activities(counselor_id);
create index if not exists idx_group_counseling_counselor on public.group_counseling_groups(counselor_id);
create index if not exists idx_guidance_counselor on public.guidance_sessions(counselor_id);

create index if not exists idx_weekly_program_counselor on public.weekly_programs(counselor_id);
create index if not exists idx_weekly_program_week on public.weekly_programs(week_start, week_end);
create index if not exists idx_weekly_items_program on public.weekly_program_items(weekly_program_id);
create index if not exists idx_weekly_items_date on public.weekly_program_items(day_date);

create index if not exists idx_notes_user on public.notes(user_id);
create index if not exists idx_notifications_user on public.notifications(user_id);
create index if not exists idx_audit_logs_user on public.audit_logs(user_id);

-- =========================
-- UPDATED_AT TRIGGER
-- =========================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_directorates_updated_at on public.directorates;
create trigger trg_directorates_updated_at
before update on public.directorates
for each row execute function public.set_updated_at();

drop trigger if exists trg_schools_updated_at on public.schools;
create trigger trg_schools_updated_at
before update on public.schools
for each row execute function public.set_updated_at();

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists trg_students_updated_at on public.students;
create trigger trg_students_updated_at
before update on public.students
for each row execute function public.set_updated_at();

drop trigger if exists trg_student_family_updated_at on public.student_family;
create trigger trg_student_family_updated_at
before update on public.student_family
for each row execute function public.set_updated_at();

drop trigger if exists trg_case_studies_updated_at on public.case_studies;
create trigger trg_case_studies_updated_at
before update on public.case_studies
for each row execute function public.set_updated_at();

drop trigger if exists trg_hot_cases_updated_at on public.hot_cases;
create trigger trg_hot_cases_updated_at
before update on public.hot_cases
for each row execute function public.set_updated_at();

drop trigger if exists trg_weekly_programs_updated_at on public.weekly_programs;
create trigger trg_weekly_programs_updated_at
before update on public.weekly_programs
for each row execute function public.set_updated_at();

drop trigger if exists trg_annual_plans_updated_at on public.annual_plans;
create trigger trg_annual_plans_updated_at
before update on public.annual_plans
for each row execute function public.set_updated_at();

drop trigger if exists trg_semester_reports_updated_at on public.semester_reports;
create trigger trg_semester_reports_updated_at
before update on public.semester_reports
for each row execute function public.set_updated_at();

drop trigger if exists trg_notes_updated_at on public.notes;
create trigger trg_notes_updated_at
before update on public.notes
for each row execute function public.set_updated_at();

-- =========================
-- HELPER FUNCTIONS FOR RLS
-- =========================

create or replace function public.my_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.my_school_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select school_id from public.profiles where id = auth.uid();
$$;

create or replace function public.my_directorate_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select directorate_id from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin_role()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.my_role() in ('SUPER_ADMIN','MINISTRY','DIRECTORATE'), false);
$$;

create or replace function public.can_access_school(p_school_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.my_role() in ('SUPER_ADMIN','MINISTRY')
    or (
      public.my_role() = 'DIRECTORATE'
      and exists (
        select 1
        from public.schools s
        where s.id = p_school_id
          and s.directorate_id = public.my_directorate_id()
      )
    )
    or (
      public.my_role() in ('PRINCIPAL','COUNSELOR')
      and p_school_id = public.my_school_id()
    );
$$;

create or replace function public.is_my_student(p_student_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.is_admin_role()
    or exists (
      select 1
      from public.students s
      where s.id = p_student_id
        and (
          s.school_id = public.my_school_id()
          or public.my_role() in ('SUPER_ADMIN','MINISTRY','DIRECTORATE')
        )
    )
    and (
      public.my_role() <> 'COUNSELOR'
      or exists (
        select 1
        from public.student_counselors sc
        where sc.student_id = p_student_id
          and sc.counselor_id = auth.uid()
          and sc.ended_at is null
      )
    );
$$;

-- =========================
-- ENABLE RLS
-- =========================

alter table public.directorates enable row level security;
alter table public.schools enable row level security;
alter table public.school_years enable row level security;
alter table public.semesters enable row level security;
alter table public.grades enable row level security;
alter table public.sections enable row level security;
alter table public.profiles enable row level security;
alter table public.user_school_assignments enable row level security;
alter table public.students enable row level security;
alter table public.student_counselors enable row level security;
alter table public.student_family enable row level security;
alter table public.case_studies enable row level security;
alter table public.case_sessions enable row level security;
alter table public.case_followups enable row level security;
alter table public.interviews enable row level security;
alter table public.consultations enable row level security;
alter table public.absence_records enable row level security;
alter table public.absence_followups enable row level security;
alter table public.lateness_records enable row level security;
alter table public.lateness_followups enable row level security;
alter table public.dropout_cases enable row level security;
alter table public.dropout_followups enable row level security;
alter table public.hot_case_categories enable row level security;
alter table public.hot_cases enable row level security;
alter table public.hot_case_followups enable row level security;
alter table public.activities enable row level security;
alter table public.activity_participants enable row level security;
alter table public.group_counseling_groups enable row level security;
alter table public.group_members enable row level security;
alter table public.group_sessions enable row level security;
alter table public.guidance_sessions enable row level security;
alter table public.weekly_programs enable row level security;
alter table public.weekly_program_items enable row level security;
alter table public.annual_plans enable row level security;
alter table public.plan_goals enable row level security;
alter table public.plan_outputs enable row level security;
alter table public.plan_activities enable row level security;
alter table public.plan_indicators enable row level security;
alter table public.semester_reports enable row level security;
alter table public.notes enable row level security;
alter table public.notifications enable row level security;
alter table public.password_change_logs enable row level security;
alter table public.audit_logs enable row level security;

-- =========================
-- BASIC RLS POLICIES
-- =========================

-- Profiles
create policy profiles_select on public.profiles
for select to authenticated
using (
  id = auth.uid()
  or public.is_admin_role()
  or (
    public.my_role() = 'PRINCIPAL'
    and school_id = public.my_school_id()
  )
);

create policy profiles_update_self on public.profiles
for update to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy profiles_admin_insert on public.profiles
for insert to authenticated
with check (public.is_admin_role());

create policy profiles_admin_update on public.profiles
for update to authenticated
using (public.is_admin_role())
with check (public.is_admin_role());

-- Schools / directorates
create policy schools_select on public.schools
for select to authenticated
using (public.can_access_school(id));

create policy schools_admin_write on public.schools
for all to authenticated
using (public.is_admin_role())
with check (public.is_admin_role());

create policy directorates_select on public.directorates
for select to authenticated
using (
  public.my_role() in ('SUPER_ADMIN','MINISTRY')
  or id = public.my_directorate_id()
);

create policy directorates_admin_write on public.directorates
for all to authenticated
using (public.my_role() in ('SUPER_ADMIN','MINISTRY'))
with check (public.my_role() in ('SUPER_ADMIN','MINISTRY'));

-- School years / semesters / grades
create policy school_years_select on public.school_years
for select to authenticated using (true);

create policy school_years_admin_write on public.school_years
for all to authenticated
using (public.is_admin_role())
with check (public.is_admin_role());

create policy semesters_select on public.semesters
for select to authenticated using (true);

create policy semesters_admin_write on public.semesters
for all to authenticated
using (public.is_admin_role())
with check (public.is_admin_role());

create policy grades_select on public.grades
for select to authenticated using (true);

create policy grades_admin_write on public.grades
for all to authenticated
using (public.is_admin_role())
with check (public.is_admin_role());

create policy sections_select on public.sections
for select to authenticated
using (public.can_access_school(school_id));

create policy sections_admin_write on public.sections
for all to authenticated
using (public.is_admin_role())
with check (public.is_admin_role());

-- Students
create policy students_select on public.students
for select to authenticated
using (public.is_my_student(id));

create policy students_insert on public.students
for insert to authenticated
with check (
  public.can_access_school(school_id)
  and (
    public.my_role() <> 'COUNSELOR'
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.school_id = school_id
    )
  )
);

create policy students_update on public.students
for update to authenticated
using (public.is_my_student(id))
with check (public.can_access_school(school_id));

-- Student-counselor assignment
create policy student_counselors_select on public.student_counselors
for select to authenticated
using (
  counselor_id = auth.uid()
  or public.is_admin_role()
  or (
    public.my_role() = 'PRINCIPAL'
    and exists (
      select 1 from public.students s
      where s.id = student_id and s.school_id = public.my_school_id()
    )
  )
);

create policy student_counselors_write on public.student_counselors
for all to authenticated
using (
  counselor_id = auth.uid()
  or public.is_admin_role()
  or public.my_role() = 'PRINCIPAL'
)
with check (
  counselor_id = auth.uid()
  or public.is_admin_role()
  or public.my_role() = 'PRINCIPAL'
);

-- Family
create policy student_family_select on public.student_family
for select to authenticated
using (public.is_my_student(student_id));

create policy student_family_write on public.student_family
for all to authenticated
using (public.is_my_student(student_id))
with check (public.is_my_student(student_id));

-- Generic counselor-owned records
create policy case_studies_select on public.case_studies
for select to authenticated
using (counselor_id = auth.uid() or public.is_admin_role());

create policy case_studies_write on public.case_studies
for all to authenticated
using (counselor_id = auth.uid() or public.is_admin_role())
with check (counselor_id = auth.uid() or public.is_admin_role());

create policy case_sessions_select on public.case_sessions
for select to authenticated
using (counselor_id = auth.uid() or public.is_admin_role());

create policy case_sessions_write on public.case_sessions
for all to authenticated
using (counselor_id = auth.uid() or public.is_admin_role())
with check (counselor_id = auth.uid() or public.is_admin_role());

create policy case_followups_select on public.case_followups
for select to authenticated
using (counselor_id = auth.uid() or public.is_admin_role());

create policy case_followups_write on public.case_followups
for all to authenticated
using (counselor_id = auth.uid() or public.is_admin_role())
with check (counselor_id = auth.uid() or public.is_admin_role());

-- Interviews / consultations
create policy interviews_select on public.interviews
for select to authenticated
using (counselor_id = auth.uid() or public.is_admin_role());

create policy interviews_write on public.interviews
for all to authenticated
using (counselor_id = auth.uid() or public.is_admin_role())
with check (counselor_id = auth.uid() or public.is_admin_role());

create policy consultations_select on public.consultations
for select to authenticated
using (counselor_id = auth.uid() or public.is_admin_role());

create policy consultations_write on public.consultations
for all to authenticated
using (counselor_id = auth.uid() or public.is_admin_role())
with check (counselor_id = auth.uid() or public.is_admin_role());

-- Absence / lateness / dropout
create policy absence_select on public.absence_records
for select to authenticated using (counselor_id = auth.uid() or public.is_admin_role());

create policy absence_write on public.absence_records
for all to authenticated
using (counselor_id = auth.uid() or public.is_admin_role())
with check (counselor_id = auth.uid() or public.is_admin_role());

create policy absence_followups_select on public.absence_followups
for select to authenticated using (counselor_id = auth.uid() or public.is_admin_role());

create policy absence_followups_write on public.absence_followups
for all to authenticated
using (counselor_id = auth.uid() or public.is_admin_role())
with check (counselor_id = auth.uid() or public.is_admin_role());

create policy lateness_select on public.lateness_records
for select to authenticated using (counselor_id = auth.uid() or public.is_admin_role());

create policy lateness_write on public.lateness_records
for all to authenticated
using (counselor_id = auth.uid() or public.is_admin_role())
with check (counselor_id = auth.uid() or public.is_admin_role());

create policy lateness_followups_select on public.lateness_followups
for select to authenticated using (counselor_id = auth.uid() or public.is_admin_role());

create policy lateness_followups_write on public.lateness_followups
for all to authenticated
using (counselor_id = auth.uid() or public.is_admin_role())
with check (counselor_id = auth.uid() or public.is_admin_role());

create policy dropout_select on public.dropout_cases
for select to authenticated using (counselor_id = auth.uid() or public.is_admin_role());

create policy dropout_write on public.dropout_cases
for all to authenticated
using (counselor_id = auth.uid() or public.is_admin_role())
with check (counselor_id = auth.uid() or public.is_admin_role());

create policy dropout_followups_select on public.dropout_followups
for select to authenticated using (counselor_id = auth.uid() or public.is_admin_role());

create policy dropout_followups_write on public.dropout_followups
for all to authenticated
using (counselor_id = auth.uid() or public.is_admin_role())
with check (counselor_id = auth.uid() or public.is_admin_role());

-- Hot cases
create policy hot_case_categories_select on public.hot_case_categories
for select to authenticated using (true);

create policy hot_case_categories_admin_write on public.hot_case_categories
for all to authenticated
using (public.is_admin_role())
with check (public.is_admin_role());

create policy hot_cases_select on public.hot_cases
for select to authenticated
using (
  counselor_id = auth.uid()
  or public.is_admin_role()
  or (
    public.my_role() = 'PRINCIPAL'
    and exists (
      select 1 from public.students s
      where s.id = student_id and s.school_id = public.my_school_id()
    )
  )
);

create policy hot_cases_write on public.hot_cases
for all to authenticated
using (counselor_id = auth.uid() or public.is_admin_role())
with check (counselor_id = auth.uid() or public.is_admin_role());

create policy hot_case_followups_select on public.hot_case_followups
for select to authenticated
using (
  public.is_admin_role()
  or counselor_id = auth.uid()
);

create policy hot_case_followups_write on public.hot_case_followups
for all to authenticated
using (public.is_admin_role() or counselor_id = auth.uid())
with check (public.is_admin_role() or counselor_id = auth.uid());

-- Activities / groups / guidance
create policy activities_select on public.activities
for select to authenticated
using (counselor_id = auth.uid() or public.is_admin_role());

create policy activities_write on public.activities
for all to authenticated
using (counselor_id = auth.uid() or public.is_admin_role())
with check (counselor_id = auth.uid() or public.is_admin_role());

create policy activity_participants_select on public.activity_participants
for select to authenticated
using (
  public.is_admin_role()
  or exists (
    select 1 from public.activities a
    where a.id = activity_id and a.counselor_id = auth.uid()
  )
);

create policy activity_participants_write on public.activity_participants
for all to authenticated
using (
  public.is_admin_role()
  or exists (
    select 1 from public.activities a
    where a.id = activity_id and a.counselor_id = auth.uid()
  )
)
with check (
  public.is_admin_role()
  or exists (
    select 1 from public.activities a
    where a.id = activity_id and a.counselor_id = auth.uid()
  )
);

create policy groups_select on public.group_counseling_groups
for select to authenticated
using (counselor_id = auth.uid() or public.is_admin_role());

create policy groups_write on public.group_counseling_groups
for all to authenticated
using (counselor_id = auth.uid() or public.is_admin_role())
with check (counselor_id = auth.uid() or public.is_admin_role());

create policy group_members_select on public.group_members
for select to authenticated
using (
  public.is_admin_role()
  or exists (
    select 1 from public.group_counseling_groups g
    where g.id = group_id and g.counselor_id = auth.uid()
  )
);

create policy group_members_write on public.group_members
for all to authenticated
using (
  public.is_admin_role()
  or exists (
    select 1 from public.group_counseling_groups g
    where g.id = group_id and g.counselor_id = auth.uid()
  )
)
with check (
  public.is_admin_role()
  or exists (
    select 1 from public.group_counseling_groups g
    where g.id = group_id and g.counselor_id = auth.uid()
  )
);

create policy group_sessions_select on public.group_sessions
for select to authenticated
using (
  public.is_admin_role()
  or exists (
    select 1 from public.group_counseling_groups g
    where g.id = group_id and g.counselor_id = auth.uid()
  )
);

create policy group_sessions_write on public.group_sessions
for all to authenticated
using (
  public.is_admin_role()
  or exists (
    select 1 from public.group_counseling_groups g
    where g.id = group_id and g.counselor_id = auth.uid()
  )
)
with check (
  public.is_admin_role()
  or exists (
    select 1 from public.group_counseling_groups g
    where g.id = group_id and g.counselor_id = auth.uid()
  )
);

create policy guidance_select on public.guidance_sessions
for select to authenticated
using (counselor_id = auth.uid() or public.is_admin_role());

create policy guidance_write on public.guidance_sessions
for all to authenticated
using (counselor_id = auth.uid() or public.is_admin_role())
with check (counselor_id = auth.uid() or public.is_admin_role());

-- Weekly program
create policy weekly_programs_select on public.weekly_programs
for select to authenticated
using (
  counselor_id = auth.uid()
  or public.is_admin_role()
  or (
    public.my_role() = 'PRINCIPAL'
    and school_id = public.my_school_id()
  )
);

create policy weekly_programs_write on public.weekly_programs
for all to authenticated
using (counselor_id = auth.uid() or public.is_admin_role())
with check (counselor_id = auth.uid() or public.is_admin_role());

create policy weekly_program_items_select on public.weekly_program_items
for select to authenticated
using (
  public.is_admin_role()
  or exists (
    select 1 from public.weekly_programs p
    where p.id = weekly_program_id
      and (
        p.counselor_id = auth.uid()
        or (public.my_role() = 'PRINCIPAL' and p.school_id = public.my_school_id())
      )
  )
);

create policy weekly_program_items_write on public.weekly_program_items
for all to authenticated
using (
  public.is_admin_role()
  or exists (
    select 1 from public.weekly_programs p
    where p.id = weekly_program_id and p.counselor_id = auth.uid()
  )
)
with check (
  public.is_admin_role()
  or exists (
    select 1 from public.weekly_programs p
    where p.id = weekly_program_id and p.counselor_id = auth.uid()
  )
);

-- Annual plan / reports
create policy annual_plans_select on public.annual_plans
for select to authenticated
using (counselor_id = auth.uid() or public.is_admin_role());

create policy annual_plans_write on public.annual_plans
for all to authenticated
using (counselor_id = auth.uid() or public.is_admin_role())
with check (counselor_id = auth.uid() or public.is_admin_role());

create policy plan_goals_select on public.plan_goals
for select to authenticated
using (
  public.is_admin_role()
  or exists (
    select 1 from public.annual_plans p
    where p.id = annual_plan_id and p.counselor_id = auth.uid()
  )
);

create policy plan_goals_write on public.plan_goals
for all to authenticated
using (
  public.is_admin_role()
  or exists (
    select 1 from public.annual_plans p
    where p.id = annual_plan_id and p.counselor_id = auth.uid()
  )
)
with check (
  public.is_admin_role()
  or exists (
    select 1 from public.annual_plans p
    where p.id = annual_plan_id and p.counselor_id = auth.uid()
  )
);

create policy semester_reports_select on public.semester_reports
for select to authenticated
using (counselor_id = auth.uid() or public.is_admin_role());

create policy semester_reports_write on public.semester_reports
for all to authenticated
using (counselor_id = auth.uid() or public.is_admin_role())
with check (counselor_id = auth.uid() or public.is_admin_role());

-- Notebook: PRIVATE to each user
create policy notes_select_own on public.notes
for select to authenticated
using (user_id = auth.uid());

create policy notes_insert_own on public.notes
for insert to authenticated
with check (user_id = auth.uid());

create policy notes_update_own on public.notes
for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy notes_delete_own on public.notes
for delete to authenticated
using (user_id = auth.uid());

-- Notifications
create policy notifications_select_own on public.notifications
for select to authenticated
using (user_id = auth.uid());

create policy notifications_update_own on public.notifications
for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- Password logs
create policy password_logs_select_own on public.password_change_logs
for select to authenticated
using (user_id = auth.uid() or public.is_admin_role());

create policy password_logs_insert_own on public.password_change_logs
for insert to authenticated
with check (user_id = auth.uid());

-- Audit logs: users can see own logs; admins can see all.
create policy audit_logs_select on public.audit_logs
for select to authenticated
using (user_id = auth.uid() or public.is_admin_role());

-- =========================
-- DEFAULT HOT CASE CATEGORIES
-- =========================

insert into public.hot_case_categories (name)
values
  ('عنف لفظي'),
  ('عنف جسدي'),
  ('تحرش جنسي'),
  ('اعتداء جنسي'),
  ('عنف نفسي / إهمال'),
  ('مشكلات أخرى')
on conflict (name) do nothing;

-- ============================================================
-- END
-- ============================================================

-- =========================
-- FIRST-LOGIN PROFILE SETUP
-- =========================
-- Allow a newly authenticated user to create only their own COUNSELOR profile.
drop policy if exists profiles_self_insert on public.profiles;
create policy profiles_self_insert on public.profiles
for insert to authenticated
with check (id = auth.uid() and role = 'COUNSELOR');

-- Organization names are not sensitive and must be selectable during first-login setup.
drop policy if exists directorates_authenticated_lookup on public.directorates;
create policy directorates_authenticated_lookup on public.directorates
for select to authenticated
using (true);

drop policy if exists schools_authenticated_lookup on public.schools;
create policy schools_authenticated_lookup on public.schools
for select to authenticated
using (true);

-- Prevent a counselor from changing their own role or activation state.
drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles
for update to authenticated
using (id = auth.uid())
with check (id = auth.uid() and role = public.my_role() and is_active = true);

-- =========================
-- INTERNAL MESSAGING
-- =========================

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  subject text not null,
  body text not null,
  priority text not null default 'عادي' check (priority in ('عادي','مهم','عاجل')),
  parent_id uuid references public.messages(id) on delete set null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_messages_recipient on public.messages(recipient_id, created_at desc);
create index if not exists idx_messages_sender on public.messages(sender_id, created_at desc);
create index if not exists idx_messages_parent on public.messages(parent_id);

alter table public.messages enable row level security;

create or replace function public.can_message_user(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    public.my_role() in ('SUPER_ADMIN','MINISTRY')
    or exists (
      select 1
      from public.profiles target
      where target.id = p_user_id
        and target.is_active = true
        and (
          (public.my_role() = 'DIRECTORATE' and target.directorate_id = public.my_directorate_id() and target.role in ('COUNSELOR','DIRECTORATE'))
          or
          (public.my_role() = 'COUNSELOR' and target.directorate_id = public.my_directorate_id() and target.role = 'DIRECTORATE')
        )
    ), false
  );
$$;

drop policy if exists messages_select on public.messages;
create policy messages_select on public.messages
for select to authenticated
using (sender_id = auth.uid() or recipient_id = auth.uid() or public.my_role() in ('SUPER_ADMIN','MINISTRY'));

drop policy if exists messages_insert on public.messages;
create policy messages_insert on public.messages
for insert to authenticated
with check (sender_id = auth.uid() and recipient_id <> auth.uid() and public.can_message_user(recipient_id));

drop policy if exists messages_update on public.messages;
create policy messages_update on public.messages
for update to authenticated
using (recipient_id = auth.uid() or public.my_role() in ('SUPER_ADMIN','MINISTRY'))
with check (recipient_id = auth.uid() or public.my_role() in ('SUPER_ADMIN','MINISTRY'));

create or replace function public.notify_new_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications(user_id,title,message,type,entity_type,entity_id)
  values (
    NEW.recipient_id,
    'رسالة جديدة من ' || coalesce((select full_name from public.profiles where id=NEW.sender_id),'مستخدم'),
    NEW.subject,
    'MESSAGE',
    'message',
    NEW.id
  );
  return NEW;
end;
$$;

drop trigger if exists trg_notify_new_message on public.messages;
create trigger trg_notify_new_message
after insert on public.messages
for each row execute function public.notify_new_message();

-- Allow users in the same directorate to discover valid messaging recipients.
drop policy if exists profiles_message_recipients on public.profiles;
create policy profiles_message_recipients on public.profiles
for select to authenticated
using (
  id = auth.uid()
  or public.my_role() in ('SUPER_ADMIN','MINISTRY')
  or (
    directorate_id = public.my_directorate_id()
    and is_active = true
    and (
      (public.my_role() = 'COUNSELOR' and role = 'DIRECTORATE')
      or (public.my_role() = 'DIRECTORATE' and role in ('COUNSELOR','DIRECTORATE'))
    )
  )
);

-- ============================================================
-- COUNSELOR DIRECTORY / ASSIGNMENT MANAGEMENT
-- ============================================================
create table if not exists public.counselor_registry (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text,
  phone text,
  job_title text not null default 'مرشد تربوي',
  directorate_id uuid not null references public.directorates(id) on delete restrict,
  school_id uuid not null references public.schools(id) on delete restrict,
  auth_user_id uuid unique references auth.users(id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(email)
);

create unique index if not exists uq_counselor_registry_email_lower on public.counselor_registry(lower(email)) where email is not null;
create index if not exists idx_counselor_registry_directorate on public.counselor_registry(directorate_id);
create index if not exists idx_counselor_registry_school on public.counselor_registry(school_id);

alter table public.counselor_registry enable row level security;

drop policy if exists counselor_registry_select on public.counselor_registry;
create policy counselor_registry_select on public.counselor_registry
for select to authenticated
using (
  public.my_role() in ('SUPER_ADMIN','MINISTRY')
  or directorate_id = public.my_directorate_id()
  or auth_user_id = auth.uid()
);

drop policy if exists counselor_registry_insert on public.counselor_registry;
create policy counselor_registry_insert on public.counselor_registry
for insert to authenticated
with check (
  public.my_role() in ('SUPER_ADMIN','MINISTRY')
  or (public.my_role()='DIRECTORATE' and directorate_id=public.my_directorate_id())
);

drop policy if exists counselor_registry_update on public.counselor_registry;
create policy counselor_registry_update on public.counselor_registry
for update to authenticated
using (
  public.my_role() in ('SUPER_ADMIN','MINISTRY')
  or (public.my_role()='DIRECTORATE' and directorate_id=public.my_directorate_id())
)
with check (
  public.my_role() in ('SUPER_ADMIN','MINISTRY')
  or (public.my_role()='DIRECTORATE' and directorate_id=public.my_directorate_id())
);

drop policy if exists counselor_registry_delete on public.counselor_registry;
create policy counselor_registry_delete on public.counselor_registry
for delete to authenticated
using (public.my_role() in ('SUPER_ADMIN','MINISTRY'));

-- Directorates remain a ministry/system responsibility; a directorate manager manages schools and counselors inside its own directorate.
drop policy if exists schools_admin_write on public.schools;
create policy schools_admin_write on public.schools
for all to authenticated
using (
  public.my_role() in ('SUPER_ADMIN','MINISTRY')
  or (public.my_role()='DIRECTORATE' and directorate_id=public.my_directorate_id())
)
with check (
  public.my_role() in ('SUPER_ADMIN','MINISTRY')
  or (public.my_role()='DIRECTORATE' and directorate_id=public.my_directorate_id())
);

drop policy if exists profiles_admin_update on public.profiles;
create policy profiles_admin_update on public.profiles
for update to authenticated
using (
  public.my_role() in ('SUPER_ADMIN','MINISTRY')
  or (public.my_role()='DIRECTORATE' and role='COUNSELOR' and directorate_id=public.my_directorate_id())
)
with check (
  public.my_role() in ('SUPER_ADMIN','MINISTRY')
  or (public.my_role()='DIRECTORATE' and role='COUNSELOR' and directorate_id=public.my_directorate_id())
);

create or replace function public.claim_counselor_registry()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  r public.counselor_registry%rowtype;
  e text;
begin
  e := lower(coalesce(auth.email(),''));
  if e = '' then return null; end if;
  select * into r from public.counselor_registry
  where lower(coalesce(email,''))=e and auth_user_id is null and is_active=true
  order by created_at limit 1;
  if r.id is null then return null; end if;

  insert into public.profiles(id,full_name,phone,role,directorate_id,school_id,job_title,is_active)
  values(auth.uid(),r.full_name,r.phone,'COUNSELOR',r.directorate_id,r.school_id,r.job_title,true)
  on conflict (id) do update set
    full_name=excluded.full_name,
    phone=excluded.phone,
    role='COUNSELOR',
    directorate_id=excluded.directorate_id,
    school_id=excluded.school_id,
    job_title=excluded.job_title,
    is_active=true;

  update public.counselor_registry set auth_user_id=auth.uid(), updated_at=now() where id=r.id;
  insert into public.user_school_assignments(user_id,school_id,is_primary,start_date)
  values(auth.uid(),r.school_id,true,current_date)
  on conflict (user_id,school_id) do update set is_primary=true,end_date=null;
  return jsonb_build_object('id',r.id,'full_name',r.full_name,'directorate_id',r.directorate_id,'school_id',r.school_id);
end;
$$;

grant execute on function public.claim_counselor_registry() to authenticated;

-- School assignment history used when a counselor is transferred.
drop policy if exists user_school_assignments_select on public.user_school_assignments;
create policy user_school_assignments_select on public.user_school_assignments
for select to authenticated
using (
  user_id=auth.uid()
  or public.my_role() in ('SUPER_ADMIN','MINISTRY')
  or (public.my_role()='DIRECTORATE' and exists(select 1 from public.profiles p where p.id=user_id and p.directorate_id=public.my_directorate_id()))
);

drop policy if exists user_school_assignments_write on public.user_school_assignments;
create policy user_school_assignments_write on public.user_school_assignments
for all to authenticated
using (
  public.my_role() in ('SUPER_ADMIN','MINISTRY')
  or (public.my_role()='DIRECTORATE' and exists(select 1 from public.profiles p where p.id=user_id and p.directorate_id=public.my_directorate_id()))
)
with check (
  public.my_role() in ('SUPER_ADMIN','MINISTRY')
  or (public.my_role()='DIRECTORATE' and exists(select 1 from public.profiles p where p.id=user_id and p.directorate_id=public.my_directorate_id()))
);

create or replace function public.set_counselor_registry_updated_at()
returns trigger language plpgsql as $$ begin new.updated_at=now(); return new; end; $$;
drop trigger if exists trg_counselor_registry_updated_at on public.counselor_registry;
create trigger trg_counselor_registry_updated_at before update on public.counselor_registry for each row execute function public.set_counselor_registry_updated_at();

-- ============================================================
-- USERNAME / COUNSELOR PROFILE MIGRATION
-- Only two application roles are exposed in the UI: DIRECTORATE (مدير) and COUNSELOR (مرشد).
-- Passwords remain in Supabase Auth; they are never stored in profiles.
-- ============================================================
alter table public.profiles add column if not exists username text;
alter table public.profiles add column if not exists national_id text;
alter table public.profiles add column if not exists profile_edit_count integer not null default 0;
create unique index if not exists uq_profiles_username on public.profiles(lower(username)) where username is not null;

alter table public.counselor_registry add column if not exists username text;
alter table public.counselor_registry add column if not exists national_id text;
create unique index if not exists uq_counselor_registry_username on public.counselor_registry(lower(username)) where username is not null;

-- Prevent a counselor from changing administrative assignment or editing more than once.
create or replace function public.guard_counselor_profile_edit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() = old.id and old.role = 'COUNSELOR' and current_user <> 'postgres' then
    if old.profile_edit_count >= 1 then
      raise exception 'تم استخدام فرصة تعديل البيانات الشخصية.';
    end if;
    if new.role <> old.role or new.directorate_id is distinct from old.directorate_id or new.school_id is distinct from old.school_id or new.username is distinct from old.username then
      raise exception 'المديرية والمدرسة والدور واسم المستخدم تُدار بواسطة المدير.';
    end if;
    new.profile_edit_count := 1;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_guard_counselor_profile_edit on public.profiles;
create trigger trg_guard_counselor_profile_edit
before update on public.profiles
for each row execute function public.guard_counselor_profile_edit();

-- Tighten self-update: counselors may update their own personal record only; the trigger above
-- protects role, username and administrative assignment and limits the operation to once.
drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles
for update to authenticated
using (id = auth.uid() and role = 'COUNSELOR')
with check (id = auth.uid() and role = 'COUNSELOR');

-- Update the registry-claim function to use username/national ID and synthetic Auth email.
create or replace function public.claim_counselor_registry()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  r public.counselor_registry%rowtype;
  e text;
begin
  e := lower(coalesce(auth.email(),''));
  if e = '' then return null; end if;
  select * into r from public.counselor_registry
  where lower(coalesce(email,''))=e and auth_user_id is null and is_active=true
  order by created_at limit 1;
  if r.id is null then return null; end if;

  insert into public.profiles(id,full_name,username,national_id,phone,role,directorate_id,school_id,job_title,is_active,profile_edit_count)
  values(auth.uid(),r.full_name,r.username,r.national_id,r.phone,'COUNSELOR',r.directorate_id,r.school_id,r.job_title,true,0)
  on conflict (id) do update set
    full_name=excluded.full_name,
    username=excluded.username,
    national_id=excluded.national_id,
    phone=excluded.phone,
    role='COUNSELOR',
    directorate_id=excluded.directorate_id,
    school_id=excluded.school_id,
    job_title=excluded.job_title,
    is_active=true;

  update public.counselor_registry set auth_user_id=auth.uid(), updated_at=now() where id=r.id;
  insert into public.user_school_assignments(user_id,school_id,is_primary,start_date)
  values(auth.uid(),r.school_id,true,current_date)
  on conflict (user_id,school_id) do update set is_primary=true,end_date=null;
  return jsonb_build_object('id',r.id,'full_name',r.full_name,'username',r.username,'directorate_id',r.directorate_id,'school_id',r.school_id);
end;
$$;

grant execute on function public.claim_counselor_registry() to authenticated;

-- Username policy: every login username is unique (case-insensitive).
create unique index if not exists uq_profiles_username_ci on public.profiles(lower(trim(username))) where username is not null;
create unique index if not exists uq_counselor_registry_username_ci on public.counselor_registry(lower(trim(username))) where username is not null;
