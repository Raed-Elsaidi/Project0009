import React,{useEffect,useMemo,useState} from 'react'
import {Eye} from 'lucide-react'
import {Page,Card,Input,Textarea,Select,Button,Empty,ErrorNotice} from '../components/UI'
import OfficialDocumentHeader from '../components/officialForms/OfficialDocumentHeader'
import {currentProfile,listStudents,listActiveAcademicData,listRecords,createOwnedRecord,updateRecord} from '../services/data'

const empty={student_id:'',school_year_id:'',semester_id:'',month:String(new Date().getMonth()+1),lateness_count:'',reason:'',notes:''}
const months=Array.from({length:12},(_,i)=>String(i+1))
const fieldStyle={width:'100%',padding:'11px 12px',border:'1px solid #d8dee8',borderRadius:10,background:'#fff',font:'inherit',color:'#172033'}
const labelStyle={display:'grid',gap:7,fontWeight:700,color:'#344054',fontSize:14}

export default function Lateness(){
 const [profile,setProfile]=useState(null),[students,setStudents]=useState([]),[academic,setAcademic]=useState({years:[],semesters:[]}),[records,setRecords]=useState([])
 const [form,setForm]=useState(empty),[editing,setEditing]=useState(null),[loading,setLoading]=useState(true),[saving,setSaving]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('')
 const [studentSearch,setStudentSearch]=useState('')
 const [showIndividual,setShowIndividual]=useState(false),[showRepeated,setShowRepeated]=useState(false),[viewRecord,setViewRecord]=useState(null)
 const set=(k,v)=>setForm(f=>({...f,[k]:v}))
 const load=async()=>{setLoading(true);setError('');try{const p=await currentProfile();if(!p)throw new Error('تعذر تحديد حساب المستخدم الحالي.');const [st,ac,rs]=await Promise.all([listStudents(p.school_id),listActiveAcademicData(p.school_id),listRecords('lateness_records','*','created_at')]);setProfile(p);setStudents(st);setAcademic(ac);setRecords(rs);setForm(f=>({...f,school_year_id:f.school_year_id||ac.years?.find(y=>y.is_active)?.id||ac.years?.[0]?.id||'',semester_id:f.semester_id||ac.semesters?.find(x=>x.is_active)?.id||ac.semesters?.[0]?.id||''}))}catch(e){setError(e.message||'تعذر تحميل بيانات التأخر.')}finally{setLoading(false)}}
 useEffect(()=>{load()},[])
 const selectedStudent=students.find(s=>String(s.id)===String(form.student_id))
 const schoolStudentIds=useMemo(()=>new Set(students.map(s=>String(s.id))),[students])
 const visibleRecords=useMemo(()=>records.filter(r=>schoolStudentIds.has(String(r.student_id))),[records,schoolStudentIds])
 const schoolName=profile?.schools?.name||'اسم المدرسة'
 const directorateName=profile?.directorates?.name||profile?.schools?.directorate?.name||'المديرية'
 const yearName=id=>academic.years?.find(x=>String(x.id)===String(id))?.name||'—'
 const semesterName=id=>academic.semesters?.find(x=>String(x.id)===String(id))?.name||'—'
 const studentName=id=>{const s=students.find(x=>String(x.id)===String(id));return s?.full_name||'—'}
 const reset=()=>{setEditing(null);setStudentSearch('');setForm({...empty,school_year_id:form.school_year_id,semester_id:form.semester_id,month:String(new Date().getMonth()+1)})}
 const save=async()=>{setSaving(true);setError('');setNotice('');try{const count=Number(form.lateness_count);const month=Number(form.month);if(!form.student_id||!form.school_year_id||!form.semester_id)throw new Error('يرجى اختيار الطالب والعام الدراسي والفصل الدراسي.');if(!Number.isInteger(count)||count<1)throw new Error('أدخل عدد مرات تأخر صحيحاً لا يقل عن مرة واحدة.');if(!Number.isInteger(month)||month<1||month>12)throw new Error('يرجى اختيار شهر صحيح.');if(!schoolStudentIds.has(String(form.student_id)))throw new Error('الطالب المحدد لا يتبع المدرسة الحالية.');const payload={student_id:form.student_id,school_year_id:form.school_year_id,semester_id:form.semester_id,month,lateness_count:count,reason:form.reason.trim(),notes:form.notes.trim()};if(editing)await updateRecord('lateness_records',editing,payload);else await createOwnedRecord('lateness_records',payload,{school:false});await load();reset();setNotice('تم حفظ سجل التأخر بنجاح.')}catch(e){setError(e.message||'تعذر حفظ سجل التأخر.')}finally{setSaving(false)}}
 const edit=r=>{setEditing(r.id);setStudentSearch(studentName(r.student_id));setForm({student_id:r.student_id||'',school_year_id:r.school_year_id||'',semester_id:r.semester_id||'',month:String(r.month||''),lateness_count:String(r.lateness_count||''),reason:r.reason||'',notes:r.notes||''});window.scrollTo({top:0,behavior:'smooth'})}
 const repeatedStudents=useMemo(()=>{
  // احصر النتائج في طلاب المدرسة الحالية، والعام والفصل المحددين فقط.
  // lateness_count هو عدد مرات التأخر المسجل في كل سجل؛ نجمعه للطالب خلال الفصل.
  const map=new Map()
  visibleRecords.forEach(r=>{
   if(String(r.school_year_id)!==String(form.school_year_id)||String(r.semester_id)!==String(form.semester_id))return
   const key=String(r.student_id||'')
   if(!key||!schoolStudentIds.has(key))return
   const x=map.get(key)||{student_id:key,total:0,reasons:[],notes:[]}
   x.total+=Number(r.lateness_count)||0
   if(r.reason&&!x.reasons.includes(r.reason))x.reasons.push(r.reason)
   if(r.notes&&!x.notes.includes(r.notes))x.notes.push(r.notes)
   map.set(key,x)
  })
  return [...map.values()]
   .filter(x=>x.total>3)
   .sort((a,b)=>b.total-a.total)
   .map((x,i)=>{
    const st=students.find(s=>String(s.id)===x.student_id)
    return {...x,number:i+1,name:st?.full_name||'—',grade:st?.grades?.name||'—',section:st?.sections?.name||'—'}
   })
 },[visibleRecords,students,form.school_year_id,form.semester_id])
 const print=()=>window.print()
 return <Page title="التأخر" sub="تسجيل تأخر الطلبة ومتابعة حالات التأخر الصباحي المتكرر">
  <style>{`
   .lateness-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
   .lateness-actions{display:flex;gap:9px;flex-wrap:wrap;margin-top:18px}
   .lateness-history{width:100%;border-collapse:collapse;min-width:720px;table-layout:fixed}
   .lateness-history th,.lateness-history td{padding:9px 7px;border-bottom:1px solid #e6eaf0;text-align:right;vertical-align:middle;line-height:1.45;overflow-wrap:anywhere;font-size:13px}
   .lateness-history th{background:#f5f7fa;color:#174f4c;font-weight:800}
   .lateness-history th:nth-child(1){width:18%}.lateness-history th:nth-child(2){width:11%}.lateness-history th:nth-child(3){width:11%}.lateness-history th:nth-child(4){width:12%}.lateness-history th:nth-child(5){width:10%}.lateness-history th:nth-child(6){width:18%}.lateness-history th:nth-child(7){width:20%}
   .lateness-history .row-actions{display:flex;gap:6px;align-items:center;flex-wrap:nowrap}
   .lateness-history .row-actions button{padding:8px 13px!important;min-height:40px!important;font-size:13px!important;white-space:nowrap}
   .lateness-history .row-actions .view-record-btn{display:inline-flex!important;align-items:center;justify-content:center;gap:8px;padding:10px 18px!important;min-height:46px!important;font-size:15px!important;font-weight:800!important;border-radius:12px!important}
   .lateness-history .row-actions .view-record-btn{background:#086b68!important;color:#fff!important;border:1px solid #086b68!important}
   .lateness-history .row-actions .view-record-btn svg{color:#fff!important}
   .lateness-history .row-actions .edit-record-btn{padding:11px 19px!important;min-height:48px!important;font-size:16px!important;font-weight:800!important;border-radius:12px!important}
   .official-report-btn{color:#174f4c!important;font-weight:800!important}
   .official-report-btn svg{color:#174f4c!important}

   .lateness-report{background:#fff;color:#111;max-width:1000px;margin:auto;padding:26px;direction:rtl}
   .lateness-report h2{text-align:center;margin:25px 0 12px;font-size:22px}
   .lateness-report p{text-align:center;margin:7px 0}
   .lateness-report table{width:100%;border-collapse:collapse;margin-top:18px;table-layout:fixed}
   .lateness-report th,.lateness-report td{border:1px solid #333;padding:9px 6px;text-align:center;overflow-wrap:anywhere;line-height:1.55}
   .lateness-report th{background:#f0e5c9}
   .lateness-line{display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap;margin:18px 0}
   .lateness-sign{margin:55px 20px 20px auto;width:max-content;font-weight:bold}
   .lateness-modal{position:fixed;inset:0;background:#0009;z-index:9999;overflow:auto;padding:18px}
   .lateness-modal-inner{background:#f3f5f8;max-width:1100px;margin:20px auto;border-radius:14px;padding:14px}
   .lateness-modal.individual-modal,.lateness-modal.report-modal{background:#eee5d3}
   .individual-modal .lateness-modal-inner,.report-modal .lateness-modal-inner{background:#eee5d3;max-width:900px;width:calc(100% - 8px);margin:12px auto;padding:14px;border-radius:22px}
   .individual-modal .lateness-modal-bar,.report-modal .lateness-modal-bar{display:flex;flex-direction:row;justify-content:space-between;align-items:center;gap:14px;padding:8px 6px 16px}
   .individual-modal .lateness-modal-bar>strong,.report-modal .lateness-modal-bar>strong,.lateness-modal-heading{font-size:20px;color:#174f4c;text-align:right}
   .individual-modal .lateness-modal-bar .lateness-actions,.report-modal .lateness-modal-bar .lateness-actions{display:flex;flex-direction:row;flex-wrap:nowrap;gap:10px;margin:0}
   .individual-modal .lateness-paper,.report-modal .lateness-paper{background:#fff;border:1px solid #333;padding:28px 24px;min-height:0;box-shadow:0 12px 28px #00000012;max-width:100%;margin:auto}
   .individual-modal .lateness-report,.report-modal .lateness-report{max-width:none;padding:0!important;font-family:Arial,sans-serif}
   /* Both lateness previews share the approved compact official-form design. */
   .individual-modal .lateness-report h2,.report-modal .lateness-report h2{text-align:center;color:#174f4c;font-size:17px;font-weight:800;margin:13px 0 7px;line-height:1.5}
   .individual-modal .lateness-report .individual-meta,.report-modal .lateness-report .individual-meta{text-align:center;font-size:10px;color:#555;margin:5px 0 8px;line-height:1.7}
   .individual-modal .lateness-report .individual-school,.report-modal .lateness-report .individual-school{text-align:center;font-size:9px;color:#444;margin:5px 0 13px;line-height:1.7}
   .individual-modal .lateness-report .lateness-line,.report-modal .lateness-report .lateness-line{display:flex;justify-content:center;align-items:center;gap:5px 18px;flex-wrap:wrap;text-align:center;font-size:10px;color:#555;line-height:1.7;margin:5px 0 8px}
   .individual-modal .lateness-report table,.report-modal .lateness-report table{margin-top:12px;font-size:9px;table-layout:fixed}
   .individual-modal .lateness-report th,.individual-modal .lateness-report td,.report-modal .lateness-report th,.report-modal .lateness-report td{padding:6px 4px;line-height:1.5;overflow-wrap:anywhere;vertical-align:middle}
   /* Keep the lateness-days column slightly smaller so its value fits neatly. */
   .individual-modal .lateness-report th:nth-child(6),.individual-modal .lateness-report td:nth-child(6){font-size:8px!important}
   .individual-modal .lateness-report th,.report-modal .lateness-report th{background:#f3e4bd!important;color:#174f4c;font-weight:800}
   .individual-modal .lateness-report .individual-sign,.report-modal .lateness-report .individual-sign{margin:25px auto 0 0!important;text-align:left!important;font-size:10px;line-height:1.9;font-weight:500;width:max-content;max-width:100%}
   .individual-modal .lateness-report .individual-sign strong,.report-modal .lateness-report .individual-sign strong{font-weight:700}
   .report-modal .lateness-report p{font-size:10px;line-height:1.8;margin:12px 0;color:#333}
   .report-modal .lateness-report .lateness-sign{font-size:10px;line-height:1.9;margin:28px 0 0 auto;width:max-content;max-width:100%;font-weight:700}
   .lateness-modal-bar{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;padding:8px 6px 16px}
   .lateness-paper{background:white;padding:22px;overflow:auto}
   .lateness-paper .lateness-report{padding:0}
   .lateness-muted{color:#667085;font-size:13px}
   @media(max-width:650px){
    .lateness-grid{grid-template-columns:1fr}
    /* حافظ على كل بيانات السجل في صف أفقي واحد على الهاتف مع تمرير أفقي عند الحاجة */
    .lateness-history{display:table;min-width:760px;width:100%;table-layout:fixed;border-collapse:collapse}
    .lateness-history thead{display:table-header-group}
    .lateness-history tbody{display:table-row-group}
    .lateness-history tr{display:table-row;background:#fff;box-shadow:none;border:0;padding:0}
    .lateness-history th,.lateness-history td{display:table-cell;padding:9px 7px;font-size:12px;white-space:nowrap;vertical-align:middle}
    .lateness-history td:before{content:none}
    .lateness-history .row-actions{display:flex;flex-direction:row;align-items:center;gap:8px}
    .lateness-history .row-actions button{padding:7px 10px!important;min-height:38px!important;font-size:12px!important}
    .lateness-history .row-actions .view-record-btn{padding:9px 15px!important;min-height:44px!important;font-size:14px!important}
    .lateness-modal{padding:5px}
    .individual-modal .lateness-modal-inner,.report-modal .lateness-modal-inner{padding:9px;width:100%;margin:5px auto}
    .individual-modal .lateness-modal-bar,.report-modal .lateness-modal-bar{align-items:flex-start;flex-direction:column;padding:7px 5px 12px}
    .individual-modal .lateness-modal-bar .lateness-actions,.report-modal .lateness-modal-bar .lateness-actions{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));width:100%;gap:7px}
    .individual-modal .lateness-modal-bar .lateness-actions button,.report-modal .lateness-modal-bar .lateness-actions button{padding:9px 5px!important;font-size:12px!important;white-space:nowrap}
    .individual-modal .lateness-paper,.report-modal .lateness-paper{padding:18px 12px;min-height:0}
    .individual-modal .lateness-report h2,.report-modal .lateness-report h2{font-size:15px;margin:10px 0 5px}
    .individual-modal .lateness-report .individual-meta,.report-modal .lateness-report .individual-meta{font-size:9px;margin:4px 0 6px}
    .individual-modal .lateness-report .individual-school,.report-modal .lateness-report .individual-school{font-size:8px;margin:4px 0 10px}
    .individual-modal .lateness-report .lateness-line,.report-modal .lateness-report .lateness-line{font-size:9px;gap:3px 12px;margin:4px 0 6px}
    .individual-modal .lateness-report table,.report-modal .lateness-report table{font-size:8px;margin-top:9px}
    .individual-modal .lateness-report th,.individual-modal .lateness-report td,.report-modal .lateness-report th,.report-modal .lateness-report td{padding:5px 2px;line-height:1.45}
    .individual-modal .lateness-report .individual-sign,.report-modal .lateness-report .individual-sign,.report-modal .lateness-report .lateness-sign{font-size:9px;margin-top:18px}
    .report-modal .lateness-report p{font-size:9px;margin:9px 0}
   }
   @media print{body *{visibility:hidden!important}.lateness-modal,.lateness-modal *{visibility:visible!important}.lateness-modal{position:absolute;inset:0;background:white;padding:0;overflow:visible}.lateness-modal-inner{max-width:none;margin:0;padding:0;background:white}.lateness-modal-bar{display:none!important}.lateness-paper{padding:0;overflow:visible}.lateness-report{max-width:none;padding:12mm!important}.lateness-report table{break-inside:auto}.lateness-report tr{break-inside:avoid}@page{size:A4;margin:10mm}}



   /* تنسيق الأزرار ورأس جدول سجل التأخر */
   .lateness-actions .official-report-btn{
     display:inline-flex!important;align-items:center!important;justify-content:center!important;
     gap:8px!important;min-height:52px!important;padding:13px 20px!important;
     border-radius:14px!important;border:1px solid #086b68!important;
     background:#086b68!important;color:#fff!important;
     font-family:inherit!important;font-size:16px!important;font-weight:700!important;
     line-height:1.35!important;box-shadow:0 8px 18px #086b6820!important;
   }
   .lateness-actions .official-report-btn svg{color:#fff!important}
   .lateness-history{min-width:920px!important}
   .lateness-history thead th{
     background:#f3e4bd!important;color:#075e5a!important;
     font-family:inherit!important;font-weight:700!important;
   }
   .lateness-history .row-actions{
     display:flex!important;flex-direction:row!important;align-items:center!important;
     justify-content:center!important;gap:8px!important;flex-wrap:nowrap!important;
     white-space:nowrap!important;
   }
   .lateness-history .row-actions .edit-record-btn,
   .lateness-history .row-actions .view-record-btn{
     display:inline-flex!important;flex:0 0 auto!important;align-items:center!important;
     justify-content:center!important;gap:7px!important;min-height:50px!important;
     padding:12px 16px!important;border-radius:14px!important;
     border:1px solid #086b68!important;background:#086b68!important;color:#fff!important;
     font-family:inherit!important;font-size:16px!important;font-weight:700!important;
     line-height:1.35!important;white-space:nowrap!important;text-align:center!important;
     box-shadow:0 8px 18px #086b6820!important;max-width:none!important;
   }
   .lateness-history .row-actions .view-record-btn svg{color:#fff!important;flex:0 0 auto!important}
   .lateness-history .row-actions .edit-record-btn:hover,
   .lateness-history .row-actions .view-record-btn:hover,
   .lateness-actions .official-report-btn:hover{background:#075a57!important;color:#fff!important}
   @media(max-width:700px){
     .lateness-actions .official-report-btn{min-height:48px!important;padding:11px 14px!important;font-size:16px!important}
     .lateness-history{min-width:920px!important}
     .lateness-history .row-actions{gap:7px!important;flex-wrap:nowrap!important}
     .lateness-history .row-actions .edit-record-btn,
     .lateness-history .row-actions .view-record-btn{min-height:46px!important;padding:10px 12px!important;font-size:16px!important}
   }

   /* تصغير خط أزرار العرض والتعديل لمطابقة الحجم المرئي لزر «جديد» */
   .lateness-actions .official-report-btn,
   .lateness-history .row-actions .edit-record-btn,
   .lateness-history .row-actions .view-record-btn{
     font-size:12px!important;
     font-weight:700!important;
     line-height:1.35!important;
   }
   @media(max-width:700px){
     .lateness-actions .official-report-btn,
     .lateness-history .row-actions .edit-record-btn,
     .lateness-history .row-actions .view-record-btn{
       font-size:12px!important;
     }
   }

   /* تنسيق ترويسة الجدول والتوقيعات في النموذج الرسمي */
   .report-modal .lateness-report th{background:#f3e4bd!important;color:#174f4c!important}
   .report-modal .lateness-report .lateness-sign{
     display:flex!important;flex-direction:row!important;justify-content:space-between!important;
     align-items:flex-start!important;gap:24px!important;width:100%!important;max-width:100%!important;
     margin:28px 0 0!important;direction:rtl!important;text-align:left!important;
     font-size:10px!important;line-height:1.9!important;
   }
   .report-modal .lateness-report .lateness-sign-block{
     flex:1 1 0!important;min-width:0!important;text-align:left!important;
     direction:rtl!important;font-weight:700!important;
   }
   .report-modal .lateness-report .lateness-sign-block strong{display:inline-block!important;font-weight:800!important}
   .report-modal .lateness-report .lateness-sign-block:first-child{order:2!important}
   @media(max-width:650px){
     .report-modal .lateness-report .lateness-sign{gap:12px!important;font-size:9px!important}
     .report-modal .lateness-report .lateness-sign-block{flex:1 1 0!important}
   }
  `}</style>
  <Card>
   <div className="section-title"><div><h2>{editing?'تعديل سجل التأخر':'إضافة سجل تأخر'}</h2><span>أدخل بيانات التأخر الصباحي ليتم حفظها في سجل المدرسة.</span></div>{editing&&<Button variant="secondary" onClick={reset}>إلغاء التعديل</Button>}</div>
   <div className="lateness-grid">
    <label style={labelStyle}>الطالب<div style={{position:'relative'}}><input style={fieldStyle} value={studentSearch} placeholder="اكتب جزءًا من اسم الطالب..." autoComplete="off" onChange={e=>{setStudentSearch(e.target.value);set('student_id','')}}/>{studentSearch.trim()&&!selectedStudent||studentSearch.trim()&&studentSearch.trim()!==selectedStudent?.full_name?<div style={{position:'absolute',top:'100%',right:0,left:0,zIndex:50,background:'#fff',border:'1px solid #d8dee8',borderRadius:10,maxHeight:220,overflowY:'auto',boxShadow:'0 6px 18px rgba(0,0,0,.14)'}}>{students.filter(s=>(s.full_name||'').toLowerCase().includes(studentSearch.trim().toLowerCase())).slice(0,15).map(s=><button type="button" key={s.id} onClick={()=>{set('student_id',s.id);setStudentSearch(s.full_name)}} style={{display:'block',width:'100%',padding:'12px',border:0,borderBottom:'1px solid #eee',background:'#fff',textAlign:'right',font:'inherit',cursor:'pointer',color:'#173f3b'}}>{s.full_name} — {s.grades?.name||''} {s.sections?.name||''}</button>)}{!students.some(s=>(s.full_name||'').toLowerCase().includes(studentSearch.trim().toLowerCase()))&&<div style={{padding:12,textAlign:'center'}}>لا توجد أسماء مطابقة</div>}</div>:null}</div></label>
    <label style={labelStyle}>العام الدراسي<Select value={form.school_year_id} onChange={e=>set('school_year_id',e.target.value)}><option value="">اختر العام الدراسي</option>{academic.years.map(y=><option key={y.id} value={y.id}>{y.name}</option>)}</Select></label>
    <label style={labelStyle}>الفصل الدراسي<Select value={form.semester_id} onChange={e=>set('semester_id',e.target.value)}><option value="">اختر الفصل</option>{academic.semesters.filter(x=>!x.school_year_id||String(x.school_year_id)===String(form.school_year_id)).map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</Select></label>
    <label style={labelStyle}>الشهر<Select value={form.month} onChange={e=>set('month',e.target.value)}>{months.map((m,i)=><option key={i+1} value={i+1}>{m}</option>)}</Select></label>
    <label style={labelStyle}>عدد مرات التأخر<Input type="number" min="1" value={form.lateness_count} onChange={e=>set('lateness_count',e.target.value)} placeholder="عدد المرات"/></label>
    <label style={labelStyle}>سبب التأخر<Input value={form.reason} onChange={e=>set('reason',e.target.value)} placeholder="سبب التأخر"/></label>
    <label style={{...labelStyle,gridColumn:'1/-1'}}>الإجراءات والملاحظات الإضافية<Textarea rows="3" value={form.notes} onChange={e=>set('notes',e.target.value)} placeholder="الإجراءات المتخذة أو ملاحظات المتابعة"/></label>
   </div>
   <div className="lateness-actions"><Button loading={saving} onClick={save}>{editing?'حفظ التعديلات':'حفظ سجل التأخر'}</Button><Button className="official-report-btn" variant="secondary" onClick={()=>setShowRepeated(true)}><Eye size={19} strokeWidth={2.5}/> عرض النموذج الرسمي للرصد</Button><Button variant="secondary" onClick={reset}>جديد</Button></div>
  </Card>
  {error&&<ErrorNotice>{error}</ErrorNotice>}{notice&&<div className="notice success">{notice}</div>}
  <Card><div className="section-title"><div><h2>سجل التأخر المحفوظ</h2><span>{visibleRecords.length} سجل</span></div><Button variant="secondary" onClick={load}>تحديث</Button></div>{loading?<div className="loading">جارٍ تحميل السجلات…</div>:visibleRecords.length===0?<Empty title="لا توجد سجلات تأخر صباحي"/>:<div style={{overflowX:'auto'}}><table className="lateness-history"><thead><tr><th>الطالب</th><th>العام</th><th>الفصل</th><th>الشهر</th><th>مرات التأخر</th><th>السبب</th><th>الإجراءات</th></tr></thead><tbody>{visibleRecords.map(r=><tr key={r.id}><td data-label="الطالب">{studentName(r.student_id)}</td><td data-label="العام الدراسي">{yearName(r.school_year_id)}</td><td data-label="الفصل">{semesterName(r.semester_id)}</td><td data-label="الشهر">{months[(Number(r.month)||1)-1]||'—'}</td><td data-label="مرات التأخر">{r.lateness_count||0}</td><td data-label="سبب التأخر">{r.reason||'—'}</td><td data-label="الإجراءات"><div className="row-actions"><Button className="edit-record-btn" variant="secondary" onClick={()=>edit(r)}>تعديل</Button><Button className="view-record-btn" onClick={()=>setViewRecord(r)} aria-label={`عرض النموذج الرسمي لتأخر ${studentName(r.student_id)}`}><Eye size={20} strokeWidth={2.5}/> عرض النموذج الرسمي للتأخر</Button></div></td></tr>)}</tbody></table></div>}</Card>
  {viewRecord&&<div className="lateness-modal individual-modal"><div className="lateness-modal-inner"><div className="lateness-modal-bar"><div><strong>نموذج متابعة التأخر الصباحي للطالب</strong><div className="lateness-muted">المعاينة الرسمية لسجل التأخر المحدد</div></div><div className="lateness-actions" style={{margin:0}}><Button variant="secondary" onClick={()=>setViewRecord(null)}>إغلاق</Button><Button onClick={print}>طباعة / PDF</Button></div></div><div className="lateness-paper"><div className="lateness-report"><OfficialDocumentHeader profile={profile}/><h2>نموذج متابعة التأخر الصباحي للطالب</h2><div className="individual-meta">العام الدراسي: {yearName(viewRecord.school_year_id)} — الفصل الدراسي: {semesterName(viewRecord.semester_id)}</div><table><thead><tr><th style={{width:'7%'}}>الرقم</th><th style={{width:'17%'}}>اسم الطالب</th><th style={{width:'17%'}}>الصف والشعبة</th><th style={{width:'12%'}}>الشهر</th><th style={{width:'19%'}}>وصف سبب التأخر</th><th style={{width:'11%'}}>مرات التأخر</th><th style={{width:'17%'}}>الإجراءات</th></tr></thead><tbody><tr><td>1</td><td>{studentName(viewRecord.student_id)}</td><td>{students.find(st=>String(st.id)===String(viewRecord.student_id))?.grades?.name||'—'} / {students.find(st=>String(st.id)===String(viewRecord.student_id))?.sections?.name||'—'}</td><td>{months[(Number(viewRecord.month)||1)-1]||'—'}</td><td>{viewRecord.reason||'—'}</td><td>{viewRecord.lateness_count||'—'}</td><td>{viewRecord.notes||'—'}</td></tr></tbody></table><div className="individual-sign"><strong>المرشد/ة التربوي/ة</strong><br/>{profile?.full_name||'........................'}</div></div></div></div></div>}
  {showRepeated&&<div className="lateness-modal report-modal"><div className="lateness-modal-inner"><div className="lateness-modal-bar"><div><strong>نموذج رصد التأخر الصباحي للطلاب</strong><div className="lateness-muted">يعرض جميع طلاب المدرسة الذين تجاوز مجموع مرات تأخرهم 3 مرات في العام والفصل المحددين</div></div><div className="lateness-actions" style={{margin:0}}><Button variant="secondary" onClick={()=>setShowRepeated(false)}>إغلاق</Button><Button onClick={print}>طباعة / PDF</Button></div></div><div className="lateness-paper"><div className="lateness-report"><OfficialDocumentHeader profile={profile}/><h2>نموذج رصد التأخر الصباحي للطلاب</h2><div className="individual-meta">العام الدراسي: {yearName(form.school_year_id)} — الفصل الدراسي: {semesterName(form.semester_id)}</div><table><thead><tr><th>الرقم</th><th>الطالب</th><th>الصف</th><th>الشعبة</th><th>مرات التأخر</th><th>سبب التأخر</th><th>الملاحظات</th></tr></thead><tbody>{repeatedStudents.length?repeatedStudents.map(x=><tr key={x.student_id}><td>{x.number}</td><td>{x.name}</td><td>{x.grade}</td><td>{x.section}</td><td>{x.total}</td><td>{x.reasons.join('؛ ')||'—'}</td><td>{x.notes.join('؛ ')||'—'}</td></tr>):<tr><td colSpan="7">لا يوجد طلاب تجاوز مجموع مرات تأخرهم ثلاث مرات في الفصل المحدد.</td></tr>}</tbody></table><p style={{textAlign:'right',marginTop:24}}>ملاحظة: يتضمن النموذج الطلاب الذين يزيد مجموع مرات تأخرهم المسجلة عن ثلاث مرات خلال الفصل المحدد.</p><div className="lateness-sign"><div className="lateness-sign-block"><strong>توقيع المرشد/ة التربوي/ة</strong><br/><br/>{profile?.full_name||'........................'}</div><div className="lateness-sign-block"><strong>توقيع المدير/ة</strong><br/><br/>{profile?.manager_name||'........................'}</div></div></div></div></div></div>}
 </Page>
}
