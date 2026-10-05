-- تسجيل الدخول باسم المستخدم فقط؛ البريد يبقى داخليًا في Supabase.
create or replace function public.resolve_login_email(p_username text)
returns text language sql stable security definer set search_path = public
as $$
  select u.email from auth.users u join public.profiles p on p.id=u.id
  where lower(trim(p.username))=lower(trim(p_username))
    and coalesce(p.is_active,true)=true and u.deleted_at is null limit 1;
$$;
revoke all on function public.resolve_login_email(text) from public;
grant execute on function public.resolve_login_email(text) to anon, authenticated;

-- توحيد البريد الداخلي للحسابات الحالية فقط. لا يظهر البريد في شاشة الدخول.
update auth.users u set email=lower(p.username)||'@counselor.local',
 email_confirmed_at=coalesce(u.email_confirmed_at,now()), updated_at=now()
from public.profiles p where p.id=u.id and p.username is not null
 and lower(coalesce(u.email,''))<>lower(p.username||'@counselor.local');
notify pgrst, 'reload schema';

-- اختبار: select public.resolve_login_email('supervisor_01');
