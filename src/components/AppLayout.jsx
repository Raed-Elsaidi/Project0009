import React,{useEffect,useState,useCallback,useRef}from'react';
import{NavLink}from'react-router-dom';
import{LayoutDashboard,CalendarDays,Users,FileText,AlertTriangle,MessageSquare,Bell,ClipboardList,Clock,DoorOpen,Activity,UsersRound,BookOpen,BarChart3,StickyNote,User,ShieldCheck,Menu,X,Building2,Shield,AlarmClock,LogOut,Files,ChevronDown}from'lucide-react';
import{supabase}from'../services/supabase';import{currentProfile,getMyPermissions,listMessages,listNotes}from'../services/data';import SiteFooter from'./SiteFooter';

const counselorItems=[
 {group:true,key:'admin-files',label:'الملف الإداري',icon:Files,children:[['/annual-plan','الخطة السنوية'],['/official-forms/semester-report','التقرير الفصلي'],['/weekly-program','البرنامج اليومي / الأسبوعي'],['/correspondence','الصادر والوارد']]},
 {group:true,key:'students-file',label:'أسماء طلاب المدرسة',icon:Users,children:[['/students','إضافة وعرض الطلاب']]},
 {group:true,key:'group-guidance',label:'الإرشاد الجماعي',icon:UsersRound,children:[['/group-counseling','أسماء طلاب المجموعة الإرشادية'],['/official-forms/group-session-details','جدول اللقاءات (الخطة)'],['/official-forms/group-session-summary','نموذج الإرشاد الجماعي']]},
 {group:true,key:'group-direction',label:'التوجيه الجمعي',icon:MessageSquare,children:[['/official-forms/guidance-meetings-followup','نموذج متابعة لقاءات التوجيه الجمعي']]},
 {group:true,key:'career-guidance',label:'التوجيه المهني',icon:BookOpen,children:[['/official-forms/career-guidance-followup','نموذج متابعة لقاءات التوجيه المهني']]},
 {group:true,key:'activities',label:'الأنشطة',icon:Activity,children:[['/official-forms/visits','الزيارات'],['/official-forms/newsletters','النشرات الإرشادية'],['/official-forms/morning-radio','الإذاعة'],['/official-forms/seminars-workshops','الندوات'],['/official-forms/posters','الملصقات'],['/official-forms/wall-magazine','مجلة حائط']]},
 {group:true,key:'parliament',label:'البرلمان',icon:Users,children:[['/official-forms/parliament-plan','الخطة'],['/official-forms/parliament-members','الأسماء'],['/official-forms/parliament-team-meetings','اجتماعات الفريق'],['/official-forms/parliament-achievements','إنجازات']]},
 {group:true,key:'student-consultations',label:'استشارات طلابية',icon:ClipboardList,children:[['/absence','الغياب'],['/lateness','التأخر'],['/dropout','التسرّب'],['/official-forms/health-cases','الحالات الصحية']]},
 {group:true,key:'focused-interviews',label:'رصد ومتابعة المقابلات الفردية المركزة',icon:FileText,children:[['/focused-interviews','نموذج رصد ومتابعة المقابلات الفردية المركزة'],['/transfer-requests','طلبات النقل الواردة']]},
 {group:true,key:'interviews',label:'المقابلات',icon:UsersRound,children:[['/interviews?type=principal','مدير/ة'],['/interviews?type=teacher','معلم/ة'],['/interviews?type=parent','أولياء أمور'],['/interviews?type=institution','مؤسسات'],['/interviews?type=graduates','تدريب خريجي جامعات']]},
 {group:true,key:'meetings',label:'اجتماعات',icon:CalendarDays,children:[['/official-forms/meeting-principal','مدير/ة'],['/official-forms/meeting-teacher','معلم/ة'],['/official-forms/meeting-parents','أولياء أمور']]},
 ['/reports','إحصائيات',BarChart3,'dashboard'],['/messages','مراسلة',MessageSquare,'messages'],['/notes','دفتر الملاحظات',StickyNote,'notes'],['/administration','إدارة الموظفين',UsersRound,'administration'],['/school-data','بيانات المدرسة',Building2,'school-data'],['/profile','الملف الشخصي',User,'profile'],['/login','خروج',LogOut,'logout']
];
const ministryItems=[['/directorate-dashboard','الإحصائيات والمتابعة',BarChart3,'directorate-dashboard'],['/directorates','المديريات',Building2,'directorates'],['/schools','المدارس',Building2,'schools'],['/school-data','بيانات المدرسة',Building2,'school-data'],['/administration','إدارة الموظفين',UsersRound,'administration'],['/official-forms/meeting-followup','النماذج الرسمية',Files,'official-forms'],['/messages','مراسلات الموظفين',MessageSquare,'messages'],['/profile','البيانات الشخصية',User,'profile'],['/permissions','الصلاحيات',Shield,'permissions'],['/academic-years','السنوات الدراسية',CalendarDays,'academic-years']];
const directorateItems=[['/directorate-dashboard','الإحصائيات والمتابعة',BarChart3,'directorate-dashboard'],['/schools','المدارس',Building2,'schools'],['/school-data','بيانات المدرسة',Building2,'school-data'],['/administration','إدارة الموظفين',UsersRound,'administration'],['/official-forms/meeting-followup','النماذج الرسمية',Files,'official-forms'],['/messages','مراسلات الموظفين',MessageSquare,'messages'],['/profile','البيانات الشخصية',User,'profile'],['/permissions','الصلاحيات',Shield,'permissions'],['/academic-years','السنوات الدراسية',CalendarDays,'academic-years']];
const principalItems=[['/directorate-dashboard','الإحصائيات والمتابعة',BarChart3,'directorate-dashboard'],['/school-data','بيانات المدرسة',Building2,'school-data'],['/administration','إدارة المرشدين',UsersRound,'administration'],['/official-forms/meeting-followup','النماذج الرسمية',Files,'official-forms'],['/messages','مراسلات الموظفين',MessageSquare,'messages'],['/profile','البيانات الشخصية',User,'profile']];
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
 const[open,setOpen]=useState(false);const[profile,setProfile]=useState(null);const[permissions,setPermissions]=useState(null);const[unreadMessages,setUnreadMessages]=useState(0);const[transferPending,setTransferPending]=useState(0);const[reminder,setReminder]=useState(null);const remindedRef=useRef(new Set());
 const load=useCallback(async()=>{try{const p=await currentProfile();setProfile(p);const perms=await getMyPermissions();setPermissions(perms)}catch{setPermissions(null);window.location.href='/login'}},[]);
 useEffect(()=>{load()},[load]);
 useEffect(()=>{if(!profile?.school_id)return;let alive=true;const check=async()=>{try{const {count,error}=await supabase.from('student_transfer_requests').select('id',{count:'exact',head:true}).eq('to_school_id',profile.school_id).eq('status','pending');if(!error&&alive)setTransferPending(count||0)}catch{}};check();const timer=setInterval(check,30000);let channel;try{channel=supabase?.channel('incoming-transfer-requests-'+profile.school_id).on('postgres_changes',{event:'INSERT',schema:'public',table:'student_transfer_requests',filter:'to_school_id=eq.'+profile.school_id},()=>{check();messageSound()}).subscribe()}catch{}return()=>{alive=false;clearInterval(timer);try{if(channel)supabase.removeChannel(channel)}catch{}}},[profile?.school_id]);
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
 const items=Array.isArray(permissions)?base.filter(item=>item.group||permissions.includes(item[3])||item[3]==='profile'||item[3]==='school-data'||item[3]==='official-forms'||(['MINISTRY','DIRECTORATE','PROGRAMMER'].includes(profile?.role)&&item[3]==='permissions')):base;
 const handleNav=useCallback(()=>{clickSound();setOpen(false)},[]);
 const officialForms=[
  ['meeting-followup','نموذج متابعة المقابلات',1],['meeting-summary','نموذج رصد المقابلات',1],['case-study','نموذج دراسة حالة',2],['hot-cases-monitor','نموذج رصد الحالات الساخنة',3],['hot-case-notice','نموذج إعلام عن ملف ساخن',4],['student-issues-monitor','نموذج رصد المشكلات وقضايا الطلبة داخل وخارج المدرسة',5],['student-consultations','نموذج المقابلات والاستشارات الطلابية',6],['consultations-monitor','نموذج رصد الاستشارات والمقابلات الطلابية',7],['repeated-absence','نموذج رصد حالات الغياب المتكرر',8],['absence-followup','نموذج متابعة غياب الطالب',9],['repeated-lateness','نموذج رصد التأخر الصباحي المتكرر',9],['lateness-followup','نموذج متابعة التأخر الصباحي المتكرر',10],['dropout-monitor','نموذج رصد حالات التسرب',11],['dropout-followup','نموذج متابعة التسرب',12],['hot-cases-school','نموذج رصد الحالات الساخنة الفصلي – المدرسة',13],['hot-cases-directorate','نموذج رصد الحالات الساخنة الفصلي – المديرية',14],['activities-monitor','نموذج رصد الأنشطة',15],['visits','نموذج الزيارات',15],['newsletters','نموذج النشرات الإرشادية',16],['morning-radio','نموذج الإذاعة الصباحية',17],['seminars-workshops','نموذج الندوات والمحاضرات وورش العمل',18],['wall-magazine','نموذج مجلة الحائط',19],['group-session-summary','نموذج تلخيص الجلسات الجماعية',19],['group-session-details','نموذج ملخص جلسات الإرشاد الجماعي للمجموعة',20],['group-sessions-monitor','نموذج رصد عدد جلسات الإرشاد الجماعي',21],['guidance-meetings-followup','نموذج متابعة لقاءات التوجيه الجمعي',22],['guidance-meetings-monitor','نموذج رصد لقاءات التوجيه الجمعي',22],['weekly-program-form','نموذج البرنامج اليومي/الأسبوعي لعمل المرشد/ة التربوي/ة',23],['annual-plan','نموذج الخطة السنوية المعتمدة',24],['plan','نموذج الخطة',25],['semester-report','التقرير الفصلي حول إنجازات العمل في الخطة',26,27,28]
 ];
 const [formsOpen,setFormsOpen]=useState(window.location.pathname.startsWith('/official-forms'));
 return <div className="shell"><button className="mobile-menu" onClick={()=>setOpen(true)} aria-label="فتح القائمة"><Menu size={21}/></button><aside className={open?'open':''}><div className="brand"><div className="brand-mark ministry-brand-mark"><img src="/assets/ministry-logo.png" alt="شعار وزارة التربية والتعليم"/></div><div><h2>{labels[profile?.role]||'نظام الإرشاد'}</h2><small>إدارة ومتابعة الإرشاد التربوي</small></div><button className="close-menu" onClick={()=>setOpen(false)}><X size={19}/></button></div>{profile&&<div className="profile-mini"><div className="avatar">{(profile.full_name||'م').slice(0,1)}</div><div><strong>{profile.full_name}</strong><small>{labels[profile.role]}{profile.directorates?.name?` • ${profile.directorates.name}`:''}{profile.schools?.name?` • ${profile.schools.name}`:''}</small></div></div>}<nav>{items.map(item=>{if(item.group){const GroupIcon=item.icon;return <details className="sidebar-menu-group" key={item.key}><summary><GroupIcon size={17}/><span>{item.label}</span><ChevronDown size={15}/></summary><div className="sidebar-menu-children">{item.children.map(([path,label])=><NavLink key={path+label} to={path} onClick={handleNav} className={({isActive})=>item.key==='interviews'?(window.location.pathname+window.location.search===path?'active':''):(isActive?'active':'')}><span className="form-dot"/>{label}{path==='/transfer-requests'&&transferPending>0&&<b className="sidebar-message-badge">{transferPending>99?'99+':transferPending}</b>}</NavLink>)}</div></details>}const [path,label,Icon,key]=item;return <NavLink key={path} to={path} onClick={handleNav} className={({isActive})=>isActive?'active':''}><Icon size={17}/><span>{label}</span>{key==='messages'&&unreadMessages>0&&<b className="sidebar-message-badge">{unreadMessages>99?'99+':unreadMessages}</b>}</NavLink>})}</nav><div className="side-footer"><div className="security-chip"><ShieldCheck size={15}/><span>وضع التشغيل المباشر</span></div><button type="button" className="logout" onClick={()=>{try{localStorage.removeItem('system_profile_id')}catch{};window.location.href='/login'}}><LogOut size={16}/><span>تسجيل الخروج</span></button></div></aside><main>{children}<SiteFooter/></main><ReminderModal note={reminder} onClose={()=>setReminder(null)}/></div>
}

