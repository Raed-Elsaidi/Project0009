-- ============================================================
-- ترقية هيكل الوظائف ونظام المتابعة والبرنامج الأسبوعي
-- الوظائف: مسؤول الإرشاد > رئيس القسم > المشرف التربوي > المرشد التربوي
-- ملاحظة: نحافظ على enum الحالي لتجنب كسر البيانات القديمة:
-- MINISTRY    = مسؤول الإرشاد
-- DIRECTORATE = رئيس القسم
-- PRINCIPAL   = المشرف التربوي
-- COUNSELOR   = المرشد التربوي
-- ============================================================

-- 1) بيانات الهيكل
alter table public.profiles
  add column if not exists username text,
  add column if not exists national_id text,
  add column if not exists profile_edit_count integer not null default 0,
  add column if not exists supervisor_id uuid references public.profiles(id) on delete set null;

create unique index if not exists uq_profiles_username_lower
  on public.profiles(lower(username))
  where username is not null;

create index if not exists idx_profiles_supervisor_id on public.profiles(supervisor_id);
create index if not exists idx_profiles_role_directorate on public.profiles(role,directorate_id);

alter table public.counselor_registry add column if not exists supervisor_id uuid references public.profiles(id) on delete set null;
create index if not exists idx_counselor_registry_supervisor on public.counselor_registry(supervisor_id);

-- 2) المشرف التربوي يجب أن يكون مسؤولًا عن مرشدين فقط، وبحد أقصى 20 مرشدًا نشطًا.
create or replace function public.validate_supervisor_assignment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  assigned_count integer;
begin
  if new.role = 'COUNSELOR' and new.supervisor_id is not null then
    if not exists (
      select 1 from public.profiles s
      where s.id = new.supervisor_id
        and s.role = 'PRINCIPAL'
        and s.is_active = true
        and (s.directorate_id is null or s.directorate_id = new.directorate_id)
    ) then
      raise exception 'المشرف المحدد غير صالح أو لا يتبع نفس المديرية.';
    end if;

    select count(*) into assigned_count
    from public.profiles c
    where c.role = 'COUNSELOR'
      and c.is_active = true
      and c.supervisor_id = new.supervisor_id
      and c.id <> new.id;

    if assigned_count >= 20 then
      raise exception 'لا يمكن للمشرف الواحد متابعة أكثر من 20 مرشدًا نشطًا.';
    end if;
  end if;

  if new.role <> 'COUNSELOR' then
    new.supervisor_id := null;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_validate_supervisor_assignment on public.profiles;
create trigger trg_validate_supervisor_assignment
before insert or update of role, supervisor_id, directorate_id, is_active
on public.profiles
for each row execute function public.validate_supervisor_assignment();

-- 3) دالة إحصائيات موحدة للوظائف الإشرافية، مع احترام نطاق كل وظيفة.
create or replace function public.supervisory_counselor_stats()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  p public.profiles%rowtype;
  counselor_json jsonb;
  school_count integer;
begin
  select * into p from public.profiles where id = auth.uid();
  if p.id is null or p.role not in ('MINISTRY','DIRECTORATE','PRINCIPAL') then
    raise exception 'غير مصرح للوصول إلى الإحصائيات الإشرافية.';
  end if;

  select count(*) into school_count
  from public.schools s
  where p.role = 'MINISTRY'
     or s.directorate_id = p.directorate_id;

  select coalesce(jsonb_agg(row_to_json(x) order by x.full_name), '[]'::jsonb)
  into counselor_json
  from (
    select
      c.id,
      c.full_name,
      c.job_title,
      c.school_id,
      coalesce(s.name,'غير محددة') as school_name,
      (select count(*) from public.student_counselors sc where sc.counselor_id=c.id and sc.ended_at is null) as students,
      (select count(*) from public.case_studies cs where cs.counselor_id=c.id) as cases,
      (select count(*) from public.hot_cases hc where hc.counselor_id=c.id and hc.status <> 'CLOSED') as hot_cases,
      (select count(*) from public.activities a where a.counselor_id=c.id) as activities
    from public.profiles c
    left join public.schools s on s.id=c.school_id
    where c.role='COUNSELOR' and c.is_active=true
      and (
        p.role='MINISTRY'
        or (p.role='DIRECTORATE' and c.directorate_id=p.directorate_id)
        or (p.role='PRINCIPAL' and c.supervisor_id=p.id)
      )
  ) x;

  return jsonb_build_object(
    'summary', jsonb_build_object(
      'schools', school_count,
      'counselors', jsonb_array_length(counselor_json),
      'students', coalesce((select sum((v->>'students')::integer) from jsonb_array_elements(counselor_json) v),0),
      'cases', coalesce((select sum((v->>'cases')::integer) from jsonb_array_elements(counselor_json) v),0),
      'hotCases', coalesce((select sum((v->>'hot_cases')::integer) from jsonb_array_elements(counselor_json) v),0),
      'activities', coalesce((select sum((v->>'activities')::integer) from jsonb_array_elements(counselor_json) v),0)
    ),
    'counselors', counselor_json
  );
