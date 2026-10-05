-- السياق الأكاديمي الموحد: السنة الدراسية + الفصل الدراسي
-- 2026/2027 هو العام الحالي، مع الفصلين الأول والثاني.

insert into public.school_years (name, is_active)
values ('2026/2027', true)
on conflict (name) do update set is_active = true;

update public.school_years
set is_active = (name = '2026/2027');

insert into public.semesters (school_year_id, type, name)
select id, 'FIRST'::public.semester_type, 'الأول'
from public.school_years where name = '2026/2027'
on conflict (school_year_id, type) do nothing;

insert into public.semesters (school_year_id, type, name)
select id, 'SECOND'::public.semester_type, 'الثاني'
from public.school_years where name = '2026/2027'
on conflict (school_year_id, type) do nothing;

-- ملفات لم تكن تحتوي الفصل الدراسي سابقًا
alter table public.case_studies add column if not exists semester_id uuid references public.semesters(id) on delete set null;
alter table public.hot_cases add column if not exists semester_id uuid references public.semesters(id) on delete set null;
alter table public.annual_plans add column if not exists semester_id uuid references public.semesters(id) on delete set null;
alter table public.notes add column if not exists school_year_id uuid references public.school_years(id) on delete set null;
alter table public.notes add column if not exists semester_id uuid references public.semesters(id) on delete set null;

-- ربط السجلات القديمة بأحدث سنة وفصل عند الحاجة، حتى لا تبقى ملفات بلا سياق أكاديمي.
update public.case_studies c
set semester_id = s.id
from public.school_years y
join public.semesters s on s.school_year_id=y.id and s.type='FIRST'
where c.semester_id is null
  and c.school_year_id=y.id;

update public.hot_cases h
set semester_id = s.id
from public.school_years y
join public.semesters s on s.school_year_id=y.id and s.type='FIRST'
where h.semester_id is null
  and h.school_year_id=y.id;

update public.annual_plans a
set semester_id = s.id
from public.school_years y
join public.semesters s on s.school_year_id=y.id and s.type='FIRST'
where a.semester_id is null
  and a.school_year_id=y.id;

-- فهرسة الربط الأكاديمي
create index if not exists idx_case_studies_academic on public.case_studies(school_year_id, semester_id);
create index if not exists idx_hot_cases_academic on public.hot_cases(school_year_id, semester_id);
create index if not exists idx_annual_plans_academic on public.annual_plans(school_year_id, semester_id);
create index if not exists idx_notes_academic on public.notes(school_year_id, semester_id);
create index if not exists idx_interviews_academic on public.interviews(school_year_id, semester_id);
create index if not exists idx_guidance_academic on public.guidance_sessions(school_year_id, semester_id);
create index if not exists idx_group_academic on public.group_counseling_groups(school_year_id, semester_id);
create index if not exists idx_activities_academic on public.activities(school_year_id, semester_id);
create index if not exists idx_absence_academic on public.absence_records(school_year_id, semester_id);
create index if not exists idx_lateness_academic on public.lateness_records(school_year_id, semester_id);
create index if not exists idx_dropout_academic on public.dropout_cases(school_year_id, semester_id);

-- ضمان أن الفصل المختار يخص نفس السنة المختارة في الملفات الجديدة/المعدلة يتم تطبيقه من واجهة النظام،
-- ويمكن لاحقًا تشديده بقيود/Triggers حسب سياسة البيانات الحالية.
