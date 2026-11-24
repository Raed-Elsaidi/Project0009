import React,{useEffect,useState,useCallback,useRef}from'react';
import{NavLink,useLocation}from'react-router-dom';
import{LayoutDashboard,CalendarDays,Users,FileText,AlertTriangle,MessageSquare,Bell,ClipboardList,Clock,DoorOpen,Activity,UsersRound,BookOpen,BarChart3,StickyNote,User,ShieldCheck,Menu,X,Building2,Shield,AlarmClock,LogOut,Files,ChevronDown}from'lucide-react';
import{supabase}from'../services/supabase';import{currentProfile,getMyPermissions,listMessages,listNotes}from'../services/data';import SiteFooter from'./SiteFooter';

const counselorItems=[
 ['/counselor-work-followup','متابعة عمل المرشد التربوي',ClipboardList,'counselor-work-followup'],
 {group:true,key:'admin-files',label:'الملف الإداري',icon:Files,children:[['/annual-plan','الخطة السنوية','annual-plan'],['/official-forms/semester-report','التقرير الفصلي','semester-report'],['/weekly-program','البرنامج اليومي / الأسبوعي','weekly-program'],['/correspondence','الصادر والوارد','correspondence']]},
 {group:true,key:'school-management',label:'الإدارة المدرسية',icon:Building2,children:[
 ['/school-data','أسماء المعلمين والصفوف','school-data'],
 ['/lesson-schedules','توقيت الحصص','lesson-schedules'],
 ['/students','أسماء طلاب المدرسة','students']
]},
 {group:true,key:'group-guidance',label:'الإرشاد الجماعي',icon:UsersRound,children:[['/group-counseling','أسماء طلاب المجموعة الإرشادية','group-counseling'],['/official-forms/group-session-details','جدول اللقاءات (الخطة)','group-session-details'],['/official-forms/group-session-summary','نموذج الإرشاد الجماعي','group-session-summary']]},
 {group:true,key:'group-direction',label:'التوجيه الجمعي',icon:MessageSquare,children:[['/official-forms/guidance-meetings-followup','نموذج متابعة لقاءات التوجيه الجمعي','guidance-meetings-followup']]},
 {group:true,key:'career-guidance',label:'التوجيه المهني',icon:BookOpen,children:[['/official-forms/career-guidance-followup','نموذج متابعة لقاءات التوجيه المهني','career-guidance-followup']]},
 {group:true,key:'activities',label:'الأنشطة',icon:Activity,children:[['/official-forms/visits','الزيارات','visits'],['/official-forms/newsletters','النشرات الإرشادية','newsletters'],['/official-forms/morning-radio','الإذاعة','morning-radio'],['/official-forms/seminars-workshops','الندوات','seminars-workshops'],['/official-forms/posters','الملصقات','posters'],['/official-forms/wall-magazine','مجلة حائط','wall-magazine'],['/activities','فعاليات','activities']]},
 {group:true,key:'parliament',label:'البرلمان',icon:Users,children:[['/official-forms/parliament-plan','الخطة','parliament-plan'],['/official-forms/parliament-members','الأسماء','parliament-members'],['/official-forms/parliament-team-meetings','اجتماعات الفريق','parliament-team-meetings'],['/official-forms/parliament-achievements','إنجازات','parliament-achievements']]},
 {group:true,key:'student-consultations',label:'استشارات طلابية',icon:ClipboardList,children:[['/absence','الغياب','absence'],['/lateness','التأخر','lateness'],['/dropout','التسرّب','dropout'],['/official-forms/case-study','دراسة الحالة','cases'],['/hot-cases','الملف الساخن','hot-cases'],['/official-forms/consultations-monitor','رصد ومتابعة استشارات طلابية','consultations-monitor'],['/official-forms/health-cases','الحالات الصحية','health-cases']]},
 {group:true,key:'focused-interviews',label:'رصد ومتابعة المقابلات الفردية المركزة',icon:FileText,children:[['/focused-interviews','نموذج رصد ومتابعة المقابلات الفردية المركزة','focused-interviews'],['/transfer-requests','طلبات النقل الواردة','transfer-requests']]},
 {group:true,key:'interviews',label:'المقابلات',icon:UsersRound,children:[['/interviews?type=principal','مدير/ة','interviews'],['/interviews?type=teacher','معلم/ة','interviews'],['/interviews?type=student','طلاب','interviews'],['/interviews?type=parent','أولياء أمور','interviews'],['/interviews?type=institution','مؤسسات','interviews'],['/interviews?type=graduates','تدريب خريجي جامعات','interviews']]},
 {group:true,key:'meetings',label:'اجتماعات',icon:CalendarDays,children:[['/official-forms/meeting-principal','مدير/ة','meeting-principal'],['/official-forms/meeting-teacher','معلم/ة','meeting-teacher'],['/official-forms/meeting-parents','أولياء أمور','meeting-parents']]},
 ['/reports','إحصائيات',BarChart3,'reports'],['/messages','مراسلة',MessageSquare,'messages'],['/notes','دفتر الملاحظات',StickyNote,'notes'],['/administration','إدارة الموظفين',UsersRound,'administration'],['/profile','الملف الشخصي',User,'profile'],['/login','خروج',LogOut,'logout']
];
const ministryItems=[['/directorate-dashboard','الإحصائيات والمتابعة',BarChart3,'directorate-dashboard'],['/directorates','المديريات',Building2,'directorates'],['/schools','المدارس',Building2,'schools'],['/school-data','بيانات المدرسة',Building2,'school-data'],['/administration','إدارة الموظفين',UsersRound,'administration'],['/official-forms/meeting-followup','النماذج الرسمية',Files,'meeting-followup'],['/messages','مراسلات الموظفين',MessageSquare,'messages'],['/profile','الملف الشخصي',User,'profile'],['/permissions','الصلاحيات',Shield,'permissions'],['/academic-years','السنوات الدراسية',CalendarDays,'academic-years']];
const directorateItems=[['/counselor-work-followup','متابعة عمل المرشد التربوي',ClipboardList,'counselor-work-followup'],['/directorate-dashboard','الإحصائيات والمتابعة',BarChart3,'directorate-dashboard'],['/schools','المدارس',Building2,'schools'],['/school-data','بيانات المدرسة',Building2,'school-data'],['/administration','إدارة الموظفين',UsersRound,'administration'],['/official-forms/meeting-followup','النماذج الرسمية',Files,'meeting-followup'],['/messages','مراسلات الموظفين',MessageSquare,'messages'],['/profile','الملف الشخصي',User,'profile'],['/permissions','الصلاحيات',Shield,'permissions'],['/academic-years','السنوات الدراسية',CalendarDays,'academic-years']];
const principalItems=[['/directorate-dashboard','الإحصائيات والمتابعة',BarChart3,'directorate-dashboard'],['/school-data','بيانات المدرسة',Building2,'school-data'],['/administration','إدارة المرشدين',UsersRound,'administration'],['/official-forms/meeting-followup','النماذج الرسمية',Files,'meeting-followup'],['/messages','مراسلات الموظفين',MessageSquare,'messages'],['/profile','الملف الشخصي',User,'profile']];
const labels={PROGRAMMER:'مبرمج النظام',MINISTRY:'مسؤول الإرشاد',DIRECTORATE:'رئيس القسم',PRINCIPAL:'المشرف التربوي',SCHOOL_PRINCIPAL:'مدير المدرسة',COUNSELOR:'المرشد التربوي'};

