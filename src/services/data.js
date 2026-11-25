import { requireSupabase } from './supabase'
import { decodeCustomToken, setCustomToken } from './customSession'

const db = () => requireSupabase()
export const requireSemesterReportClient = () => db()
export async function testEmployeeIdentity() {
  const { data, error } = await db().rpc('test_auth_uid')
  if (error) throw error
  return data
}

let systemProfileCache = null

export async function currentUser() {
  const claims = decodeCustomToken()
  if (!claims?.sub) return null
  return { id: claims.sub, user_metadata: { role: claims.app_role } }
}

export async function ensureMyProfile() { return currentProfile() }

export async function currentProfile() {
  const user = await currentUser()
  if (!user?.id) return null
  const { data, error } = await db().from('profiles').select('*, schools(id,name,code,directorate_id,lesson_duration_minutes), directorates(id,name,code)').eq('id', user.id).maybeSingle()
  if (error) throw error
  if (!data || data.is_active === false) return null
  return data
}


export async function listMyCounseledStudents() {
  const user = await currentUser()
  const profile = await currentProfile()
  if (!user?.id || profile?.role !== 'COUNSELOR') return []

  const {data,error} = await db().from('students')
    .select('*, grades(id,name), sections(id,name), school_years(id,name), student_counselors!inner(counselor_id,is_primary,ended_at)')
    .eq('student_counselors.counselor_id',user.id)
    .is('student_counselors.ended_at',null)
    .order('full_name')

  if (error) throw error
  return data || []
}

export async function listCounselorRegistry(){
  const {data,error}=await db()
    .from('profiles')
    .select('id,full_name,role,is_active,directorate_id,school_id,job_title,phone,schools(id,name),directorates(id,name)')
    .eq('role','COUNSELOR')
    .eq('is_active',true)
    .order('full_name')
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

  const profile = await currentProfile()
  const role = profile?.role

  const personalRoles = ['COUNSELOR', 'MINISTRY', 'DIRECTORATE', 'PRINCIPAL', 'SCHOOL_PRINCIPAL']
  if (!personalRoles.includes(role)) {
    throw new Error('تعديل البيانات الشخصية غير متاح لهذه الوظيفة.')
  }

  const updates = {
    full_name: String(payload.full_name || '').trim(),
    national_id: payload.national_id || null,
    phone: payload.phone || null,
    manager_name: String(payload.manager_name || '').trim() || null
  }

  if (!updates.full_name) throw new Error('الاسم مطلوب.')
  if (updates.national_id && !/^\d{9}$/.test(updates.national_id)) {
    throw new Error('رقم الهوية يجب أن يتكون من 9 أرقام.')
  }
  if (updates.phone && !/^\d{1,10}$/.test(updates.phone)) {
    throw new Error('رقم الهاتف يجب ألا يتجاوز 10 أرقام.')
  }

  const { data, error } = await db().from('profiles').update(updates)
    .eq('id', user.id)
    .select('*, schools(id,name,code,directorate_id), directorates(id,name,code)')
    .single()

  if (error) throw error
  return data
}

export async function listStudents(schoolId=null) {
  let query = db().from('students')
    .select('*, grades(id,name), sections(id,name), school_years(id,name), student_counselors!inner(counselor_id,is_primary,ended_at)')
  if (schoolId) query = query.eq('school_id', schoolId)
  const { data, error } = await query.order('full_name')
  if (error) throw error
  return data || []
}


export async function saveMySchoolLessonDuration(duration){
  const {data,error}=await db().rpc('save_my_school_lesson_duration',{
    p_duration:Number(duration)
  })
  if(error) throw error
  return data
}

