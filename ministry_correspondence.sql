-- الصادر والوارد: إنشاء الجداول والترقيم التلقائي
create table if not exists public.ministry_correspondence (
  id uuid primary key default gen_random_uuid(),
  counselor_id uuid not null references public.profiles(id) on delete cascade,
  school_id uuid references public.schools(id) on delete set null,
  school_year_id uuid not null references public.school_years(id),
  record_type text not null check (record_type in ('outgoing','incoming')),
  serial_number integer not null,
  correspondence_date date not null,
  title text not null,
  details text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (counselor_id, school_year_id, record_type, serial_number)
);

create table if not exists public.ministry_correspondence_counters (
  counselor_id uuid not null references public.profiles(id) on delete cascade,
  school_year_id uuid not null references public.school_years(id) on delete cascade,
  record_type text not null check (record_type in ('outgoing','incoming')),
  last_number integer not null default 0,
  primary key (counselor_id, school_year_id, record_type)
);

create table if not exists public.ministry_correspondence_attachments (
  id uuid primary key default gen_random_uuid(),
  correspondence_id uuid not null references public.ministry_correspondence(id) on delete cascade,
  file_name text not null,
  storage_path text not null unique,
  mime_type text,
  size_bytes bigint,
  created_at timestamptz not null default now()
);

create or replace function public.assign_ministry_correspondence_serial()
returns trigger language plpgsql security definer set search_path = public as $$
declare next_no integer;
begin
  insert into public.ministry_correspondence_counters(counselor_id, school_year_id, record_type, last_number)
  values (new.counselor_id, new.school_year_id, new.record_type, 1)
  on conflict (counselor_id, school_year_id, record_type)
  do update set last_number = ministry_correspondence_counters.last_number + 1
  returning last_number into next_no;
  new.serial_number := next_no;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_ministry_correspondence_serial on public.ministry_correspondence;
create trigger trg_ministry_correspondence_serial
before insert on public.ministry_correspondence
for each row execute function public.assign_ministry_correspondence_serial();

create or replace function public.touch_ministry_correspondence_updated_at()
returns trigger language plpgsql as $$ begin new.updated_at := now(); return new; end; $$;
drop trigger if exists trg_ministry_correspondence_updated_at on public.ministry_correspondence;
create trigger trg_ministry_correspondence_updated_at before update on public.ministry_correspondence
for each row execute function public.touch_ministry_correspondence_updated_at();

-- صلاحية تشغيل أولية آمنة: المرشد يدير سجلاته فقط. صلاحيات الاطلاع الإضافية ستضاف لاحقًا من شاشة الصلاحيات.
alter table public.ministry_correspondence enable row level security;
alter table public.ministry_correspondence_attachments enable row level security;

drop policy if exists correspondence_owner_select on public.ministry_correspondence;
create policy correspondence_owner_select on public.ministry_correspondence for select to authenticated
using (counselor_id = auth.uid());
drop policy if exists correspondence_owner_insert on public.ministry_correspondence;
create policy correspondence_owner_insert on public.ministry_correspondence for insert to authenticated
with check (counselor_id = auth.uid());
drop policy if exists correspondence_owner_update on public.ministry_correspondence;
create policy correspondence_owner_update on public.ministry_correspondence for update to authenticated
using (counselor_id = auth.uid()) with check (counselor_id = auth.uid());
drop policy if exists correspondence_owner_delete on public.ministry_correspondence;
create policy correspondence_owner_delete on public.ministry_correspondence for delete to authenticated
using (counselor_id = auth.uid());

drop policy if exists correspondence_attachment_owner_select on public.ministry_correspondence_attachments;
create policy correspondence_attachment_owner_select on public.ministry_correspondence_attachments for select to authenticated
using (exists(select 1 from public.ministry_correspondence c where c.id = correspondence_id and c.counselor_id = auth.uid()));
drop policy if exists correspondence_attachment_owner_insert on public.ministry_correspondence_attachments;
create policy correspondence_attachment_owner_insert on public.ministry_correspondence_attachments for insert to authenticated
with check (exists(select 1 from public.ministry_correspondence c where c.id = correspondence_id and c.counselor_id = auth.uid()));
drop policy if exists correspondence_attachment_owner_delete on public.ministry_correspondence_attachments;
create policy correspondence_attachment_owner_delete on public.ministry_correspondence_attachments for delete to authenticated
using (exists(select 1 from public.ministry_correspondence c where c.id = correspondence_id and c.counselor_id = auth.uid()));

insert into storage.buckets (id, name, public, file_size_limit)
values ('ministry-correspondence', 'ministry-correspondence', false, 10485760)
on conflict (id) do update set public = false, file_size_limit = 10485760;

drop policy if exists correspondence_storage_select_own on storage.objects;
create policy correspondence_storage_select_own on storage.objects for select to authenticated
using (bucket_id = 'ministry-correspondence' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists correspondence_storage_insert_own on storage.objects;
create policy correspondence_storage_insert_own on storage.objects for insert to authenticated
with check (bucket_id = 'ministry-correspondence' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists correspondence_storage_delete_own on storage.objects;
create policy correspondence_storage_delete_own on storage.objects for delete to authenticated
using (bucket_id = 'ministry-correspondence' and (storage.foldername(name))[1] = auth.uid()::text);
