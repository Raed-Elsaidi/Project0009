import { requireSupabase } from './supabase'

const db = () => requireSupabase()

let systemProfileCache = null

export async function currentUser() {
  const profile = await currentProfile()
  return profile ? { id: profile.id, profile } : null
}

async function resolveSystemProfile() {
  if (systemProfileCache) return systemProfileCache
  const storedId = typeof localStorage !== 'undefined' ? localStorage.getItem('system_profile_id') : null
  if (!storedId) throw new Error('يجب تسجيل الدخول أولاً.')
  let q = db().from('profiles').select('*, schools(id,name,code,directorate_id), directorates(id,name,code)').eq('is_active', true).eq('id', storedId)
  const { data, error } = await q.maybeSingle()
  if (error) throw error
  if (!data) throw new Error('لا توجد بيانات موظف نشطة في النظام.')
  if (typeof localStorage !== 'undefined') localStorage.setItem('system_profile_id', data.id)
  systemProfileCache = data
  return data
}


export async function ensureMyProfile() {
  return resolveSystemProfile()
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

export async function transferCounselor(counselorId, schoolId){
  const {data,error}=await db().from('counselor_registry').update({school_id:schoolId}).eq('id',counselorId).select('*, directorates(id,name), schools(id,name)').single()
  if(error) throw error
  if(data.id){
    const {error:pe}=await db().from('profiles').update({school_id:schoolId,directorate_id:data.directorate_id}).eq('id',data.id)
    if(pe) throw pe
    await db().from('user_school_assignments').upsert({user_id:data.id,school_id:schoolId,is_primary:true,start_date:new Date().toISOString().slice(0,10),end_date:null},{onConflict:'user_id,school_id'})
  }
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
  return resolveSystemProfile()
}

export async function listStudents() {
  const { data, error } = await db().from('students')
    .select('*, grades(id,name), sections(id,name), school_years(id,name), semesters(id,name), student_counselors!inner(counselor_id,is_primary,ended_at)')
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
  const profile = await currentProfile()
  if (!profile?.id || !profile?.school_id) throw new Error('لم يتم ربط حساب الموظف بمدرسة بعد.')
  const { data, error } = await db().from('weekly_programs').insert({
    counselor_id: profile.id,
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

export async function createActivityRecord(payload){
  const user=await currentUser(); if(!user) throw new Error('انتهت جلسة الدخول.')
  const profile=await currentProfile(); if(!profile?.school_id) throw new Error('لم يتم ربط حسابك بمدرسة بعد.')
  const {data,error}=await db().from('activities').insert({counselor_id:user.id,school_id:profile.school_id,...payload}).select().single()
  if(error) throw error
  return data
}

export async function getActivityRecord(id){
  const {data,error}=await db().from('activities').select('*').eq('id',id).single()
  if(error) throw error
  return data
}

export async function updateActivityRecord(id,payload){
  const {data,error}=await db().from('activities').update(payload).eq('id',id).select().single()
  if(error) throw error
  return data
}

export async function listActiveAcademicData() {
  const sb = db()
  const [{ data: years, error: yErr }, { data: semesters, error: sErr }, { data: grades, error: gErr }] = await Promise.all([
    sb.from('school_years').select('*').order('start_date', { ascending: false, nullsFirst: false }).order('name', { ascending: false }),
    sb.from('semesters').select('*').order('start_date', { ascending: false }),
    sb.from('grades').select('*').order('sort_order')
  ])
  if (yErr) throw yErr
  if (sErr) throw sErr
  if (gErr) throw gErr
  return { years: years || [], semesters: semesters || [], grades: grades || [] }
}



export async function createInterviewRecord(payload){
  const user=await currentUser(); if(!user) throw new Error('انتهت جلسة الدخول.')
  const profile=await currentProfile(); if(!profile?.school_id) throw new Error('لم يتم ربط حسابك بمدرسة بعد.')
  const {data,error}=await db().from('interviews').insert({counselor_id:user.id,school_id:profile.school_id,...payload}).select().single()
  if(error) throw error; return data
}
export async function getInterviewRecord(id){
  const {data,error}=await db().from('interviews').select('*').eq('id',id).single(); if(error) throw error; return data
}
export async function updateInterviewRecord(id,payload){
  const {data,error}=await db().from('interviews').update(payload).eq('id',id).select().single(); if(error) throw error; return data
}

export async function createGuidanceRecord(payload){
  const user=await currentUser(); if(!user) throw new Error('انتهت جلسة الدخول.')
  const profile=await currentProfile(); if(!profile?.school_id) throw new Error('لم يتم ربط حسابك بمدرسة بعد.')
  const {data,error}=await db().from('guidance_sessions').insert({counselor_id:user.id,school_id:profile.school_id,...payload}).select().single()
  if(error) throw error; return data
}
export async function getGuidanceRecord(id){
  const {data,error}=await db().from('guidance_sessions').select('*').eq('id',id).single(); if(error) throw error; return data
}
export async function updateGuidanceRecord(id,payload){
  const {data,error}=await db().from('guidance_sessions').update(payload).eq('id',id).select().single(); if(error) throw error; return data
}

export async function createGroupCounselingRecord(payload){
  const user=await currentUser(); if(!user) throw new Error('انتهت جلسة الدخول.')
  const profile=await currentProfile(); if(!profile?.school_id) throw new Error('لم يتم ربط حسابك بمدرسة بعد.')
  const {session, ...groupPayload}=payload
  const {data:group,error:groupError}=await db().from('group_counseling_groups').insert({counselor_id:user.id,school_id:profile.school_id,...groupPayload}).select().single()
  if(groupError) throw groupError
  if(session){
    const {error:sessionError}=await db().from('group_sessions').insert({group_id:group.id,...session})
    if(sessionError) throw sessionError
  }
  return group
}
export async function getGroupCounselingRecord(id){
  const {data:group,error}=await db().from('group_counseling_groups').select('*').eq('id',id).single(); if(error) throw error
  const {data:sessions}=await db().from('group_sessions').select('*').eq('group_id',id).order('session_date',{ascending:false}).limit(1)
  return {...group,session:sessions?.[0]||null}
}
export async function updateGroupCounselingRecord(id,payload){
  const {session,...groupPayload}=payload
  const {data:group,error}=await db().from('group_counseling_groups').update(groupPayload).eq('id',id).select().single(); if(error) throw error
  if(session){
    const {data:existing}=await db().from('group_sessions').select('id').eq('group_id',id).order('session_date',{ascending:false}).limit(1)
    if(existing?.[0]?.id){
      const {error:e}=await db().from('group_sessions').update(session).eq('id',existing[0].id); if(e) throw e
    }else{
      const {error:e}=await db().from('group_sessions').insert({group_id:id,...session}); if(e) throw e
    }
  }
  return group
}

export async function linkWeeklyWork(itemId,{work_record_id,work_route,work_label}){
  const {data,error}=await db().from('weekly_program_items').update({work_record_id,work_route,work_label,topic:work_label,work_saved_at:new Date().toISOString()}).eq('id',itemId).select().single()
  if(error) throw error; return data
}
export async function deleteWeeklyWorkItem(id){
  const {error}=await db().from('weekly_program_items').delete().eq('id',id); if(error) throw error
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

export async function listOrganization(){
  const [{data:directorates,error:dErr},{data:schools,error:sErr},{data:profiles,error:pErr}]=await Promise.all([
    db().from('directorates').select('id,name,code').order('name'),
    db().from('schools').select('id,name,code,directorate_id').order('name'),
    db().from('profiles').select('id,full_name,role,is_active,directorate_id,school_id,job_title,directorates(id,name),schools(id,name)').eq('is_active',true).order('full_name')
  ])
  if(dErr||sErr||pErr) throw (dErr||sErr||pErr)
  return {directorates:directorates||[],schools:schools||[],profiles:profiles||[]}
}

export async function createAcademicYear({name, start_date=null, end_date=null}) {
  const sb = db()
  const { data: year, error } = await sb.from('school_years').insert({name, start_date, end_date, is_active:true}).select().single()
  if (error) throw error
  await sb.from('school_years').update({is_active:false}).neq('id', year.id)
  const { error: semError } = await sb.from('semesters').insert([
    {school_year_id:year.id, type:'FIRST', name:'الأول'},
    {school_year_id:year.id, type:'SECOND', name:'الثاني'}
  ])
  if (semError && !String(semError.message||'').toLowerCase().includes('duplicate')) throw semError
  return year
}

export async function setActiveAcademicYear(id) {
  const sb = db()
  const { error } = await sb.from('school_years').update({is_active:false}).neq('id', id)
  if (error) throw error
  const { data, error: e2 } = await sb.from('school_years').update({is_active:true}).eq('id', id).select().single()
  if (e2) throw e2
  return data
}

export async function listAcademicYears() {
  const {data,error}=await db().from('school_years').select('*, semesters(id,type,name,start_date,end_date)').order('start_date',{ascending:false,nullsFirst:false}).order('name',{ascending:false})
  if(error) throw error
  return data||[]
}

export async function dashboardStats(schoolYearId='', semesterId='') {
  const sb = db()
  const applyAcademic = q => {
    if (schoolYearId) q = q.eq('school_year_id', schoolYearId)
    if (semesterId) q = q.eq('semester_id', semesterId)
    return q
  }
  const studentsQ = sb.from('students').select('id', { count: 'exact', head: true })
  const [students, cases, hot, activities] = await Promise.all([
    studentsQ,
    applyAcademic(sb.from('case_studies').select('id', { count: 'exact', head: true })),
    applyAcademic(sb.from('hot_cases').select('id', { count: 'exact', head: true }).neq('status', 'CLOSED')),
    applyAcademic(sb.from('activities').select('id', { count: 'exact', head: true }))
  ])
  const err = [students, cases, hot, activities].find(x => x.error)
  if (err) throw err.error
  return { students: students.count || 0, cases: cases.count || 0, hotCases: hot.count || 0, activities: activities.count || 0 }
}


export async function directorateStats() {
  const profile = await currentProfile()
  if (!profile || !['MINISTRY','DIRECTORATE','PRINCIPAL','PROGRAMMER'].includes(profile.role)) throw new Error('هذه الإحصائيات مخصصة للوظائف الإشرافية.')
  const sb = db()
  const [schools, counselors, students, cases, hotCases, activities] = await Promise.all([
    sb.from('schools').select('id', { count: 'exact', head: true }),
    sb.from('profiles').select('id', { count: 'exact', head: true }).eq('role','COUNSELOR').eq('is_active',true),
    sb.from('students').select('id', { count: 'exact', head: true }),
    sb.from('case_studies').select('id', { count: 'exact', head: true }),
    sb.from('hot_cases').select('id', { count: 'exact', head: true }).neq('status','CLOSED'),
    sb.from('activities').select('id', { count: 'exact', head: true })
  ])
  const err=[schools,counselors,students,cases,hotCases,activities].find(x=>x.error)
  if(err) throw err.error
  return {summary:{schools:schools.count||0,counselors:counselors.count||0,students:students.count||0,cases:cases.count||0,hotCases:hotCases.count||0,activities:activities.count||0},counselors:[]}
}

export async function listMessageRecipients(){
  const profile=await currentProfile()
  if(!profile) throw new Error('انتهت جلسة الدخول.')
  const {data,error}=await db().from('profiles')
    .select('id,full_name,role,directorate_id,school_id,is_active,schools(id,name),directorates(id,name)')
    .eq('is_active',true).neq('id',profile.id).order('full_name')
  if(error) throw error
  return data||[]
}

export async function listMessageDepartments(){
  const {data,error}=await db().from('directorates').select('id,name,code').order('name')
  if(error) throw error
  return data||[]
}

export async function listMessages(){
  const user=await currentUser(); if(!user) throw new Error('انتهت جلسة الدخول.')
  const {data,error}=await db().from('messages')
    .select('*,sender:sender_id(id,full_name,role),recipient:recipient_id(id,full_name,role,schools(id,name),directorates(id,name))')
    .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
    .order('created_at',{ascending:false})
  if(error) throw error
  return data||[]
}

export async function sendMessage(payload){
  const user=await currentUser(); if(!user) throw new Error('لا توجد بيانات موظف أساسية.')
  const recipientIds=(payload.recipient_ids||payload.recipient_id?[...(payload.recipient_ids||[payload.recipient_id])]:[]).filter(Boolean)
  if(!recipientIds.length) throw new Error('يرجى اختيار المستلم.')
  const rows=recipientIds.map(recipient_id=>({sender_id:user.id,recipient_id,subject:payload.subject?.trim()||'',body:payload.body?.trim()||'',priority:payload.priority||'عادي'}))
  const {data,error}=await db().from('messages').insert(rows).select('*')
  if(error) throw error
  return data||[]
}

export async function uploadMessageAttachment(messageIds, file){
  const user=await currentUser();
  if(!user) throw new Error('انتهت جلسة الدخول.')
  if(!file) return []
  const maxSize=10*1024*1024
  if(file.size>maxSize) throw new Error('حجم المرفق يجب ألا يتجاوز 10 MB.')
  const safeName=file.name.replace(/[^\w.\-\u0600-\u06FF ]/g,'_').replace(/\s+/g,'_')
  const path=`${user.id}/${crypto.randomUUID()}-${safeName}`
  const {error:uploadError}=await db().storage.from('message-attachments').upload(path,file,{contentType:file.type||'application/octet-stream',upsert:false})
  if(uploadError) throw uploadError
  const rows=(messageIds||[]).map(messageId=>({message_id:messageId,file_name:file.name,storage_path:path,mime_type:file.type||'application/octet-stream',size_bytes:file.size}))
  if(rows.length){
    const {data,error}=await db().from('message_attachments').insert(rows).select('*')
    if(error){ await db().storage.from('message-attachments').remove([path]); throw error }
    return data||[]
  }
  return []
}

export async function listMessageAttachments(messageId){
  const {data,error}=await db().from('message_attachments').select('id,file_name,storage_path,mime_type,size_bytes,created_at').eq('message_id',messageId).order('created_at')
  if(error) throw error
  return data||[]
}

export async function openMessageAttachment(storagePath){
  const {data,error}=await db().storage.from('message-attachments').createSignedUrl(storagePath,60*10)
  if(error) throw error
  if(!data?.signedUrl) throw new Error('تعذر فتح المرفق.')
  window.open(data.signedUrl,'_blank','noopener,noreferrer')
}

export async function markMessageRead(id){
  const {error}=await db().from('messages').update({read_at:new Date().toISOString()}).eq('id',id).is('read_at',null)
  if(error) throw error
}

export async function deleteMessage(id,side){
  const field=side==='sent'?'sender_deleted_at':'recipient_deleted_at'
  const {error}=await db().from('messages').update({[field]:new Date().toISOString()}).eq('id',id)
  if(error) throw error
}

export async function updateDirectorate(id,payload){
  const {data,error}=await db().from('directorates').update({name:payload.name,code:payload.code}).eq('id',id).select().single();
  if(error) throw error; return data
}
export async function deleteDirectorate(id){const {error}=await db().from('directorates').delete().eq('id',id);if(error) throw error}
export async function updateSchool(id,payload){const {data,error}=await db().from('schools').update({name:payload.name,code:payload.code,directorate_id:payload.directorate_id}).eq('id',id).select('*,directorates(id,name,code)').single();if(error) throw error;return data}
export async function deleteSchool(id){const {error}=await db().from('schools').delete().eq('id',id);if(error) throw error}

export async function verifyEmployeeIdentity({username,nationalId,phone}){
  const {data,error}=await db().rpc('employee_verify_identity',{
    p_username:username.trim().toLowerCase(),
    p_national_id:nationalId.trim(),
    p_phone:phone.trim()
  })
  if(error) throw error
  if(!data?.success) throw new Error(data?.message||'البيانات المدخلة غير صحيحة.')
  return data
}

export async function resetEmployeePassword({username,nationalId,phone,password}){
  const {data,error}=await db().rpc('employee_reset_password',{
    p_username:username.trim().toLowerCase(),
    p_national_id:nationalId.trim(),
    p_phone:phone.trim(),
    p_password:password
  })
  if(error) throw error
  if(!data?.success) throw new Error(data?.message||'البيانات المدخلة غير صحيحة.')
  return data
}

export async function loginEmployee(username,password){
  const {data,error}=await db().rpc('employee_login',{p_username:username.trim().toLowerCase(),p_password:password})
  if(error) throw error
  if(!data?.success) throw new Error(data?.message||'اسم المستخدم أو كلمة المرور غير صحيحة.')
  if(typeof localStorage!=='undefined') localStorage.setItem('system_profile_id',data.profile_id)
  systemProfileCache=null
  return data
}

export async function createEmployeeAccount(payload){
  const username=payload.username?.trim().toLowerCase()||''
  const password=payload.password||''
  if(!username) throw new Error('اسم المستخدم مطلوب.')
  if(!password) throw new Error('كلمة المرور مطلوبة.')
  const {data,error}=await db().from('profiles').insert({
    full_name:payload.full_name.trim(),national_id:payload.national_id?.trim()||null,
    employee_number:payload.employee_number?.trim()||null,phone:payload.phone?.trim()||null,gender:payload.gender||null,
    username,directorate_id:payload.directorate_id||null,
    school_id:payload.school_id||null,role:payload.role,job_title:payload.job_title||'',manager_name:payload.manager_name?.trim()||null,is_active:true
  }).select('id,full_name,username,role,directorate_id,school_id,job_title').single()
  if(error) throw error
  const {error:passwordError}=await db().rpc('employee_set_password',{p_profile_id:data.id,p_password:password})
  if(passwordError){ await db().from('profiles').delete().eq('id',data.id); throw passwordError }
  systemProfileCache=null
  return {...data,user_id:data.id}
}
export async function listEmployeeProfiles(){
  const {data,error}=await db().from('profiles').select('*, directorates(id,name,code), schools(id,name,code,directorate_id)').neq('role','PROGRAMMER').order('full_name')
  if(error) throw error
  return data||[]
}
export async function updateEmployeeProfile(profileId,payload){
  const patch={
    full_name:payload.full_name,national_id:payload.national_id||null,employee_number:payload.employee_number||null,
    phone:payload.phone||null,gender:payload.gender||null,school_id:payload.school_id||null,
    username:payload.username?.trim().toLowerCase()||undefined,job_title:payload.job_title||undefined,manager_name:payload.manager_name?.trim()||null
  }
  const {data,error}=await db().from('profiles').update(patch).eq('id',profileId).select('*, directorates(id,name,code), schools(id,name,code,directorate_id)').single()
  if(error) throw error
  if(payload.password){
    const {error:passwordError}=await db().rpc('employee_set_password',{p_profile_id:profileId,p_password:payload.password})
    if(passwordError) throw passwordError
  }
  if(typeof localStorage!=='undefined' && localStorage.getItem('system_profile_id')===profileId) systemProfileCache=null
  return data||{ok:true}
}
export async function deleteEmployeeAccount(profileId){
  const {data,error}=await db().from('profiles').update({is_active:false}).eq('id',profileId).select().single()
  if(error) throw error
  if(typeof localStorage!=='undefined' && localStorage.getItem('system_profile_id')===profileId) localStorage.removeItem('system_profile_id')
  return data||{ok:true}
}
export async function assignCounselorsToSupervisor(supervisorId,counselorIds){
  const ids=counselorIds||[]
  const {error:clearError}=await db().from('profiles').update({supervisor_id:null}).eq('role','COUNSELOR').eq('supervisor_id',supervisorId)
  if(clearError) throw clearError
  if(!ids.length) return {ok:true}
  const {data,error}=await db().from('profiles').update({supervisor_id:supervisorId}).in('id',ids).select('id')
  if(error) throw error
  return {ok:true,assigned:data||[]}
}

export const PERMISSION_CATALOG=[
 {key:'directorate-dashboard',label:'الإحصائيات والمتابعة',section:'المتابعة'},
 {key:'directorates',label:'المديريات',section:'الهيكل الإداري'},
 {key:'schools',label:'المدارس',section:'الهيكل الإداري'},
 {key:'administration',label:'إدارة الموظفين / المرشدين',section:'الموظفون'},
 {key:'weekly-program',label:'البرنامج اليومي/الأسبوعي',section:'الإرشاد التربوي'},
 {key:'dashboard',label:'ملخص أعمالي',section:'الإرشاد التربوي'},
 {key:'students',label:'الطلاب',section:'الإرشاد التربوي'},
 {key:'cases',label:'دراسة الحالات',section:'الإرشاد التربوي'},
 {key:'hot-cases',label:'الحالات الساخنة',section:'الإرشاد التربوي'},
 {key:'interviews',label:'المقابلات والاستشارات',section:'الإرشاد التربوي'},
 {key:'absence',label:'الغياب',section:'المتابعة الطلابية'},
 {key:'lateness',label:'التأخر الصباحي',section:'المتابعة الطلابية'},
 {key:'dropout',label:'التسرب',section:'المتابعة الطلابية'},
 {key:'activities',label:'الأنشطة',section:'البرامج الإرشادية'},
 {key:'group-counseling',label:'الإرشاد الجمعي',section:'البرامج الإرشادية'},
 {key:'guidance',label:'الإرشاد التوجيهي',section:'البرامج الإرشادية'},
 {key:'annual-plan',label:'الخطة السنوية',section:'الخطط والتقارير'},
 {key:'reports',label:'التقارير',section:'الخطط والتقارير'},
 {key:'notes',label:'دفتر الملاحظات',section:'الأدوات'},
 {key:'notifications',label:'الإشعارات',section:'التواصل'},
 {key:'messages',label:'المراسلات',section:'التواصل'},
 {key:'profile',label:'البيانات الشخصية',section:'الحساب'},
]
export async function getPermissionCatalog(){return PERMISSION_CATALOG}
export async function listPermissionEmployees(profile){
 let q=db().from('profiles').select('id,full_name,username,role,is_active,directorate_id,school_id,job_title,directorates(id,name),schools(id,name)').eq('is_active',true).neq('role','PROGRAMMER').order('full_name')
 if(profile?.role==='DIRECTORATE') q=q.eq('directorate_id',profile.directorate_id)
 const {data,error}=await q; if(error) throw error; return data||[]
}
export async function getEmployeePermissions(profileId){
 const {data,error}=await db().from('employee_permissions').select('screen_key').eq('profile_id',profileId)
 if(error) throw error; return (data||[]).map(x=>x.screen_key)
}
export async function getMyPermissions(){
 const user=await currentUser(); if(!user)return null
 const {data,error}=await db().from('employee_permissions').select('screen_key').eq('profile_id',user.id)
 if(error) return null
 if(!data||data.length===0)return null
 return data.map(x=>x.screen_key)
}
export async function saveEmployeePermissions(profileId,keys){
 const {error:delError}=await db().from('employee_permissions').delete().eq('profile_id',profileId); if(delError) throw delError
 if(!keys?.length)return true
 const rows=keys.map(screen_key=>({profile_id:profileId,screen_key}))
 const {error}=await db().from('employee_permissions').insert(rows); if(error) throw error
 return true
}

export async function listSectionsBySchool(schoolId){
  const {data,error}=await db().from('sections').select('id,name,school_id,grade_id').eq('school_id',schoolId).order('name')
  if(error) throw error
  return data||[]
}
export async function createStudent(payload){
  const user=await currentUser(); if(!user) throw new Error('انتهت جلسة الدخول.')
  const profile=await currentProfile(); if(!profile?.school_id) throw new Error('لم يتم ربط حسابك بمدرسة بعد.')
  const {school_id,...studentPayload}=payload
  const {data:student,error}=await db().from('students').insert({school_id:school_id||profile.school_id,...studentPayload}).select('*, grades(id,name), sections(id,name), school_years(id,name), semesters(id,name)').single()
  if(error) throw error
  const {error:assignError}=await db().from('student_counselors').upsert({student_id:student.id,counselor_id:user.id,is_primary:true,ended_at:null},{onConflict:'student_id,counselor_id'})
  if(assignError) throw assignError
  return student
}
export async function updateStudent(id,payload){
  const {school_id,...studentPayload}=payload
  const {data,error}=await db().from('students').update(studentPayload).eq('id',id).select('*, grades(id,name), sections(id,name), school_years(id,name), semesters(id,name)').single()
  if(error) throw error
  return data
}
export async function deleteStudent(id){
  const {error}=await db().from('students').delete().eq('id',id)
  if(error) throw error
}

