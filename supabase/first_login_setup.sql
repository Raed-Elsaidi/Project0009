-- Run this once in Supabase SQL Editor if the database was created before
-- the first-login setup feature was added.

drop policy if exists profiles_self_insert on public.profiles;
create policy profiles_self_insert on public.profiles
for insert to authenticated
with check (id = auth.uid() and role = 'COUNSELOR');

drop policy if exists directorates_authenticated_lookup on public.directorates;
create policy directorates_authenticated_lookup on public.directorates
for select to authenticated
using (true);

drop policy if exists schools_authenticated_lookup on public.schools;
create policy schools_authenticated_lookup on public.schools
for select to authenticated
using (true);

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles
for update to authenticated
using (id = auth.uid())
with check (id = auth.uid() and role = public.my_role() and is_active = true);
