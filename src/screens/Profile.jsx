import React,{useEffect,useState}from'react'
import{Page,Card,Input,Select,Button,ErrorNotice}from'../components/UI'
import{currentProfile,listDirectorates,listSchoolsByDirectorate,updateMyProfile}from'../services/data'

const roleLabels={MINISTRY:'مسؤول الإرشاد',DIRECTORATE:'رئيس القسم',PRINCIPAL:'المشرف التربوي',COUNSELOR:'المرشد التربوي'}

export default function Profile(){
 const[d,setD]=useState(null),[dirs,setDirs]=useState([]),[schools,setSchools]=useState([]),[form,setForm]=useState({full_name:'',national_id:'',phone:'',directorate_id:'',school_id:'',job_title:''}),[saving,setSaving]=useState(false),[msg,setMsg]=useState(''),[error,setError]=useState('')
 const load=async()=>{try{const p=await currentProfile();setD(p);setForm({full_name:p?.full_name||'',national_id:p?.national_id||'',phone:p?.phone||'',directorate_id:p?.directorate_id||'',school_id:p?.school_id||'',job_title:p?.job_title||roleLabels[p?.role]||''});if(p?.role==='COUNSELOR'){const ds=await listDirectorates();setDirs(ds);if(p?.directorate_id)setSchools(await listSchoolsByDirectorate(p.directorate_id))}}catch(e){setError(e.message)}}
 useEffect(()=>{load()},[])
 const editable=d?.role==='COUNSELOR'&&(d?.profile_edit_count||0)<1
 const role=roleLabels[d?.role]||'الموظف'
 const save=async e=>{e.preventDefault();if(!editable)return;setSaving(true);setError('');setMsg('');try{const p=await updateMyProfile(form);setD(p);setMsg('تم حفظ بياناتك الشخصية. يمكنك تعديلها مرة واحدة فقط.')}catch(e){setError(e.message)}finally{setSaving(false)}}
 const readonly=(label,value)=><div className="profile-readonly"><div><b>{label}</b><span>{value||'—'}</span></div></div>
 return <Page title="البيانات الشخصية" sub="بيانات الحساب والبيانات الوظيفية">
  <div className="grid" style={{gridTemplateColumns:'minmax(0,1.2fr) minmax(260px,.8fr)'}}>
   <Card>
    <h2>بيانات {role}</h2>
    {error&&<ErrorNotice>{error}</ErrorNotice>}{msg&&<div className="notice">{msg}</div>}
    {d?.role!=='COUNSELOR'?<div className="profile-readonly">
      <div><b>الاسم</b><span>{d?.full_name||'—'}</span></div>
      <div><b>الوظيفة</b><span>{role}</span></div>
      <div><b>رقم الهوية</b><span>{d?.national_id||'—'}</span></div>
      <div><b>رقم الهاتف</b><span>{d?.phone||'—'}</span></div>
      <div><b>اسم المستخدم</b><span>{d?.username||'—'}</span></div>
      <div><b>المديرية</b><span>{d?.directorates?.name||'—'}</span></div>
      {d?.role==='PRINCIPAL'&&<div><b>المرشدون المسؤول عنهم</b><span>{'من شاشة إدارة المرشدين'}</span></div>}
    </div>:<form onSubmit={save}>
      <Input label="اسم المستخدم" value={d?.username||''} disabled/>
      <div className="form-grid two"><Input label="اسم المرشد" value={form.full_name} onChange={e=>setForm({...form,full_name:e.target.value})} disabled={!editable}/><Input label="رقم الهوية" value={form.national_id} onChange={e=>setForm({...form,national_id:e.target.value})} disabled={!editable}/></div>
      <Input label="رقم الهاتف" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} disabled={!editable}/>
      <div className="form-grid two"><Select label="المديرية" value={form.directorate_id} disabled><option value="">اختر المديرية</option>{dirs.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</Select><Select label="المدرسة" value={form.school_id} disabled><option value="">اختر المدرسة</option>{schools.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</Select></div>
      <Input label="المسمى الوظيفي" value={form.job_title} disabled/>
      {editable?<Button loading={saving}>حفظ البيانات الشخصية</Button>:<div className="notice">تم استخدام فرصة تعديل البيانات الشخصية. أي نقل للمدرسة أو تعديل إداري يتم بواسطة رئيس القسم.</div>}
    </form>}
   </Card>
   <Card><div className="profile-preview"><div className="avatar" style={{width:60,height:60,fontSize:24}}>{(d?.full_name||'م').slice(0,1)}</div><h3>{role}</h3><strong>{d?.full_name||'اسم الموظف'}</strong><span>{d?.directorates?.name||'لم تحدد المديرية'}</span>{d?.schools?.name&&<span>{d.schools.name}</span>}<span>{d?.username?'اسم المستخدم: '+d.username:''}</span></div></Card>
  </div>
 </Page>
}
