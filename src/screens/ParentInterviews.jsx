import LessonTimeSelect from '../components/LessonTimeSelect'
import React,{useEffect,useMemo,useState}from'react'
import{Page,Card,Input,Textarea,Button,ErrorNotice,Select}from'../components/UI'
import{currentProfile,listActiveAcademicData,listStudents,createInterviewRecord,getInterviewRecord,updateInterviewRecord,listInterviewRecords,createWeeklyItem,updateWeeklyItem}from'../services/data'
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

export default function ParentInterviews(){
 const nav=useNavigate()
 const[params]=useSearchParams()
 const recordId=params.get('record_id')
 const weeklyItemId=params.get('weekly_item_id')
 const weeklyProgramId=params.get('weekly_program_id')
 const weeklyDate=params.get('date')||today()
 const weeklyPeriod=params.get('period')||'الحصة الأولى'

 const[profile,setProfile]=useState(null)
 const[academic,setAcademic]=useState({years:[],semesters:[],grades:[]})
 const[students,setStudents]=useState([])
 const[records,setRecords]=useState([])
 const[form,setForm]=useState({
  student_id:'',parent_name:'',interview_date:weeklyDate,interview_time:'',
  topic:'',notes:'',result:'',school_year_id:'',semester_id:''
 })
 const[activeId,setActiveId]=useState(null)
 const[historical,setHistorical]=useState(false)
 const[historyOpen,setHistoryOpen]=useState(false)
 const[preview,setPreview]=useState(false)
 const[loading,setLoading]=useState(true)
 const[saving,setSaving]=useState(false)
 const[error,setError]=useState('')
 const[notice,setNotice]=useState('')

 const refresh=async()=>{
  const rows=await listInterviewRecords('ولي الأمر')
  setRecords(rows)
  return rows
 }

 useEffect(()=>{
  let alive=true
  ;(async()=>{
   try{
    const[p,a,st]=await Promise.all([
     currentProfile(),listActiveAcademicData(),listStudents()
    ])
    if(!alive)return
    setProfile(p)
    setAcademic(a||{years:[],semesters:[],grades:[]})
    setStudents(st||[])
    const activeYear=(a?.years||[]).find(x=>x.is_active)||(a?.years||[])[0]
    const now=new Date()
    const semesters=(a?.semesters||[]).filter(x=>String(x.school_year_id)===String(activeYear?.id))
    const activeSemester=semesters.find(x=>{
     const start=x.start_date?new Date(`${String(x.start_date).slice(0,10)}T00:00:00`):null
     const end=x.end_date?new Date(`${String(x.end_date).slice(0,10)}T23:59:59`):null
     return (!start||now>=start)&&(!end||now<=end)
    })||semesters.find(x=>x.is_active)||semesters[0]

    let next={
     student_id:'',parent_name:'',interview_date:weeklyDate,interview_time:'',
     topic:'',notes:'',result:'',
     school_year_id:activeYear?.id||'',semester_id:activeSemester?.id||''
    }

    if(recordId){
     const saved=await getInterviewRecord(recordId)
     next={...next,...saved}
     setActiveId(saved.id)
     setHistorical(true)
    }else{
     try{
      const draft=JSON.parse(localStorage.getItem('parent-interview-draft')||'null')
      if(draft?.form)next={...next,...draft.form}
     }catch{}
     next.school_year_id=activeYear?.id||''
     next.semester_id=activeSemester?.id||''
    }
    if(alive)setForm(next)
    await refresh()
   }catch(e){
    if(alive)setError(e.message||'تعذر تحميل مقابلات أولياء الأمور.')
   }finally{
    if(alive)setLoading(false)
   }
  })()
  return()=>{alive=false}
 },[recordId])

 useEffect(()=>{
  if(!historical){
   try{localStorage.setItem('parent-interview-draft',JSON.stringify({form}))}catch{}
  }
 },[form,historical])

 const yearName=yearLabel(academic.years?.find(x=>String(x.id)===String(form.school_year_id)))||'................'
 const semesterName=semesterLabel(academic.semesters?.find(x=>String(x.id)===String(form.semester_id)))||'................'
 const selectedStudent=students.find(s=>String(s.id)===String(form.student_id))
 const sorted=useMemo(()=>[...records].sort((a,b)=>String(b.interview_date||'').localeCompare(String(a.interview_date||''))),[records])

 const newInterview=()=>{
  setForm({
   student_id:'',parent_name:'',interview_date:today(),interview_time:'',
   topic:'',notes:'',result:'',
   school_year_id:form.school_year_id||'',semester_id:form.semester_id||''
  })
  setActiveId(null)
  setHistorical(false)
  setPreview(false)
  setHistoryOpen(false)
  setError('')
 }

 const save=async()=>{
  if(historical)return setError('هذا سجل سابق للعرض فقط. اضغط «مقابلة جديدة» لإضافة مقابلة أخرى.')
  if(!form.student_id)return setError('اختر الطالب المرتبط بولي الأمر.')
  if(!String(form.parent_name||'').trim())return setError('أدخل اسم ولي الأمر.')
  if(!form.interview_date||!form.interview_time||!String(form.topic||'').trim())
   return setError('أدخل التاريخ ووقت المقابلة وموضوعها.')
  if(!form.school_year_id||!form.semester_id)
   return setError('لم يتم تحديد السنة الدراسية والفصل الدراسي.')

  setSaving(true)
  setError('')
  try{
   const payload={
    person:'ولي الأمر',
    parent_name:String(form.parent_name).trim(),
    student_id:form.student_id,
    interview_date:form.interview_date,
    interview_time:form.interview_time,
    consultation_type:'مقابلة',
    topic:String(form.topic).trim(),
    notes:form.notes||'',
    result:form.result||'',
    school_year_id:form.school_year_id,
    semester_id:form.semester_id,
    grade_id:selectedStudent?.grade_id||null,
    section_id:selectedStudent?.section_id||null
   }
   const saved=activeId
    ?await updateInterviewRecord(activeId,payload)
    :await createInterviewRecord(payload)

   setActiveId(saved.id)
   if(weeklyItemId){
    await updateWeeklyItem(weeklyItemId,{
     work_record_id:saved.id,
     work_route:'/interviews?type=parent',
     work_label:'مقابلة ولي أمر',
     topic:'مقابلة ولي أمر',
     activity_type:'مقابلات'
    })
    nav('/weekly-program')
   }else if(weeklyProgramId){
    await createWeeklyItem({
     weekly_program_id:weeklyProgramId,
     day_date:weeklyDate,
     period:weeklyPeriod,
     day_name:dayName(weeklyDate),
     activity_type:'مقابلات',
     topic:'مقابلة ولي أمر',
     objectives:'',
     notes:'',
     status:'COMPLETED',
     work_record_id:saved.id,
     work_route:'/interviews?type=parent',
     work_label:'مقابلة ولي أمر',
     work_saved_at:new Date().toISOString()
    })
    nav('/weekly-program')
   }else{
    setHistorical(false)
    await refresh()
    localStorage.removeItem('parent-interview-draft')
    setNotice(activeId?'تم تحديث المقابلة.':'تم حفظ المقابلة وإضافتها إلى السجل.')
   }
  }catch(e){
   setError(e.message||'تعذر حفظ المقابلة.')
  }finally{
   setSaving(false)
  }
 }

 const openRecord=r=>{
  setForm({
   student_id:r.student_id||'',
   parent_name:r.parent_name||'',
   interview_date:r.interview_date||'',
   interview_time:r.interview_time||'',
   topic:r.topic||'',
   notes:r.notes||'',
   result:r.result||'',
   school_year_id:r.school_year_id||'',
   semester_id:r.semester_id||''
  })
  setActiveId(r.id)
  setHistorical(true)
  setHistoryOpen(false)
  setPreview(true)
  setError('')
 }

 return <Page title="مقابلات أولياء الأمور" sub="توثيق المقابلات الفردية مع أولياء أمور الطلبة في سجلات مستقلة.">
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
     <Select label="الطالب" value={form.student_id||''} disabled={historical} onChange={e=>setForm({...form,student_id:e.target.value})}>
      <option value="">اختر الطالب</option>
      {students.map(s=><option key={s.id} value={s.id}>{s.full_name}</option>)}
     </Select>
     <Input label="اسم ولي الأمر" value={form.parent_name||''} disabled={historical} onChange={e=>setForm({...form,parent_name:e.target.value})}/>
     <Input label="التاريخ" type="date" value={form.interview_date||''} disabled={historical} onChange={e=>setForm({...form,interview_date:e.target.value})}/>
     <Input label="ساعة المقابلة" type="time" value={form.interview_time||''} disabled={historical} onChange={e=>setForm({...form,interview_time:e.target.value})}/>
      <LessonTimeSelect label="الحصة / ساعة اللقاء" value={form.interview_time||''} disabled={historical} onChange={value=>setForm({...form,interview_time:value})}/>
     <Input label="اليوم" value={dayName(form.interview_date)} disabled/>
     <Input label="موضوع المقابلة" value={form.topic||''} disabled={historical} onChange={e=>setForm({...form,topic:e.target.value})}/>
    </div>
    <div className="form-grid two">
     <Textarea label="محتوى المقابلة" value={form.notes||''} disabled={historical} onChange={e=>setForm({...form,notes:e.target.value})}/>
     <Textarea label="الإجراءات والتوصيات" value={form.result||''} disabled={historical} onChange={e=>setForm({...form,result:e.target.value})}/>
    </div>
    <div className="principal-interview-bottom-actions" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginTop:0,transform:'translateY(-22px)'}}>
     <Button block onClick={()=>setPreview(true)}><Eye size={17}/> عرض النموذج الرسمي</Button>
     {!historical&&<Button block variant="secondary" loading={saving} onClick={save}><Save size={17}/> حفظ المقابلة</Button>}
    </div>
   </Card>

   {historyOpen&&<div className="meeting-preview-overlay">
    <div className="meeting-preview-modal" style={{maxWidth:760}}>
     <div className="meeting-preview-toolbar">
      <strong>سجل مقابلات أولياء الأمور</strong>
      <Button variant="secondary" onClick={()=>setHistoryOpen(false)}><X size={15}/> إغلاق</Button>
     </div>
     <div style={{padding:18,overflowY:'auto',direction:'rtl'}}>
      {sorted.length?sorted.map((r,i)=><div key={r.id} style={{display:'flex',gap:12,justifyContent:'space-between',alignItems:'center',padding:14,border:'1px solid #e5d8c5',borderRadius:12,marginBottom:10}}>
       <div style={{minWidth:0}}>
        <strong>{r.parent_name||'ولي أمر'} — {r.topic||'مقابلة بدون موضوع'}</strong>
        <div style={{fontSize:12,color:'#786f65',marginTop:5}}>رقم {sorted.length-i} · {dateLabel(r.interview_date)}</div>
       </div>
       <Button onClick={()=>openRecord(r)} style={{whiteSpace:'nowrap',display:'inline-flex',alignItems:'center',justifyContent:'center',gap:7,minWidth:76}}><Eye size={15}/> <span style={{whiteSpace:'nowrap'}}>عرض</span></Button>
      </div>):<div style={{textAlign:'center',padding:30}}>لا توجد مقابلات محفوظة حتى الآن.</div>}
     </div>
    </div>
   </div>}

   {preview&&<div className="meeting-preview-overlay">
    <div className="meeting-preview-modal">
     <div className="meeting-preview-toolbar">
      <div><strong>نموذج مقابلة ولي أمر</strong><span>{historical?'سجل محفوظ — للقراءة فقط':'المعاينة الرسمية'}</span></div>
      <div className="meeting-preview-actions">
       <Button variant="secondary" onClick={()=>window.print()}><Printer size={15}/> طباعة / PDF</Button>
       {!historical&&<Button onClick={save}><Save size={15}/> حفظ</Button>}
       <Button variant="secondary" onClick={()=>setPreview(false)}><X size={15}/> إغلاق</Button>
      </div>
     </div>
     <div className="meeting-paper-wrap">
      <div className="official-document">
       <OfficialDocumentHeader/>
       <div className="official-doc-heading">
        <h1>نموذج مقابلة ولي أمر</h1>
        <p>للعام الدراسي {yearName} — الفصل الدراسي {semesterName}</p>
        <p>{profile?.schools?.name||'اسم المدرسة'} — {profile?.directorates?.name||'اسم المديرية'}</p>
       </div>
       <table className="official-doc-table meeting-main-table">
        <thead><tr><th>الرقم</th><th>اليوم</th><th>التاريخ</th><th>ساعة المقابلة</th><th>الطالب / ولي الأمر</th><th>موضوع المقابلة</th><th>محتوى اللقاء والإجراءات</th></tr></thead>
        <tbody><tr>
         <td>{activeId?Math.max(1,sorted.findIndex(r=>r.id===activeId)+1):records.length+1}</td>
         <td>{dayName(form.interview_date)}</td>
         <td>{dateLabel(form.interview_date)}</td>
         <td>{form.interview_time||'—'}</td>
         <td>{selectedStudent?.full_name||'—'}<br/>{form.parent_name||'—'}</td>
         <td>{form.topic||'—'}</td>
         <td className="actions-cell"><strong>محتوى المقابلة:</strong><div style={{whiteSpace:'pre-wrap'}}>{form.notes||'—'}</div><strong>الإجراءات والتوصيات:</strong><div style={{whiteSpace:'pre-wrap'}}>{form.result||'—'}</div></td>
        </tr></tbody>
       </table>
       <div className="official-signature-block"><div><strong>المرشد/ة التربوي/ة</strong><span>{profile?.full_name||'........................'}</span></div></div>
      </div>
     </div>
    </div>
   </div>}
  </>}
 </Page>
}