const OFFICIAL_FORM_PERMISSION_KEYS = new Set([
 'meeting-followup','meeting-summary','case-study','hot-cases-monitor',
 'hot-case-notice','student-issues-monitor','student-consultations',
 'consultations-monitor','repeated-absence','absence-followup',
 'repeated-lateness','lateness-followup','dropout-monitor','dropout-followup',
 'hot-cases-school','hot-cases-directorate','activities-monitor','visits',
 'newsletters','morning-radio','seminars-workshops','wall-magazine',
 'group-session-summary','group-session-details','group-counseling-plan',
 'group-sessions-monitor','guidance-meetings-followup',
 'guidance-meetings-monitor','weekly-program-form','annual-plan','plan',
 'semester-report','career-guidance-monitor','career-guidance-followup',
 'parliament-plan','parliament-members','parliament-team-meetings',
 'parliament-achievements','health-cases','meeting-principal',
 'meeting-teacher','meeting-parents','posters'
]);

function getRoutePermissionKey(pathname){
 const path=pathname.replace(/\/+$/,'')||'/';

 if(['/profile','/setup','/settings'].includes(path)) return null;
 if(path==='/programmer-dashboard') return '__PROGRAMMER_ONLY__';
 if(path==='/permissions') return '__PERMISSIONS_ADMIN__';

 if(path.startsWith('/official-forms/')){
  const formId=path.split('/')[2];
  if(!OFFICIAL_FORM_PERMISSION_KEYS.has(formId)) return '__INVALID_ROUTE__';
  return formId==='case-study'?'cases':formId;
 }

 const routeKeys={
  '/welcome':'directorate-dashboard',
  '/directorate-dashboard':'directorate-dashboard',
  '/administration':'administration',
  '/directorates':'directorates',
  '/schools':'schools',
  '/school-data':'school-data',
  '/lesson-schedules':'lesson-schedules',
  '/counselor-work-followup':'counselor-work-followup',
  '/dashboard':'dashboard',
  '/weekly-program':'weekly-program',
  '/students':'students',
  '/cases':'cases',
  '/hot-cases':'hot-cases',
  '/interviews':'interviews',
  '/focused-interviews':'focused-interviews',
  '/transfer-requests':'transfer-requests',
  '/absence':'absence',
  '/lateness':'lateness',
  '/dropout':'dropout',
  '/activities':'activities',
  '/group-counseling':'group-counseling',
  '/guidance':'guidance',
  '/annual-plan':'annual-plan',
  '/reports':'reports',
  '/notes':'notes',
  '/messages':'messages',
  '/correspondence':'correspondence',
  '/academic-years':'academic-years'
 };

 return routeKeys[path]||null;
}

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
 const location=useLocation();
 const[open,setOpen]=useState(false);const[profile,setProfile]=useState(null);const[permissions,setPermissions]=useState(null);const[accessLoaded,setAccessLoaded]=useState(false);const[unreadMessages,setUnreadMessages]=useState(0);const[transferPending,setTransferPending]=useState(0);const[reminder,setReminder]=useState(null);const remindedRef=useRef(new Set());
 const load=useCallback(async()=>{try{const p=await currentProfile();setProfile(p);const perms=await getMyPermissions();setPermissions(perms);setAccessLoaded(true)}catch{setPermissions(null);window.location.href='/login'}},[]);
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

 const schoolPrincipalItems=[...new Map([...ministryItems,...directorateItems,...principalItems,...counselorItems].map(item=>[item.group?'group:'+item.key:item[0],item])).values()];
 const base=profile?.role==='PROGRAMMER'?ministryItems:profile?.role==='MINISTRY'?ministryItems:profile?.role==='DIRECTORATE'?directorateItems:profile?.role==='PRINCIPAL'?principalItems:profile?.role==='SCHOOL_PRINCIPAL'?schoolPrincipalItems:counselorItems;
 const items=Array.isArray(permissions)
 ?profile?.role==='SUPER_ADMIN'
  ?base.filter(item=>item.group||permissions.includes(item[3])||item[3]==='profile'||(['MINISTRY','PROGRAMMER'].includes(profile?.role)&&item[3]==='permissions'))
  :base.map(item=>item.group
    ?{...item,children:item.children.filter(([, ,key])=>permissions.includes(key))}
    :item
   ).filter(item=>item.group
    ?item.children.length>0
    :permissions.includes(item[3])||item[3]==='profile'||(['MINISTRY','PROGRAMMER'].includes(profile?.role)&&item[3]==='permissions'))
 :profile?.role==='SUPER_ADMIN'?base:base.filter(item=>!item.group&&item[3]==='profile');
