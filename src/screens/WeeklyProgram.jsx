import React,{useEffect,useMemo,useState}from'react';
import{useNavigate}from'react-router-dom';
import{Page,Card,Input,Textarea,Button,Select,ErrorNotice}from'../components/UI';
import{listWeeklyPrograms,createWeeklyProgram,createWeeklyItem,updateWeeklyItem,deleteWeeklyItem,currentProfile,listActiveAcademicData,listSectionsBySchool}from'../services/data';
import{ChevronLeft,ChevronRight,CalendarDays,ExternalLink,Edit3,Trash2}from'lucide-react';

const days=[['الأحد',0],['الإثنين',1],['الثلاثاء',2],['الأربعاء',3],['الخميس',4]];
const periods=['الحصة الأولى','الحصة الثانية','الحصة الثالثة','الحصة الرابعة','الحصة الخامسة','الحصة السادسة','الحصة السابعة'];
const periodTimes={
 'الحصة الأولى':{start:'08:00',end:'08:40'},
 'الحصة الثانية':{start:'08:45',end:'09:20'},
 'الحصة الثالثة':{start:'09:25',end:'10:19'},
 'الحصة الرابعة':{start:'10:15',end:'10:55'},
 'الحصة الخامسة':{start:'11:20',end:'12:00'},
 'الحصة السادسة':{start:'12:00',end:'12:40'},
 'الحصة السابعة':{start:'12:40',end:'13:20'}
};
const getPeriodTimes=period=>periodTimes[period]||{start:'',end:''};
const dayColorClasses=['day-sunday','day-monday','day-tuesday','day-wednesday','day-thursday'];
const periodColorClasses=['period-1','period-2','period-3','period-4','period-5','period-6','period-7'];
const types=[
 'حصة توجيه جمعي','حصة توجيه مهني','مقابلة مديرة','مقابلة معلمات','مقابلة أولياء أمور',
 'اجتماع مديرة','اجتماع معلمات','اجتماع أولياء أمور','نشرة','إذاعة مدرسية','مجلة حائط',
 'اجتماع برلمان','تدريب برلمان','استشارة طالبات','مقابلة فردية مركزة طالبة','استراحة',
 'دورة','ارشاد فردي','ارشاد جماعي'
];
const quickWorkOptions=types.map(label=>({
 label,
 activity_type:label,
 route:({
  'حصة توجيه جمعي':'/group-counseling','حصة توجيه مهني':'/guidance',
  'مقابلة مديرة':'/interviews','مقابلة معلمات':'/interviews','مقابلة أولياء أمور':'/interviews',
  'اجتماع مديرة':'/notes','اجتماع معلمات':'/notes','اجتماع أولياء أمور':'/notes',
  'نشرة':'/activities','إذاعة مدرسية':'/activities','مجلة حائط':'/activities',
  'اجتماع برلمان':'/activities','تدريب برلمان':'/activities','استشارة طالبات':'/interviews',
  'مقابلة فردية مركزة طالبة':'/interviews','استراحة':'/notes','دورة':'/activities',
  'ارشاد فردي':'/guidance','ارشاد جماعي':'/group-counseling'
 }[label]||'/notes'),
 workType:label
}));
const routeFor={
 'حصة توجيه جمعي':'/group-counseling','حصة توجيه مهني':'/guidance',
 'مقابلة مديرة':'/interviews','مقابلة معلمات':'/interviews','مقابلة أولياء أمور':'/interviews',
 'اجتماع مديرة':'/notes','اجتماع معلمات':'/notes','اجتماع أولياء أمور':'/notes',
 'نشرة':'/activities','إذاعة مدرسية':'/activities','مجلة حائط':'/activities',
 'اجتماع برلمان':'/activities','تدريب برلمان':'/activities','استشارة طالبات':'/interviews',
 'مقابلة فردية مركزة طالبة':'/interviews','استراحة':'/notes','دورة':'/activities',
 'ارشاد فردي':'/guidance','ارشاد جماعي':'/group-counseling'
};
const pad=n=>String(n).padStart(2,'0');
const iso=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const displayDate=d=>{const x=new Date(`${d}T00:00:00`);return `${pad(x.getDate())}/${pad(x.getMonth()+1)}/${x.getFullYear()}`};
const addDays=(start,n)=>{const d=new Date(`${start}T00:00:00`);d.setDate(d.getDate()+n);return iso(d)};
const weekStart=(d=new Date())=>{const x=new Date(d);x.setHours(0,0,0,0);const day=x.getDay();x.setDate(x.getDate()-(day===0?0:day));return iso(x)};
const formatAcademicYear=y=>{if(!y)return '';const name=String(y.name||'').trim();if(/^\d{4}\/\d{4}$/.test(name))return name;const start=y.start_date?new Date(`${y.start_date}T00:00:00`).getFullYear():null;const end=y.end_date?new Date(`${y.end_date}T00:00:00`).getFullYear():null;return start&&end?`${start}/${end}`:name};
const formatSemester=s=>{if(!s)return '';const t=String(s.type||'').toUpperCase();if(t.includes('FIRST')||t.includes('1')||String(s.name||'').includes('الأول')||String(s.name||'').includes('الاول'))return 'الأول';if(t.includes('SECOND')||t.includes('2')||String(s.name||'').includes('الثاني')||String(s.name||'').includes('الثاني'))return 'الثاني';return s.name||''};
const studentRelatedTypes=new Set(['حصة توجيه جمعي','حصة توجيه مهني','مقابلة أولياء أمور','استشارة طالبات','مقابلة فردية مركزة طالبة','ارشاد فردي','ارشاد جماعي']);
const emptyForm={day_date:'',period:periods[0],start_time:periodTimes[periods[0]].start,end_time:periodTimes[periods[0]].end,activity_type:'حصة توجيه جمعي',topic:'',objectives:'',notes:'',status:'PLANNED',grade_id:'',section_id:''};
const academicContextForDate=(date,years=[],semesters=[])=>{
 const target=new Date(`${date}T00:00:00`);
 const parseYear=y=>{const m=String(y?.name||'').match(/^(\d{4})\/(\d{4})$/);if(!m)return null;const sy=Number(m[1]),ey=Number(m[2]);return {a:y.start_date?new Date(`${y.start_date}T00:00:00`):new Date(sy,7,15),b:y.end_date?new Date(`${y.end_date}T00:00:00`):new Date(ey,5,30)};};
 let year=years.find(y=>{const r=parseYear(y);return r&&target>=r.a&&target<=r.b});
 if(!year) year=years.find(y=>{const r=parseYear(y);return r&&target<r.b})||years[0];
 if(!year)return {year:null,semester:null};
 const yr=parseYear(year), sems=semesters.filter(s=>s.school_year_id===year.id);
 let semester=sems.find(s=>s.start_date&&s.end_date&&target>=new Date(`${s.start_date}T00:00:00`)&&target<=new Date(`${s.end_date}T00:00:00`));
 if(!semester){const secondStart=new Date(yr.b.getFullYear(),0,1);semester=target<secondStart?(sems.find(s=>String(s.type).toUpperCase().includes('FIRST'))||sems.find(s=>String(s.name||'').includes('الأول'))):(sems.find(s=>String(s.type).toUpperCase().includes('SECOND'))||sems.find(s=>String(s.name||'').includes('الثاني')));}
 return {year,semester};
};

