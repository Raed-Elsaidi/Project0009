import { requireSupabase } from './supabase'

const db = () => requireSupabase()



export async function currentUser() {
  const { data: { user } } = await db().auth.getUser()
  return user || null
}


export async function ensureMyProfile() {
  const user = await currentUser()
  if (!user) return null
  const { data, error } = await db().from('profiles').select('*, schools(id,name,code,directorate_id), directorates(id,name,code)').eq('id', user.id).maybeSingle()
  if (error) throw error
  if (data) return data
  try { await claimCounselorRegistry() } catch {}
  const { data: claimed } = await db().from('profiles').select('*, schools(id,name,code,directorate_id), directorates(id,name,code)').eq('id', user.id).maybeSingle()
  if (claimed) return claimed
  const meta = user.user_metadata || {}
  const fullName = meta.full_name || meta.name || user.email?.split('@')[0] || 'مرشد تربوي'
  const { data: created, error: createError } = await db().from('profiles').insert({ id:user.id, full_name:fullName, role:'COUNSELOR', job_title:'مرشد تربوي' }).select('*, schools(id,name,code,directorate_id), directorates(id,name,code)').single()
  if (createError) throw createError
  return created
}


export async function listCounselorRegistry(){
  const {data,error}=await db().from('counselor_registry').select('*, directorates(id,name), schools(id,name)').order('full_name')
  if(error) throw error
  return data||[]
}

export async function createCounselorRegistry(payload){
  const { data, error } = await db().from('counselor_registry').insert({
    full_name:payload.full_name.trim(), username:payload.username.trim().toLowerCase(), national_id:payload.national_id?.trim()||null,
    email:payload.email?.trim().toLowerCase()||null, phone:payload.phone?.trim()||null, directorate_id:payload.directorate_id,
    school_id:payload.school_id, job_title:payload.job_title?.trim()||'مرشد تربوي'
  }).select('*, directorates(id,name), schools(id,name)').single()
  if(error) throw error
  return data
}

export async function createCounselorAccount(payload){
  const { data, error } = await db().functions.invoke('create-counselor', { body: payload })
  if(error) throw error
  if(data?.error) throw new Error(data.error)
  return data
}

export async function transferCounselor(counselorId, schoolId){
  const {data,error}=await db().from('counselor_registry').update({school_id:schoolId}).eq('id',counselorId).select('*, directorates(id,name), schools(id,name)').single()
  if(error) throw error
  if(data.auth_user_id){
    const {error:pe}=await db().from('profiles').update({school_id:schoolId,directorate_id:data.directorate_id}).eq('id',data.auth_user_id)
    if(pe) throw pe
    await db().from('user_school_assignments').upsert({user_id:data.auth_user_id,school_id:schoolId,is_primary:true,start_date:new Date().toISOString().slice(0,10),end_date:null},{onConflict:'user_id,school_id'})
  }
  return data
}

export async function claimCounselorRegistry(){
  const {data,error}=await db().rpc('claim_counselor_registry')
  if(error) throw error
  return data
}

export async function listDirectorates() {
  const { data, error } = await db().from('directorates').select('id,name,code').order('name')
  if (error) throw error
  return data || []
}

export async function listSchoolsByDirectorate(directorateId) {
  let q = db().from('schools').select('id,name,code,directorate_id').order('name')
  if (directorateId) q = q.eq('directorate_id', directorateId)
  const { data, error } = await q
  if (error) throw error
  return data || []
}

export async function updateMyProfile(payload) {
  const user = await currentUser()
  if (!user) throw new Error('انتهت جلسة الدخول.')
  const { data, error } = await db().from('profiles').update({
    full_name: payload.full_name,
    phone: payload.phone || null,
    national_id: payload.national_id || null,
    directorate_id: payload.directorate_id || null,
    school_id: payload.school_id || null,
    job_title: payload.job_title || 'مرشد تربوي',
    profile_edit_count: 1
  }).eq('id', user.id).select('*, schools(id,name,code,directorate_id), directorates(id,name,code)').single()
  if (error) throw error
  return data
}

export async function currentProfile() {
  const user = await currentUser()
  if (!user) return null
  const { data, error } = await db().rpc('get_my_profile')
  if (error) throw error
  return data || null
}

export async function listStudents() {
  const { data, error } = await db().from('students')
    .select('*, grades(id,name), sections(id,name), student_counselors!inner(counselor_id,is_primary,ended_at)')
    .order('full_name')
  if (error) throw error
  return data || []
}

export async function listWeeklyPrograms() {
  const { data, error } = await db().from('weekly_programs')
    .select('*, schools(id,name), school_years(id,name), semesters(id,name,type), weekly_program_items(*)')
    .order('week_start', { ascending: false })
  if (error) throw error
  return data || []
}

