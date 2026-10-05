-- إصلاح حفظ وتوثيق البرنامج الأسبوعي بدون الاعتماد على Supabase Auth
-- يعتمد النظام على profiles.id المخزن في localStorage باسم system_profile_id.

alter table public.weekly_programs disable row level security;
alter table public.weekly_program_items disable row level security;

grant select, insert, update, delete on public.weekly_programs to anon, authenticated;
grant select, insert, update, delete on public.weekly_program_items to anon, authenticated;
grant usage, select, update on all sequences in schema public to anon, authenticated;

-- يسمح بالتأكد من وجود البرنامج ثم إدخال البند في الخانة المحددة.
-- لا يتم إنشاء سجل جديد عند كل تحديث؛ التعديل يتم على نفس id.

create index if not exists idx_weekly_items_cell
on public.weekly_program_items(weekly_program_id, day_date, period);
