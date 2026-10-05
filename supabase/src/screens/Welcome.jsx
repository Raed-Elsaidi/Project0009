import React,{useEffect,useState}from'react'
import{useNavigate}from'react-router-dom'
import{currentProfile}from'../services/data'
import{ShieldCheck,UserRound,Building2}from'lucide-react'

export default function Welcome(){
 const nav=useNavigate();const[profile,setProfile]=useState(null);const[count,setCount]=useState(2);const[error,setError]=useState('')
 useEffect(()=>{let mounted=true;currentProfile().then(p=>{if(!mounted)return;if(!p){setError('تعذر قراءة بيانات الحساب.');return}setProfile(p)}).catch(e=>mounted&&setError(e.message||'تعذر قراءة بيانات الحساب.'));return()=>{mounted=false}},[])
 useEffect(()=>{if(!profile)return; if(count<=0){nav(['MINISTRY','DIRECTORATE','PRINCIPAL'].includes(profile.role)?'/directorate-dashboard':'/weekly-program',{replace:true});return} const t=setTimeout(()=>setCount(v=>v-1),1000);return()=>clearTimeout(t)},[profile,count,nav])
 if(error)return <div className="welcome-page"><div className="welcome-card"><div className="welcome-icon error-icon">!</div><h1>تعذر الدخول</h1><p>{error}</p><button onClick={()=>nav('/login',{replace:true})}>العودة لتسجيل الدخول</button></div></div>
 if(!profile)return <div className="welcome-page"><div className="welcome-card"><div className="welcome-spinner"/><p>جارٍ التحقق من بيانات الحساب…</p></div></div>
 const isManager=['MINISTRY','DIRECTORATE','PRINCIPAL'].includes(profile.role);const Icon=isManager?Building2:UserRound;const roleLabel=profile.role==='MINISTRY'?'مسؤول الإرشاد':profile.role==='DIRECTORATE'?'رئيس القسم':profile.role==='PRINCIPAL'?'المشرف التربوي':'المرشد التربوي'
 return <div className="welcome-page"><div className="welcome-card"><div className="welcome-icon"><Icon size={38}/></div><div className="welcome-kicker"><ShieldCheck size={16}/> تم التحقق من الحساب</div><h1>أهلاً بك {roleLabel} / {profile.full_name}</h1><p className="welcome-meta">{profile.directorates?.name||'المديرية'}{profile.schools?.name?` • ${profile.schools.name}`:''}</p><p>سيتم دخولك للنظام بعد ثانيتين</p><div className="countdown">{count}</div><div className="countdown-label">جارٍ تجهيز الصفحة الرئيسية…</div></div></div>
}
