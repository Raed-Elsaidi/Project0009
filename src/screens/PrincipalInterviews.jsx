import React,{useEffect,useMemo,useState}from'react'
import{Page,Card,Input,Textarea,Button,ErrorNotice}from'../components/UI'
import{currentProfile,listOrganization,listActiveAcademicData,createInterviewRecord,getInterviewRecord,updateInterviewRecord,listInterviewRecords,createWeeklyItem,updateWeeklyItem}from'../services/data'
import OfficialDocumentHeader from'../components/officialForms/OfficialDocumentHeader'
import{Plus,History,Eye,Printer,Save,X}from'lucide-react'
import{useNavigate,useSearchParams}from'react-router-dom'

const pad=n=>String(n).padStart(2,'0')
const today=()=>{const d=new Date();return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`}
const weekdays=['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت']
const dayName=d=>d?weekdays[new Date(`${d}T12:00:00`).getDay()]:''
const dateLabel=d=>d?new Date(`${d}T12:00:00`).toLocaleDateString('en-GB'):'—'
const yearLabel=y=>y?.name||((y?.start_date&&y?.end_date)?`${new Date(y.start_date).getFullYear()}/${new Date(y.end_date).getFullYear()}`:'')
const semesterLabel=s=>s?.name||s?.type||''

export default function PrincipalInterviews(){
 const nav=useNavigate()
 const[params]=useSearchParams()
 const recordId=params.get('record_id')
 const weeklyItemId=params.get('weekly_item_id')
 const weeklyProgramId=params.get('weekly_program_id')
 const weeklyDate=params.get('date')||today()
 const weeklyPeriod=params.get('period')||'الحصة الأولى'
 const[profile,setProfile]=useState(null),[principalName,setPrincipalName]=useState('')
 const[academic,setAcademic]=useState({years:[],semesters:[]})
 const[records,setRecords]=useState([])
 const[form,setForm]=useState({person:'',interview_date:weeklyDate,interview_time:'',topic:'',notes:'',result:'',school_year_id:params.get('year_id')||'',semester_id:params.get('semester_id')||''})
 const[activeId,setActiveId]=useState(null)
 const[historical,setHistorical]=useState(false)
 const[historyOpen,setHistoryOpen]=useState(false)
 const[preview,setPreview]=useState(false)
 const[loading,setLoading]=useState(true)
 const[saving,setSaving]=useState(false)
 const[error,setError]=useState('')
 const[notice,setNotice]=useState('')

 const refresh=async()=>{
  const rows=await listInterviewRecords('مدير المدرسة')
  setRecords(rows)
  return rows
 }

 useEffect(()=>{
  let alive=true
  ;(async()=>{
   try{
    const[p,a,org]=await Promise.all([currentProfile(),listActiveAcademicData(),listOrganization()])
    if(!alive)return
    setProfile(p);setAcademic(a)
    const schoolId=p?.school_id||p?.schools?.id
    const schoolStaff=(org.profiles||[]).filter(x=>String(x.school_id)===String(schoolId))
    const principal=schoolStaff.find(x=>
     String(x.role||'').toUpperCase()==='PRINCIPAL'||
     String(x.job_title||'').includes('مدير')
    )
    const managerName=principal?.full_name||p?.manager_name||''
    setPrincipalName(managerName)
    const activeYear=a.years?.find(x=>x.is_active)||(a.years||[])[0]
    const now=new Date()
    const yearSemesters=(a.semesters||[]).filter(x=>String(x.school_year_id)===String(activeYear?.id))
    const activeSemester=yearSemesters.find(x=>{
     const start=x.start_date?new Date(`${String(x.start_date).slice(0,10)}T00:00:00`):null
     const end=x.end_date?new Date(`${String(x.end_date).slice(0,10)}T23:59:59`):null
     return (!start||now>=start)&&(!end||now<=end)
    })||yearSemesters.find(x=>x.is_active)||yearSemesters[0]
    let next={person:managerName,interview_date:weeklyDate,interview_time:'',topic:'',notes:'',result:'',school_year_id:activeYear?.id||'',semester_id:activeSemester?.id||''}
    if(recordId){
     const r=await getInterviewRecord(recordId)
     next={...next,...r}
     setActiveId(r.id);setHistorical(true)
    }else{
     try{
      const draft=JSON.parse(localStorage.getItem('principal-interview-draft')||'null')
      if(draft?.form)next={...next,...draft.form}
     }catch{}
     // السنة والفصل النشطان من إعدادات النظام لهما الأولوية على المسودة القديمة
     next.school_year_id=activeYear?.id||''
     next.semester_id=activeSemester?.id||''
    }
    if(alive)setForm(next)
    await refresh()
   }catch(e){if(alive)setError(e.message||'تعذر تحميل مقابلات المدير.')}
   finally{if(alive)setLoading(false)}
  })()
  return()=>{alive=false}
 },[recordId])

 useEffect(()=>{
  if(!historical){
   try{localStorage.setItem('principal-interview-draft',JSON.stringify({form}))}catch{}
  }
 },[form,historical])

 const yearName=academic.years?.find(x=>String(x.id)===String(form.school_year_id))?.name||yearLabel(academic.years?.find(x=>String(x.id)===String(form.school_year_id)))||'................'
 const semesterName=semesterLabel(academic.semesters?.find(x=>String(x.id)===String(form.semester_id)))||'................'
 const sorted=useMemo(()=>[...records].sort((a,b)=>String(b.interview_date||'').localeCompare(String(a.interview_date||''))),[records])

 const newInterview=()=>{
  setForm({person:'',interview_date:today(),interview_time:'',topic:'',notes:'',result:'',school_year_id:form.school_year_id||'',semester_id:form.semester_id||''})
  setActiveId(null);setHistorical(false);setPreview(false);setHistoryOpen(false);setError('')
 }

 const save=async()=>{
  if(historical)return setError('هذا سجل سابق للعرض فقط. اضغط «مقابلة جديدة» لإضافة مقابلة أخرى.')
  const personName=String(form.person||principalName||'').trim()
  if(!personName||!form.interview_date||!form.interview_time||!form.topic.trim())
   return setError('أدخل اسم المدير ووقت اللقاء والتاريخ وموضوع المقابلة.')
  if(!form.school_year_id||!form.semester_id)return setError('اختر السنة الدراسية والفصل الدراسي.')
  setSaving(true);setError('')
  try{
   const payload={person:personName,interview_date:form.interview_date,interview_time:form.interview_time,topic:form.topic.trim(),notes:form.notes||'',result:form.result||'',consultation_type:'مقابلة',school_year_id:form.school_year_id,semester_id:form.semester_id,student_id:null,grade_id:null,section_id:null}
   const saved=activeId?await updateInterviewRecord(activeId,payload):await createInterviewRecord(payload)
   setActiveId(saved.id)
   if(weeklyItemId){
    await updateWeeklyItem(weeklyItemId,{work_record_id:saved.id,work_route:'/interviews?type=principal',work_label:'مقابلة مدير/ة المدرسة',topic:'مقابلة مدير/ة المدرسة',activity_type:'مقابلات'})
    nav('/weekly-program')
   }else if(weeklyProgramId){
    await createWeeklyItem({weekly_program_id:weeklyProgramId,day_date:weeklyDate,period:weeklyPeriod,day_name:dayName(weeklyDate),activity_type:'مقابلات',topic:'مقابلة مدير/ة المدرسة',objectives:'',notes:'',status:'COMPLETED',work_record_id:saved.id,work_route:'/interviews?type=principal',work_label:'مقابلة مدير/ة المدرسة',work_saved_at:new Date().toISOString()})
    nav('/weekly-program')
   }else{
    setHistorical(false)
    await refresh()
    localStorage.removeItem('principal-interview-draft')
    setNotice(activeId?'تم تحديث المقابلة.':'تم حفظ المقابلة وإضافتها إلى السجل.')
   }
  }catch(e){setError(e.message||'تعذر حفظ المقابلة.')}
  finally{setSaving(false)}
 }

 const openRecord=r=>{
  setForm({...r,person:r.person||'',interview_time:r.interview_time||''})
  setActiveId(r.id);setHistorical(true);setHistoryOpen(false);setPreview(true);setError('')
 }

 return <Page title="مقابلات مدير/ة المدرسة" sub="توثيق مقابلات مدير/ة المدرسة في سجلات مستقلة.">
  {notice&&<div className="meeting-preview-overlay"><div style={{background:'#fff',padding:28,borderRadius:18,textAlign:'center'}}><h3>تم الحفظ ✓</h3><p>{notice}</p><Button onClick={()=>setNotice('')}>حسنًا</Button></div></div>}
  {error&&<ErrorNotice>{error}</ErrorNotice>}
  {loading?<div className="loading">جارٍ تحميل السجلات...</div>:<>
   <Card>
    <div className="meeting-entry-actions principal-interview-actions" style={{marginTop:0,padding:'14px 18px',borderTop:0,display:'grid',gridTemplateColumns:'1fr',gap:14}}>
     <Button block onClick={newInterview}><Plus size={19}/> مقابلة جديدة</Button>
     <Button block variant="secondary" onClick={()=>setHistoryOpen(true)}><History size={19}/> عرض سجل المقابلات ({records.length})</Button>
     {historical&&<Button block variant="secondary" onClick={newInterview}>العودة لمقابلة جديدة</Button>}
    </div>
    {historical&&<div className="official-auto-note">أنت تعرض مقابلة سابقة — العرض للقراءة فقط.</div>}
    <h2>{historical?'بيانات مقابلة محفوظة':'بيانات مقابلة جديدة'}</h2>
    <div className="form-grid two">
     <Input label="السنة الدراسية" value={yearName} disabled/>
     <Input label="الفصل الدراسي" value={semesterName} disabled/>
     <Input label="اسم المدير/ة الذي تمت مقابلته" value={historical?(form.person||''):principalName} disabled readOnly/>
     <Input label="التاريخ" type="date" value={form.interview_date||''} disabled={historical} onChange={e=>setForm({...form,interview_date:e.target.value})}/>
     <Input label="ساعة اللقاء" type="time" value={form.interview_time||''} disabled={historical} onChange={e=>setForm({...form,interview_time:e.target.value})}/>
     <Input label="اليوم" value={dayName(form.interview_date)} disabled/>
     <Input label="موضوع المقابلة" value={form.topic||''} disabled={historical} onChange={e=>setForm({...form,topic:e.target.value})}/>
    </div>
    <div className="form-grid two">
     <Textarea label="محتوى اللقاء" value={form.notes||''} disabled={historical} onChange={e=>setForm({...form,notes:e.target.value})}/>
     <Textarea label="الإجراءات" value={form.result||''} disabled={historical} onChange={e=>setForm({...form,result:e.target.value})}/>
    </div>
    <div className="principal-interview-bottom-actions" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginTop:0,transform:'translateY(-22px)'}}>
     <Button block onClick={()=>setPreview(true)}><Eye size={17}/> عرض النموذج الرسمي</Button>
     {!historical&&<Button block variant="secondary" loading={saving} onClick={save}><Save size={17}/> حفظ المقابلة</Button>}
    </div>
   </Card>

   {historyOpen&&<div className="meeting-preview-overlay"><div className="meeting-preview-modal" style={{maxWidth:760}}>
    <div className="meeting-preview-toolbar"><strong>سجل مقابلات مدير/ة المدرسة</strong><Button variant="secondary" onClick={()=>setHistoryOpen(false)}><X size={15}/> إغلاق</Button></div>
    <div style={{padding:18,overflowY:'auto',direction:'rtl'}}>
     {sorted.length?sorted.map((r,i)=><div key={r.id} style={{display:'flex',gap:12,justifyContent:'space-between',alignItems:'center',padding:14,border:'1px solid #e5d8c5',borderRadius:12,marginBottom:10}}>
      <div><strong>{r.topic||'مقابلة بدون موضوع'}</strong><div style={{fontSize:12,color:'#786f65',marginTop:5}}>رقم {sorted.length-i} · {dateLabel(r.interview_date)} · {r.person||'—'}</div></div>
      <Button onClick={()=>openRecord(r)}><Eye size={15}/> عرض</Button>
     </div>):<div style={{textAlign:'center',padding:30}}>لا توجد مقابلات محفوظة حتى الآن.</div>}
    </div>
   </div></div>}

   {preview&&<div className="meeting-preview-overlay"><div className="meeting-preview-modal">
    <div className="meeting-preview-toolbar"><div><strong>نموذج مقابلة مدير/ة المدرسة</strong><span>{historical?'سجل محفوظ — للقراءة فقط':'المعاينة الرسمية'}</span></div><div className="meeting-preview-actions">
     <Button variant="secondary" onClick={()=>window.print()}><Printer size={15}/> طباعة / PDF</Button>
     {!historical&&<Button onClick={save}><Save size={15}/> حفظ</Button>}
     <Button variant="secondary" onClick={()=>setPreview(false)}><X size={15}/> إغلاق</Button>
    </div></div>
    <div className="meeting-paper-wrap"><div className="official-document">
     <OfficialDocumentHeader/>
     <div className="official-doc-heading"><h1>نموذج مقابلات مدير/ة المدرسة</h1><p>للعام الدراسي {yearName} — الفصل الدراسي {semesterName}</p><p>{profile?.schools?.name||'اسم المدرسة'} — {profile?.directorates?.name||'اسم المديرية'}</p></div>
     <table className="official-doc-table meeting-main-table"><thead><tr><th>الرقم</th><th>اليوم</th><th>التاريخ</th><th>ساعة اللقاء</th><th>الشخص الذي تمت مقابلته</th><th>موضوع المقابلة</th><th>محتوى اللقاء والإجراءات</th></tr></thead>
      <tbody><tr><td>{activeId?Math.max(1,sorted.findIndex(r=>r.id===activeId)+1):records.length+1}</td><td>{dayName(form.interview_date)}</td><td>{dateLabel(form.interview_date)}</td><td>{form.interview_time||'—'}</td><td>{form.person||principalName||'—'}</td><td>{form.topic||'—'}</td><td className="actions-cell"><strong>محتوى اللقاء:</strong><div style={{whiteSpace:'pre-wrap'}}>{form.notes||'—'}</div><strong>الإجراءات:</strong><div style={{whiteSpace:'pre-wrap'}}>{form.result||'—'}</div></td></tr></tbody>
     </table>
     <div className="official-signature-block"><div><strong>المرشد/ة التربوي/ة</strong><span>{profile?.full_name||'........................'}</span></div></div>
    </div></div>
   </div></div>}
  </>}
 </Page>
}
