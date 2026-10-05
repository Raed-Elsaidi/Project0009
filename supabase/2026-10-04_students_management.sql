-- Students management: academic context + delete permission
alter table public.students add column if not exists school_year_id uuid references public.school_years(id) on delete restrict;
alter table public.students add column if not exists semester_id uuid references public.semesters(id) on delete restrict;

create index if not exists idx_students_school_year on public.students(school_year_id);
create index if not exists idx_students_semester on public.students(semester_id);

-- Allow a counselor to delete only students assigned to that counselor.
drop policy if exists students_delete on public.students;
create policy students_delete on public.students
for delete to authenticated
using (
  public.is_my_student(id)
  or public.is_admin_role()
  or public.my_role() = 'PRINCIPAL'
);
