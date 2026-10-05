-- 2026-10-04 messaging upgrade
-- Emoji support is handled by the UI. This migration adds broadcast/group delivery,
-- delivery status, per-user trash, and an atomic recipient fan-out RPC.

alter table public.messages
  add column if not exists delivered_at timestamptz not null default now(),
  add column if not exists sender_deleted_at timestamptz,
  add column if not exists recipient_deleted_at timestamptz;

update public.messages
set delivered_at = coalesce(delivered_at, created_at)
where delivered_at is null;

drop policy if exists messages_update on public.messages;
create policy messages_update on public.messages
for update to authenticated
using (sender_id = auth.uid() or recipient_id = auth.uid() or public.my_role() in ('SUPER_ADMIN','MINISTRY'))
with check (sender_id = auth.uid() or recipient_id = auth.uid() or public.my_role() in ('SUPER_ADMIN','MINISTRY'));

create or replace function public.send_message_to_recipients(
  p_recipient_ids uuid[],
  p_subject text,
  p_body text,
  p_priority text default 'عادي'
)
returns setof public.messages
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sender uuid := auth.uid();
begin
  if v_sender is null then
    raise exception 'يجب تسجيل الدخول أولاً';
  end if;

  if coalesce(trim(p_subject),'') = '' or coalesce(trim(p_body),'') = '' then
    raise exception 'عنوان الرسالة ونصها مطلوبان';
  end if;

  if p_priority not in ('عادي','مهم','عاجل') then
    raise exception 'أولوية الرسالة غير صحيحة';
  end if;

  return query
  insert into public.messages(
    sender_id, recipient_id, subject, body, priority, delivered_at
  )
  select
    v_sender, r.id, trim(p_subject), trim(p_body), p_priority, now()
  from public.profiles r
  where r.id = any(p_recipient_ids)
    and r.id <> v_sender
    and r.is_active = true
  returning *;
end;
$$;

revoke all on function public.send_message_to_recipients(uuid[],text,text,text) from public;
grant execute on function public.send_message_to_recipients(uuid[],text,text,text) to authenticated;
