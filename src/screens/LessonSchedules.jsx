import React,{useCallback,useEffect,useState}from'react'
import{Page,Card,Input,Button,ErrorNotice,Empty}from'../components/UI'
import{
  currentProfile,
  listSchoolLessonSchedules,
  saveSchoolLessonSchedule,
  deleteSchoolLessonSchedule,
  saveMySchoolLessonDuration
}from'../services/data'
import{Clock,Plus,Save,Edit3,Trash2,RefreshCw}from'lucide-react'

function calculateEndTime(startTime,duration){
  if(!startTime)return '—'
  const parts=String(startTime).split(':')
  const hours=Number(parts[0])
  const minutes=Number(parts[1])
  if(!Number.isFinite(hours)||!Number.isFinite(minutes))return '—'
  const total=(hours*60)+minutes+Number(duration||45)
  const end=((total%1440)+1440)%1440
  return `${String(Math.floor(end/60)).padStart(2,'0')}:${String(end%60).padStart(2,'0')}`
}

export default function LessonSchedules(){
 const[profile,setProfile]=useState(null)
 const[rows,setRows]=useState([])
 const[duration,setDuration]=useState(45)
 const[form,setForm]=useState({period_name:'',period_order:1,start_time:''})
 const[editId,setEditId]=useState(null)
 const[loading,setLoading]=useState(true)
 const[busy,setBusy]=useState(false)
 const[error,setError]=useState('')
 const[notice,setNotice]=useState('')

 const load=useCallback(async()=>{
  setLoading(true)
  setError('')
  try{
   const p=await currentProfile()
   setProfile(p)
   setDuration(Number(p?.schools?.lesson_duration_minutes)||45)
   setRows(await listSchoolLessonSchedules(p?.school_id))
  }catch(e){
   setError(e.message||'تعذر تحميل توقيت الحصص.')
  }finally{
   setLoading(false)
  }
 },[])

 useEffect(()=>{load()},[load])

 const saveDuration=async()=>{
  const value=Number(duration)
  if(!Number.isInteger(value)||value<1||value>240){
   return setError('أدخل مدة صحيحة بين دقيقة واحدة و240 دقيقة.')
  }
  setBusy(true)
  setError('')
  setNotice('')
  try{
   const saved=await saveMySchoolLessonDuration(value)
   setDuration(Number(saved)||value)
   setNotice(`تم حفظ مدة الحصة: ${Number(saved)||value} دقيقة.`)
  }catch(e){
   setError(e.message||'تعذر حفظ مدة الحصة.')
  }finally{
   setBusy(false)
  }
 }

 const save=async()=>{
  if(!profile?.school_id)return setError('الحساب غير مرتبط بمدرسة.')
  if(!form.period_name.trim()||!form.start_time)return setError('أدخل اسم الحصة ووقت بدايتها.')
  setBusy(true)
  setError('')
  setNotice('')
  try{
   await saveSchoolLessonSchedule({
    id:editId||undefined,
    school_id:profile.school_id,
    period_name:form.period_name,
    period_order:form.period_order,
    start_time:form.start_time
   })
   setForm({period_name:'',period_order:rows.length+1,start_time:''})
   setEditId(null)
   setNotice('تم حفظ توقيت الحصة.')
   await load()
  }catch(e){
   setError(e.message||'تعذر حفظ الحصة.')
  }finally{
   setBusy(false)
  }
 }

 const edit=row=>{
  setEditId(row.id)
  setForm({
   period_name:row.period_name||'',
   period_order:row.period_order||1,
   start_time:String(row.start_time||'').slice(0,5)
  })
  setNotice('')
 }

 const remove=async row=>{
  if(!window.confirm(`حذف ${row.period_name}؟`))return
  setBusy(true)
  setError('')
  setNotice('')
  try{
   await deleteSchoolLessonSchedule(row.id)
   await load()
   setNotice('تم حذف الحصة.')
  }catch(e){
   setError(e.message||'تعذر حذف الحصة.')
  }finally{
   setBusy(false)
  }
 }

 return <Page
  title="توقيت الحصص"
  sub="إدارة أسماء الحصص وأوقات بدايتها ومدتها، وحساب وقت النهاية تلقائيًا."
  actions={<Button variant="secondary" onClick={load}><RefreshCw size={16}/> تحديث</Button>}
 >
  {error&&<ErrorNotice>{error}</ErrorNotice>}
  {notice&&<div className="notice">{notice}</div>}

  <Card>
   <div className="section-title">
    <div>
     <h2><Clock size={19}/> مدة الحصة الموحدة</h2>
     <span>تُطبق المدة على جميع حصص المدرسة.</span>
    </div>
   </div>
   <div className="form-grid two">
    <Input
     label="مدة الحصة بالدقائق"
     type="number"
     min="1"
     max="240"
     value={duration}
     onChange={e=>setDuration(e.target.value)}
    />
    <div>
     <span>القيمة الافتراضية</span>
     <strong style={{display:'block',marginTop:10}}>45 دقيقة</strong>
    </div>
   </div>
   <Button loading={busy} onClick={saveDuration}>
    <Save size={16}/> حفظ مدة الحصة
   </Button>
  </Card>

  <Card>
   <div className="section-title">
    <div>
     <h2><Clock size={19}/> إضافة حصة أو تعديلها</h2>
     <span>أدخل اسم الحصة وترتيبها ووقت بدايتها.</span>
    </div>
   </div>
   <div className="form-grid two">
    <Input
     label="اسم الحصة"
     value={form.period_name}
     onChange={e=>setForm({...form,period_name:e.target.value})}
     placeholder="مثال: الحصة الأولى"
    />
    <Input
     label="ترتيب الحصة"
     type="number"
     min="1"
     value={form.period_order}
     onChange={e=>setForm({...form,period_order:e.target.value})}
    />
    <Input
     label="وقت بداية الحصة"
     type="time"
     value={form.start_time}
     onChange={e=>setForm({...form,start_time:e.target.value})}
    />
    <div>
     <span>وقت النهاية المتوقع</span>
     <strong style={{display:'block',marginTop:10}}>
      {calculateEndTime(form.start_time,duration)}
     </strong>
    </div>
   </div>
   <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
    <Button loading={busy} onClick={save}>
     <Save size={16}/> {editId?'حفظ التعديلات':'إضافة الحصة'}
    </Button>
    {editId&&
     <Button
      variant="secondary"
      onClick={()=>{
       setEditId(null)
       setForm({period_name:'',period_order:rows.length+1,start_time:''})
      }}
     >
      إلغاء التعديل
     </Button>
    }
   </div>
  </Card>

  <Card>
   <div className="section-title">
    <div>
     <h2>الحصص المسجلة</h2>
     <span>{rows.length} حصة — مدة الحصة {duration} دقيقة</span>
    </div>
   </div>
   {loading?
    <div className="loading">جارٍ تحميل الحصص...</div>
    :rows.length?
     <div className="table-wrap">
      <table className="lesson-schedule-table">
       <thead>
        <tr>
         <th>الترتيب</th>
         <th>اسم الحصة</th>
         <th>وقت البداية</th>
         <th>وقت النهاية</th>
         <th>الإجراءات</th>
        </tr>
       </thead>
       <tbody>
        {rows.map(row=>
         <tr key={row.id}>
          <td>{row.period_order}</td>
          <td>{String(row.period_name||'').replace(/^الحصة\s*/, '')}</td>
          <td>{String(row.start_time||'').slice(0,5)}</td>
          <td>{calculateEndTime(row.start_time,duration)}</td>
          <td>
           <div style={{display:'flex',gap:8}}>
            <Button size="sm" variant="secondary" onClick={()=>edit(row)}>
             <Edit3 size={15}/> تعديل
            </Button>

           </div>
          </td>
         </tr>
        )}
       </tbody>
      </table>
     </div>
     :<Empty title="لا توجد حصص مسجلة" text="أضف الحصص وأوقات بدايتها من النموذج أعلاه."/>
   }
  </Card>
 </Page>
}
