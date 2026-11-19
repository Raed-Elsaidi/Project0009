import React,{useEffect,useMemo,useState} from 'react'
import { Button } from '../UI'
import { currentUser,currentProfile,requireSemesterReportClient } from '../../services/data'
import { listOfficialFormRecords } from '../../services/officialFormsApi'
import OfficialDocumentHeader from './OfficialDocumentHeader'

const MONTHS=[9,10,11,12,1,2,3,4,5]
const SOURCE_DEFS=[
 {table:'group_sessions',label:'التوجيه الجمعي',dates:['session_date','meeting_date','activity_date','date','created_at'],grouped:true},
 {table:'guidance_sessions',label:'التوجيه المهني',dates:['session_date','guidance_date','activity_date','date','created_at']},
 {table:'parliament_team_meetings',label:'اجتماعات البرلمان الطلابي',dates:['meeting_date','session_date','date','created_at']},
 {table:'focused_interview_followups',label:'رصد ومتابعة المقابلات الفردية المركزة',dates:['interview_date','followup_date','meeting_day','date','created_at']},
 {table:'interviews',label:'المقابلات',dates:['interview_date','meeting_date','date','created_at']},
 {table:'activities',label:'الأنشطة الإرشادية',dates:['activity_date','date','event_date','created_at']}
]
const MEETING_FORMS=[
 {formId:'meeting-principal',label:'اجتماعات مدير/ة المدرسة'},
 {formId:'meeting-teacher',label:'اجتماعات المعلمين'},
 {formId:'meeting-parents',label:'اجتماعات أولياء الأمور'}
]
const INTERVIEW_PEOPLE=['مدير المدرسة','معلم','ولي الأمر','مؤسسات أخرى','تدريب خريجي الجامعات']
const INTERVIEW_TOPICS=['نفسية','سلوكية','تربوية']
const emptyCounts=()=>Object.fromEntries(MONTHS.map(m=>[m,{}]))
const parseDate=(row,keys)=>{
 for(const key of keys){
  const value=row?.[key]
  if(!value)continue
  const raw=String(value).trim()
  const iso=raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/)
  if(iso)return {month:Number(iso[2]),year:Number(iso[1])}
  const dmy=raw.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/)
  if(dmy)return {month:Number(dmy[2]),year:Number(dmy[3])}
  const date=new Date(value)
  if(!Number.isNaN(date.getTime()))return {month:date.getMonth()+1,year:date.getFullYear()}
 }
 return {month:null,year:null}
}
const cleanLabel=value=>String(value||'').replace(/\s*\(\d+\)\s*$/,'').trim()
const yearContains=(date,year)=>{
 if(!date.year||!year?.start_date||!year?.end_date)return true
 const start=new Date(year.start_date).getFullYear(),end=new Date(year.end_date).getFullYear()
 return date.year>=Math.min(start,end)&&date.year<=Math.max(start,end)
}

