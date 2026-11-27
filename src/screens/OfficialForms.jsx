import React,{useEffect,useMemo,useState}from'react'
import{useParams,useLocation,useNavigate}from'react-router-dom'
import{Page,Card,Button,ErrorNotice}from'../components/UI'
import{Maximize2,Printer,Save,X,Plus,History,Eye,Trash2,Edit}from'lucide-react'
import{currentProfile,listActiveAcademicData,requireSemesterReportClient,listSchoolsByDirectorate,listStudents,listParliamentStudents,getSchoolManagerName}from'../services/data'
import{listOfficialFormRecords,saveOfficialFormRecord,deleteOfficialFormRecord,listSchoolTeachers}from'../services/officialFormsApi'
import MeetingFollowupEntry,{createMeetingRow}from'../components/officialForms/MeetingFollowupEntry'
import MeetingFollowupPreview from'../components/officialForms/MeetingFollowupPreview'
import GenericOfficialForm,{GenericOfficialPreview,FORM_CONFIGS}from'../components/officialForms/GenericOfficialForm'
import ParliamentTeamTraining,{ParliamentTeamTrainingPreview}from'../components/officialForms/ParliamentTeamTraining'
import SemesterReportCounts from '../components/officialForms/SemesterReportCounts'
import GroupAssessment from '../components/officialForms/GroupAssessment'
import GroupCounselingPlan from '../components/officialForms/GroupCounselingPlan'
import GuidanceMeetingsFollowupEntry from '../components/officialForms/GuidanceMeetingsFollowupEntry'
import GuidanceMeetingsFollowupPreview from '../components/officialForms/GuidanceMeetingsFollowupPreview'

const forms=[
 ['meeting-followup','نموذج متابعة المقابلات',[1],'ملف المقابلات'],['meeting-summary','نموذج رصد المقابلات',[1],'ملف المقابلات'],['case-study','نموذج دراسة حالة',[2],'ملف شؤون الطلبة'],['hot-cases-monitor','نموذج رصد الحالات الساخنة',[3],'ملف شؤون الطلبة'],['hot-case-notice','نموذج إعلام عن ملف ساخن',[4],'ملف شؤون الطلبة'],['student-issues-monitor','نموذج رصد المشكلات وقضايا الطلبة داخل وخارج المدرسة',[5,6],'ملف شؤون الطلبة'],['student-consultations','نموذج المقابلات والاستشارات الطلابية',[6],'ملف الاستشارات'],['consultations-monitor','نموذج رصد الاستشارات والمقابلات الطلابية',[7],'ملف الاستشارات'],['repeated-absence','نموذج رصد حالات الغياب المتكرر',[8],'ملف الغياب'],['absence-followup','نموذج متابعة غياب الطالب',[9],'ملف الغياب'],['repeated-lateness','نموذج رصد التأخر الصباحي المتكرر',[9,10],'ملف التأخر الصباحي'],['lateness-followup','نموذج متابعة التأخر الصباحي المتكرر',[10],'ملف التأخر الصباحي'],['dropout-monitor','نموذج رصد حالات التسرب',[11,12],'ملف التسرب'],['dropout-followup','نموذج متابعة التسرب',[12],'ملف التسرب'],['hot-cases-school','نموذج رصد الحالات الساخنة الفصلي – المدرسة',[13],'الحالات الساخنة'],['hot-cases-directorate','نموذج رصد الحالات الساخنة الفصلي – المديرية',[14],'الحالات الساخنة'],['activities-monitor','نموذج رصد الأنشطة',[15],'ملف الأنشطة'],['visits','نموذج الزيارات',[15],'ملف الأنشطة'],['newsletters','نموذج النشرات الإرشادية',[16],'ملف الأنشطة'],['morning-radio','نموذج الإذاعة الصباحية',[17],'ملف الأنشطة'],['seminars-workshops','نموذج الندوات والمحاضرات وورش العمل',[18],'ملف الأنشطة'],['wall-magazine','نموذج مجلة الحائط',[19],'ملف الأنشطة'],['group-session-summary','نموذج تلخيص الجلسات الجماعية',[19],'ملف الإرشاد الجماعي'],['group-session-details','نموذج ملخص جلسات الإرشاد الجماعي للمجموعة',[20],'ملف الإرشاد الجماعي'],['group-counseling-plan','نموذج الإرشاد الجماعي',[],'ملف الإرشاد الجماعي'],['group-sessions-monitor','نموذج رصد عدد جلسات الإرشاد الجماعي',[21],'ملف الإرشاد الجماعي'],['guidance-meetings-followup','نموذج متابعة لقاءات التوجيه الجمعي',[22],'ملف التوجيه الجمعي'],['guidance-meetings-monitor','نموذج رصد لقاءات التوجيه الجمعي',[22],'ملف التوجيه الجمعي'],['weekly-program-form','نموذج البرنامج اليومي/الأسبوعي لعمل المرشد/ة التربوي/ة',[23],'الملف الإداري'],['annual-plan','نموذج الخطة السنوية المعتمدة',[24],'الملف الإداري'],['plan','نموذج الخطة',[25],'الملف الإداري'],['semester-report','التقرير الفصلي حول إنجازات العمل في الخطة',[26,27,28],'الملف الإداري'],['career-guidance-monitor','نموذج رصد لقاءات التوجيه المهني',[],'ملف التوجيه المهني'],['career-guidance-followup','نموذج متابعة لقاءات التوجيه المهني',[],'ملف التوجيه المهني'],['parliament-plan','خطة البرلمان',[],'ملف البرلمان'],['parliament-members','أسماء أعضاء البرلمان',[],'ملف البرلمان'],['parliament-team-meetings','اجتماعات فريق البرلمان',[],'ملف البرلمان'],['parliament-team-training','تدريب الفريق',[],'ملف البرلمان'],['parliament-achievements','إنجازات البرلمان',[],'ملف البرلمان'],['health-cases','نموذج رصد الحالات الصحية',[],'ملف الاستشارات'],['meeting-principal','نموذج اجتماعات مدير/ة المدرسة',[],'ملف الاجتماعات'],['meeting-teacher','نموذج اجتماعات المعلمين',[],'ملف الاجتماعات'],['meeting-parents','نموذج اجتماعات أولياء الأمور',[],'ملف الاجتماعات'],['posters','نموذج الملصقات الإرشادية',[],'ملف الأنشطة']
]
const dayName=d=>{const x=new Date(`${d}T00:00:00`);return Number.isNaN(x.getTime())?'':['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'][x.getDay()]}
const today=new Date().toISOString().slice(0,10)
const GUIDANCE_FOLLOWUP_IDS=['guidance-meetings-followup','career-guidance-followup']
const blankGuidanceRow=()=>({date:'',period:'',grade_id:'',section_id:'',grade:'',section:'',topic:'',objectives:'',activities:'',notes:''})
// Keep older locally saved rows readable when switching to the unified follow-up layout.
const normalizeGuidanceRow=row=>({
 ...row,
 date:row.date??row['اليوم/التاريخ']??row['التاريخ']??'',
 period:row.period??row['الحصة']??'',
 grade_id:row.grade_id??'',section_id:row.section_id??'',
 grade:row.grade??row['الصف']??'',section:row.section??row['الشعبة']??'',
 topic:row.topic??row['الموضوع']??'',objectives:row.objectives??row['الأهداف']??'',
 activities:row.activities??row['الأنشطة']??row['الإجراءات']??'',
 notes:row.notes??row['ملاحظات']??row['التوصيات']??''
})

