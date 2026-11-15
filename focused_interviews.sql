-- نموذج رصد ومتابعة المقابلات الفردية المركزة
-- نفّذ هذا الملف مرة واحدة في Supabase SQL Editor.
create extension if not exists pgcrypto;

create table if not exists public.focused_interview_file_counters (
  counselor_id uuid not null references public.profiles(id) on delete cascade,
  school_year_id uuid not null references public.school_years(id) on delete cascade,
  last_number integer not null default 0,
  primary key (counselor_id, school_year_id)
);

create table if not exists public.focused_interview_student_files (
  id uuid primary key default gen_random_uuid(),
  counselor_id uuid not null references public.profiles(id) on delete cascade,
  school_id uuid references public.schools(id) on delete set null,
  student_id uuid not null references public.students(id),
  school_year_id uuid not null references public.school_years(id),
  serial_number text not null,
  student_name text not null,
  national_id text,
  student_code text,
  grade_name text,
  section_name text,
  phone text,
  status text not null default 'open' check(status in ('open','closed')),
  created_at timestamptz not null default now(),
  closed_at timestamptz,
  unique(counselor_id, school_year_id, serial_number),
  unique(counselor_id, school_year_id, student_id)
);

create table if not exists public.focused_interview_reviews (
  id uuid primary key default gen_random_uuid(),
  file_id uuid not null references public.focused_interview_student_files(id) on delete restrict,
  review_date date not null default current_date,
  topic text not null,
  notes text,
  result text,
  recommendations text,
  created_at timestamptz not null default now()
);

create or replace function public.assign_focused_interview_serial()
returns trigger language plpgsql security definer set search_path=public as $$
declare n integer; yy text;
begin
  select right(coalesce(to_char(start_date,'YYYY'), substring(regexp_replace(coalesce(name,''),'[^0-9]','','g') from 1 for 4), to_char(current_date,'YYYY')),2)
    into yy from public.school_years where id=new.school_year_id;
  if yy is null then yy:=to_char(current_date,'YY'); end if;
  insert into public.focused_interview_file_counters(counselor_id,school_year_id,last_number)
  values(new.counselor_id,new.school_year_id,1)
  on conflict(counselor_id,school_year_id) do update
    set last_number=focused_interview_file_counters.last_number+1
  returning last_number into n;
  new.serial_number:=yy||lpad(n::text,4,'0');
  return new;
end; $$;
drop trigger if exists trg_focused_interview_serial on public.focused_interview_student_files;
create trigger trg_focused_interview_serial before insert on public.focused_interview_student_files
for each row execute function public.assign_focused_interview_serial();

create or replace function public.guard_focused_interview_archive()
returns trigger language plpgsql as $$
declare st text;
begin
 if TG_TABLE_NAME='focused_interview_student_files' then
   if TG_OP in ('UPDATE','DELETE') and old.status='closed' then raise exception 'هذا الملف مؤرشف ومغلق ولا يمكن تعديله أو حذفه'; end if;
 else
   select status into st from public.focused_interview_student_files where id=coalesce(new.file_id,old.file_id);
   if st='closed' then raise exception 'ملف المتابعة مغلق ولا يمكن إضافة أو تعديل أو حذف مراجعاته'; end if;
 end if;
 if TG_OP='DELETE' then return old; end if;
 return new;
end; $$;
drop trigger if exists trg_guard_focused_file on public.focused_interview_student_files;
create trigger trg_guard_focused_file before update or delete on public.focused_interview_student_files
for each row execute function public.guard_focused_interview_archive();
drop trigger if exists trg_guard_focused_review on public.focused_interview_reviews;
create trigger trg_guard_focused_review before insert or update or delete on public.focused_interview_reviews
for each row execute function public.guard_focused_interview_archive();

alter table public.focused_interview_student_files enable row level security;
alter table public.focused_interview_reviews enable row level security;
alter table public.focused_interview_file_counters enable row level security;
drop policy if exists focused_files_select on public.focused_interview_student_files;
create policy focused_files_select on public.focused_interview_student_files for select to authenticated using(counselor_id=auth.uid());
drop policy if exists focused_files_insert on public.focused_interview_student_files;
create policy focused_files_insert on public.focused_interview_student_files for insert to authenticated with check(counselor_id=auth.uid());
drop policy if exists focused_reviews_select on public.focused_interview_reviews;
create policy focused_reviews_select on public.focused_interview_reviews for select to authenticated using(exists(select 1 from public.focused_interview_student_files f where f.id=file_id and f.counselor_id=auth.uid()));
drop policy if exists focused_reviews_insert on public.focused_interview_reviews;
create policy focused_reviews_insert on public.focused_interview_reviews for insert to authenticated with check(exists(select 1 from public.focused_interview_student_files f where f.id=file_id and f.counselor_id=auth.uid() and f.status='open'));

-- عند تفعيل سنة دراسية جديدة، تُغلق ملفات السنوات الأخرى تلقائيًا.
create or replace function public.close_old_focused_interview_files()
returns trigger language plpgsql security definer set search_path=public as $$
begin
 if new.is_active is true and (old.is_active is distinct from new.is_active) then
   update public.focused_interview_student_files set status='closed', closed_at=now()
   where school_year_id<>new.id and status='open';
 end if;
 return new;
end; $$;
drop trigger if exists trg_close_old_focused_interview_files on public.school_years;
create trigger trg_close_old_focused_interview_files after update of is_active on public.school_years
for each row execute function public.close_old_focused_interview_files();