export async function listSchoolLessonSchedules(schoolId){
  if(!schoolId) return []
  const {data,error}=await db().from('school_lesson_schedules').select('*').eq('school_id',schoolId).order('period_order')
  if(error) throw error
  return data||[]
}
export async function saveSchoolLessonSchedule({id,school_id,period_name,period_order,start_time}){
  const payload={school_id,period_name:String(period_name||'').trim(),period_order:Number(period_order),start_time}
  if(!payload.school_id||!payload.period_name||!payload.start_time) throw new Error('أكمل اسم الحصة ووقت بدايتها.')
  const query=id?db().from('school_lesson_schedules').update(payload).eq('id',id):db().from('school_lesson_schedules').upsert(payload,{onConflict:'school_id,period_name'})
  const {data,error}=await query.select('*').single()
  if(error) throw error
  return data
}
export async function deleteSchoolLessonSchedule(id){
  const {error}=await db().from('school_lesson_schedules').delete().eq('id',id)
  if(error) throw error
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


// Normalize optional TIME fields before writing weekly items.
const normalizeWeeklyItemTimes = payload => ({
  ...payload,
  ...(Object.prototype.hasOwnProperty.call(payload || {}, 'start_time')
    ? { start_time: payload.start_time || null }
    : {}),
  ...(Object.prototype.hasOwnProperty.call(payload || {}, 'end_time')
    ? { end_time: payload.end_time || null }
    : {})
})

export async function createWeeklyItem(payload) {
  const { data, error } = await db().from('weekly_program_items').insert(normalizeWeeklyItemTimes(payload)).select().single()
  if (error) throw error
  return data
}

export async function updateWeeklyItem(id, payload) {
  const { data, error } = await db().from('weekly_program_items').update(normalizeWeeklyItemTimes(payload)).eq('id', id).select().single()
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

export async function listActiveAcademicData(schoolId=null) {
  const sb = db()
  const [{ data: years, error: yErr }, { data: semesters, error: sErr }, { data: grades, error: gErr }] = await Promise.all([
    sb.from('school_years').select('*').order('start_date', { ascending: false, nullsFirst: false }).order('name', { ascending: false }),
    sb.from('semesters').select('*').order('start_date', { ascending: false }),
    (schoolId ? sb.from('grades').select('*').eq('school_id',schoolId) : sb.from('grades').select('*')).order('sort_order')
  ])
  if (yErr) throw yErr
  if (sErr) throw sErr
  if (gErr) throw gErr
  return { years: years || [], semesters: semesters || [], grades: grades || [] }
}



export async function listConsultations(){
  const user = await currentUser();
  const profile = await currentProfile();
  if (!user?.id || !profile?.school_id) throw new Error('انتهت جلسة الدخول أو لم يتم ربط الحساب بمدرسة.');
  const {data,error} = await db().from('consultations')
    .select('*')
    .eq('counselor_id',user.id)
    .eq('school_id',profile.school_id)
    .order('consultation_date',{ascending:false});
  if(error) throw error;
  return data || [];
}

export async function createConsultationRecord(payload){
  const user = await currentUser();
  const profile = await currentProfile();
  if (!user?.id || !profile?.school_id) throw new Error('انتهت جلسة الدخول أو لم يتم ربط الحساب بمدرسة.');
  const {data,error} = await db().from('consultations')
    .insert({...payload,counselor_id:user.id,school_id:profile.school_id})
    .select().single();
  if(error) throw error;
  return data;
}

export async function updateConsultationRecord(id,payload){
  const user = await currentUser();
  const profile = await currentProfile();
  if (!user?.id || !profile?.school_id) throw new Error('انتهت جلسة الدخول أو لم يتم ربط الحساب بمدرسة.');
  const {data,error} = await db().from('consultations')
    .update(payload).eq('id',id).eq('counselor_id',user.id).eq('school_id',profile.school_id)
    .select().single();
  if(error) throw error;
  return data;
}

export async function deleteConsultationRecord(id){
  const user = await currentUser();
  const profile = await currentProfile();
  if (!user?.id || !profile?.school_id) throw new Error('انتهت جلسة الدخول أو لم يتم ربط الحساب بمدرسة.');
  const {error} = await db().from('consultations')
    .delete().eq('id',id).eq('counselor_id',user.id).eq('school_id',profile.school_id);
  if(error) throw error;
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


export async function listSchoolTeachers(){
  const profile=await currentProfile()
  if(!profile?.school_id) throw new Error('لم يتم ربط حسابك بمدرسة بعد.')
  const {data,error}=await db().from('school_teachers')
    .select('id,school_id,full_name,specialization')
    .eq('school_id',profile.school_id)
    .order('full_name')
  if(error) throw error
  return data||[]
}

export async function listTeacherMeetings(){
  const profile=await currentProfile()
  if(!profile?.school_id) throw new Error('لم يتم ربط حسابك بمدرسة بعد.')
  const {data,error}=await db().from('teacher_meetings')
    .select('*')
    .eq('school_id',profile.school_id)
    .order('meeting_date',{ascending:false})
    .order('created_at',{ascending:false})
  if(error) throw error
  return data||[]
}

export async function createTeacherMeeting(payload){
  const user=await currentUser()
  if(!user) throw new Error('انتهت جلسة الدخول.')
  const profile=await currentProfile()
  if(!profile?.school_id) throw new Error('لم يتم ربط حسابك بمدرسة بعد.')
  const {data,error}=await db().from('teacher_meetings')
    .insert({counselor_id:user.id,school_id:profile.school_id,...payload})
    .select().single()
  if(error) throw error
  return data
}

export async function getTeacherMeeting(id){
  const {data,error}=await db().from('teacher_meetings')
    .select('*').eq('id',id).single()
  if(error) throw error
  return data
}

export async function updateTeacherMeeting(id,payload){
  const {data,error}=await db().from('teacher_meetings')
    .update(payload).eq('id',id).select().single()
  if(error) throw error
  return data
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
  const allowedRoles = ['MINISTRY','DIRECTORATE','PRINCIPAL','SCHOOL_PRINCIPAL','COUNSELOR','PROGRAMMER']
  if (!profile || !allowedRoles.includes(profile.role)) {
    throw new Error('ليس لديك صلاحية عرض هذه الإحصائيات.')
  }

  const sb = db()
  let counselorQuery = sb.from('profiles')
    .select('id,full_name,job_title,school_id,schools(name)')
    .eq('role','COUNSELOR')
    .eq('is_active',true)

  if (profile.role === 'DIRECTORATE') {
    if (!profile.directorate_id) throw new Error('لم يتم ربط حسابك بمديرية.')
    counselorQuery = counselorQuery.eq('directorate_id',profile.directorate_id)
  } else if (profile.role === 'PRINCIPAL') {
    counselorQuery = counselorQuery.eq('supervisor_id',profile.id)
  } else if (profile.role === 'SCHOOL_PRINCIPAL') {
    if (!profile.school_id) throw new Error('لم يتم ربط حسابك بمدرسة.')
    counselorQuery = counselorQuery.eq('school_id',profile.school_id)
  } else if (profile.role === 'COUNSELOR') {
    counselorQuery = counselorQuery.eq('id',profile.id)
  }

  const {data:counselors,error:counselorsError} = await counselorQuery.order('full_name')
  if (counselorsError) throw counselorsError

  const counselorRows = counselors || []
  const counselorIds = counselorRows.map(c => c.id)
  let schoolIds = [...new Set(counselorRows.map(c => c.school_id).filter(Boolean))]

  if (profile.role === 'SCHOOL_PRINCIPAL' && profile.school_id) {
    schoolIds = [profile.school_id]
  }

  if (['MINISTRY','PROGRAMMER'].includes(profile.role)) {
    const {data:schools,error} = await sb.from('schools').select('id')
    if (error) throw error
    schoolIds = (schools || []).map(s => s.id)
  }

  const count = async (query) => {
    const {count,error} = await query
    if (error) throw error
    return count || 0
  }

  const [schoolsCount,studentsCount,casesCount,hotCasesCount,activitiesCount] =
    await Promise.all([
      schoolIds.length
        ? count(sb.from('schools').select('id',{count:'exact',head:true}).in('id',schoolIds))
        : Promise.resolve(0),

      profile.role === 'COUNSELOR'
        ? count(sb.from('student_counselors')
            .select('student_id',{count:'exact',head:true})
            .eq('counselor_id',profile.id)
            .is('ended_at',null))
        : schoolIds.length
          ? count(sb.from('students').select('id',{count:'exact',head:true}).in('school_id',schoolIds))
          : Promise.resolve(0),

      counselorIds.length
        ? count(sb.from('case_studies').select('id',{count:'exact',head:true}).in('counselor_id',counselorIds))
        : Promise.resolve(0),

      counselorIds.length
        ? count(sb.from('hot_cases').select('id',{count:'exact',head:true}).in('counselor_id',counselorIds).neq('status','CLOSED'))
        : Promise.resolve(0),

      counselorIds.length
        ? count(sb.from('activities').select('id',{count:'exact',head:true}).in('counselor_id',counselorIds))
        : Promise.resolve(0)
    ])

  const rows = await Promise.all(counselorRows.map(async counselor => {
    const [students,cases,hotCases,activities] = await Promise.all([
      count(sb.from('student_counselors')
        .select('student_id',{count:'exact',head:true})
        .eq('counselor_id',counselor.id)
        .is('ended_at',null)),
      count(sb.from('case_studies').select('id',{count:'exact',head:true}).eq('counselor_id',counselor.id)),
      count(sb.from('hot_cases').select('id',{count:'exact',head:true}).eq('counselor_id',counselor.id).neq('status','CLOSED')),
      count(sb.from('activities').select('id',{count:'exact',head:true}).eq('counselor_id',counselor.id))
    ])

    return {
      id:counselor.id,
      full_name:counselor.full_name,
      job_title:counselor.job_title,
      school_name:counselor.schools?.name || '',
      students,cases,hot_cases:hotCases,activities
    }
  }))

  return {
    summary:{
      schools:schoolsCount,
      counselors:counselorRows.length,
      students:studentsCount,
      cases:casesCount,
      hotCases:hotCasesCount,
      activities:activitiesCount
    },
    counselors:rows
  }
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

export async function loginEmployee(username, password, remember = true) {
  const apiBase = import.meta.env.PROD ? '' : String(import.meta.env.VITE_AUTH_API_URL || 'http://localhost:8787').replace(/\/$/, '')
  let response
  try {
    response = await fetch(`${apiBase}/api/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: String(username || '').trim(), password: String(password || '') }) })
  } catch { throw new Error('تعذر الاتصال بخادم تسجيل الدخول. تأكد من تشغيل خادم المصادقة.') }
  const result = await response.json().catch(() => ({}))
  if (!response.ok || !result.token) throw new Error(result.error || 'اسم المستخدم أو كلمة المرور غير صحيحة.')
  setCustomToken(result.token, remember)

window.dispatchEvent(new Event('counselor-session-change'))
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
  const profile = await currentProfile()
  let query = db().from('profiles')
    .select('*, directorates(id,name,code), schools(id,name,code,directorate_id)')
    .neq('role','PROGRAMMER')

  if (profile?.role === 'DIRECTORATE') {
    if (!profile.directorate_id) return []
    query = query.eq('directorate_id', profile.directorate_id)
  }

  const {data,error} = await query.order('full_name')
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
 {key:'counselor-work-followup',label:'متابعة عمل المرشد التربوي',section:'المتابعة'} ,
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
 {key:'profile',label:'البيانات الشخصية',section:'الحساب'},,
 {key:'school-data',label:'بيانات المدرسة',section:'الإدارة المدرسية'},
 {key:'lesson-schedules',label:'توقيت الحصص',section:'الإدارة المدرسية'},
 {key:'correspondence',label:'الصادر والوارد',section:'الملف الإداري'},
 {key:'weekly-program-form',label:'نموذج البرنامج اليومي والأسبوعي',section:'الملف الإداري'},
 {key:'semester-report',label:'التقرير الفصلي',section:'الخطط والتقارير'},
 {key:'plan',label:'الخطة',section:'الخطط والتقارير'},
 {key:'meeting-summary',label:'نموذج رصد المقابلات',section:'المقابلات'},
 {key:'student-issues-monitor',label:'رصد مشكلات وقضايا الطلبة',section:'شؤون الطلبة'},
 {key:'hot-cases-monitor',label:'رصد الحالات الساخنة',section:'شؤون الطلبة'},
 {key:'hot-case-notice',label:'إعلام عن ملف ساخن',section:'شؤون الطلبة'},
 {key:'repeated-absence',label:'رصد الغياب المتكرر',section:'المتابعة الطلابية'},
 {key:'absence-followup',label:'متابعة الغياب',section:'المتابعة الطلابية'},
 {key:'repeated-lateness',label:'رصد التأخر المتكرر',section:'المتابعة الطلابية'},
 {key:'lateness-followup',label:'متابعة التأخر',section:'المتابعة الطلابية'},
 {key:'dropout-monitor',label:'رصد التسرب',section:'المتابعة الطلابية'},
 {key:'dropout-followup',label:'متابعة التسرب',section:'المتابعة الطلابية'},
 {key:'hot-cases-school',label:'الحالات الساخنة - المدرسة',section:'شؤون الطلبة'},
 {key:'hot-cases-directorate',label:'الحالات الساخنة - المديرية',section:'شؤون الطلبة'},
 {key:'health-cases',label:'الحالات الصحية',section:'شؤون الطلبة'},
 {key:'student-consultations',label:'المقابلات والاستشارات الطلابية',section:'المقابلات والاستشارات'},
 {key:'consultations-monitor',label:'رصد الاستشارات والمقابلات',section:'المقابلات والاستشارات'},
 {key:'focused-interviews',label:'المقابلات الفردية المركزة',section:'المقابلات والاستشارات'},
 {key:'transfer-requests',label:'طلبات النقل الواردة',section:'المتابعة الطلابية'},
 {key:'activities-monitor',label:'رصد الأنشطة',section:'الأنشطة'},
 {key:'visits',label:'الزيارات',section:'الأنشطة'},
 {key:'newsletters',label:'النشرات الإرشادية',section:'الأنشطة'},
 {key:'morning-radio',label:'الإذاعة الصباحية',section:'الأنشطة'},
 {key:'seminars-workshops',label:'الندوات والمحاضرات وورش العمل',section:'الأنشطة'},
 {key:'wall-magazine',label:'مجلة الحائط',section:'الأنشطة'},
 {key:'posters',label:'الملصقات الإرشادية',section:'الأنشطة'},
 {key:'group-session-summary',label:'تلخيص الجلسات الجماعية',section:'الإرشاد الجمعي'},
 {key:'group-session-details',label:'تفاصيل جلسات الإرشاد الجمعي',section:'الإرشاد الجمعي'},
 {key:'group-counseling-plan',label:'خطة الإرشاد الجمعي',section:'الإرشاد الجمعي'},
 {key:'group-sessions-monitor',label:'رصد جلسات الإرشاد الجمعي',section:'الإرشاد الجمعي'},
 {key:'guidance-meetings-followup',label:'متابعة لقاءات التوجيه الجمعي',section:'التوجيه الجمعي'},
 {key:'guidance-meetings-monitor',label:'رصد لقاءات التوجيه الجمعي',section:'التوجيه الجمعي'},
 {key:'career-guidance-followup',label:'متابعة التوجيه المهني',section:'التوجيه المهني'},
 {key:'career-guidance-monitor',label:'رصد التوجيه المهني',section:'التوجيه المهني'},
 {key:'parliament-plan',label:'خطة البرلمان',section:'البرلمان'},
 {key:'parliament-members',label:'أعضاء البرلمان',section:'البرلمان'},
 {key:'parliament-team-meetings',label:'اجتماعات فريق البرلمان',section:'البرلمان'},
 {key:'parliament-achievements',label:'إنجازات البرلمان',section:'البرلمان'},
 {key:'meeting-principal',label:'اجتماعات مدير المدرسة',section:'الاجتماعات'},
 {key:'meeting-teacher',label:'اجتماعات المعلمين',section:'الاجتماعات'},
 {key:'meeting-parents',label:'اجتماعات أولياء الأمور',section:'الاجتماعات'}
,
{key:'meeting-followup',label:'متابعة المقابلات',section:'المقابلات'},
{key:'academic-years',label:'السنوات الدراسية',section:'الإدارة العامة'},
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
 const user=await currentUser()
 if(!user?.id)return null

 const profile=await currentProfile()
 if(!profile)return null

 if(profile.role && profile.role!=='SUPER_ADMIN'){
   const {data:setting,error:settingError}=await db()
     .from('role_permission_settings')
     .select('is_configured')
     .eq('role',profile.role)
     .maybeSingle()

   if(settingError) throw settingError

   if(setting?.is_configured===true){
     const {data,error}=await db()
       .from('role_permissions')
       .select('screen_key')
       .eq('role',profile.role)

     if(error) throw error
     return (data||[]).map(x=>x.screen_key)
   }
 }

 const {data,error}=await db()
   .from('employee_permissions')
   .select('screen_key')
   .eq('profile_id',user.id)

 if(error) throw error
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

export async function getRolePermissions(role){
  if(!role || role === 'SUPER_ADMIN') throw new Error('الوظيفة غير صالحة.')
  const {data:setting,error:settingError}=await db()
    .from('role_permission_settings')
    .select('is_configured')
    .eq('role',role)
    .maybeSingle()
  if(settingError) throw settingError
  if(!setting) throw new Error('إعدادات هذه الوظيفة غير موجودة.')

  const {data,error}=await db()
    .from('role_permissions')
    .select('screen_key')
    .eq('role',role)
  if(error) throw error

  return {
    isConfigured: setting.is_configured === true,
    keys: (data||[]).map(x=>x.screen_key)
  }
}

export async function saveRolePermissions(role,keys){
  if(!role || role === 'SUPER_ADMIN') throw new Error('لا يمكن تعديل هذه الوظيفة.')
  const user=await currentUser()
  if(!user?.id) throw new Error('تعذر تحديد المستخدم الحالي.')

  const cleanKeys=[...new Set((keys||[]).filter(k=>typeof k==='string' && k.trim()))]

  const {error:deleteError}=await db()
    .from('role_permissions')
    .delete()
    .eq('role',role)
  if(deleteError) throw deleteError

  if(cleanKeys.length){
    const rows=cleanKeys.map(screen_key=>({role,screen_key}))
    const {error:insertError}=await db()
      .from('role_permissions')
      .insert(rows)
    if(insertError) throw insertError
  }

  const {error:settingError}=await db()
    .from('role_permission_settings')
    .upsert({
      role,
      is_configured:true,
      updated_at:new Date().toISOString(),
      updated_by:user.id
    },{onConflict:'role'})
  if(settingError) throw settingError

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
  const {school_id,student_code,national_id,...studentPayload}=payload
  const {data:student,error}=await db().from('students').insert({school_id:school_id||profile.school_id,...studentPayload,phone:studentPayload.phone||null}).select('*, grades(id,name), sections(id,name), school_years(id,name)').single()
  if(error) throw error
  const {error:assignError}=await db().from('student_counselors').upsert({student_id:student.id,counselor_id:user.id,is_primary:true,ended_at:null},{onConflict:'student_id,counselor_id'})
  if(assignError) throw assignError
  return student
}
export async function updateStudent(id,payload){
  const {school_id,student_code,national_id,...studentPayload}=payload
  const {data,error}=await db().from('students').update({...studentPayload,phone:studentPayload.phone||null}).eq('id',id).select('*, grades(id,name), sections(id,name), school_years(id,name)').single()
  if(error) throw error
  return data
}

export async function deleteStudent(id) {
  const {error}=await db().from('students').delete().eq('id',id)
  if(error?.code==='23503') {
    throw new Error('لا يمكن حذف هذا الطالب؛ لأنه مرتبط بمقابلة مركّزة أو بسجلات أخرى. احتفظ ببياناته.')
  }
  if(error) throw error
}

function normalizeStudentName(value) {
  return String(value??'').trim().toLowerCase()
    .replace(/[أإآ]/g,'ا')
    .replace(/ى/g,'ي')
    .replace(/[\sـ]+/g,' ')
}

export async function importStudentsFromExcel(rows) {
  const user=await currentUser()
  if(!user) throw new Error('انتهت جلسة الدخول.')

  const profile=await currentProfile()
  if(!profile?.school_id) throw new Error('لم يتم ربط حسابك بمدرسة.')
  if(!Array.isArray(rows)||!rows.length) throw new Error('لا توجد بيانات للاستيراد.')

  const names=rows.map(r=>normalizeStudentName(r.full_name))
  if(names.some(n=>!n)) throw new Error('يوجد اسم طالب فارغ.')
  if(new Set(names).size!==names.length)
    throw new Error('يوجد اسم مكرر داخل ملف Excel. أوقفنا الاستيراد.')

  const {data:existing,error:checkError}=await db()
    .from('students')
    .select('id,full_name')
    .eq('school_id',profile.school_id)

  if(checkError) throw checkError

  const byName=new Map()
  for(const s of existing||[]) {
    const key=normalizeStudentName(s.full_name)
    if(!byName.has(key)) byName.set(key,[])
    byName.get(key).push(s)
  }

  // فحص جميع الأسماء قبل بدء التعديل
  for(const row of rows) {
    const matches=byName.get(normalizeStudentName(row.full_name))||[]
    if(matches.length>1) {
      throw new Error(`الاسم «${row.full_name}» موجود أكثر من مرة في المدرسة. لم يتم تحديثه.`)
    }
    if(!row.school_year_id||!row.grade_id||!row.section_id) {
      throw new Error(`بيانات السنة أو الصف أو الشعبة ناقصة للطالب ${row.full_name}.`)
    }
  }

  let inserted=0
  let updated=0

  for(const row of rows) {
    const key=normalizeStudentName(row.full_name)
    const matches=byName.get(key)||[]

    const payload={
      full_name:String(row.full_name).trim(),
      school_year_id:row.school_year_id,
      grade_id:row.grade_id,
      section_id:row.section_id,
      phone:row.phone||null,
      notes:row.notes||null
    }

    let studentId

    if(matches.length===1) {
      studentId=matches[0].id
      const {error}=await db().from('students')
        .update(payload)
        .eq('id',studentId)
        .eq('school_id',profile.school_id)
      if(error) throw error
      updated++
    } else {
      const {data:created,error}=await db().from('students')
        .insert({school_id:profile.school_id,...payload})
        .select('id')
        .single()
      if(error) throw error

      studentId=created.id
      byName.set(key,[{id:studentId,full_name:payload.full_name}])
      inserted++
    }

    const {error:assignError}=await db().from('student_counselors')
      .upsert({
        student_id:studentId,
        counselor_id:user.id,
        is_primary:true,
        ended_at:null
      },{onConflict:'student_id,counselor_id'})

    if(assignError) throw assignError
  }

  return {inserted,updated,total:rows.length}
}

export async function deleteAllStudentsForSchool() {
  const profile=await currentProfile()
  if(!profile?.school_id) throw new Error('لم يتم ربط حسابك بمدرسة.')

  if(String(profile.role||'').toUpperCase()!=='COUNSELOR')
    throw new Error('هذه العملية متاحة للمرشد التربوي فقط.')

  const {data:students,error}=await db().from('students')
    .select('id')
    .eq('school_id',profile.school_id)

  if(error) throw error
  if(!students?.length) return {deleted:0,protected:0}

  // نجلب سجلات المقابلات المركزة دون افتراض وجود school_id في جدولها
  const {data:files,error:fileError}=await db()
    .from('focused_interview_student_files')
    .select('student_id')

  if(fileError) throw fileError

  const protectedIds=new Set(
    (files||[]).map(f=>String(f.student_id))
  )

  let deleted=0
  let protectedCount=0

  for(const student of students) {
    if(protectedIds.has(String(student.id))) {
      protectedCount++
      continue
    }

    const {error:deleteError}=await db().from('students')
      .delete()
      .eq('id',student.id)
      .eq('school_id',profile.school_id)

    if(deleteError?.code==='23503') {
      protectedCount++
      continue
    }

    if(deleteError) throw deleteError
    deleted++
  }

  return {deleted,protected:protectedCount}
}

export async function changePassword(currentPassword, password) {
  const token = (await import('./customSession')).getCustomToken()
  const response = await fetch(`${import.meta.env.VITE_AUTH_API_URL || ''}/api/change-password`, { method:'POST', headers:{'Content-Type':'application/json', Authorization:`Bearer ${token}`}, body:JSON.stringify({currentPassword,password}) })
  const result = await response.json().catch(()=>({}))
  if (!response.ok) throw new Error(result.error || 'تعذر تغيير كلمة المرور.')
  return result
}


// Generic CRUD helpers used by CrudScreen. Table names are restricted to the app's known modules.
const CRUD_TABLES = new Set(['case_studies','absence_records','lateness_records','dropout_cases','hot_cases','activities','group_counseling_records','guidance_records','interviews','annual_plans','notifications']);
function checkedTable(table) { if (!CRUD_TABLES.has(table)) throw new Error('هذا القسم غير متاح.'); return table; }
export async function listRecords(table, select='*', order='created_at') {
  const t = checkedTable(table); let q = db().from(t).select(select);
  if (order) q = q.order(order, { ascending: false, nullsFirst: false });
  const { data, error } = await q; if (error) throw error; return data || [];
}
export async function createOwnedRecord(table, payload, options={}) {
  const t = checkedTable(table); const user = await currentUser(); const profile = await currentProfile();
  if (!user || !profile) throw new Error('انتهت جلسة الدخول.');
  const record = { ...payload };
  if (options.school && profile.school_id && !record.school_id) record.school_id = profile.school_id;
  if (!record.counselor_id && ['case_studies','absence_records','lateness_records','dropout_cases','hot_cases','activities','group_counseling_records','guidance_records','interviews','annual_plans'].includes(t)) record.counselor_id = user.id;
  const { data, error } = await db().from(t).insert(record).select().single(); if (error) throw error; return data;
}
export async function updateRecord(table, id, payload) {
  const t = checkedTable(table); const { data, error } = await db().from(t).update(payload).eq('id', id).select().single(); if (error) throw error; return data;
}
export async function deleteRecord(table, id) {
  const t = checkedTable(table); const { error } = await db().from(t).delete().eq('id', id); if (error) throw error;
}


export async function requestPasswordReset(payload){
  const {data,error}=await db().rpc('request_password_reset',{p_username:payload.username.trim().toLowerCase(),p_national_id:payload.national_id.trim()});
  if(error) throw error; return data
}


// Ministry correspondence (outgoing / incoming)
export async function listMinistryCorrespondence(schoolYearId, recordType) {
  let query = db().from('ministry_correspondence')
    .select('*, school_years(id,name), ministry_correspondence_attachments(*)')
    .eq('school_year_id', schoolYearId)
    .order('correspondence_date', { ascending: false })
    .order('serial_number', { ascending: false });
  if (recordType) query = query.eq('record_type', recordType);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function createMinistryCorrespondence(payload) {
  const profile = await currentProfile();
  if (!profile?.id) throw new Error('انتهت جلسة الدخول.');
  const { data, error } = await db().from('ministry_correspondence').insert({
    counselor_id: profile.id,
    school_id: profile.school_id || null,
    school_year_id: payload.school_year_id,
    record_type: payload.record_type,
    correspondence_date: payload.correspondence_date,
    title: payload.title.trim(),
    details: payload.details?.trim() || null
  }).select().single();
  if (error) throw error;
  return data;
}

export async function updateMinistryCorrespondence(id, payload) {
  const { data, error } = await db().from('ministry_correspondence').update({
    correspondence_date: payload.correspondence_date,
    title: payload.title.trim(),
    details: payload.details?.trim() || null
  }).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteMinistryCorrespondence(id) {
  const { data: attachments, error: readError } = await db().from('ministry_correspondence_attachments').select('storage_path').eq('correspondence_id', id);
  if (readError) throw readError;
  if (attachments?.length) {
    const { error: storageError } = await db().storage.from('ministry-correspondence').remove(attachments.map(a => a.storage_path));
    if (storageError) throw storageError;
  }
  const { error } = await db().from('ministry_correspondence').delete().eq('id', id);
  if (error) throw error;
}

export async function addMinistryCorrespondenceAttachment(correspondenceId, file) {
  const profile = await currentProfile();
  if (!profile?.id) throw new Error('انتهت جلسة الدخول.');
  if (!file) return;
  if (file.size > 10 * 1024 * 1024) throw new Error('حجم الملف يجب ألا يتجاوز 10 MB.');
  const safeName = file.name.replace(/[^\w.\-\u0600-\u06FF ]/g, '_');
  const path = `${profile.id}/${crypto.randomUUID()}-${safeName}`;
  const { error: uploadError } = await db().storage.from('ministry-correspondence').upload(path, file, { contentType: file.type || 'application/octet-stream' });
  if (uploadError) throw uploadError;
  const { error } = await db().from('ministry_correspondence_attachments').insert({
    correspondence_id: correspondenceId, file_name: file.name, storage_path: path,
    mime_type: file.type || null, size_bytes: file.size
  });
  if (error) {
    await db().storage.from('ministry-correspondence').remove([path]);
    throw error;
  }
}

export async function openMinistryCorrespondenceAttachment(path) {
  const { data, error } = await db().storage.from('ministry-correspondence').createSignedUrl(path, 600);
  if (error) throw error;
  window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
}

// Parliament achievements supporting files use the existing private correspondence storage bucket.
export async function uploadParliamentAchievementAttachment(file) {
  const profile = await currentProfile();
  if (!profile?.id) throw new Error('انتهت جلسة الدخول.');
  if (!file) return null;
  if (file.size > 10 * 1024 * 1024) throw new Error('حجم الملف يجب ألا يتجاوز 10 MB.');
  const allowed = /\.(png|jpe?g|gif|webp|bmp|pdf|docx?|xlsx?|pptx?|od[tp])$/i;
  if (!allowed.test(file.name)) throw new Error('نوع الملف غير مدعوم. أرفق صورة أو ملف Office أو PDF.');
  // Use the same single-folder object-key shape as the working ministry-correspondence uploads.
  // Keep the original filename only as metadata; never place user-supplied filename characters in the storage key.
  const extension = file.name.match(/\.([a-z0-9]+)$/i)?.[1]?.toLowerCase() || 'bin';
  const path = `${profile.id}/${crypto.randomUUID()}.${extension}`;
  const { error } = await db().storage.from('ministry-correspondence').upload(path, file, { contentType: file.type || 'application/octet-stream', upsert: false });
  if (error) throw error;
  return { file_name: file.name, storage_path: path, mime_type: file.type || null, size_bytes: file.size, created_at: new Date().toISOString() };
}

export async function openParliamentAchievementAttachment(path) {
  const { data, error } = await db().storage.from('ministry-correspondence').createSignedUrl(path, 600);
  if (error) throw error;
  window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
}

export async function getParliamentAchievementAttachmentUrl(path) {
  if (!path) throw new Error('مسار المرفق غير متوفر.');
  const { data, error } = await db().storage.from('ministry-correspondence').createSignedUrl(path, 60 * 30);
  if (error) throw error;
  return data.signedUrl;
}

export async function deleteParliamentAchievementAttachment(path) {
  if (!path) return;
  const { error } = await db().storage.from('ministry-correspondence').remove([path]);
  if (error) throw error;
}


// Focused individual interview files (one file per student per academic year)
export async function listFocusedInterviewFiles(schoolYearId=''){
  let q=db().from('focused_interview_student_files').select('*, focused_interview_reviews(*)').order('created_at',{ascending:false})
  if(schoolYearId) q=q.eq('school_year_id',schoolYearId)
  const {data,error}=await q
  if(error) throw error
  return data||[]
}
export async function createFocusedInterviewFile(payload){
  const user=await currentUser(); if(!user) throw new Error('انتهت جلسة الدخول.')
  const profile=await currentProfile(); if(!profile?.school_id) throw new Error('لم يتم ربط حسابك بمدرسة بعد.')
  const {data,error}=await db().from('focused_interview_student_files').insert({counselor_id:user.id,school_id:profile.school_id,...payload}).select().single()
  if(error) throw error
  return data
}
export async function addFocusedInterviewReview(payload){
  const {data,error}=await db().from('focused_interview_reviews').insert(payload).select().single()
  if(error) throw error
  return data
}


export async function listSchoolGrades(schoolId){
  let q=db().from('grades').select('id,name,sort_order,school_id,directorate_id').order('sort_order').order('name')
  if(schoolId) q=q.eq('school_id',schoolId)
  const {data,error}=await q
  if(error) throw error
  return data||[]
}
export async function createSchoolGrade({name,school_id,directorate_id,sort_order=0}){
  const {data,error}=await db().from('grades').insert({name:name.trim(),school_id,directorate_id,sort_order}).select().single()
  if(error) throw error
  return data
}
export async function updateSchoolGrade(id,payload){
  const {data,error}=await db().from('grades').update({name:payload.name.trim(),sort_order:payload.sort_order}).eq('id',id).select().single()
  if(error) throw error
  return data
}
export async function deleteSchoolGrade(id){
  const {error}=await db().from('grades').delete().eq('id',id)
  if(error) throw error
}
export async function createSchoolSection({name,school_id,grade_id}){
  const {data,error}=await db().from('sections').insert({name:name.trim(),school_id,grade_id}).select().single()
  if(error) throw error
  return data
}
export async function updateSchoolSection(id,payload){
  const {data,error}=await db().from('sections').update({name:payload.name.trim()}).eq('id',id).select().single()
  if(error) throw error
  return data
}
export async function deleteSchoolSection(id){
  const {error}=await db().from('sections').delete().eq('id',id)
  if(error) throw error
}

export async function createStudentTransferRequest(payload) {
  const user = await currentUser()
  if (!user?.id) throw new Error('انتهت جلسة الدخول.')
  const profile = await currentProfile()
  if (!profile?.school_id) throw new Error('لم يتم ربط حسابك بمدرسة حالية.')
  const { data, error } = await db().from('student_transfer_requests').insert({
    student_id: payload.student_id,
    school_year_id: payload.school_year_id || null,
    from_school_id: profile.school_id,
    to_school_id: payload.to_school_id,
    from_grade_id: payload.from_grade_id || null,
    from_section_id: payload.from_section_id || null,
    requested_by: user.id,
    status: 'pending'
  }).select().single()
  if (error) throw error
  return data
}


// Incoming student transfer requests for the current receiving school.
export async function listIncomingStudentTransferRequests() {
  const profile = await currentProfile()
  if (!profile?.school_id) throw new Error('لم يتم ربط حسابك بمدرسة.')
  const { data, error } = await db()
    .from('student_transfer_requests')
    .select('*, students(id,full_name,student_code,national_id,grades(name),sections(name)), from_school:schools!student_transfer_requests_from_school_id_fkey(id,name,directorates(name)), to_school:schools!student_transfer_requests_to_school_id_fkey(id,name,directorates(name))')
    .eq('to_school_id', profile.school_id)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function decideStudentTransferRequest({ requestId, decision, gradeId = null, sectionId = null, note = null }) {
  const rpcName = decision === 'accepted' ? 'accept_student_transfer_request' : 'reject_student_transfer_request'
  const args = decision === 'accepted'
    ? { p_request_id: requestId, p_grade_id: gradeId, p_section_id: sectionId }
    : { p_request_id: requestId, p_note: note }
  const { data, error } = await db().rpc(rpcName, args)
  if (error) throw error
  return data
}

export async function listInterviewRecords(person='مدير المدرسة'){
  const profile=await currentProfile()
  if(!profile?.school_id) throw new Error('لم يتم ربط حسابك بمدرسة بعد.')

  let query=db().from('interviews')
    .select('*')
    .eq('school_id',profile.school_id)

  if(person==='مدير المدرسة'){
    query=query.eq('consultation_type','مقابلة')
  }else{
    query=query.eq('person',person)
  }

  const {data,error}=await query
    .order('interview_date',{ascending:false})
    .order('created_at',{ascending:false})

  if(error) throw error
  return data||[]
}

// سجل الفعاليات المستقل
export async function listSchoolEvents(schoolYearId='', semesterId='') {
  const profile = await currentProfile()
  if (!profile?.school_id) throw new Error('لم يتم ربط حسابك بمدرسة بعد.')
  let query = db().from('school_events').select('*, school_event_attachments(*)').eq('school_id', profile.school_id).order('event_date', { ascending: false }).order('created_at', { ascending: false })
  if (schoolYearId) query = query.eq('school_year_id', schoolYearId)
  if (semesterId) query = query.eq('semester_id', semesterId)
  const { data, error } = await query
  if (error) throw error
  return data || []
}

export async function saveSchoolEvent(payload, eventId=null) {
  const user = await currentUser()
  const profile = await currentProfile()
  if (!user?.id || !profile?.school_id) throw new Error('انتهت الجلسة أو لم يتم ربط الحساب بمدرسة.')
  const values = { ...payload, updated_at: new Date().toISOString(), counselor_id: user.id, school_id: profile.school_id, manager_name: profile.manager_name || null, counselor_name: profile.full_name || null, directorate_id: profile.directorate_id || profile.schools?.directorate_id || null }
  const result = eventId
    ? await db().from('school_events').update(values).eq('id', eventId).eq('counselor_id', user.id).select().single()
    : await db().from('school_events').insert(values).select().single()
  if (result.error) throw result.error
  return result.data
}

export async function uploadSchoolEventAttachment(eventId, file) {
  const profile = await currentProfile()
  if (!profile?.id) throw new Error('انتهت جلسة الدخول.')
  if (!file) return null
  if (file.size > 100 * 1024 * 1024) throw new Error('حجم كل مرفق يجب ألا يتجاوز 100 MB.')
  if (!/\.(png|jpe?g|gif|webp|bmp|mp4|webm|mov|pdf|docx?|xlsx?|pptx?|od[tp])$/i.test(file.name)) throw new Error('نوع الملف غير مدعوم. استخدم صورة أو فيديو MP4/WEBM/MOV أو PDF أو ملف Office.')
  const ext = file.name.match(/\.([a-z0-9]+)$/i)?.[1]?.toLowerCase() || 'bin'
  const path = `${profile.id}/${crypto.randomUUID()}.${ext}`
  const bucket = 'ministry-correspondence'
  const { error: uploadError } = await db().storage.from(bucket).upload(path, file, { contentType: file.type || 'application/octet-stream', upsert: false })
  if (uploadError) throw uploadError
  const { data, error } = await db().from('school_event_attachments').insert({ event_id: eventId, file_name: file.name, storage_path: path, mime_type: file.type || null, size_bytes: file.size }).select().single()
  if (error) { await db().storage.from(bucket).remove([path]); throw error }
  return data
}

export async function getSchoolEventAttachmentUrl(path) {
  const { data, error } = await db().storage.from('ministry-correspondence').createSignedUrl(path, 600)
  if (error) throw error
  return data.signedUrl
}

export async function openSchoolEventAttachment(path) {
  const url = await getSchoolEventAttachmentUrl(path)
  window.open(url, '_blank', 'noopener,noreferrer')
}

export async function deleteSchoolEventAttachment(attachment) {
  const { error: storageError } = await db().storage.from('ministry-correspondence').remove([attachment.storage_path])
  if (storageError) throw storageError
  const { error } = await db().from('school_event_attachments').delete().eq('id', attachment.id)
  if (error) throw error
}

export async function deleteSchoolEvent(eventId) {
  const { data: attachments, error: readError } = await db().from('school_event_attachments').select('storage_path').eq('event_id', eventId)
  if (readError) throw readError
  if (attachments?.length) {
    const { error: storageError } = await db().storage.from('ministry-correspondence').remove(attachments.map(x => x.storage_path))
    if (storageError) throw storageError
  }
  const { error } = await db().from('school_events').delete().eq('id', eventId)
  if (error) throw error
}