const ANNUAL_MONTHS=[9,10,11,12,1,2,3,4,5]
const ANNUAL_SOURCES=[
 {table:'group_sessions',label:'التوجيه الجمعي',dates:['session_date','meeting_date','activity_date','date','created_at'],grouped:true},
 {table:'guidance_sessions',label:'التوجيه المهني',dates:['session_date','guidance_date','activity_date','date','created_at']},
 {table:'parliament_team_meetings',label:'اجتماعات البرلمان الطلابي',dates:['meeting_date','session_date','date','created_at']},
 {table:'focused_interview_followups',label:'رصد ومتابعة المقابلات الفردية المركزة',dates:['interview_date','followup_date','meeting_day','date','created_at']},
 {table:'interviews',label:'المقابلات',dates:['interview_date','meeting_date','date','created_at']},
 {table:'principal_meetings',label:'اجتماعات مدير/ة المدرسة',dates:['meeting_date','date','created_at']},
 {table:'teacher_meetings',label:'اجتماعات المعلمين',dates:['meeting_date','date','created_at']},
 {table:'parent_meetings',label:'اجتماعات أولياء الأمور',dates:['meeting_date','date','created_at']},
 {table:'activities',label:'الأنشطة الإرشادية',dates:['activity_date','date','event_date','created_at']}
]
const annualDate=(row,keys)=>{
 for(const key of keys){
  const v=row?.[key];if(!v)continue
  const raw=String(v).trim()
  const iso=raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/)
  if(iso)return {month:+iso[2],year:+iso[1]}
  const dmy=raw.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/)
  if(dmy)return {month:+dmy[2],year:+dmy[3]}
  const d=new Date(v)
  if(!Number.isNaN(d.getTime()))return {month:d.getMonth()+1,year:d.getFullYear()}
 }
 return {month:null,year:null}
}

