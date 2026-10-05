import React,{useEffect,useState}from'react'
import{Page,Card,Button,Input,ErrorNotice,Empty}from'../components/UI'
import{listAcademicYears,createAcademicYear,setActiveAcademicYear}from'../services/data'
import{Plus,CheckCircle2,CalendarRange}from'lucide-react'
const pad=n=>String(n).padStart(2,'0')
const yearLabel=y=>y?.name||''
const nextYearName=rows=>{
 const nums=(rows||[]).map(y=>String(y.name||'').match(/^(\d{4})\/(\d{4})$/)).filter(Boolean).map(m=>[+m[1],+m[2]])
 const start=nums.length?Math.max(...nums.map(x=>x[0]))+1:new Date().getFullYear()
 return `${start}/${start+1}`
}
export default function AcademicYears(){
 const[rows,setRows]=useState([]),[name,setName]=useState(''),[startDate,setStartDate]=useState(''),[endDate,setEndDate]=useState(''),[loading,setLoading]=useState(true),[saving,setSaving]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('')
 const load=async()=>{setLoading(true);try{const r=await listAcademicYears();setRows(r);if(!name)setName(nextYearName(r))}catch(e){setError(e.message||'تعذر تحميل السنوات الدراسية.')}finally{setLoading(false)}}
 useEffect(()=>{load()},[])
 const add=async()=>{setError('');setNotice('');if(!/^\d{4}\/\d{4}$/.test(name)){setError('اكتب السنة الدراسية بهذا الشكل: 2026/2027');return}setSaving(true);try{await createAcademicYear({name,start_date:startDate||null,end_date:endDate||null});setNotice(`تمت إضافة السنة الدراسية ${name} مع الفصلين الأول والثاني.`);setName('');setStartDate('');setEndDate('');await load()}catch(e){setError(e.message||'تعذر إضافة السنة الدراسية.')}finally{setSaving(false)}}
 const activate=async id=>{try{await setActiveAcademicYear(id);await load()}catch(e){setError(e.message||'تعذر تفعيل السنة الدراسية.')}}
 return <Page title="السنوات الدراسية والفصول" sub="إدارة السنوات الدراسية. كل سنة تحتوي تلقائيًا على الفصل الأول والثاني، ويمكن الرجوع إلى السنوات السابقة دون فقدان بياناتها.">
  {error&&<ErrorNotice>{error}</ErrorNotice>}{notice&&<div className="notice">{notice}</div>}
  <Card><div className="section-title"><CalendarRange size={20}/><div><h2>إضافة سنة دراسية جديدة</h2><span>مثال: 2026/2027 ثم في العام التالي 2027/2028.</span></div></div><div className="form-grid three"><Input label="السنة الدراسية *" value={name} onChange={e=>setName(e.target.value)} placeholder="2026/2027"/><Input label="تاريخ بداية العام" type="date" value={startDate} onChange={e=>setStartDate(e.target.value)}/><Input label="تاريخ نهاية العام" type="date" value={endDate} onChange={e=>setEndDate(e.target.value)}/></div><Button loading={saving} onClick={add}><Plus size={16}/> إضافة السنة والفصلين</Button></Card>
  <Card><div className="section-title"><div><h2>السنوات المسجلة</h2><span>السنة النشطة تستخدم افتراضيًا في النظام.</span></div></div>{loading?<div className="loading">جارٍ التحميل...</div>:rows.length===0?<Empty title="لا توجد سنوات دراسية" text="أضف السنة الدراسية الأولى."/>:<div className="table-wrap"><table className="table"><thead><tr><th>السنة الدراسية</th><th>الحالة</th><th>الفصول</th><th>إجراء</th></tr></thead><tbody>{rows.map(y=><tr key={y.id}><td><strong>{yearLabel(y)}</strong></td><td>{y.is_active?<span className="status-badge"><CheckCircle2 size={14}/> نشطة</span>:<span>سابقة</span>}</td><td>{(y.semesters||[]).map(s=>s.name).join(' • ')||'الأول • الثاني'}</td><td>{!y.is_active&&<Button variant="secondary" onClick={()=>activate(y.id)}>تفعيل</Button>}</td></tr>)}</tbody></table></div>}</Card>
 </Page>
}
