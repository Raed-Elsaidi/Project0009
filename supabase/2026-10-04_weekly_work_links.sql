-- ربط خانات البرنامج الأسبوعي بملفات العمل المتخصصة
alter table public.weekly_program_items
  add column if not exists work_record_id uuid,
  add column if not exists work_route text,
  add column if not exists work_label text,
  add column if not exists work_saved_at timestamptz;

-- استكمال ربط الإرشاد الجمعي بالسنة والفصل وعدد الأعضاء
alter table public.group_counseling_groups
  add column if not exists semester_id uuid references public.semesters(id) on delete set null,
  add column if not exists member_count integer;

-- نوع المقابلة/الاستشارة لاستخدامه داخل الملف
alter table public.interviews
  add column if not exists consultation_type text;

create index if not exists idx_weekly_items_work_record on public.weekly_program_items(work_record_id);