export default function SemesterReportCounts({academic,profile}){
 const years=academic.years||[],semesters=academic.semesters||[]
 const year=years.find(x=>x.is_active)||years[0]
 const semesterList=useMemo(()=>semesters.filter(s=>String(s.school_year_id)===String(year?.id)).sort((a,b)=>new Date(a.start_date||0)-new Date(b.start_date||0)),[semesters,year?.id])
 const [active,setActive]=useState(0)
 const [counts,setCounts]=useState(emptyCounts)
 const [planRows,setPlanRows]=useState([])
 const [recordId,setRecordId]=useState(null)
 const [busy,setBusy]=useState(false)
 const [loading,setLoading]=useState(false)
 const [message,setMessage]=useState('')
 const [previewSemester,setPreviewSemester]=useState(null)
 const selected=semesterList[active]
 const months=active===0?MONTHS.slice(0,4):MONTHS.slice(4)

 const load=async()=>{
  if(!selected||!year?.id||!profile?.id)return
  setLoading(true);setMessage('')
  try{
   let rows=[]
   try{rows=JSON.parse(localStorage.getItem('official-form-annual-plan')||'null')?.rows||[]}catch{}
   const fallback=[
    ...SOURCE_DEFS.map(x=>({'النشاط الاستراتيجي':x.label})),
    ...MEETING_FORMS.map(x=>({'النشاط الاستراتيجي':x.label})),
    ...INTERVIEW_PEOPLE.flatMap(person=>INTERVIEW_TOPICS.map(topic=>({'النشاط الاستراتيجي':`مقابلة مع ${person} (${topic})`})))
   ]
   const unique=new Map()
   ;[...(rows.length?rows:fallback)].forEach(row=>{
    const label=cleanLabel(row['النشاط الاستراتيجي']||row.activity||row.label)
    if(label&&!unique.has(label))unique.set(label,{label})
   })
   const labels=[...unique.keys()]
   setPlanRows(labels)
   const next=emptyCounts()
   labels.forEach(label=>months.forEach(month=>{next[month][label]=0}))
   const client=requireSemesterReportClient()
   let groupIds=[]
   try{
    const {data,error}=await client.from('group_counseling_groups').select('id').eq('counselor_id',profile.id)
    if(error)throw error
    groupIds=(data||[]).map(x=>String(x.id))
   }catch{}
   const add=(label,row,keys)=>{
    if(!unique.has(label))return
    const date=parseDate(row,keys)
    if(!months.includes(date.month)||!yearContains(date,year))return
    const ownerIds=['counselor_id','user_id','profile_id','created_by','entered_by'].map(k=>row?.[k]).filter(Boolean).map(String)
    if(ownerIds.length&&!ownerIds.includes(String(profile.id)))return
    if(row.school_id&&profile.school_id&&String(row.school_id)!==String(profile.school_id))return
    if(row.school_year_id&&String(row.school_year_id)!==String(year.id))return
    if(row.semester_id&&String(row.semester_id)!==String(selected.id))return
    if(next[date.month][label]!==undefined)next[date.month][label]++
   }
   await Promise.all(SOURCE_DEFS.map(async source=>{
    try{
     const {data,error}=await client.from(source.table).select('*')
     if(error)throw error
     ;(data||[]).forEach(row=>{
      if(source.grouped&&groupIds.length&&!groupIds.includes(String(row.group_id)))return
      if(source.table==='interviews'){
       const person=String(row.person||row.person_type||row.interviewed_person||row.person_interviewed||row.interviewee||'').trim()
       const topic=String(row.topic||row.interview_topic||row.consultation_type||row.interview_type||'').trim()
       add(`مقابلة مع ${person} (${topic})`,row,source.dates)
      }else add(source.label,row,source.dates)
     })
    }catch(e){console.warn(`تعذر قراءة ${source.table}`,e)}
   }))
   try{
    const records=await listOfficialFormRecords(MEETING_FORMS.map(x=>x.formId),year.id)
    MEETING_FORMS.forEach(source=>{
     const record=records.find(r=>r.form_id===source.formId)
     ;(record?.form_data?.rows||[]).forEach(row=>add(source.label,row,['التاريخ','meeting_date','date','created_at']))
    })
   }catch(e){console.warn('تعذر قراءة نماذج الاجتماعات',e)}
   setCounts(next)
   const {data,error}=await client.from('semester_reports').select('id').eq('counselor_id',(await currentUser()).id).eq('school_year_id',year.id).eq('semester_id',selected.id).maybeSingle()
   if(error)throw error
   setRecordId(data?.id||null)
  }catch(e){setMessage(e.message||'تعذر تحميل بيانات التقرير الفصلي.')}
  finally{setLoading(false)}
 }
 useEffect(()=>{load()},[selected?.id,year?.id,profile?.id])

 const total=label=>months.reduce((sum,month)=>sum+Number(counts[month]?.[label]||0),0)
 const yearName=year?.name||year?.academic_year||'—'
 const schoolName=profile?.schools?.name||'—'
 const directorateName=profile?.directorates?.name||'—'
 const openOfficialPreview=async index=>{
  if(index===active){await load();setPreviewSemester(index)}
  else{setLoading(true);setActive(index);setPreviewSemester(index)}
 }
 const save=async()=>{
  if(!selected||!year?.id){setMessage('يرجى التأكد من إعداد السنة والفصل الدراسي.');return}
  setBusy(true);setMessage('')
  try{
   const client=requireSemesterReportClient(),user=await currentUser(),p=profile||await currentProfile()
   if(!user?.id||!p?.school_id)throw new Error('تعذر تحديد حساب المرشد أو المدرسة.')
   const payload={counselor_id:user.id,school_id:p.school_id,school_year_id:year.id,semester_id:selected.id,monthly_counts:counts}
   if(recordId){const r=await client.from('semester_reports').update(payload).eq('id',recordId).select('id').single();if(r.error)throw r.error}
   else{const r=await client.from('semester_reports').insert(payload).select('id').single();if(r.error)throw r.error;setRecordId(r.data.id)}
   setMessage('تم حفظ ملخص التقرير الفصلي بنجاح.')
  }catch(e){setMessage(e.message||'تعذر حفظ التقرير.')}
  finally{setBusy(false)}
 }
 if(!semesterList.length)return <div className="official-entry-card"><p>لا توجد فصول دراسية مرتبطة بالسنة النشطة. يرجى مراجعة إعدادات السنة والفصول.</p></div>
 return <div className="official-entry-card" dir="rtl">
  <div className="official-entry-section-title"><div><strong>إحصائيات الإنجاز الشهري</strong><span>تُحتسب الأعداد تلقائياً من سجلات الأنشطة المسجلة، وتُطابق أسماء البنود مع الخطة السنوية.</span></div></div>
  <div className="semester-report-semester-actions">{semesterList.slice(0,2).map((s,i)=><div className="semester-report-semester-action" key={s.id}><button type="button" onClick={()=>setActive(i)} className={active===i?'is-active':''}>{i===0?'الفصل الأول':'الفصل الثاني'}</button><Button variant="secondary" onClick={()=>openOfficialPreview(i)}>عرض النموذج الرسمي</Button></div>)}</div>
  <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:10}}><Button variant="secondary" onClick={load} disabled={loading}>{loading?'جارٍ التحديث...':'تحديث الأعداد'}</Button>{loading&&<span>جارٍ احتساب السجلات...</span>}</div>
  <div className="semester-report-table-wrap"><table className="official-entry-table semester-report-grid"><thead><tr><th className="semester-report-activity">النشاط الاستراتيجي</th>{months.map(m=><th key={m}>{m}</th>)}<th>المجموع</th></tr></thead><tbody>{planRows.map(label=><tr key={label}><th className="semester-report-activity">{label}</th>{months.map(m=><td key={m}>{counts[m]?.[label]??0}</td>)}<td className="semester-report-total">{total(label)}</td></tr>)}</tbody><tfoot><tr><th className="semester-report-activity">مجموع جميع البنود</th><td colSpan={months.length+1} className="semester-report-total">{planRows.reduce((sum,label)=>sum+total(label),0)}</td></tr></tfoot></table></div>
  <div style={{display:'flex',alignItems:'center',gap:12,marginTop:14,flexWrap:'wrap'}}><Button onClick={save} disabled={busy||loading}>{busy?'جارٍ الحفظ...':'حفظ ملخص التقرير'}</Button>{message&&<span role="status" style={{color:message.startsWith('تم')?'#15803d':'#b45309'}}>{message}</span>}</div>
  {previewSemester!==null&&!loading&&<div className="semester-report-preview-overlay" role="dialog" aria-modal="true" aria-label="النموذج الرسمي للتقرير الفصلي"><div className="semester-report-preview-toolbar"><strong>النموذج الرسمي — {previewSemester===0?'الفصل الأول':'الفصل الثاني'}</strong><div><Button onClick={()=>window.print()}>طباعة / PDF</Button><Button variant="secondary" onClick={()=>setPreviewSemester(null)}>إغلاق</Button></div></div><div className="semester-report-official-paper"><OfficialDocumentHeader/><div className="semester-report-official-heading"><h1>نموذج التقرير الفصلي حول إنجازات العمل في الخطة</h1><p>للعام الدراسي {yearName} — {previewSemester===0?'الفصل الأول':'الفصل الثاني'}</p><p>{schoolName} — مديرية {directorateName}</p></div><table className="semester-report-official-table"><thead><tr><th>النشاط الاستراتيجي</th>{(previewSemester===0?MONTHS.slice(0,4):MONTHS.slice(4)).map(m=><th key={m}>{m}</th>)}<th>المجموع</th></tr></thead><tbody>{planRows.map(label=><tr key={label}><th>{label}</th>{(previewSemester===0?MONTHS.slice(0,4):MONTHS.slice(4)).map(m=><td key={m}>{counts[m]?.[label]??0}</td>)}<td>{(previewSemester===0?MONTHS.slice(0,4):MONTHS.slice(4)).reduce((sum,m)=>sum+Number(counts[m]?.[label]||0),0)}</td></tr>)}</tbody><tfoot><tr><th>مجموع جميع البنود</th><td colSpan={(previewSemester===0?MONTHS.slice(0,4):MONTHS.slice(4)).length+1}>{planRows.reduce((sum,label)=>sum+(previewSemester===0?MONTHS.slice(0,4):MONTHS.slice(4)).reduce((sub,m)=>sub+Number(counts[m]?.[label]||0),0),0)}</td></tr></tfoot></table><div className="semester-report-signatures"><div><strong>اسم وتوقيع المرشد التربوي</strong><span>{profile?.full_name||'........................'}</span></div><div><strong>اسم وتوقيع مدير المدرسة</strong><span>{profile?.manager_name||'........................'}</span></div></div></div></div>}
 </div>
}