export async function createWeeklyProgram(payload) {
  const user = await currentUser()
  const profile = await currentProfile()
  if (!user || !profile?.school_id) throw new Error('لم يتم ربط حسابك بمدرسة بعد.')
  const { data, error } = await db().from('weekly_programs').insert({
    counselor_id: user.id,
    school_id: profile.school_id,
    ...payload
  }).select().single()
  if (error) throw error
  return data
}

export async function createWeeklyItem(payload) {
  const { data, error } = await db().from('weekly_program_items').insert(payload).select().single()
  if (error) throw error
  return data
}

export async function updateWeeklyItem(id, payload) {
  const { data, error } = await db().from('weekly_program_items').update(payload).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteWeeklyItem(id) {
  const { error } = await db().from('weekly_program_items').delete().eq('id', id)
  if (error) throw error
}

export async function listActiveAcademicData() {
  const sb = db()
  const [{ data: years, error: yErr }, { data: semesters, error: sErr }, { data: grades, error: gErr }] = await Promise.all([
    sb.from('school_years').select('*').eq('is_active', true).order('start_date', { ascending: false }),
    sb.from('semesters').select('*').order('start_date', { ascending: false }),
    sb.from('grades').select('*').order('sort_order')
  ])
  if (yErr) throw yErr
  if (sErr) throw sErr
  if (gErr) throw gErr
  return { years: years || [], semesters: semesters || [], grades: grades || [] }
}

export async function listNotes() {
  const { data, error } = await db().from('notes').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function createNote(payload) {
  const user = await currentUser()
  if (!user) throw new Error('انتهت جلسة الدخول.')
  const { data, error } = await db().from('notes').insert({ user_id: user.id, ...payload }).select().single()
  if (error) throw error
  return data
}

export async function updateNote(id, payload) {
  const { data, error } = await db().from('notes').update(payload).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteNote(id) {
  const { error } = await db().from('notes').delete().eq('id', id)
  if (error) throw error
}

export async function changePassword(password) {
  const { error } = await db().auth.updateUser({ password })
  if (error) throw error
}

export async function logAudit(action, tableName, recordId = null, metadata = {}) {
  const user = await currentUser()
  if (!user) return
  await db().from('audit_logs').insert({ user_id: user.id, action, table_name: tableName, record_id: recordId, metadata })
}


export async function createDirectorate(payload) {
  const { data, error } = await db().from('directorates').insert(payload).select().single()
  if (error) throw error
  return data
}

export async function createSchool(payload) {
  const { data, error } = await db().from('schools').insert(payload).select('*, directorates(id,name)').single()
  if (error) throw error
  return data
}

export async function listOrganization() {
  const sb = db()
  const [{ data: directorates, error: dErr }, { data: schools, error: sErr }, { data: profiles, error: pErr }] = await Promise.all([
    sb.from('directorates').select('*').order('name'),
    sb.from('schools').select('*, directorates(id,name)').order('name'),
    sb.from('profiles').select('id,full_name,role,is_active,directorate_id,school_id,job_title,schools(id,name),directorates(id,name)').order('full_name')
  ])
  if (dErr) throw dErr
  if (sErr) throw sErr
  if (pErr) throw pErr
  return { directorates: directorates || [], schools: schools || [], profiles: profiles || [] }
}

export async function dashboardStats() {
  const sb = db()
  const [students, cases, hot, activities] = await Promise.all([
    sb.from('students').select('id', { count: 'exact', head: true }),
    sb.from('case_studies').select('id', { count: 'exact', head: true }),
    sb.from('hot_cases').select('id', { count: 'exact', head: true }).neq('status', 'CLOSED'),
    sb.from('activities').select('id', { count: 'exact', head: true })
  ])
  const err = [students, cases, hot, activities].find(x => x.error)
  if (err) throw err.error
  return { students: students.count || 0, cases: cases.count || 0, hotCases: hot.count || 0, activities: activities.count || 0 }
}


export async function directorateStats() {
  const profile = await currentProfile()
  if (!profile || !['MINISTRY','DIRECTORATE','PRINCIPAL'].includes(profile.role)) throw new Error('هذه الإحصائيات مخصصة للوظائف الإشرافية.')
  const { data, error } = await db().rpc('supervisory_counselor_stats')
  if (error) throw error
  return data || {summary:{schools:0,counselors:0,students:0,cases:0,hotCases:0,activities:0},counselors:[]}
}

export async function listMessageRecipients(){
  const profile=await currentProfile()
  if(!profile) throw new Error('انتهت جلسة الدخول.')
  let q=db().from('profiles').select('id,full_name,role,directorate_id,school_id,is_active,schools(id,name),directorates(id,name)').eq('is_active',true).neq('id',profile.id).order('full_name')
  if(profile.role==='COUNSELOR') q=q.in('role',['PRINCIPAL','DIRECTORATE']).eq('directorate_id',profile.directorate_id)
  else if(profile.role==='PRINCIPAL') q=q.in('role',['COUNSELOR','DIRECTORATE']).eq('directorate_id',profile.directorate_id)
  else if(profile.role==='DIRECTORATE') q=q.in('role',['COUNSELOR','PRINCIPAL','DIRECTORATE']).eq('directorate_id',profile.directorate_id)
  else q=q.in('role',['COUNSELOR','PRINCIPAL','DIRECTORATE','MINISTRY'])
  const {data,error}=await q
  if(error) throw error
  return data||[]
}

export async function listMessages(){
  const user=await currentUser(); if(!user) throw new Error('انتهت جلسة الدخول.')
  const {data,error}=await db().from('messages').select('*,sender:sender_id(id,full_name,role),recipient:recipient_id(id,full_name,role,schools(id,name))').or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`).order('created_at',{ascending:false})
  if(error) throw error
  return data||[]
}

export async function sendMessage(payload){
  const user=await currentUser(); if(!user) throw new Error('انتهت جلسة الدخول.')
  const {data,error}=await db().from('messages').insert({sender_id:user.id,recipient_id:payload.recipient_id,subject:payload.subject.trim(),body:payload.body.trim(),priority:payload.priority||'عادي',parent_id:payload.parent_id||null}).select('*,sender:sender_id(id,full_name,role),recipient:recipient_id(id,full_name,role,schools(id,name))').single()
  if(error) throw error
  return data
}

export async function markMessageRead(id){
  const {error}=await db().from('messages').update({read_at:new Date().toISOString()}).eq('id',id).is('read_at',null)
  if(error) throw error
}

export async function updateDirectorate(id,payload){
  const {data,error}=await db().from('directorates').update({name:payload.name,code:payload.code}).eq('id',id).select().single();
  if(error) throw error; return data
}
export async function deleteDirectorate(id){const {error}=await db().from('directorates').delete().eq('id',id);if(error) throw error}
export async function updateSchool(id,payload){const {data,error}=await db().from('schools').update({name:payload.name,code:payload.code,directorate_id:payload.directorate_id}).eq('id',id).select('*,directorates(id,name,code)').single();if(error) throw error;return data}
export async function deleteSchool(id){const {error}=await db().from('schools').delete().eq('id',id);if(error) throw error}

export async function createEmployeeAccount(payload){
  const {data,error}=await db().rpc('create_employee_account',{
    p_directorate_id: payload.directorate_id || null,
    p_employee_number: payload.employee_number?.trim() || null,
    p_full_name: payload.full_name.trim(),
    p_gender: payload.gender || null,
    p_job_title: payload.job_title?.trim() || null,
    p_national_id: payload.national_id?.trim() || null,
    p_password: payload.password,
    p_phone: payload.phone?.trim() || null,
    p_role: payload.role,
    p_school_id: payload.school_id || null,
    p_username: payload.username.trim().toLowerCase()
  });
  if(error) throw error;
  if(data?.error) throw new Error(data.error);
  return data;
}
export async function listEmployeeProfiles(){
  const {data,error}=await db().from('profiles').select('id,full_name,username,national_id,role,is_active,directorate_id,school_id,supervisor_id,job_title,schools(id,name,code),directorates(id,name,code)').in('role',['DIRECTORATE','PRINCIPAL','COUNSELOR']).order('full_name');
  if(error) throw error; return data||[]
}
export async function assignCounselorsToSupervisor(supervisorId,counselorIds){
  const {data,error}=await db().rpc('assign_counselors_to_supervisor',{p_supervisor_id:supervisorId,p_counselor_ids:counselorIds||[]});
  if(error) throw error; return data
}
export async function listPasswordResetRequests(){
  const {data,error}=await db().from('password_reset_requests').select('*,employee:employee_id(id,full_name,username,national_id,role,directorates(id,name),schools(id,name))').order('created_at',{ascending:false});
  if(error) throw error; return data||[]
}
export async function requestPasswordReset(payload){
  const {data,error}=await db().rpc('request_password_reset',{p_username:payload.username.trim().toLowerCase(),p_national_id:payload.national_id.trim()});
  if(error) throw error; return data
}
export async function requestPasswordResetPublic(payload){
  const {data,error}=await db().rpc('reset_password_public',{
    p_username: payload.username.trim().toLowerCase(),
    p_national_id: payload.national_id.trim(),
    p_phone: payload.phone.trim()
  });
  if(error) throw error;
  if(data?.error) throw new Error(data.error);
  return data;
}

export async function resetEmployeePassword(payload){
  const {data,error}=await db().functions.invoke('reset-employee-password',{body:payload});
  if(error) throw error; if(data?.error) throw new Error(data.error); return data
}
