-- فحص ومزامنة حسابات التطوير
-- نفّذ هذا الملف في Supabase SQL Editor إذا كان الدخول ما زال يرفض كلمة المرور.
create extension if not exists pgcrypto;

-- عرض الحسابات للتأكد من وجودها:
select email, confirmed_at, last_sign_in_at
from auth.users
where lower(email) in (
 'admin@counselor.local',
 'programmer@counselor.local',
 'section_head_01@counselor.local',
 'head@counselor.local',
 'counselor_01@counselor.local'
)
order by email;

-- مزامنة كلمة مرور مسؤول الإرشاد:
update auth.users
set encrypted_password=crypt('Adm@2026',gen_salt('bf',8)), updated_at=now()
where lower(email)='admin@counselor.local';

-- إذا كنت تختبر حسابًا آخر، نفّذ سطره المناسب:
-- update auth.users set encrypted_password=crypt('Prg@2026',gen_salt('bf',8)), updated_at=now() where lower(email)='programmer@counselor.local';
-- update auth.users set encrypted_password=crypt('Sec@2026',gen_salt('bf',8)), updated_at=now() where lower(email)='section_head_01@counselor.local';
-- update auth.users set encrypted_password=crypt('Sup@2026',gen_salt('bf',8)), updated_at=now() where lower(email)='head@counselor.local';
-- update auth.users set encrypted_password=crypt('Cns@2026',gen_salt('bf',8)), updated_at=now() where lower(email)='counselor_01@counselor.local';