export default function OfficialForms(){
 const{formId='meeting-followup'}=useParams();const location=useLocation();const navigate=useNavigate();const previewOnly=location.pathname.endsWith('/official')||new URLSearchParams(location.search).get('preview')==='1';const selected=useMemo(()=>forms.find(f=>f[0]===formId)||forms[0],[formId]);const[id,title]=selected
 const[showPreview,setShowPreview]=useState(previewOnly),[notice,setNotice]=useState(''),[profile,setProfile]=useState(null),[academic,setAcademic]=useState({years:[],semesters:[],grades:[]}),[schoolSections,setSchoolSections]=useState([]),[loading,setLoading]=useState(true),[error,setError]=useState('')
 const[activeMeetingRecordId,setActiveMeetingRecordId]=useState(null), [deleteTarget,setDeleteTarget]=useState(null),[meetingRecords,setMeetingRecords]=useState([]),[showMeetingHistory,setShowMeetingHistory]=useState(false),[viewingHistorical,setViewingHistorical]=useState(false)
 const[teachers,setTeachers]=useState([])
 const[students,setStudents]=useState([])
 const initial=useMemo(()=>({school_year_id:'',semester_id:'',rows:[createMeetingRow(today,dayName(today))],values:{}}),[]);const[form,setForm]=useState(initial);const documentProfile=useMemo(()=>{const snap=form?._document_snapshot;if(!snap)return profile;return {...profile,full_name:snap.counselor_name||profile?.full_name,manager_name:snap.manager_name||profile?.manager_name}},[profile,form?._document_snapshot])
 const isGuidanceFollowup=GUIDANCE_FOLLOWUP_IDS.includes(id)
 // Hot-case records are entered once on the Hot Cases screen and reused by every official form.
 useEffect(()=>{
  const record=location.state?.hotCaseRecord
  if(!record||!['hot-cases-monitor','hot-case-notice','hot-cases-school','hot-cases-directorate'].includes(id))return
  const source=record.form_data?.values||{}
  const shared={
   'الرقم':source['الرقم']||'',
   'رمز الطالب':source['رمز الطالب']||'',
   'الصف':source['الصف']||'',
   'تاريخ':source['تاريخ']||'',
   'المشكلة':source['المشكلة']||'',
   'تصنيف الحالة':source['تصنيف الحالة']||'',
   'جهة تحويل الحالة':source['جهة تحويل الحالة']||'',
   'الإجراءات/المتابعة':source['الإجراءات/المتابعة']||'',
   'ملاحظات':source['ملاحظات']||''
  }
  const row={
   ...shared,
   'جهة التحويل':shared['جهة تحويل الحالة'],
   'عدد الحالات':'1',
   'نوع المشكلة':shared['تصنيف الحالة']||shared['المشكلة'],
   'الإجراءات':shared['الإجراءات/المتابعة']
  }
  const nextForm={
   school_year_id:record.school_year_id||'',
   semester_id:record.semester_id||'',
   values:{
    'اسم الطالب':source['اسم الطالب']||'',
    'الصف والشعبة':[source['الصف'],source['الشعبة']].filter(Boolean).join(' / '),
    'تاريخ الحالة':shared['تاريخ'],
    'وصف المشكلة':shared['المشكلة'],
    'الإجراءات المتخذة':shared['الإجراءات/المتابعة'],
    'جهة التحويل':shared['جهة تحويل الحالة'],
    'ملاحظات':shared['ملاحظات']
   },
   rows:[id==='hot-cases-school'?{
    'الرقم':shared['الرقم'],'رمز الطالب':shared['رمز الطالب'],'الصف':shared['الصف'],
    'عدد الحالات':'1','نوع المشكلة':row['نوع المشكلة'],'الإجراءات':row['الإجراءات']
   }:row]
  }
  setForm(nextForm)
  setShowPreview(true)
  setViewingHistorical(id!=='hot-case-notice')
  setError('')
 },[id,location.key])
 useEffect(()=>{
  if(!isGuidanceFollowup)return
  try{
   const raw=localStorage.getItem(`official-form-${id}`)
   const saved=raw?JSON.parse(raw):null
   setForm(prev=>({
    ...prev,
    ...(saved||{}),
    rows:saved?.rows?.length?saved.rows.map(normalizeGuidanceRow):[blankGuidanceRow()],
    values:saved?.values||{}
   }))
  }catch{setForm(prev=>({...prev,rows:[blankGuidanceRow()],values:{}}))}
 },[id,isGuidanceFollowup])
 useEffect(()=>{let alive=true;(async()=>{
if(id!=='parliament-members'||!profile?.school_id)return
try{
const records=await listOfficialFormRecords(['parliament-members'],'','',profile.school_id)
if(!alive)return
if(records?.length){
const record=records[0]
setForm(record.form_data||initial)
setActiveMeetingRecordId(record.id)
}else{
setActiveMeetingRecordId(null)
}
setViewingHistorical(false)
}catch(e){if(alive)setError(e.message||'تعذر تحميل أعضاء البرلمان المحفوظين.')}
})()
return()=>{alive=false}
},[id,profile?.school_id])

useEffect(()=>{let alive=true;(async()=>{if(!['case-study','consultations-monitor','health-cases','dropout-followup','parliament-members','parliament-team-training'].includes(id)||!profile?.school_id){setStudents([]);return}try{const rows=id==='parliament-members'?await listParliamentStudents(profile.school_id):await listStudents(profile.school_id);if(alive)setStudents(rows||[])}catch(e){if(alive)setError(e.message||'تعذر تحميل قائمة الطلاب.')}})();return()=>{alive=false}},[id,profile?.school_id])
 useEffect(()=>{let alive=true;(async()=>{if(!['case-study','consultations-monitor','health-cases','dropout-followup','parliament-team-training'].includes(id)||!profile?.school_id){if(alive)setMeetingRecords([]);return}try{const records=await listOfficialFormRecords([id],form.school_year_id||'',form.semester_id||'',profile.school_id);if(alive)setMeetingRecords(records||[])}catch(e){if(alive)setError(e.message||'تعذر تحميل السجلات المحفوظة.')}})();return()=>{alive=false}},[id,profile?.school_id,form.school_year_id,form.semester_id])
 useEffect(()=>{if(!notice)return;const timer=window.setTimeout(()=>setNotice(''),2000);return()=>window.clearTimeout(timer)},[notice])
 useEffect(()=>{
  if(!profile?.school_id||!form.school_year_id||isGuidanceFollowup||id==='parliament-members'||id==='hot-case-notice'||['meeting-principal','meeting-teacher','meeting-parents','group-counseling-plan','group-session-details','semester-report'].includes(id))return
  try{const key=`official-form-${id}-${profile.school_id}-${form.school_year_id}`;const raw=localStorage.getItem(key);if(raw){const saved=JSON.parse(raw);if(saved&&typeof saved==='object')setForm(prev=>({...prev,...saved,school_year_id:form.school_year_id}))}}catch(e){console.warn('تعذر تحميل بيانات النموذج المحفوظة للمدرسة والسنة المحددتين',e)}
 },[id,profile?.school_id,form.school_year_id,isGuidanceFollowup])
 useEffect(()=>{let alive=true;(async()=>{try{const[p,a]=await Promise.all([currentProfile(),listActiveAcademicData()]);if(!alive)return;let effectiveProfile=p;
const params=new URLSearchParams(location.search);
const selectedSchoolId=params.get('school_id');
const selectedYearId=params.get('school_year_id');
const selectedCounselorName=params.get('counselor_name');

if(selectedSchoolId&&p?.role==='DIRECTORATE'){
  if(!p.directorate_id){
    throw new Error('لا توجد مديرية مرتبطة بحسابك.');
  }

  const schoolRows=await listSchoolsByDirectorate(p.directorate_id);
  const selectedSchool=schoolRows.find(
    x=>String(x.id)===String(selectedSchoolId)
  );

  if(!selectedSchool){
    throw new Error('غير مسموح لك بفتح نماذج مدرسة خارج مديريتك.');
  }

  const managerName=await getSchoolManagerName(selectedSchool.id);
  effectiveProfile={
    ...p,
    school_id:selectedSchool.id,
    schools:selectedSchool,
    manager_name:managerName,
    full_name:selectedCounselorName||p.full_name
  };
}if(!alive)return;setProfile(effectiveProfile);setAcademic(a||{years:[],semesters:[],grades:[]});const y=(a?.years||[]).find(x=>String(x.id)===String(selectedYearId))||(a?.years||[]).find(x=>x.is_active)||(a?.years||[])[0];const sem=(a?.semesters||[]).find(s=>s.school_year_id===y?.id&&new Date()>=new Date(s.start_date||'1900-01-01')&&new Date()<=new Date(s.end_date||'2999-12-31'))||(a?.semesters||[]).find(s=>s.school_year_id===y?.id);setForm(v=>({...v,school_year_id:y?.id||'',semester_id:sem?.id||''}))}catch(e){if(alive)setError(e.message||'تعذر تحميل بيانات النظام.')}finally{if(alive)setLoading(false)}})();return()=>{alive=false}},[location.search])

 // Both guidance follow-up forms use the same school-specific grade/section lists.
 useEffect(()=>{
  if(!(isGuidanceFollowup||id==='parliament-members')||!profile?.school_id){setSchoolSections([]);return}
  let alive=true
  ;(async()=>{
   try{
    const client=requireSemesterReportClient()
    const {data,error:sectionError}=await client.from('sections').select('id,name,grade_id,school_id').eq('school_id',profile.school_id).order('name')
    if(sectionError)throw sectionError
    if(alive)setSchoolSections(data||[])
   }catch(e){if(alive){setSchoolSections([]);setError(e.message||'تعذر تحميل شعب المدرسة.')}}
  })()
  return()=>{alive=false}
 },[isGuidanceFollowup,id,profile?.school_id])

 useEffect(()=>{
  if(id!=='meeting-teacher'||!profile?.school_id){
   setTeachers([])
   return
  }
  let alive=true
  listSchoolTeachers(profile.school_id)
   .then(list=>{if(alive)setTeachers(list||[])})
   .catch(e=>{if(alive)setError(e.message||'تعذر تحميل قائمة معلمي المدرسة.')})
  return()=>{alive=false}
 },[id,profile?.school_id])

 useEffect(()=>{
  if(!profile?.id||!['meeting-principal','meeting-teacher','meeting-parents'].includes(id))return
  let alive=true
  ;(async()=>{
   try{
    const records=await listOfficialFormRecords([id],form.school_year_id||'',form.semester_id||'',profile?.school_id||'')
    if(!alive)return
    const sorted=[...records].sort((a,b)=>{
     const da=String(a.form_data?.values?.['التاريخ']||a.created_at||'')
     const db=String(b.form_data?.values?.['التاريخ']||b.created_at||'')
     return db.localeCompare(da)
    })
    setMeetingRecords(sorted)
    // Restore an unfinished draft first, so leaving the page never discards in-progress input.
    const draftRaw=localStorage.getItem(`official-form-${id}-draft`)
    if(draftRaw){
     const draft=JSON.parse(draftRaw)
     if(draft?.form){setForm(draft.form);setActiveMeetingRecordId(draft.recordId||null);setViewingHistorical(false);return}
    }
    // Support the older local draft format used before the separate-meetings workflow.
    const raw=localStorage.getItem(`official-form-${id}`)
    if(raw){
     const legacy=JSON.parse(raw)
     if(sorted.length){setForm(legacy);setActiveMeetingRecordId(sorted[0].id);setViewingHistorical(false);return}
     const migrated={...legacy,school_year_id:legacy.school_year_id||form.school_year_id||'',semester_id:legacy.semester_id||form.semester_id||''}
     const saved=await saveOfficialFormRecord({formId:id,profile,form:migrated})
     if(!alive)return
     setForm(migrated);setActiveMeetingRecordId(saved?.id||null)
     localStorage.removeItem(`official-form-${id}`)
     const refreshed=await listOfficialFormRecords([id],form.school_year_id||'',form.semester_id||'',profile?.school_id||'')
     if(alive)setMeetingRecords(refreshed)
     setNotice('تم نقل المسودة السابقة إلى سجل الاجتماعات.')
     return
    }
    if(sorted.length){
     const saved=sorted[0]
     setForm(saved.form_data||initial)
     setActiveMeetingRecordId(saved.id)
     setViewingHistorical(false)
     return
    }
    // No saved meetings or local drafts: keep the blank initial form.
   }catch(e){if(alive)setError(e.message||'تعذر تحميل سجل الاجتماعات من قاعدة البيانات.')}
  })()
  return()=>{alive=false}
 },[id,profile?.id,form.school_year_id,form.semester_id])


 useEffect(()=>{
  if(id!=='annual-plan'||!profile?.id)return
  let alive=true
  ;(async()=>{
   const db=requireSemesterReportClient()
   const selectedYear=(academic.years||[]).find(y=>y.id===form.school_year_id)||(academic.years||[]).find(y=>y.is_active)||(academic.years||[])[0]
   const yearId=selectedYear?.id
   let groupIds=[]
   try{
    const {data}=await db.from('group_counseling_groups').select('id').eq('counselor_id',profile.id)
    groupIds=(data||[]).map(x=>x.id)
   }catch{}
   const totals=new Map(ANNUAL_SOURCES.map(src=>[src.label,{label:src.label,total:0,months:{}}]))
   const interviewPeople=['مدير المدرسة','معلم','ولي الأمر','مؤسسات أخرى','تدريب خريجي الجامعات']
  const interviewTopics=['نفسية','سلوكية','تربوية']
  const interviewTotals=new Map()
  interviewPeople.forEach(person=>interviewTopics.forEach(topic=>{
   const label=`مقابلة مع ${person} (${topic})`
   interviewTotals.set(`${person}||${topic}`,{label,total:0,months:{}})
  }))
   const errors=[]
   await Promise.all(ANNUAL_SOURCES.map(async source=>{
    try{
     // The principal/teacher/parent meeting forms currently persist their rows
     // in browser localStorage (official-form-<form-id>), not in Supabase tables.
     // Their annual-plan counts are collected from the saved form payload below.
     if(['principal_meetings','teacher_meetings','parent_meetings'].includes(source.table))return
     // Read rows visible under the current Supabase session first. Some meeting
     // screens save school-owned rows without counselor_id, so filtering in SQL
     // by counselor_id would silently omit those records.
     const {data,error}=await db.from(source.table).select('*')
     if(error)throw error
     ;(data||[]).forEach(row=>{
      const ownerIds=['counselor_id','user_id','profile_id','created_by','entered_by']
       .map(k=>row?.[k]).filter(Boolean).map(String)
      if(ownerIds.length&&!ownerIds.includes(String(profile.id)))return
      if(row.school_id&&profile.school_id&&String(row.school_id)!==String(profile.school_id))return
      if(row.school_year_id&&yearId&&String(row.school_year_id)!==String(yearId))return
      if(source.grouped&&groupIds.length&&!groupIds.includes(row.group_id))return
      const d=annualDate(row,source.dates)
      if(!ANNUAL_MONTHS.includes(d.month))return
      if(d.year&&selectedYear?.start_date&&selectedYear?.end_date){
       const sy=new Date(selectedYear.start_date).getFullYear(),ey=new Date(selectedYear.end_date).getFullYear()
       if(d.year<Math.min(sy,ey)||d.year>Math.max(sy,ey))return
      }
      if(source.table==='interviews'){
       const person=String(row.person||row.person_type||row.interviewed_person||row.person_interviewed||row.interviewee||'').trim()
       const topic=String(row.topic||row.interview_topic||row.consultation_type||row.interview_type||'').trim()
       const item=interviewTotals.get(`${person}||${topic}`)
       if(item){
        item.total++
        item.months[d.month]=(item.months[d.month]||0)+1
       }
       return
      }
      const item=totals.get(source.label)
      item.total++
      item.months[d.month]=(item.months[d.month]||0)+1
     })
    }catch(e){errors.push(`${source.table}: ${e.message||'تعذر القراءة'}`)}
   }))
   // Read the three meeting forms from Supabase through the authenticated custom-JWT server.
   const meetingFormSources=[
    {formId:'meeting-principal',label:'اجتماعات مدير/ة المدرسة'},
    {formId:'meeting-teacher',label:'اجتماعات المعلمين'},
    {formId:'meeting-parents',label:'اجتماعات أولياء الأمور'}
   ]
   try{
    let records=await listOfficialFormRecords(meetingFormSources.map(x=>x.formId),yearId||'', '', profile?.school_id||'')
    for(const source of meetingFormSources){
     let record=records.find(r=>r.form_id===source.formId)
     if(!record){
      const raw=localStorage.getItem(`official-form-${source.formId}`)
      if(raw){
       const legacy=JSON.parse(raw)
       if(!legacy?.school_year_id||!yearId||String(legacy.school_year_id)===String(yearId)){
        await saveOfficialFormRecord({formId:source.formId,profile,form:{...legacy,school_year_id:legacy.school_year_id||yearId||''}})
        localStorage.removeItem(`official-form-${source.formId}`)
       }
      }
     }
    }
    records=await listOfficialFormRecords(meetingFormSources.map(x=>x.formId),yearId||'', '', profile?.school_id||'')
    meetingFormSources.forEach(source=>{
     const saved=records.find(r=>r.form_id===source.formId)?.form_data
     ;(saved?.rows||[]).forEach(row=>{
      const d=annualDate(row,['التاريخ','meeting_date','date','created_at'])
      if(!ANNUAL_MONTHS.includes(d.month))return
      if(d.year&&selectedYear?.start_date&&selectedYear?.end_date){
       const sy=new Date(selectedYear.start_date).getFullYear(),ey=new Date(selectedYear.end_date).getFullYear()
       if(d.year<Math.min(sy,ey)||d.year>Math.max(sy,ey))return
      }
      const item=totals.get(source.label)
      if(item){item.total++;item.months[d.month]=(item.months[d.month]||0)+1}
     })
    })
   }catch(e){errors.push(`نماذج الاجتماعات: ${e.message||'تعذر القراءة من قاعدة البيانات'}`)}
   if(!alive)return
   const makeAnnualRow=item=>{
    const row={'النشاط الاستراتيجي':`${item.label} (${item.total})`}
    ANNUAL_MONTHS.forEach(month=>row[String(month)]=String(item.months[month]||0))
    row['المسؤول / جهة التنفيذ']=profile.full_name||''
    row['ملاحظات']=''
    return row
   }
   const generatedRows=[
    ...ANNUAL_SOURCES.filter(source=>source.table!=='interviews').map(source=>makeAnnualRow(totals.get(source.label))),
    ...Array.from(interviewTotals.values()).map(makeAnnualRow)
   ]
   // Preserve counselor-entered monthly figures when the annual plan is reopened.
   let savedRows=[]
   try{savedRows=JSON.parse(localStorage.getItem('official-form-annual-plan')||'null')?.rows||[]}catch{}
   const savedByLabel=new Map(savedRows.map(row=>[String(row['النشاط الاستراتيجي']||'').replace(/\s*\(\d+\)\s*$/,''),row]))
   const rows=generatedRows.map(row=>{
    const saved=savedByLabel.get(String(row['النشاط الاستراتيجي']||'').replace(/\s*\(\d+\)\s*$/,''))
    if(!saved)return row
    const merged={...row,...saved}
    // Keep manually entered month values (including zero) and refresh the displayed total.
    const total=['9','10','11','12','1','2','3','4','5'].reduce((sum,month)=>sum+Math.max(0,Number(merged[month])||0),0)
    merged['النشاط الاستراتيجي']=`${String(row['النشاط الاستراتيجي']||'').replace(/\s*\(\d+\)\s*$/,'')} (${total})`
    return merged
   })
   setForm(prev=>({...prev,rows}))
   if(errors.length)setError('تعذر تحميل بعض الجداول: '+errors.join(' | '))
   else setError('')
  })().catch(e=>{if(alive)setError(e.message||'تعذر تحميل بيانات الخطة السنوية')})
  return()=>{alive=false}
 },[id,profile?.id,profile?.school_id,academic.years,form.school_year_id])

 const yearName=(academic.years||[]).find(x=>x.id===form.school_year_id)?.name||'—';const semesterName=(academic.semesters||[]).find(x=>x.id===form.semester_id)?.name||'—';const academicView={...academic,yearName,semesterName}
 const isPrincipalMeeting=id==='meeting-principal'
 const isTeacherMeeting=id==='meeting-teacher'
 const isParentsMeeting=id==='meeting-parents'
 const isSpecialMeeting=isPrincipalMeeting||isTeacherMeeting||isParentsMeeting
 const isDatabaseForm=['case-study','consultations-monitor','health-cases','dropout-followup','parliament-team-training'].includes(id)
 const save=async()=>{
   if(viewingHistorical){setError('هذا اجتماع سابق للعرض فقط. اضغط «اجتماع جديد» لإدخال اجتماع آخر.');return}
   const formToSave=form?._document_snapshot?form:{...form,_document_snapshot:{
    counselor_name:profile?.full_name||'',
    manager_name:profile?.manager_name||'',
    school_name:profile?.schools?.name||'',
    captured_at:new Date().toISOString()
   }}
   setForm(formToSave)
   if(!['meeting-principal','meeting-teacher','meeting-parents','case-study','consultations-monitor','health-cases','dropout-followup','parliament-members','parliament-team-training'].includes(id)){
    try{
     const storageKey=`official-form-${id}-${profile?.school_id||'no-school'}-${formToSave.school_year_id||'no-year'}`
     if(id==='hot-case-notice'){
      const historyKey=`official-form-hot-case-notice-history-${profile?.school_id||'no-school'}-${formToSave.school_year_id||'no-year'}`
      const history=JSON.parse(localStorage.getItem(historyKey)||'[]')
      localStorage.setItem(historyKey,JSON.stringify([...history,{...formToSave,saved_at:new Date().toISOString()}]))
      const cleared={...initial,school_year_id:formToSave.school_year_id,semester_id:formToSave.semester_id,values:{}}
      localStorage.setItem(storageKey,JSON.stringify(cleared))
      setForm(cleared)
     }else{
      localStorage.setItem(storageKey,JSON.stringify(formToSave))
     }
     setNotice('تم حفظ بيانات النموذج بنجاح.')
    }catch(e){setNotice('تعذر حفظ البيانات، حاول مرة أخرى.')}
    return
   }
   try{
    const saved=await saveOfficialFormRecord({formId:id,profile,form:formToSave,recordId:activeMeetingRecordId})
    if(saved?.id)setActiveMeetingRecordId(saved.id)
    localStorage.removeItem(`official-form-${id}-draft`)
    localStorage.removeItem(`official-form-${id}`)
    const records=await listOfficialFormRecords([id],id==='parliament-members'?'':formToSave.school_year_id||'',id==='parliament-members'?'':formToSave.semester_id||'',profile?.school_id||'')
    setMeetingRecords(records)
    setNotice(id==='parliament-members'?(activeMeetingRecordId?'تم تحديث أعضاء البرلمان بنجاح.':'تم حفظ أعضاء البرلمان بنجاح.'):id==='parliament-team-training'?(activeMeetingRecordId?'تم تحديث اللقاء التدريبي بنجاح.':'تم حفظ اللقاء التدريبي بنجاح.'):(activeMeetingRecordId?'تم تحديث الاجتماع الحالي.':'تم حفظ الاجتماع وإضافته إلى السجل.'))
   }catch(e){setError(e.message||'تعذر حفظ البيانات في قاعدة البيانات.')}
  }
  const sortedMeetingRecords=[...meetingRecords].sort((a,b)=>String(meetingRecordDate(b)).localeCompare(String(meetingRecordDate(a))))
 const databaseRecordDate=record=>record?.form_data?.values?.['التاريخ']||record?.form_data?.values?.['تاريخ فتح الحالة']||record?.form_data?.values?.['تاريخ التسرب']||record?.form_data?.rows?.[0]?.['التاريخ']||record?.created_at||record?.updated_at||''
 const databaseRecordTitle=record=>{const v=record?.form_data?.values||{};const r=record?.form_data?.rows?.[0]||{};return v['اللقاء']||v['عنوان اللقاء']||v['اسم الطالب']||v['الطالب']||r['الطالب/الشخص']||r['رمز الطالب']||v['موضوع الاستشارة']||'سجل محفوظ'}
 const openDatabaseRecord=record=>{setForm(record.form_data||initial);setActiveMeetingRecordId(record.id);setViewingHistorical(false);setShowMeetingHistory(false);setShowPreview(false);setError('')}
const deleteHealthCaseRecord=record=>setDeleteTarget(record);
const confirmDeleteHealthCaseRecord=async()=>{
  const record=deleteTarget;
  if(!record)return;
  try{
    await deleteOfficialFormRecord(record.id);
    const records=await listOfficialFormRecords(['health-cases'],form.school_year_id||'',form.semester_id||'',profile?.school_id||'');
    setMeetingRecords(records);
    if(activeMeetingRecordId===record.id){setActiveMeetingRecordId(null);setForm({...initial,school_year_id:form.school_year_id,semester_id:form.semester_id});}
    setDeleteTarget(null);
    setNotice('تم حذف سجل الحالة الصحية بنجاح.');
  }catch(e){setDeleteTarget(null);setError(e.message||'تعذر حذف السجل.');}
}
 const createNewDatabaseRecord=()=>{setForm({...initial,school_year_id:form.school_year_id,semester_id:form.semester_id});setActiveMeetingRecordId(null);setViewingHistorical(false);setShowMeetingHistory(false);setShowPreview(false);setError('')}
 const print=()=>window.print()
 const isMeeting=id==='meeting-followup', config=FORM_CONFIGS[id]||{fields:['البيانات','الملاحظات'],columns:[]}
 if(loading)return previewOnly?<div className="meeting-preview-overlay"><div className="meeting-preview-modal" style={{height:'auto',padding:28,textAlign:'center'}}>جارٍ تجهيز النموذج الرسمي...</div></div>:<Page title="النماذج الرسمية" sub="جارٍ تحميل البيانات تلقائيًا..."><Card><div className="loading">جارٍ تحميل بيانات المرشد والسنة الدراسية...</div></Card></Page>
 if(previewOnly)return <section className="page counselor-direct-preview-page"><div className="meeting-preview-overlay counselor-direct-preview" role="dialog" aria-modal="true"><div className="meeting-preview-modal"><div className="meeting-preview-toolbar"><div><strong>{title}</strong><span>النموذج الرسمي — معاينة مباشرة</span></div><div className="meeting-preview-actions"><Button variant="secondary" onClick={()=>document.querySelector('.counselor-direct-preview .official-document')?.requestFullscreen?.()}><Maximize2 size={15}/> عرض كامل</Button><Button variant="secondary" onClick={print}><Printer size={15}/> طباعة / PDF</Button><Button onClick={()=>navigate('/counselor-work-followup',{replace:true})}><X size={15}/> رجوع</Button></div></div><div className="meeting-paper-wrap">{isGuidanceFollowup?<GuidanceMeetingsFollowupPreview title={title} profile={documentProfile} grades={academic.grades||[]} sections={schoolSections} form={form} academicYear={yearName}/>:isMeeting?<MeetingFollowupPreview profile={documentProfile} form={form} academic={academicView}/>:id==='parliament-team-training'?<ParliamentTeamTrainingPreview profile={documentProfile} academic={academicView} form={form}/>:<GenericOfficialPreview title={title} config={config} profile={documentProfile} academic={academicView} form={form} records={meetingRecords} students={students}/>}</div></div></div></section>
 return <Page title={title} sub="أدخل البيانات مرة واحدة، واعرض النموذج الرسمي عند الحاجة.">
  {notice&&<div className="meeting-preview-overlay official-save-notice" role="alertdialog" aria-modal="true"><div style={{width:'min(420px,92vw)',background:'#fffdf8',border:'1px solid #e3d5bf',borderRadius:24,padding:'30px 24px',boxShadow:'0 20px 60px rgba(0,0,0,.22)',textAlign:'center'}}><div style={{fontSize:42,marginBottom:12}}>✓</div><h3 style={{margin:'0 0 12px',color:'#075b57'}}>تم الحفظ</h3><p style={{margin:'0 0 24px',color:'#655f55'}}>{notice}</p><Button onClick={()=>setNotice('')}>حسنًا</Button></div></div>}
  {error&&<ErrorNotice>{error}</ErrorNotice>}{deleteTarget&&<div role="dialog" aria-modal="true" style={{position:'fixed',inset:0,zIndex:10000,background:'rgba(20,25,23,.62)',display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
<div style={{width:'min(430px,100%)',background:'#fffdf8',border:'1px solid #e5d8c5',borderRadius:22,padding:'28px 22px',boxShadow:'0 22px 70px rgba(0,0,0,.3)',textAlign:'center',direction:'rtl'}}>
<div style={{width:58,height:58,borderRadius:'50%',background:'#fbe9e5',color:'#b42318',display:'grid',placeItems:'center',margin:'0 auto 14px'}}><Trash2 size={27}/></div>
<h3 style={{margin:'0 0 12px',color:'#075b57'}}>تأكيد حذف السجل</h3>
<p style={{margin:'0 0 24px',color:'#655f55',lineHeight:1.8}}>هل أنت متأكد من حذف سجل الحالة الصحية لهذا الطالب؟ لا يمكن التراجع عن هذه العملية.</p>
<div style={{display:'flex',gap:10,justifyContent:'center'}}>
<Button onClick={confirmDeleteHealthCaseRecord} style={{background:'#b42318',borderColor:'#b42318'}}>تأكيد الحذف</Button>
<Button variant="secondary" onClick={()=>setDeleteTarget(null)}>إلغاء</Button>
</div></div></div>}
  <div className="official-workspace official-workspace-entry-only"><section className="official-entry-panel">
   {isDatabaseForm&&<div className="meeting-entry-actions" style={{padding:'14px 18px',margin:0,borderBottom:'1px solid #e8ddcd',borderTop:0}}><Button onClick={createNewDatabaseRecord}><Plus size={16}/> سجل جديد</Button><Button variant="secondary" onClick={()=>setShowMeetingHistory(true)}><History size={16}/> السجلات المحفوظة ({meetingRecords.length})</Button>{activeMeetingRecordId&&<span style={{alignSelf:'center',fontSize:13,color:'#075b57'}}>تعديل سجل محفوظ</span>}</div>}
   {isSpecialMeeting&&<div className="meeting-entry-actions" style={{padding:'14px 18px',margin:0,borderBottom:'1px solid #e8ddcd',borderTop:0}}><Button onClick={createNewPrincipalMeeting}><Plus size={16}/> اجتماع جديد</Button><Button variant="secondary" onClick={()=>setShowMeetingHistory(true)}><History size={16}/> عرض سجل الاجتماعات ({meetingRecords.length})</Button>{viewingHistorical&&<Button variant="secondary" onClick={createNewPrincipalMeeting}>العودة لاجتماع جديد</Button>}</div>}
   {isSpecialMeeting&&viewingHistorical&&<div className="official-auto-note" style={{margin:'12px 18px'}}>أنت تعرض اجتماعًا سابقًا — العرض للقراءة فقط.</div>}
   {id==='group-counseling-plan'?<GroupCounselingPlan formId={id}/>:id==='group-session-details'?<GroupAssessment/>:isGuidanceFollowup?<GuidanceMeetingsFollowupEntry meetingLabel={id==='career-guidance-followup'?'لقاءات التوجيه المهني':'لقاءات التوجيه الجمعي'} profile={documentProfile} grades={(academic.grades||[]).filter(g=>!profile?.school_id||String(g.school_id)===String(profile.school_id))} sections={schoolSections} form={form} onChange={setForm} onShowPreview={()=>setShowPreview(true)} onSave={save}/>:isMeeting?<MeetingFollowupEntry profile={documentProfile} academic={academicView} form={form} onChange={setForm} today={today} onShowPreview={()=>setShowPreview(true)} onSave={save}/>:id==='semester-report'?<SemesterReportCounts academic={academic} profile={documentProfile}/>:id==='parliament-team-training'?<ParliamentTeamTraining profile={documentProfile} academic={academicView} form={form} onChange={setForm} onShowPreview={()=>setShowPreview(true)} onSave={save} meetingNumber={activeMeetingRecordId?(Number(form.values?.meeting_number)||1):meetingRecords.length+1}/>:<GenericOfficialForm config={config} title={title} profile={documentProfile} academic={academicView} form={form} onChange={(viewingHistorical&&['hot-cases-monitor','hot-case-notice','hot-cases-school','hot-cases-directorate'].includes(id))?()=>{}:isSpecialMeeting?(viewingHistorical?()=>{}:handleGenericFormChange):setForm} onShowPreview={()=>setShowPreview(true)} onSave={viewingHistorical?()=>{}:save} teachers={teachers} students={students} grades={(academic.grades||[]).filter(g=>!profile?.school_id||String(g.school_id)===String(profile.school_id))} sections={schoolSections}/> }
  </section></div>
  {id==='health-cases'&&<section style={{marginTop:22,padding:18,background:'#fffdf8',border:'1px solid #e5d8c5',borderRadius:16,direction:'rtl'}}>
<h3 style={{margin:'0 0 14px',color:'#075b57'}}>سجلات الحالات الصحية ({meetingRecords.length})</h3>
{meetingRecords.length?[...meetingRecords].sort((a,b)=>String(databaseRecordDate(b)).localeCompare(String(databaseRecordDate(a)))).map(record=><div key={record.id} style={{display:'flex',flexDirection:'row',flexWrap:'nowrap',gap:7,alignItems:'center',justifyContent:'space-between',padding:'8px 10px',border:'1px solid #e5d8c5',borderRadius:10,marginBottom:7,background:'#fff'}}>
<div style={{minWidth:0,flex:'1 1 auto'}}><strong style={{display:'block',color:'#075b57',fontSize:12,lineHeight:1.4,overflowWrap:'anywhere'}}>{databaseRecordTitle(record)}</strong><span style={{display:'block',fontSize:9,color:'#786f65',marginTop:2}}>التاريخ: {databaseRecordDate(record)?String(databaseRecordDate(record)).slice(0,10):'غير محدد'}</span></div>
<div style={{display:'flex',gap:4,flexWrap:'nowrap',flexShrink:0}}><Button style={{padding:'5px 7px',fontSize:10,minHeight:28,whiteSpace:'nowrap'}} onClick={()=>openDatabaseRecord(record)}><Edit size={12}/> تعديل</Button><Button variant="secondary" style={{padding:'5px 7px',fontSize:10,minHeight:28,whiteSpace:'nowrap'}} onClick={()=>deleteHealthCaseRecord(record)}><Trash2 size={12}/> حذف</Button></div>
</div>):<div style={{textAlign:'center',padding:24,color:'#81766a'}}>لا توجد سجلات حالات صحية محفوظة.</div>}
</section>}
  {id==='parliament-team-training'&&<section style={{marginTop:22,padding:18,background:'#fffdf8',border:'1px solid #e5d8c5',borderRadius:16,direction:'rtl'}}>
   <h3 style={{margin:'0 0 14px',color:'#075b57'}}>سجل اللقاءات التدريبية ({meetingRecords.length})</h3>
   {meetingRecords.length?[...meetingRecords].sort((a,b)=>String(b.created_at||'').localeCompare(String(a.created_at||''))).map((record,index)=><div key={record.id} style={{display:'flex',flexWrap:'wrap',gap:10,alignItems:'center',justifyContent:'space-between',padding:'12px',border:'1px solid #e5d8c5',borderRadius:12,marginBottom:9,background:'#fff'}}>
    <div style={{minWidth:0,flex:'1 1 160px'}}>
     <strong style={{display:'block',color:'#075b57'}}>{record.form_data?.values?.['اللقاء']||`اللقاء ${['الأول','الثاني','الثالث','الرابع','الخامس','السادس','السابع','الثامن','التاسع','العاشر','الحادي عشر','الثاني عشر','الثالث عشر','الرابع عشر','الخامس عشر','السادس عشر','السابع عشر','الثامن عشر','التاسع عشر','العشرون'][meetingRecords.length-index-1]||meetingRecords.length-index}`}</strong>
     <span style={{display:'block',fontSize:12,color:'#786f65',marginTop:4}}>تاريخ الحفظ: {record.created_at?String(record.created_at).slice(0,10):'—'}</span>
    </div>
    <div style={{display:'flex',gap:7,flexWrap:'wrap'}}>
     <Button onClick={()=>openDatabaseRecord(record)}><Edit size={14}/> تعديل</Button>
     <Button variant="secondary" onClick={()=>{setForm(record.form_data||initial);setActiveMeetingRecordId(record.id);setViewingHistorical(true);setShowMeetingHistory(false);setShowPreview(true);}}><Eye size={14}/> عرض النموذج الرسمي</Button>
    </div>
   </div>):<div style={{textAlign:'center',padding:24,color:'#81766a'}}>لا توجد لقاءات تدريبية محفوظة حتى الآن.</div>}
  </section>}
  <div className="meeting-bottom-note">النموذج الرسمي مخفي افتراضيًا. اضغط «عرض النموذج الرسمي» لمعاينته أو طباعته أو حفظه PDF.</div>
  {showMeetingHistory&&isDatabaseForm&&<div className="meeting-preview-overlay" role="dialog" aria-modal="true"><div className="meeting-preview-modal" style={{height:'min(82vh,760px)',maxWidth:760}}><div className="meeting-preview-toolbar"><div><strong>السجلات المحفوظة — {title}</strong><span>اختر سجلًا لفتحه وتعديله</span></div><div className="meeting-preview-actions"><Button variant="secondary" onClick={()=>setShowMeetingHistory(false)}><X size={15}/> إغلاق</Button></div></div><div style={{padding:18,overflowY:'auto',direction:'rtl'}}>{meetingRecords.length?[...meetingRecords].sort((a,b)=>String(databaseRecordDate(b)).localeCompare(String(databaseRecordDate(a)))).map(record=><div key={record.id} style={{display:'flex',gap:12,alignItems:'center',justifyContent:'space-between',padding:'14px 12px',border:'1px solid #e5d8c5',borderRadius:14,marginBottom:10,background:'#fffdf8'}}><div style={{minWidth:0}}><strong style={{display:'block',color:'#075b57'}}>{databaseRecordTitle(record)}</strong><span style={{display:'block',fontSize:12,color:'#786f65',marginTop:5}}>التاريخ: {databaseRecordDate(record)?String(databaseRecordDate(record)).slice(0,10):'غير محدد'}</span></div><Button onClick={()=>openDatabaseRecord(record)}><Eye size={15}/> فتح وتعديل</Button></div>):<div style={{textAlign:'center',padding:36,color:'#81766a'}}>لا توجد سجلات محفوظة حتى الآن.</div>}</div></div></div>}
   {showMeetingHistory&&isSpecialMeeting&&<div className="meeting-preview-overlay" role="dialog" aria-modal="true"><div className="meeting-preview-modal" style={{height:'min(82vh,760px)',maxWidth:760}}><div className="meeting-preview-toolbar"><div><strong>{isParentsMeeting?'سجل اجتماعات أولياء الأمور':isTeacherMeeting?'سجل اجتماعات معلمي/ات المدرسة':'سجل اجتماعات مدير/ة المدرسة'}</strong><span>مرتبة من الأحدث إلى الأقدم حسب تاريخ الاجتماع</span></div><div className="meeting-preview-actions"><Button variant="secondary" onClick={()=>setShowMeetingHistory(false)}><X size={15}/> إغلاق</Button></div></div><div style={{padding:18,overflowY:'auto',direction:'rtl'}}>{sortedMeetingRecords.length?sortedMeetingRecords.map((record,index)=><div key={record.id} style={{display:'flex',gap:12,alignItems:'center',justifyContent:'space-between',padding:'14px 12px',border:'1px solid #e5d8c5',borderRadius:14,marginBottom:10,background:'#fffdf8'}}><div style={{minWidth:0}}><strong style={{display:'block',color:'#075b57'}}>{meetingRecordTopic(record)}</strong><span style={{display:'block',fontSize:12,color:'#786f65',marginTop:5}}>التاريخ: {meetingRecordDate(record)?new Date(`${String(meetingRecordDate(record)).slice(0,10)}T12:00:00`).toLocaleDateString('en-GB'):'غير محدد'} · عدد الحضور: {record.form_data?.values?.['عدد الحضور']||'—'}</span></div><Button onClick={()=>openPreviousMeeting(record)}><Eye size={15}/> عرض</Button></div>):<div style={{textAlign:'center',padding:36,color:'#81766a'}}>لا توجد اجتماعات محفوظة حتى الآن.</div>}</div></div></div>}
  {showPreview&&<div className="meeting-preview-overlay" role="dialog" aria-modal="true"><div className="meeting-preview-modal"><div className="meeting-preview-toolbar"><div><strong>{viewingHistorical?'محضر اجتماع سابق':'النموذج الرسمي'}</strong><span>{viewingHistorical?'عرض سجل محفوظ — دون تعديل':'المعاينة الحية — البيانات محدثة مباشرة من نموذج الإدخال'}</span></div><div className="meeting-preview-actions"><Button variant="secondary" onClick={()=>document.querySelector('.meeting-preview-modal .official-document')?.requestFullscreen?.()}><Maximize2 size={15}/> عرض كامل</Button><Button variant="secondary" onClick={print}><Printer size={15}/> طباعة / PDF</Button>{!viewingHistorical&&<Button onClick={save}><Save size={15}/> حفظ</Button>}<Button variant="secondary" onClick={()=>setShowPreview(false)}><X size={15}/> إغلاق</Button></div></div><div className="meeting-paper-wrap">{isGuidanceFollowup?<GuidanceMeetingsFollowupPreview title={title} profile={documentProfile} grades={academic.grades||[]} sections={schoolSections} form={form} academicYear={yearName}/>:isMeeting?<MeetingFollowupPreview profile={documentProfile} form={form} academic={academicView}/>:id==='parliament-team-training'?<ParliamentTeamTrainingPreview profile={documentProfile} academic={academicView} form={form}/>:<GenericOfficialPreview title={title} config={config} profile={documentProfile} academic={academicView} form={form} records={meetingRecords} students={students}/>}</div></div></div>}
 </Page>
}