end;
$$;

grant execute on function public.supervisory_counselor_stats() to authenticated;

-- 4) إتاحة قراءة بيانات المرشد للمشرف التربوي ورئيس القسم ومسؤول الإرشاد ضمن نطاقهم.
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
for select to authenticated
using (
  id = auth.uid()
  or public.my_role() in ('SUPER_ADMIN','MINISTRY','DIRECTORATE')
  or (public.my_role()='PRINCIPAL' and (id=auth.uid() or supervisor_id=auth.uid() or school_id=public.my_school_id()))
);

-- 5) البرنامج الأسبوعي: الإحصائيات الإشرافية تُقرأ عبر الدالة أعلاه، والمرشد يدير برنامجه فقط.
-- لا نوسع الكتابة على البرنامج؛ المرشد وحده ينشئ ويعدل برنامجه.

-- 6) توضيح الهيكل في قاعدة البيانات.
comment on column public.profiles.role is 'MINISTRY=مسؤول الإرشاد، DIRECTORATE=رئيس القسم، PRINCIPAL=المشرف التربوي، COUNSELOR=المرشد التربوي';
comment on column public.profiles.supervisor_id is 'للمرشد فقط: المشرف التربوي المباشر المسؤول عن متابعته ضمن المديرية.';


-- مثال تعيين حساب موجود كوظيفة إشرافية (يُستخدم بعد معرفة UUID للحساب):
-- update public.profiles set role='MINISTRY', job_title='مسؤول الإرشاد' where id='AUTH-USER-UUID';
-- update public.profiles set role='DIRECTORATE', job_title='رئيس القسم', directorate_id='DIRECTORATE-UUID' where id='AUTH-USER-UUID';
-- update public.profiles set role='PRINCIPAL', job_title='مشرف تربوي', directorate_id='DIRECTORATE-UUID' where id='AUTH-USER-UUID';

-- 7) المراسلات ضمن الهيكل الجديد.
create or replace function public.can_message_user(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    public.my_role() in ('SUPER_ADMIN','MINISTRY')
    or exists (
      select 1 from public.profiles target
      where target.id=p_user_id and target.is_active=true and (
        (public.my_role()='DIRECTORATE' and target.directorate_id=public.my_directorate_id() and target.role in ('COUNSELOR','PRINCIPAL','DIRECTORATE'))
        or (public.my_role()='PRINCIPAL' and target.supervisor_id=auth.uid())
        or (public.my_role()='COUNSELOR' and target.directorate_id=public.my_directorate_id() and target.role in ('PRINCIPAL','DIRECTORATE'))
      )
    ), false
  );
$$;

drop policy if exists messages_select on public.messages;
create policy messages_select on public.messages
for select to authenticated
using (sender_id=auth.uid() or recipient_id=auth.uid() or public.my_role() in ('SUPER_ADMIN','MINISTRY'));

-- ============================================================
-- إدارة الهيكل والحسابات + طلبات نسيان كلمة المرور
-- ============================================================

-- كود المديرية رقمان وكود المدرسة 8 أرقام.
create unique index if not exists uq_directorates_code_2_digits on public.directorates(code) where code is not null;
create unique index if not exists uq_schools_code_global on public.schools(code) where code is not null;
alter table public.directorates drop constraint if exists directorates_code_format;
alter table public.schools drop constraint if exists schools_code_format;
alter table public.directorates add constraint directorates_code_format check (code is null or code ~ '^[0-9]{2}$');
alter table public.schools add constraint schools_code_format check (code is null or code ~ '^[0-9]{8}$');

