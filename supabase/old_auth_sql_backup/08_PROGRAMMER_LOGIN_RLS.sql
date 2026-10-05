-- ============================================================
-- 08_PROGRAMMER_LOGIN_RLS.sql
-- دعم حساب PROGRAMMER كرأس هرم النظام
-- شغّل هذا الملف مرة واحدة بعد إضافة قيمة PROGRAMMER إلى enum.
-- ============================================================

-- المبرمج يُعامل كدور إداري أعلى داخل RLS.
create or replace function public.is_admin_role()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.my_role() in ('SUPER_ADMIN','PROGRAMMER','MINISTRY','DIRECTORATE'), false);
$$;

-- السماح للمبرمج بقراءة ملفات الحسابات اللازمة للإدارة.
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
for select to authenticated
using (
  id = auth.uid()
  or public.is_admin_role()
  or (
    public.my_role() = 'PRINCIPAL'
    and (id = auth.uid() or supervisor_id = auth.uid() or school_id = public.my_school_id())
  )
);

-- تأكيد أن حساب المبرمج لا يجمّد نفسه.
create or replace function public.prevent_programmer_self_deactivation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.role = 'PROGRAMMER' and new.is_active = false then
    raise exception 'لا يمكن تجميد حساب المبرمج الرئيسي.';
  end if;
  if old.role = 'PROGRAMMER' and new.role <> 'PROGRAMMER' then
    raise exception 'لا يمكن تغيير وظيفة حساب المبرمج الرئيسي.';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_protect_programmer_account on public.profiles;
create trigger trg_protect_programmer_account
before update on public.profiles
for each row execute function public.prevent_programmer_self_deactivation();

select username, role, job_title, is_active
from public.profiles
where username = 'programmer';
