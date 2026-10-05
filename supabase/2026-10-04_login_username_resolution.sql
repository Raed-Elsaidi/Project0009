-- Allow the username-based login screen to resolve the actual Auth email.
create or replace function public.resolve_login_email(p_username text)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare v_email text;
begin
  select u.email into v_email
  from public.profiles p
  join auth.users u on u.id=p.id
  where lower(trim(p.username))=lower(trim(p_username))
    and coalesce(p.is_active,true)=true
  limit 1;
  return jsonb_build_object('email',v_email);
end;
$$;
revoke all on function public.resolve_login_email(text) from public;
grant execute on function public.resolve_login_email(text) to anon, authenticated;