-- طلب استعادة كلمة المرور: لا نخزن كلمة المرور الجديدة هنا.
create table if not exists public.password_reset_requests (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.profiles(id) on delete cascade,
  username text not null,
  national_id text not null,
  status text not null default 'PENDING' check (status in ('PENDING','RESET','CLOSED')),
  created_at timestamptz not null default now(),
  verified_by uuid references public.profiles(id) on delete set null,
  verified_at timestamptz,
  reset_at timestamptz
);
create index if not exists idx_password_reset_status on public.password_reset_requests(status,created_at desc);
alter table public.password_reset_requests enable row level security;
drop policy if exists password_reset_select_ministry on public.password_reset_requests;
create policy password_reset_select_ministry on public.password_reset_requests for select to authenticated using (public.my_role()='MINISTRY');
drop policy if exists password_reset_update_ministry on public.password_reset_requests;
create policy password_reset_update_ministry on public.password_reset_requests for update to authenticated using (public.my_role()='MINISTRY') with check (public.my_role()='MINISTRY');

create or replace function public.request_password_reset(p_username text,p_national_id text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare e public.profiles%rowtype; rid uuid;
begin
 select * into e from public.profiles where lower(username)=lower(trim(p_username)) and national_id=trim(p_national_id) and is_active=true limit 1;
 if e.id is not null then
   insert into public.password_reset_requests(employee_id,username,national_id) values(e.id,lower(trim(p_username)),trim(p_national_id)) returning id into rid;
   insert into public.notifications(user_id,title,message,type,entity_type,entity_id)
   select p.id,'طلب استعادة كلمة مرور','يوجد طلب جديد لموظف يحتاج التحقق من الهوية وإعادة ضبط كلمة المرور.','SECURITY','PASSWORD_RESET',rid
   from public.profiles p where p.role='MINISTRY' and p.is_active=true;
 end if;
 return jsonb_build_object('ok',true);
end;$$;
grant execute on function public.request_password_reset(text,text) to anon,authenticated;

create or replace function public.assign_counselors_to_supervisor(p_supervisor_id uuid,p_counselor_ids uuid[])
returns jsonb language plpgsql security definer set search_path=public as $$
declare sp public.profiles%rowtype; cnt integer; bad integer;
begin
 if public.my_role() not in ('MINISTRY','DIRECTORATE') then raise exception 'غير مصرح.'; end if;
 select * into sp from public.profiles where id=p_supervisor_id and role='PRINCIPAL' and is_active=true;
 if sp.id is null then raise exception 'المشرف غير صالح.'; end if;
 if public.my_role()='DIRECTORATE' and sp.directorate_id<>public.my_directorate_id() then raise exception 'المشرف خارج مديريتك.'; end if;
 cnt:=coalesce(array_length(p_counselor_ids,1),0); if cnt>20 then raise exception 'الحد الأعلى 20 مرشدًا للمشرف.'; end if;
 select count(*) into bad from public.profiles where id=any(coalesce(p_counselor_ids,'{}')) and role='COUNSELOR' and is_active=true and directorate_id=sp.directorate_id;
 if bad<>cnt then raise exception 'قائمة المرشدين تحتوي حسابات غير صالحة أو من مديرية أخرى.'; end if;
 update public.profiles set supervisor_id=null where supervisor_id=p_supervisor_id and not (id=any(coalesce(p_counselor_ids,'{}')));
 update public.profiles set supervisor_id=p_supervisor_id where id=any(coalesce(p_counselor_ids,'{}'));
 update public.counselor_registry r set supervisor_id=p_supervisor_id where r.auth_user_id=any(coalesce(p_counselor_ids,'{}'));
 return jsonb_build_object('ok',true,'count',cnt);
end;$$;
grant execute on function public.assign_counselors_to_supervisor(uuid,uuid[]) to authenticated;

-- صلاحيات إنشاء المدرسة تبقى لرئيس القسم داخل مديرته، والمديريات لمسؤول الإرشاد فقط.
comment on table public.password_reset_requests is 'طلبات استعادة كلمة المرور؛ لا يتم تخزين كلمة المرور الجديدة في قاعدة البيانات.';

-- صوت الرسائل الواردة عبر Supabase Realtime.
do $$ begin
  alter publication supabase_realtime add table public.messages;
exception when duplicate_object then null;
end $$;
