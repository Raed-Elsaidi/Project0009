import React,{useEffect,useMemo,useState}from'react'
import{Search,Plus,Pin,PinOff,CheckCircle2,Circle,Trash2,Edit3,Save,BookOpen,Clock3}from'lucide-react'
import{Page,Card,Input,Textarea,Button,Select,Empty}from'../components/UI'
import{listNotes,createNote,updateNote,deleteNote,listActiveAcademicData}from'../services/data'

const empty={title:'',content:'',priority:'NORMAL',is_pinned:false,reminder_at:'',completed:false}
const priorityLabel={NORMAL:'عادية',HIGH:'مهمة',URGENT:'عاجلة'}
const pad=n=>String(n).padStart(2,'0')
const toLocalInputValue=value=>{
 if(!value)return''
 const d=new Date(value)
 if(Number.isNaN(d.getTime()))return''
 return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
const toIsoValue=value=>{
 if(!value)return null
 const d=new Date(value)
 return Number.isNaN(d.getTime())?null:d.toISOString()
}
export default function Notes(){
 const[notes,setNotes]=useState([]),[academic,setAcademic]=useState({years:[],semesters:[]}),[form,setForm]=useState({...empty,school_year_id:'',semester_id:''}),[editing,setEditing]=useState(null),[q,setQ]=useState(''),[filter,setFilter]=useState('ALL'),[loading,setLoading]=useState(false)
 const load=()=>listNotes().then(setNotes).catch(()=>{})
 useEffect(()=>{Promise.all([load(),listActiveAcademicData()]).then(([,a])=>{setAcademic(a);setForm(f=>({...f,school_year_id:f.school_year_id||a.years?.find(x=>x.is_active)?.id||a.years?.[0]?.id||'',semester_id:f.semester_id||a.semesters?.find(x=>x.school_year_id===(f.school_year_id||a.years?.find(x=>x.is_active)?.id)&&x.type==='FIRST')?.id||''}))})},[])
 const visible=useMemo(()=>notes.filter(n=>{const text=((n.title||'')+' '+(n.content||'')).toLowerCase();const okq=text.includes(q.toLowerCase());const ok=filter==='ALL'||(filter==='PINNED'&&n.is_pinned)||(filter==='TODO'&&!n.completed)||(filter==='DONE'&&n.completed);return okq&&ok}).sort((a,b)=>(Number(b.is_pinned)-Number(a.is_pinned))||new Date(b.created_at)-new Date(a.created_at)),[notes,q,filter])
 const submit=async()=>{
  if(!form.content.trim()&&!form.title.trim())return
  setLoading(true)
  const payload={...form,reminder_at:toIsoValue(form.reminder_at)}
  try{
   if(editing)await updateNote(editing,payload)
   else await createNote(payload)
   setForm({...empty,school_year_id:form.school_year_id,semester_id:form.semester_id});setEditing(null);await load()
  }finally{setLoading(false)}
 }
 const edit=n=>{setForm({...n,reminder_at:toLocalInputValue(n.reminder_at)});setEditing(n.id)}
 const toggle=async n=>{await updateNote(n.id,{completed:!n.completed});load()}
 const pin=async n=>{await updateNote(n.id,{is_pinned:!n.is_pinned});load()}
 return <Page title="دفتر الملاحظات" sub="دفتر شخصي منظم للمرشد — احفظ الملاحظات والمتابعات المهمة في مكان واحد." actions={<Button onClick={()=>{setForm(empty);setEditing(null);document.getElementById('note-editor')?.scrollIntoView({behavior:'smooth'})}}><Plus size={17}/> ملاحظة جديدة</Button>}>
  <div className="notes-layout">
   <Card className="note-editor" id="note-editor"><div className="section-title"><BookOpen size={19}/><div><h3>{editing?'تعديل الملاحظة':'ملاحظة جديدة'}</h3><p>يمكنك تثبيت الملاحظات المهمة وتحديد الأولوية وتحديد تاريخ ووقت المنبه.</p></div></div>
    <div className="form-grid two"><Select label="السنة الدراسية *" value={form.school_year_id||''} onChange={e=>setForm({...form,school_year_id:e.target.value,semester_id:''})}><option value="">اختر</option>{academic.years.map(y=><option key={y.id} value={y.id}>{y.name}</option>)}</Select><Select label="الفصل الدراسي *" value={form.semester_id||''} onChange={e=>setForm({...form,semester_id:e.target.value})}><option value="">اختر</option>{academic.semesters.filter(s=>!form.school_year_id||s.school_year_id===form.school_year_id).map(s=><option key={s.id} value={s.id}>{s.type==='SECOND'?'الثاني':'الأول'}</option>)}</Select></div><Input label="عنوان الملاحظة" placeholder="مثال: متابعة طالب — أحمد..." value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/>
    <Textarea label="نص الملاحظة" placeholder="اكتب الملاحظة أو تفاصيل المتابعة هنا..." rows={7} value={form.content} onChange={e=>setForm({...form,content:e.target.value})}/>
    <div className="form-grid"><Select label="الأولوية" value={form.priority} onChange={e=>setForm({...form,priority:e.target.value})}><option value="NORMAL">عادية</option><option value="HIGH">مهمة</option><option value="URGENT">عاجلة</option></Select><Input label="موعد المنبه" type="datetime-local" value={form.reminder_at||''} onChange={e=>setForm({...form,reminder_at:e.target.value})}/></div>
    <label className="check-row"><input type="checkbox" checked={form.is_pinned} onChange={e=>setForm({...form,is_pinned:e.target.checked})}/><Pin size={16}/> تثبيت الملاحظة في الأعلى</label>
    <div className="row-actions"><Button loading={loading} onClick={()=>{if(!form.school_year_id||!form.semester_id){alert('اختر السنة الدراسية والفصل الدراسي أولًا.');return}submit()}}><Save size={16}/> {editing?'حفظ التعديل':'حفظ الملاحظة'}</Button>{editing&&<Button variant="secondary" onClick={()=>{setForm(empty);setEditing(null)}}>إلغاء</Button>}</div>
   </Card>
   <div className="notes-list"><Card className="notes-toolbar"><div className="search-wrap"><Search size={17}/><input placeholder="بحث في دفتر الملاحظات..." value={q} onChange={e=>setQ(e.target.value)}/></div><div className="note-filters">{[['ALL','الكل'],['PINNED','المثبتة'],['TODO','قيد المتابعة'],['DONE','المكتملة']].map(([v,t])=><button key={v} className={filter===v?'active':''} onClick={()=>setFilter(v)}>{t}</button>)}</div></Card>
    {visible.length===0?<Empty title="لا توجد ملاحظات" text="أضف أول ملاحظة من النموذج الجانبي."/>:visible.map(n=><Card key={n.id} className={'note-card '+(n.completed?'done':'')+(n.is_pinned?' pinned':'')}>
      <div className="note-card-head"><div><div className="note-meta">{n.is_pinned&&<span><Pin size={13}/> مثبتة</span>}<span className={'priority '+n.priority.toLowerCase()}>{priorityLabel[n.priority]||'عادية'}</span>{n.completed&&<span className="done-label"><CheckCircle2 size={13}/> مكتملة</span>}</div><h3>{n.title||'ملاحظة بدون عنوان'}</h3></div><div className="note-actions"><button title={n.completed?'إلغاء الإنجاز':'تم الإنجاز'} onClick={()=>toggle(n)}>{n.completed?<CheckCircle2 size={18}/>:<Circle size={18}/>}</button><button title={n.is_pinned?'إلغاء التثبيت':'تثبيت'} onClick={()=>pin(n)}>{n.is_pinned?<PinOff size={18}/>:<Pin size={18}/>}</button><button title="تعديل" onClick={()=>edit(n)}><Edit3 size={17}/></button><button title="حذف" onClick={async()=>{if(confirm('هل تريد حذف هذه الملاحظة؟')){await deleteNote(n.id);load()}}}><Trash2 size={17}/></button></div></div>
      <p className="note-content">{n.content}</p>{n.reminder_at&&<div className="note-reminder"><Clock3 size={14}/> المنبه: {new Date(n.reminder_at).toLocaleString('en-GB',{dateStyle:'medium',timeStyle:'short'})}</div>}
    </Card>)}
   </div>
  </div>
 </Page>
}
