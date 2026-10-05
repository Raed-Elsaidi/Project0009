import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  try {
    const authHeader = req.headers.get('Authorization') || ''
    const userClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authHeader } } })
    const { data: { user } } = await userClient.auth.getUser()
    if (!user) return new Response(JSON.stringify({ error: 'غير مصرح.' }), { status: 401, headers: { ...cors, 'Content-Type': 'application/json' } })

    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const { data: manager, error: managerError } = await admin.from('profiles').select('id,role,directorate_id').eq('id', user.id).single()
    if (managerError || !['MINISTRY','DIRECTORATE'].includes(manager?.role)) return new Response(JSON.stringify({ error: 'هذه العملية متاحة لمسؤول الإرشاد أو رئيس القسم.' }), { status: 403, headers: { ...cors, 'Content-Type': 'application/json' } })

    const body = await req.json()
    const { full_name, username, password, national_id, phone, directorate_id, school_id, supervisor_id, job_title = 'مرشد تربوي' } = body
    const cleanUsername = String(username || '').trim().toLowerCase()
    if (!full_name || !cleanUsername || !password || !school_id) throw new Error('الاسم واسم المستخدم وكلمة المرور والمدرسة حقول مطلوبة.')
    if (!/^[a-zA-Z0-9._-]{3,40}$/.test(cleanUsername)) throw new Error('اسم المستخدم يجب أن يكون فريدًا، من 3 إلى 40 محرفًا، وبلا مسافات.')
    if (!/^[A-Za-z0-9!@#$%^&*()_+\-=\[\]{};':\",.<>/?]{8,10}$/.test(password) || !/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/[0-9]/.test(password) || !/[^A-Za-z0-9]/.test(password)) throw new Error('كلمة المرور يجب أن تكون من 8 إلى 10 أحرف وتحتوي على حرف صغير وحرف كبير ورقم ورمز.')
    const { data: usernameTaken } = await admin.from('profiles').select('id').ilike('username', cleanUsername).maybeSingle()
    if (usernameTaken) throw new Error('اسم المستخدم مستخدم مسبقًا. اختر اسمًا فريدًا.')
    if (manager.role === 'DIRECTORATE' && directorate_id !== manager.directorate_id) throw new Error('لا يمكنك إنشاء مرشد خارج مديريتك.')
    const effectiveDirectorate = manager.role === 'MINISTRY' ? directorate_id : manager.directorate_id
    if (!effectiveDirectorate) throw new Error('اختر المديرية.')

    const { data: school, error: schoolError } = await admin.from('schools').select('id,directorate_id').eq('id', school_id).single()
    if (schoolError || !school || school.directorate_id !== effectiveDirectorate) throw new Error('المدرسة ليست ضمن مديريتك.')

    const syntheticEmail = `${cleanUsername}@counselor.local`
    const { data: created, error: createError } = await admin.auth.admin.createUser({ email: syntheticEmail, password, email_confirm: true, user_metadata: { username: cleanUsername, full_name } })
    if (createError) throw createError

    const { error: profileError } = await admin.from('profiles').upsert({ id: created.user.id, full_name, username: cleanUsername, national_id: national_id || null, phone: phone || null, role: 'COUNSELOR', directorate_id: effectiveDirectorate, school_id, supervisor_id: supervisor_id || null, job_title, is_active: true, profile_edit_count: 0 })
    if (profileError) { await admin.auth.admin.deleteUser(created.user.id); throw profileError }

    const { error: registryError } = await admin.from('counselor_registry').insert({ full_name, username: cleanUsername, national_id: national_id || null, email: syntheticEmail, phone: phone || null, directorate_id: effectiveDirectorate, school_id, supervisor_id: supervisor_id || null, job_title, auth_user_id: created.user.id, is_active: true })
    if (registryError) { await admin.auth.admin.deleteUser(created.user.id); throw registryError }

    await admin.from('user_school_assignments').upsert({ user_id: created.user.id, school_id, is_primary: true, start_date: new Date().toISOString().slice(0,10), end_date: null }, { onConflict: 'user_id,school_id' })
    return new Response(JSON.stringify({ ok: true, username: cleanUsername, user_id: created.user.id }), { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } })
  } catch (e) {
    return new Response(JSON.stringify({ error: e?.message || 'تعذر إنشاء المستخدم.' }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } })
  }
})
