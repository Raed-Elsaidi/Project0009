import React,{useEffect,useState,useCallback,useRef}from'react';
import{NavLink}from'react-router-dom';
import{LayoutDashboard,CalendarDays,Users,FileText,AlertTriangle,MessageSquare,ClipboardList,Clock,DoorOpen,Activity,UsersRound,BookOpen,BarChart3,StickyNote,User,ShieldCheck,Menu,X,Building2,Shield,AlarmClock,LogOut}from'lucide-react';
import{supabase}from'../services/supabase';import{currentProfile,getMyPermissions,listMessages,listNotes}from'../services/data';import SiteFooter from'./SiteFooter';

const counselorItems=[['/weekly-program','البرنامج اليومي/الأسبوعي',CalendarDays,'weekly-program'],['/dashboard','ملخص أعمالي',LayoutDashboard,'dashboard'],['/students','الطلاب',Users,'students'],['/cases','دراسة الحالات',FileText,'cases'],['/hot-cases','الحالات الساخنة',AlertTriangle,'hot-cases'],['/interviews','المقابلات والاستشارات',MessageSquare,'interviews'],['/absence','الغياب',ClipboardList,'absence'],['/lateness','التأخر الصباحي',Clock,'lateness'],['/dropout','التسرب',DoorOpen,'dropout'],['/activities','الأنشطة',Activity,'activities'],['/group-counseling','الإرشاد الجمعي',UsersRound,'group-counseling'],['/guidance','الإرشاد التوجيهي',BookOpen,'guidance'],['/annual-plan','الخطة السنوية',BarChart3,'annual-plan'],['/reports','التقارير',BarChart3,'reports'],['/notes','دفتر الملاحظات',StickyNote,'notes'],['/messages','المراسلات',MessageSquare,'messages'],['/profile','البيانات الشخصية',User,'profile']];
const ministryItems=[['/directorate-dashboard','الإحصائيات والمتابعة',BarChart3,'directorate-dashboard'],['/directorates','المديريات',Building2,'directorates'],['/schools','المدارس',Building2,'schools'],['/administration','إدارة الموظفين',UsersRound,'administration'],['/messages','مراسلات الموظفين',MessageSquare,'messages'],['/profile','البيانات الشخصية',User,'profile'],['/permissions','الصلاحيات',Shield,'permissions'],['/academic-years','السنوات الدراسية',CalendarDays,'academic-years']];
const directorateItems=[['/directorate-dashboard','الإحصائيات والمتابعة',BarChart3,'directorate-dashboard'],['/schools','المدارس',Building2,'schools'],['/administration','إدارة الموظفين',UsersRound,'administration'],['/messages','مراسلات الموظفين',MessageSquare,'messages'],['/profile','البيانات الشخصية',User,'profile'],['/permissions','الصلاحيات',Shield,'permissions'],['/academic-years','السنوات الدراسية',CalendarDays,'academic-years']];
const principalItems=[['/directorate-dashboard','الإحصائيات والمتابعة',BarChart3,'directorate-dashboard'],['/administration','إدارة المرشدين',UsersRound,'administration'],['/messages','مراسلات الموظفين',MessageSquare,'messages'],['/profile','البيانات الشخصية',User,'profile']];
const labels={PROGRAMMER:'مبرمج النظام',MINISTRY:'مسؤول الإرشاد',DIRECTORATE:'رئيس القسم',PRINCIPAL:'المشرف التربوي',COUNSELOR:'المرشد التربوي'};
function clickSound(){try{const C=window.AudioContext||window.webkitAudioContext;if(!C)return;const c=new C(),o=c.createOscillator(),g=c.createGain();o.type='sine';o.frequency.value=520;g.gain.setValueAtTime(.0001,c.currentTime);g.gain.exponentialRampToValueAtTime(.025,c.currentTime+.01);g.gain.exponentialRampToValueAtTime(.0001,c.currentTime+.075);o.connect(g);g.connect(c.destination);o.start();o.stop(c.currentTime+.08)}catch{}}
function messageSound(){try{const C=window.AudioContext||window.webkitAudioContext;if(!C)return;const c=new C();[660,880].forEach((f,i)=>{const o=c.createOscillator(),g=c.createGain();o.frequency.value=f;g.gain.setValueAtTime(.0001,c.currentTime+i*.09);g.gain.exponentialRampToValueAtTime(.035,c.currentTime+i*.09+.01);g.gain.exponentialRampToValueAtTime(.0001,c.currentTime+i*.09+.08);o.connect(g);g.connect(c.destination);o.start(c.currentTime+i*.09);o.stop(c.currentTime+i*.09+.085)})}catch{}}
function reminderSound(){try{const C=window.AudioContext||window.webkitAudioContext;if(!C)return;const c=new C();[740,988,740,988].forEach((f,i)=>{const o=c.createOscillator(),g=c.createGain();const t=c.currentTime+i*.16;o.type='sine';o.frequency.value=f;g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.055,t+.02);g.gain.exponentialRampToValueAtTime(.0001,t+.12);o.connect(g);g.connect(c.destination);o.start(t);o.stop(t+.13)})}catch{}}
function ReminderModal({note,onClose}){
 if(!note)return null
 return <div className="reminder-overlay" role="dialog" aria-modal="true" aria-labelledby="reminder-title">
  <div className="reminder-modal">
   <div className="reminder-icon"><AlarmClock size={30}/></div>
   <div className="reminder-kicker">منبه دفتر الملاحظات</div>
   <h2 id="reminder-title">حان وقت التذكير</h2>
   <div className="reminder-note-name">{note.title||'ملاحظة بدون عنوان'}</div>
   <p>{note.content||'لديك ملاحظة مجدولة للتذكير الآن.'}</p>
   <button type="button" className="reminder-close" onClick={onClose}>إغلاق التذكير</button>
  </div>
 </div>
}
export default function AppLayout({children}){
 const[open,setOpen]=useState(false);const[profile,setProfile]=useState(null);const[permissions,setPermissions]=useState(null);const[unreadMessages,setUnreadMessages]=useState(0);const[reminder,setReminder]=useState(null);const remindedRef=useRef(new Set());
 const load=useCallback(async()=>{try{const p=await currentProfile();setProfile(p);const perms=await getMyPermissions();setPermissions(perms)}catch{setPermissions(null);window.location.href='/login'}},[]);
 useEffect(()=>{load()},[load]);
 useEffect(()=>{if(!profile?.id)return;let alive=true;listMessages('inbox').then(rows=>{if(alive)setUnreadMessages(rows.filter(m=>m.recipient_id===profile.id&&!m.read_at&&!m.recipient_deleted_at).length)}).catch(()=>{});return()=>{alive=false}},[profile?.id]);
 useEffect(()=>{if(!profile?.id)return;let channel;try{channel=supabase?.channel('incoming-messages-'+profile.id).on('postgres_changes',{event:'INSERT',schema:'public',table:'messages',filter:'recipient_id=eq.'+profile.id},()=>{setUnreadMessages(n=>n+1);messageSound()}).subscribe()}catch{}return()=>{try{if(channel)supabase.removeChannel(channel)}catch{}}},[profile?.id]);
 useEffect(()=>{
  if(!profile?.id)return
  let alive=true
  const check=async()=>{
   try{
    const rows=await listNotes()
    if(!alive)return
    const now=Date.now()
    const due=(rows||[]).filter(n=>n.reminder_at&&!n.completed&&!remindedRef.current.has(n.id)&&new Date(n.reminder_at).getTime()<=now).sort((a,b)=>new Date(a.reminder_at)-new Date(b.reminder_at))
    if(due[0]){
      remindedRef.current.add(due[0].id)
      setReminder(due[0])
      reminderSound()
    }
   }catch{}
  }
  check()
  const timer=setInterval(check,15000)
  return()=>{alive=false;clearInterval(timer)}
 },[profile?.id]);

 const base=profile?.role==='PROGRAMMER'?ministryItems:profile?.role==='MINISTRY'?ministryItems:profile?.role==='DIRECTORATE'?directorateItems:profile?.role==='PRINCIPAL'?principalItems:counselorItems;
 const items=Array.isArray(permissions)?base.filter(([,,,key])=>permissions.includes(key)||key==='profile'||(profile?.role==='MINISTRY'&&key==='permissions')):base;
 const handleNav=useCallback(()=>{clickSound();setOpen(false)},[]);
 return <div className="shell"><button className="mobile-menu" onClick={()=>setOpen(true)} aria-label="فتح القائمة"><Menu size={21}/></button><aside className={open?'open':''}><div className="brand"><div className="brand-mark"><ShieldCheck size={22}/></div><div><h2>{labels[profile?.role]||'نظام الإرشاد'}</h2><small>إدارة ومتابعة الإرشاد التربوي</small></div><button className="close-menu" onClick={()=>setOpen(false)}><X size={19}/></button></div>{profile&&<div className="profile-mini"><div className="avatar">{(profile.full_name||'م').slice(0,1)}</div><div><strong>{profile.full_name}</strong><small>{labels[profile.role]}{profile.directorates?.name?` • ${profile.directorates.name}`:''}{profile.schools?.name?` • ${profile.schools.name}`:''}</small></div></div>}<nav>{items.map(([p,t,I,key])=><NavLink key={p} to={p} onClick={handleNav} className={({isActive})=>isActive?'active':''}><I size={17}/><span>{t}</span>{key==='messages'&&unreadMessages>0&&<b className="sidebar-message-badge">{unreadMessages>99?'99+':unreadMessages}</b>}</NavLink>)}</nav><div className="side-footer"><div className="security-chip"><ShieldCheck size={15}/><span>وضع التشغيل المباشر</span></div><button type="button" className="logout" onClick={()=>{try{localStorage.removeItem('system_profile_id')}catch{};window.location.href='/login'}}><LogOut size={16}/><span>تسجيل الخروج</span></button></div></aside><main>{children}<SiteFooter/></main><ReminderModal note={reminder} onClose={()=>setReminder(null)}/></div>
}

<style id="mobile-final-adjustments">
@media (max-width: 700px){
  footer, .footer, .site-footer, .app-footer { transform: translateY(-38px) !important; }
  /* Hide only the text label immediately associated with the guidance logo. */
  .guidance-logo + .guidance-label, .guidance-logo-text, .guidance-logo + span, .guidance-logo + p { display:none !important; }
}
</style>
