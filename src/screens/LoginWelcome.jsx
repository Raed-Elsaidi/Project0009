import React,{useEffect,useState}from'react'
import{useNavigate}from'react-router-dom'
import{ShieldCheck}from'lucide-react'
import{currentProfile}from'../services/data'
const labels={PROGRAMMER:'مبرمج النظام',MINISTRY:'مسؤول الإرشاد',DIRECTORATE:'رئيس القسم',PRINCIPAL:'المشرف التربوي',COUNSELOR:'المرشد التربوي'}
const routes={PROGRAMMER:'/programmer-dashboard',MINISTRY:'/directorate-dashboard',DIRECTORATE:'/directorate-dashboard',PRINCIPAL:'/directorate-dashboard',COUNSELOR:'/weekly-program'}
export default function LoginWelcome(){
 const navigate=useNavigate();const [profile,setProfile]=useState(null);const [count,setCount]=useState(2);const [error,setError]=useState('')
 useEffect(()=>{let alive=true;currentProfile().then(p=>{if(alive)setProfile(p)}).catch(e=>{setError(e.message||'تعذر تحميل بيانات الموظف.')});return()=>{alive=false}},[])
 useEffect(()=>{if(!profile)return;setCount(2);const timer=setInterval(()=>setCount(v=>{if(v<=1){clearInterval(timer);navigate(routes[profile.role]||'/weekly-program',{replace:true});return 1}return v-1}),1000);return()=>clearInterval(timer)},[profile,navigate])
 return <div className="login-welcome-screen"><div className="login-welcome-card"><div className="login-welcome-icon"><ShieldCheck size={34}/></div>{error?<><h1>تعذر الدخول</h1><p>{error}</p><button onClick={()=>navigate('/login',{replace:true})}>العودة لتسجيل الدخول</button></>:<><div className="eyebrow">دخول ناجح</div><h1>مرحبًا بك، {profile?.full_name||'موظف النظام'}</h1><p>أهلًا بك في نظام الإرشاد التربوي</p><strong className="login-role">{labels[profile?.role]||'موظف'}</strong><div className="countdown-circle"><svg viewBox="0 0 100 100" aria-hidden="true"><circle className="countdown-track" cx="50" cy="50" r="42"/><circle className="countdown-progress" cx="50" cy="50" r="42"/></svg><span>{count}</span></div><small>سيتم فتح الشاشة المناسبة لوظيفتك...</small></>}</div></div>
}
