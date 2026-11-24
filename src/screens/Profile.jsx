import React,{useEffect,useState}from'react'
import{Page,Card,Input,Select,Button,ErrorNotice}from'../components/UI'
import{currentProfile,listDirectorates,listSchoolsByDirectorate,updateMyProfile,changePassword}from'../services/data'

const roleLabels={MINISTRY:'مسؤول الإرشاد',DIRECTORATE:'رئيس القسم',PRINCIPAL:'المشرف التربوي',COUNSELOR:'المرشد التربوي',SCHOOL_PRINCIPAL:'مدير المدرسة'}

export default function Profile(){
 const[d,setD]=useState(null),[dirs,setDirs]=useState([]),[schools,setSchools]=useState([]),[form,setForm]=useState({full_name:'',national_id:'',phone:'',directorate_id:'',school_id:'',job_title:'',manager_name:''}),[saving,setSaving]=useState(false),[msg,setMsg]=useState(''),[error,setError]=useState(''),[password,setPassword]=useState({current:'',next:'',confirm:''}),[passwordBusy,setPasswordBusy]=useState(false),[passwordMsg,setPasswordMsg]=useState(''),[passwordError,setPasswordError]=useState('')
 const load=async()=>{try{const p=await currentProfile();setD(p);setForm({full_name:p?.full_name||'',national_id:p?.national_id||'',phone:p?.phone||'',directorate_id:p?.directorate_id||'',school_id:p?.school_id||'',job_title:p?.job_title||roleLabels[p?.role]||'',manager_name:p?.manager_name||''});if(p?.role==='COUNSELOR'){const ds=await listDirectorates();setDirs(ds);if(p?.directorate_id)setSchools(await listSchoolsByDirectorate(p.directorate_id))}}catch(e){setError(e.message)}}
 useEffect(()=>{load()},[])
 const editable=['COUNSELOR','MINISTRY','DIRECTORATE','PRINCIPAL','SCHOOL_PRINCIPAL'].includes(d?.role);const isMinistry=d?.role==='MINISTRY';const isCounselor=d?.role==='COUNSELOR'
 const role=roleLabels[d?.role]||'الموظف'
 const save=async e=>{e.preventDefault();if(!editable)return;setError('');setMsg('');if(!form.full_name.trim())return setError('أدخل الاسم.');if(form.national_id&&!/^\d{9}$/.test(form.national_id))return setError('رقم الهوية يجب أن يتكون من 9 أرقام.');if(form.phone&&!/^\d{1,10}$/.test(form.phone))return setError('رقم الهاتف يجب ألا يتجاوز 10 أرقام.');setSaving(true);try{const p=await updateMyProfile(form);setD(p);setMsg('تم حفظ بياناتك الشخصية بنجاح. يمكنك تعديلها في أي وقت دون حد أقصى لعدد مرات التعديل.')}catch(e){setError(e.message)}finally{setSaving(false)}}
 const savePassword=async e=>{e.preventDefault();setPasswordError('');setPasswordMsg('');if(!password.current)return setPasswordError('أدخل كلمة المرور الحالية.');if(!/^[A-Za-z0-9!@#$%^&*()_+\-=\[\]{};':",.<>/?]{8,10}$/.test(password.next)||!/[a-z]/.test(password.next)||!/[A-Z]/.test(password.next)||!/[0-9]/.test(password.next)||!/[^A-Za-z0-9]/.test(password.next))return setPasswordError('كلمة المرور الجديدة يجب أن تكون من 8 إلى 10 أحرف، وتحتوي على حرف صغير وحرف كبير ورقم ورمز.');if(password.next!==password.confirm)return setPasswordError('تأكيد كلمة المرور غير مطابق.');setPasswordBusy(true);try{await changePassword(password.current,password.next);setPassword({current:'',next:'',confirm:''});setPasswordMsg('تم تغيير كلمة المرور بنجاح.')}catch(e){setPasswordError(e.message||'تعذر تغيير كلمة المرور.')}finally{setPasswordBusy(false)}}
 return <Page title="البيانات الشخصية" sub="بيانات الحساب والبيانات الوظيفية">
  <div className="grid profile-layout" style={{gridTemplateColumns:'minmax(0,1.2fr) minmax(260px,.8fr)'}}>
   <Card>
    <h2>بيانات {role}</h2>
    {error&&<ErrorNotice>{error}</ErrorNotice>}{msg&&<div className="notice">{msg}</div>}
    {!editable?<div className="profile-readonly">
      <div><b>الاسم</b><span>{d?.full_name||'—'}</span></div><div><b>اسم المدير</b><span>{d?.manager_name||'—'}</span></div>
      <div><b>الوظيفة</b><span>{role}</span></div>
      <div><b>رقم الهوية</b><span>{d?.national_id||'—'}</span></div>
      <div><b>رقم الهاتف</b><span>{d?.phone||'—'}</span></div>
      <div><b>اسم المستخدم</b><span>{d?.username||'—'}</span></div>
      <div><b>المديرية</b><span>{d?.directorates?.name||'—'}</span></div>
      {d?.role==='PRINCIPAL'&&<div><b>المرشدون المسؤول عنهم</b><span>{'من شاشة إدارة المرشدين'}</span></div>}
    </div>:<form onSubmit={save}>

<Input label="اسم المستخدم" value={d?.username||''} disabled/>
<div className="form-grid two">
  <Input label={isCounselor?"اسم المرشد":"الاسم"} value={form.full_name} onChange={e=>setForm({...form,full_name:e.target.value})}/>
  <Input label="رقم الهوية" value={form.national_id} onChange={e=>setForm({...form,national_id:e.target.value.replace(/\D/g,'').slice(0,9)})} inputMode="numeric" maxLength={9}/>
</div>
<Input label="رقم الهاتف" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value.replace(/\D/g,'').slice(0,10)})} inputMode="numeric" maxLength={10}/>
<Input label="اسم المدير" value={form.manager_name} onChange={e=>setForm({...form,manager_name:e.target.value})}/>
<Button loading={saving}>حفظ تعديل البيانات</Button>
<div className="password-policy">'يمكنك تعديل الاسم ورقم الهوية ورقم الهاتف واسم المدير فقط. تغيير المدرسة أو المديرية من صلاحيات الإدارة.'</div>
</form>}
   </Card>
   <Card><div className="profile-preview"><div className="avatar" style={{width:60,height:60,fontSize:24}}>{(d?.full_name||'م').slice(0,1)}</div><h3>{role}</h3><strong>{d?.full_name||'اسم الموظف'}</strong><span>{d?.directorates?.name||'لم تحدد المديرية'}</span>{d?.schools?.name&&<span>{d.schools.name}</span>}<span>{d?.username?'اسم المستخدم: '+d.username:''}</span></div></Card>
  </div>
  <Card className="profile-password-card">
   <h2>تغيير كلمة المرور</h2>
   <p>غيّر كلمة مرور حسابك مباشرة من هذه الشاشة.</p>
   {passwordError&&<ErrorNotice>{passwordError}</ErrorNotice>}{passwordMsg&&<div className="notice">{passwordMsg}</div>}
   <form onSubmit={savePassword}>
    <div className="form-grid three"><Input label="كلمة المرور الحالية" type="password" autoComplete="current-password" value={password.current} onChange={e=>setPassword({...password,current:e.target.value})} required/><Input label="كلمة المرور الجديدة" type="password" autoComplete="new-password" value={password.next} onChange={e=>setPassword({...password,next:e.target.value})} required/><Input label="تأكيد كلمة المرور الجديدة" type="password" autoComplete="new-password" value={password.confirm} onChange={e=>setPassword({...password,confirm:e.target.value})} required/></div>
    <div className="password-policy">8–10 أحرف، حرف صغير وحرف كبير ورقم ورمز.</div>
    <Button loading={passwordBusy}>تغيير كلمة المرور</Button>
   </form>
  </Card>
 </Page>
}
