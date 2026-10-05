-- إصلاح نطاق المشرف التربوي:
-- المشرف يرى المرشدين المرتبطين به فقط عبر profiles.supervisor_id.
-- لا يرى المرشدين في نفس المدرسة لمجرد أنهم في المدرسة نفسها.

drop policy if exists profiles_select on public.profiles;

create policy profiles_select on public.profiles
for select to authenticated
using (
  id = auth.uid()
  or public.my_role() in ('SUPER_ADMIN','MINISTRY','DIRECTORATE')
  or (public.my_role()='PRINCIPAL' and supervisor_id=auth.uid())
);

notify pgrst, 'reload schema';