export default function WeeklyProgram(){
 const nav=useNavigate();const[programs,setPrograms]=useState([]),[profile,setProfile]=useState(null),[academic,setAcademic]=useState({years:[],semesters:[],grades:[]}),[sections,setSections]=useState([]),[loading,setLoading]=useState(true),[saving,setSaving]=useState(false),[error,setError]=useState(''),[start,setStart]=useState(weekStart()),[yearId,setYearId]=useState(''),[semesterId,setSemesterId]=useState(''),[form,setForm]=useState({...emptyForm,day_date:weekStart()}),[selected,setSelected]=useState(null),[openCell,setOpenCell]=useState(null),[cellContext,setCellContext]=useState(false);
 const load=async()=>{setLoading(true);setError('');try{const[p,a,u]=await Promise.all([listWeeklyPrograms(),listActiveAcademicData(),currentProfile()]);setPrograms(p||[]);setAcademic(a||{years:[],semesters:[],grades:[]});setProfile(u||null);if(u?.school_id){try{const secs=await listSectionsBySchool(u.school_id);setSections(secs||[])}catch{setSections([])}}}catch(e){setError(e?.message||'تعذر تحميل البرنامج.')}finally{setLoading(false)}};
 useEffect(()=>{load()},[]);
 useEffect(()=>{const ctx=academicContextForDate(start,academic.years||[],academic.semesters||[]);setYearId(ctx.year?.id||'');setSemesterId(ctx.semester?.id||'')},[start,academic.years,academic.semesters]);
 useEffect(()=>{const close=()=>setOpenCell(null);document.addEventListener('click',close);return()=>document.removeEventListener('click',close)},[]);
 const active=useMemo(()=>programs.find(p=>p.week_start===start&&(!yearId||p.school_year_id===yearId)&&(!semesterId||p.semester_id===semesterId)),[programs,start,yearId,semesterId]);
 const moveWeek=delta=>setStart(addDays(start,delta*7));
 const ensureProgram=async()=>{if(active)return active;if(!yearId||!semesterId)throw new Error('أضف السنة الدراسية والفصل الدراسي من Supabase أولًا.');return createWeeklyProgram({school_year_id:yearId,semester_id:semesterId,week_start:start,week_end:addDays(start,4),title:`برنامج أسبوع ${start}`})};
 const save=async()=>{if(!form.day_date||!form.topic.trim())return setError('أكمل اليوم والموضوع.');if(studentRelatedTypes.has(form.activity_type)&&(!form.grade_id||!form.section_id))return setError('اختر الصف والشعبة لهذا العمل المرتبط بالطلاب.');setSaving(true);setError('');try{const p=await ensureProgram();const dayName=days.find(([,idx])=>addDays(start,idx)===form.day_date)?.[0]||'';const payload={weekly_program_id:p.id,...form,grade_id:studentRelatedTypes.has(form.activity_type)?(form.grade_id||null):null,section_id:studentRelatedTypes.has(form.activity_type)?(form.section_id||null):null,day_name:dayName,topic:form.topic.trim()};if(selected)await updateWeeklyItem(selected.id,payload);else await createWeeklyItem(payload);setSelected(null);setCellContext(false);setForm({...emptyForm,day_date:form.day_date});await load()}catch(e){setError(e?.message||'تعذر حفظ البند.')}finally{setSaving(false)}};
 const addQuickWork=(date,period,option)=>{setOpenCell(null);setError('');setSelected(null);setCellContext(true);setForm({...emptyForm,day_date:date,period,start_time:getPeriodTimes(period).start,end_time:getPeriodTimes(period).end,activity_type:option.activity_type,topic:'',grade_id:'',section_id:''});setTimeout(()=>{document.querySelector('.weekly-editor')?.scrollIntoView({behavior:'smooth',block:'start'});},60)};
 const startManualAdd=()=>{setError('');setSelected(null);setOpenCell(null);setCellContext(false);setForm({...emptyForm,day_date:start,period:periods[0],start_time:getPeriodTimes(periods[0]).start,end_time:getPeriodTimes(periods[0]).end,activity_type:types[0],grade_id:'',section_id:''});setTimeout(()=>document.querySelector('.weekly-editor')?.scrollIntoView({behavior:'smooth',block:'start'}),60)};
 const edit=item=>{setSelected(item);setCellContext(false);setForm({day_date:item.day_date||start,period:item.period||periods[0],start_time:item.start_time||'',end_time:item.end_time||'',activity_type:item.activity_type||'حصة توجيه جمعي',topic:item.topic||'',objectives:item.objectives||'',notes:item.notes||'',status:item.status||'PLANNED',grade_id:item.grade_id||'',section_id:item.section_id||''});window.scrollTo({top:0,behavior:'smooth'})};
 const remove=async id=>{if(!confirm('حذف هذا البند؟'))return;try{await deleteWeeklyItem(id);await load()}catch(e){setError(e?.message||'تعذر الحذف.')}};
 const goItem=item=>{const route=item.work_route||routeFor[item.activity_type]||'/notes';const qs=new URLSearchParams({from:'weekly',date:item.day_date||'',period:item.period||'الحصة الأولى',weekly_item_id:item.id||'',record_id:item.work_record_id||'',weekly_program_id:item.weekly_program_id||'',year_id:yearId||'',semester_id:semesterId||'',work_type:item.activity_type||'',grade_id:item.grade_id||'',section_id:item.section_id||''});nav(`${route}?${qs.toString()}`)};
 const selectedGradeSections=sections.filter(s=>!form.grade_id||String(s.grade_id)===String(form.grade_id));
 const gradeOptions=(academic.grades||[]).slice().sort((a,b)=>(a.sort_order??999)-(b.sort_order??999));
 return <Page title="البرنامج اليومي / الأسبوعي" sub="أهم شاشة عمل للمرشد: أسبوع كامل، حصص يومية، وكل حصة تفتح شاشة العمل المرتبطة بها." actions={<Button variant="secondary" onClick={()=>window.print()}>طباعة الأسبوع</Button>}>
  {error&&<ErrorNotice>{error}</ErrorNotice>}
  <Card className="weekly-header-card"><div className="week-nav"><Button variant="secondary" onClick={()=>moveWeek(-1)}><ChevronRight size={18}/> الأسبوع السابق</Button><div className="week-current"><CalendarDays size={20}/><div><strong>الأسبوع الحالي</strong><span>من الأحد {displayDate(start)} إلى الخميس {displayDate(addDays(start,4))}</span></div></div><Button variant="secondary" onClick={()=>moveWeek(1)}>الأسبوع التالي <ChevronLeft size={18}/></Button></div><div className="form-grid four"><Input label="الانتقال إلى أي أسبوع" type="date" value={start} onChange={e=>setStart(weekStart(new Date(`${e.target.value}T00:00:00`)))}/><div className="program-meta auto-academic"><span>السنة الدراسية</span><strong>{formatAcademicYear(academicContextForDate(start,academic.years||[],academic.semesters||[]).year)||'غير محددة'}</strong><small>تُحدد تلقائيًا حسب تاريخ الأسبوع</small></div><div className="program-meta auto-academic"><span>الفصل الدراسي</span><strong>{formatSemester(academicContextForDate(start,academic.years||[],academic.semesters||[]).semester)||'غير محدد'}</strong><small>الأول: منتصف أغسطس–بداية يناير | الثاني: حتى نهاية يونيو</small></div><div className="program-meta"><span>المدرسة</span><strong>{profile?.schools?.name||'غير مرتبطة'}</strong></div></div></Card>
  <Card className="weekly-board"><div className="section-title"><div><h2>الأسبوع كاملًا</h2><span>اضغط على زر الحصة لفتح شاشة العمل المرتبطة، أو استخدم الإضافة لإدخال نشاط جديد.</span></div></div>{loading?<div className="loading">جارٍ تحميل البرنامج…</div>:<div className="week-table-wrap"><div className="week-table"><div className="period-head">الأيام / الحصص</div>{periods.map(period=><div className={`period-head period-column-head ${periodColorClasses[periods.indexOf(period)]}`} key={period}><strong>{period}</strong></div>)}{days.map(([day,idx])=><React.Fragment key={day}><div className={`day-head day-row-head ${dayColorClasses[idx]}`}><strong>{day}</strong><small>{displayDate(addDays(start,idx))}</small></div>{periods.map((period,periodIndex)=>{const date=addDays(start,idx);const item=(active?.weekly_program_items||[]).find(x=>x.day_date===date&&(x.period||'')===period);return <div className={`lesson-cell ${dayColorClasses[idx]} ${periodColorClasses[periodIndex]}`} key={`${date}-${period}`}>{item?<div className="lesson-filled-wrap"><button className="lesson-button filled" onClick={()=>edit(item)} title="تعديل اللقاء"><span>{item.work_label||item.topic}</span><small>{item.activity_type}</small><Edit3 size={14}/></button><div className="lesson-cell-actions"><button className="lesson-cell-edit" title="تعديل اللقاء" onClick={e=>{e.stopPropagation();edit(item)}}><Edit3 size={13}/></button><button className="lesson-cell-delete" title="حذف اللقاء" onClick={e=>{e.stopPropagation();remove(item.id)}}><Trash2 size={13}/></button></div></div>:<div className="lesson-add-wrap"><button className="lesson-button empty-lesson" onClick={e=>{e.stopPropagation();setOpenCell(openCell?.date===date&&openCell?.period===period?null:{date,period})}}>+ إضافة</button>{openCell?.date===date&&openCell?.period===period&&<div className="lesson-work-menu" onClick={e=>e.stopPropagation()}><div className="lesson-work-menu-title">اختر نوع العمل</div>{quickWorkOptions.map(option=><button key={option.label} className="lesson-work-option" disabled={saving} onClick={()=>addQuickWork(date,period,option)}>{option.label}</button>)}</div>}</div>}</div>})}</React.Fragment>)}</div></div>}</Card>
  <Card className="weekly-editor"><div className="section-title"><div><h2>{selected?'تعديل بند الحصة':'إضافة بند للحصة'}</h2><span>{selected?'يمكن تعديل بيانات بند الحصة المحفوظ.':'تم تحديد اليوم والحصة ونوع العمل تلقائيًا من الخانة التي ضغطت عليها؛ أكمل باقي البيانات ثم احفظ.'}</span></div><div className="editor-actions">{!selected&&<Button variant="secondary" onClick={startManualAdd}>إضافة بند للحصة</Button>}{selected&&<Button variant="secondary" onClick={()=>{setSelected(null);setCellContext(false);setForm({...emptyForm,day_date:start})}}>إلغاء</Button>}</div></div><div className="selected-lesson-context"><span>{cellContext?'الخانة المحددة من الجدول':'إضافة يدوية من شاشة بند الحصة'}</span><strong>{form.day_date?`${days.find(([,idx])=>addDays(start,idx)===form.day_date)?.[0]||form.day_date} — ${form.period}`:'اختر اليوم والحصة'}</strong><em>{form.activity_type}</em></div><div className="form-grid four"><Input label="اليوم" type="date" value={form.day_date} readOnly={cellContext} min={start} max={addDays(start,4)}/><Select label="الحصة" value={form.period} disabled={cellContext} onChange={e=>{const period=e.target.value;const times=getPeriodTimes(period);setForm({...form,period,start_time:times.start,end_time:times.end})}}>{periods.map(x=><option key={x}>{x}</option>)}</Select><Input label="من" type="time" value={form.start_time} readOnly/><Input label="إلى" type="time" value={form.end_time} readOnly/></div><div className="form-grid three"><Select label="نوع العمل" value={form.activity_type} disabled={cellContext} onChange={e=>{const activity_type=e.target.value;setForm({...form,activity_type,grade_id:studentRelatedTypes.has(activity_type)?form.grade_id:"",section_id:studentRelatedTypes.has(activity_type)?form.section_id:""})}}>{types.map(x=><option key={x}>{x}</option>)}</Select><Input label="الموضوع" value={form.topic} onChange={e=>setForm({...form,topic:e.target.value})} placeholder="موضوع الحصة أو اللقاء"/><Select label="الحالة" value={form.status} onChange={e=>setForm({...form,status:e.target.value})}><option value="PLANNED">مخطط</option><option value="COMPLETED">منجز</option><option value="NOT_COMPLETED">لم ينفذ</option><option value="CANCELLED">ملغى</option></Select></div><>{studentRelatedTypes.has(form.activity_type)&&<div className="form-grid two weekly-student-fields"><Select label="الصف" value={form.grade_id||""} onChange={e=>setForm({...form,grade_id:e.target.value,section_id:""})}><option value="">اختر الصف</option>{gradeOptions.map((g,i)=><option key={g.id} value={g.id}>{i+1}</option>)}</Select><Select label="الشعبة" value={form.section_id||""} onChange={e=>setForm({...form,section_id:e.target.value})}><option value="">اختر الشعبة</option>{selectedGradeSections.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</Select></div>}</>
  <div className="form-grid two"><Textarea label="الأهداف" value={form.objectives} onChange={e=>setForm({...form,objectives:e.target.value})}/><Textarea label="ملاحظات" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/></div><Button loading={saving} onClick={save}>{selected?<><Edit3 size={16}/> حفظ التعديل</>:<>+ إضافة للحصة</>}</Button></Card>
  <Card className="weekly-list"><div className="section-title"><div><h2>تفاصيل الأسبوع المحفوظة</h2><span>{active?.weekly_program_items?.length||0} بند</span></div></div>{(active?.weekly_program_items||[]).length===0?<div className="empty">لا توجد بنود محفوظة لهذا الأسبوع بعد.</div>:<div className="program-detail-list">{[...active.weekly_program_items].sort((a,b)=>`${a.day_date}${a.period}`.localeCompare(`${b.day_date}${b.period}`)).map(item=><div className="program-detail-row" key={item.id}><div><strong>{item.day_name||item.day_date}</strong><span>{item.period} • {item.activity_type}{item.grade_id&&item.section_id?` • الصف ${gradeOptions.findIndex(g=>String(g.id)===String(item.grade_id))+1} / ${sections.find(s=>String(s.id)===String(item.section_id))?.name||"الشعبة"}`:""}</span></div><strong>{item.topic}</strong><div className="item-actions"><button onClick={()=>goItem(item)}>فتح الشاشة <ExternalLink size={14}/></button><button onClick={()=>edit(item)}>تعديل</button><button onClick={()=>remove(item.id)}><Trash2 size={14}/> حذف</button></div></div>)}</div>}</Card>
 </Page>
}

