-- 2026-10-04 message attachments
-- Private Supabase Storage bucket + attachment metadata.

insert into storage.buckets (id, name, public)
values ('message-attachments', 'message-attachments', false)
on conflict (id) do update set public = false;

create table if not exists public.message_attachments (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.messages(id) on delete cascade,
  file_name text not null,
  storage_path text not null,
  mime_type text not null default 'application/octet-stream',
  size_bytes bigint not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists message_attachments_message_id_idx
  on public.message_attachments(message_id);

alter table public.message_attachments enable row level security;

drop policy if exists message_attachments_select on public.message_attachments;
create policy message_attachments_select
on public.message_attachments
for select to authenticated
using (
  exists (
    select 1 from public.messages m
    where m.id = message_attachments.message_id
      and (m.sender_id = auth.uid() or m.recipient_id = auth.uid())
  )
);

drop policy if exists message_attachments_insert on public.message_attachments;
create policy message_attachments_insert
on public.message_attachments
for insert to authenticated
with check (
  exists (
    select 1 from public.messages m
    where m.id = message_attachments.message_id
      and (m.sender_id = auth.uid() or m.recipient_id = auth.uid())
  )
);

drop policy if exists message_attachments_delete on public.message_attachments;
create policy message_attachments_delete
on public.message_attachments
for delete to authenticated
using (
  exists (
    select 1 from public.messages m
    where m.id = message_attachments.message_id
      and m.sender_id = auth.uid()
  )
);

-- Storage paths are stored as: <sender-user-id>/<uuid>-<filename>
drop policy if exists message_attachments_storage_insert on storage.objects;
create policy message_attachments_storage_insert
on storage.objects
for insert to authenticated
with check (
  bucket_id = 'message-attachments'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists message_attachments_storage_select on storage.objects;
create policy message_attachments_storage_select
on storage.objects
for select to authenticated
using (
  bucket_id = 'message-attachments'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or exists (
      select 1
      from public.message_attachments ma
      join public.messages m on m.id = ma.message_id
      where ma.storage_path = storage.objects.name
        and (m.sender_id = auth.uid() or m.recipient_id = auth.uid())
    )
  )
);

drop policy if exists message_attachments_storage_delete on storage.objects;
create policy message_attachments_storage_delete
on storage.objects
for delete to authenticated
using (
  bucket_id = 'message-attachments'
  and (storage.foldername(name))[1] = auth.uid()::text
);