const routePermissionKey=getRoutePermissionKey(location.pathname);
 const routeDenied=!!profile&&profile.role!=='SUPER_ADMIN'&&(
  (routePermissionKey==='__PROGRAMMER_ONLY__'&&profile.role!=='PROGRAMMER')||
  (routePermissionKey==='__PERMISSIONS_ADMIN__'&&!['MINISTRY','PROGRAMMER'].includes(profile.role))||
  routePermissionKey==='__INVALID_ROUTE__'||
  (typeof routePermissionKey==='string'&&!routePermissionKey.startsWith('__')&&(!Array.isArray(permissions)||!permissions.includes(routePermissionKey)))
 );
 const handleNav=useCallback(()=>{clickSound();setOpen(false)},[]);
 const officialForms=[
  ['meeting-followup','نموذج متابعة المقابلات',1],['meeting-summary','نموذج رصد المقابلات',1],['case-study','نموذج دراسة حالة',2],['hot-cases-monitor','نموذج رصد الحالات الساخنة',3],['hot-case-notice','نموذج إعلام عن ملف ساخن',4],['student-issues-monitor','نموذج رصد المشكلات وقضايا الطلبة داخل وخارج المدرسة',5],['student-consultations','نموذج المقابلات والاستشارات الطلابية',6],['consultations-monitor','نموذج رصد الاستشارات والمقابلات الطلابية',7],['repeated-absence','نموذج رصد حالات الغياب المتكرر',8],['absence-followup','نموذج متابعة غياب الطالب',9],['repeated-lateness','نموذج رصد التأخر الصباحي المتكرر',9],['lateness-followup','نموذج متابعة التأخر الصباحي المتكرر',10],['dropout-monitor','نموذج رصد حالات التسرب',11],['dropout-followup','نموذج متابعة التسرب',12],['hot-cases-school','نموذج رصد الحالات الساخنة الفصلي – المدرسة',13],['hot-cases-directorate','نموذج رصد الحالات الساخنة الفصلي – المديرية',14],['activities-monitor','نموذج رصد الأنشطة',15],['visits','نموذج الزيارات',15],['newsletters','نموذج النشرات الإرشادية',16],['morning-radio','نموذج الإذاعة الصباحية',17],['seminars-workshops','نموذج الندوات والمحاضرات وورش العمل',18],['wall-magazine','نموذج مجلة الحائط',19],['group-session-summary','نموذج تلخيص الجلسات الجماعية',19],['group-session-details','نموذج ملخص جلسات الإرشاد الجماعي للمجموعة',20],['group-sessions-monitor','نموذج رصد عدد جلسات الإرشاد الجماعي',21],['guidance-meetings-followup','نموذج متابعة لقاءات التوجيه الجمعي',22],['guidance-meetings-monitor','نموذج رصد لقاءات التوجيه الجمعي',22],['weekly-program-form','نموذج البرنامج اليومي/الأسبوعي لعمل المرشد/ة التربوي/ة',23],['annual-plan','نموذج الخطة السنوية المعتمدة',24],['plan','نموذج الخطة',25],['semester-report','التقرير الفصلي حول إنجازات العمل في الخطة',26,27,28]
 ];
 const [formsOpen,setFormsOpen]=useState(window.location.pathname.startsWith('/official-forms'));
 return <div className="shell"><button className="mobile-menu" onClick={()=>setOpen(true)} aria-label="فتح القائمة"><Menu size={21}/></button><aside className={open?'open':''}><div className="brand"><div className="brand-mark ministry-brand-mark"><img src="/assets/ministry-logo.png" alt="شعار وزارة التربية والتعليم"/></div><div><h2>{labels[profile?.role]||'نظام الإرشاد'}</h2><small>إدارة ومتابعة الإرشاد التربوي</small></div><button className="close-menu" onClick={()=>setOpen(false)}><X size={19}/></button></div>{profile&&<div className="profile-mini"><div className="avatar">{(profile.full_name||'م').slice(0,1)}</div><div><strong>{profile.full_name}</strong><small>{labels[profile.role]}{profile.directorates?.name?` • ${profile.directorates.name}`:''}{profile.schools?.name?` • ${profile.schools.name}`:''}</small></div></div>}<nav>{items.map(item=>{if(item.group){const GroupIcon=item.icon;return <details className="sidebar-menu-group" key={item.key}><summary><GroupIcon size={17}/><span>{item.label}</span><ChevronDown size={15}/></summary><div className="sidebar-menu-children">{item.children.map(([path,label])=><NavLink key={path+label} to={path} onClick={handleNav} className={({isActive})=>item.key==='interviews'?(window.location.pathname+window.location.search===path?'active':''):(path==='/annual-plan'&&window.location.pathname==='/official-forms/annual-plan')||isActive?'active':''}><span className="form-dot"/>{label}{path==='/transfer-requests'&&transferPending>0&&<b className="sidebar-message-badge">{transferPending>99?'99+':transferPending}</b>}</NavLink>)}</div></details>}const [path,label,Icon,key]=item;return <NavLink key={path} to={path} onClick={handleNav} className={({isActive})=>isActive?'active':''}><Icon size={17}/><span>{label}</span>{key==='messages'&&unreadMessages>0&&<b className="sidebar-message-badge">{unreadMessages>99?'99+':unreadMessages}</b>}</NavLink>})}</nav><div className="side-footer"><div className="security-chip"><ShieldCheck size={15}/><span>وضع التشغيل المباشر</span></div><button type="button" className="logout" onClick={()=>{try{localStorage.removeItem('system_profile_id')}catch{};window.location.href='/login'}}><LogOut size={16}/><span>تسجيل الخروج</span></button></div></aside><main>{!accessLoaded?<div className="page-loading">جارٍ التحقق من الصلاحيات...</div>:!profile?<div className="page-error">تعذر التحقق من حساب المستخدم. يرجى تسجيل الدخول مجددًا.</div>:routeDenied?<div className="page-error"><h2>غير مصرح بالدخول</h2><p>لا تملك الصلاحية اللازمة لفتح هذه الصفحة.</p></div>:children}<SiteFooter/></main><ReminderModal note={reminder} onClose={()=>setReminder(null)}/></div>
}

