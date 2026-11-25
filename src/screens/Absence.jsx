import React,{useEffect,useMemo,useState} from 'react'
import {Eye} from 'lucide-react'
import {Page,Card,Input,Textarea,Select,Button,Empty,ErrorNotice} from '../components/UI'
import OfficialDocumentHeader from '../components/officialForms/OfficialDocumentHeader'
import {currentProfile,listStudents,listActiveAcademicData,listRecords,createOwnedRecord,updateRecord} from '../services/data'

const empty={student_id:'',school_year_id:'',semester_id:'',month:String(new Date().getMonth()+1),absence_count:'',reason:'',notes:''}
const months=Array.from({length:12},(_,i)=>String(i+1))
const fieldStyle={width:'100%',padding:'11px 12px',border:'1px solid #d8dee8',borderRadius:10,background:'#fff',font:'inherit',color:'#172033'}
const labelStyle={display:'grid',gap:7,fontWeight:700,color:'#344054',fontSize:14}

export default function Absence(){
 const [profile,setProfile]=useState(null),[students,setStudents]=useState([]),[academic,setAcademic]=useState({years:[],semesters:[]}),[records,setRecords]=useState([])
 const [form,setForm]=useState(empty),[editing,setEditing]=useState(null),[loading,setLoading]=useState(true),[saving,setSaving]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('')
 const [showIndividual,setShowIndividual]=useState(false),[showRepeated,setShowRepeated]=useState(false),[viewRecord,setViewRecord]=useState(null),[studentSearch,setStudentSearch]=useState('')
 const set=(k,v)=>setForm(f=>({...f,[k]:v}))
 const load=async()=>{setLoading(true);setError('');try{const p=await currentProfile();if(!p)throw new Error('تعذر تحديد حساب المستخدم الحالي.');const [st,ac,rs]=await Promise.all([listStudents(p.school_id),listActiveAcademicData(p.school_id),listRecords('absence_records','*','created_at')]);setProfile(p);setStudents(st);setAcademic(ac);setRecords(rs);setForm(f=>({...f,school_year_id:f.school_year_id||ac.years?.find(y=>y.is_active)?.id||ac.years?.[0]?.id||'',semester_id:f.semester_id||ac.semesters?.find(x=>x.is_active)?.id||ac.semesters?.[0]?.id||''}))}catch(e){setError(e.message||'تعذر تحميل بيانات الغياب.')}finally{setLoading(false)}}
 useEffect(()=>{load()},[])
 const selectedStudent=students.find(s=>String(s.id)===String(form.student_id))
 const schoolName=profile?.schools?.name||'اسم المدرسة'
 const directorateName=profile?.directorates?.name||profile?.schools?.directorate?.name||'المديرية'
 const yearName=id=>academic.years?.find(x=>String(x.id)===String(id))?.name||'—'
 const semesterName=id=>academic.semesters?.find(x=>String(x.id)===String(id))?.name||'—'
 const studentName=id=>{const s=students.find(x=>String(x.id)===String(id));return s?.full_name||'—'}
 const reset=()=>{setEditing(null);setForm({...empty,school_year_id:form.school_year_id,semester_id:form.semester_id,month:String(new Date().getMonth()+1)})}
 const save=async()=>{setSaving(true);setError('');setNotice('');try{if(!form.student_id||!form.school_year_id||!form.semester_id||!form.absence_count)throw new Error('يرجى اختيار الطالب والعام والفصل وإدخال عدد أيام الغياب.');const payload={student_id:form.student_id,school_year_id:form.school_year_id,semester_id:form.semester_id,month:Number(form.month),absence_count:Number(form.absence_count),reason:form.reason.trim(),notes:form.notes.trim()};if(editing)await updateRecord('absence_records',editing,payload);else await createOwnedRecord('absence_records',payload,{school:false});await load();reset();setNotice('تم حفظ سجل الغياب بنجاح.')}catch(e){setError(e.message||'تعذر حفظ سجل الغياب.')}finally{setSaving(false)}}
 const edit=r=>{setEditing(r.id);setForm({student_id:r.student_id||'',school_year_id:r.school_year_id||'',semester_id:r.semester_id||'',month:String(r.month||''),absence_count:String(r.absence_count||''),reason:r.reason||'',notes:r.notes||''});window.scrollTo({top:0,behavior:'smooth'})}
 const repeatedStudents=useMemo(()=>{
  // احصر النتائج في طلاب المدرسة الحالية، والعام والفصل المحددين فقط.
  // absence_count هو عدد أيام الغياب المسجل في كل سجل؛ نجمعه للطالب خلال الفصل.
  const schoolStudentIds=new Set(students.map(s=>String(s.id)))
  const map=new Map()
  records.forEach(r=>{
   if(String(r.school_year_id)!==String(form.school_year_id)||String(r.semester_id)!==String(form.semester_id))return
   const key=String(r.student_id||'')
   if(!key||!schoolStudentIds.has(key))return
   const x=map.get(key)||{student_id:key,total:0,reasons:[],notes:[]}
   x.total+=Number(r.absence_count)||0
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
 },[records,students,form.school_year_id,form.semester_id])
 const print=()=>window.print()
 return <Page title="الغياب" sub="تسجيل غياب الطلبة ومتابعة حالات الغياب المتكرر">
  <style>{`
   .absence-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
   .absence-actions{display:flex;gap:9px;flex-wrap:wrap;margin-top:18px}
   .absence-history{width:100%;border-collapse:collapse;min-width:720px;table-layout:fixed}
   .absence-history th,.absence-history td{padding:9px 7px;border-bottom:1px solid #e6eaf0;text-align:right;vertical-align:middle;line-height:1.45;overflow-wrap:anywhere;font-size:13px}
   .absence-history th{background:#f5f7fa;color:#174f4c;font-weight:800}
   .absence-history th:nth-child(1){width:18%}.absence-history th:nth-child(2){width:11%}.absence-history th:nth-child(3){width:11%}.absence-history th:nth-child(4){width:12%}.absence-history th:nth-child(5){width:10%}.absence-history th:nth-child(6){width:18%}.absence-history th:nth-child(7){width:20%}
   .absence-history .row-actions{display:flex;gap:6px;align-items:center;flex-wrap:nowrap}
   .absence-history .row-actions button{padding:8px 13px!important;min-height:40px!important;font-size:13px!important;white-space:nowrap}
   .absence-history .row-actions .view-record-btn{display:inline-flex!important;align-items:center;justify-content:center;gap:8px;padding:10px 18px!important;min-height:46px!important;font-size:15px!important;font-weight:800!important;border-radius:12px!important}
   .absence-history .row-actions .view-record-btn{background:#086b68!important;color:#fff!important;border:1px solid #086b68!important}
   .absence-history .row-actions .view-record-btn svg{color:#fff!important}
   .absence-history .row-actions .edit-record-btn{padding:11px 19px!important;min-height:48px!important;font-size:16px!important;font-weight:800!important;border-radius:12px!important}
   .official-report-btn{color:#174f4c!important;font-weight:800!important}
   .official-report-btn svg{color:#174f4c!important}

   .absence-report{background:#fff;color:#111;max-width:1000px;margin:auto;padding:26px;direction:rtl}
   .absence-report h2{text-align:center;margin:25px 0 12px;font-size:22px}
   .absence-report p{text-align:center;margin:7px 0}
   .absence-report table{width:100%;border-collapse:collapse;margin-top:18px;table-layout:fixed}
   .absence-report th,.absence-report td{border:1px solid #333;padding:9px 6px;text-align:center;overflow-wrap:anywhere;line-height:1.55}
   .absence-report th{background:#f0e5c9}
   .absence-line{display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap;margin:18px 0}
   .absence-sign{margin:55px 20px 20px auto;width:max-content;font-weight:bold}
   .absence-modal{position:fixed;inset:0;background:#0009;z-index:9999;overflow:auto;padding:18px}
   .absence-modal-inner{background:#f3f5f8;max-width:1100px;margin:20px auto;border-radius:14px;padding:14px}
   .absence-modal.individual-modal,.absence-modal.report-modal{background:#eee5d3}
   .individual-modal .absence-modal-inner,.report-modal .absence-modal-inner{background:#eee5d3;max-width:900px;width:calc(100% - 8px);margin:12px auto;padding:14px;border-radius:22px}
   .individual-modal .absence-modal-bar,.report-modal .absence-modal-bar{display:flex;flex-direction:row;justify-content:space-between;align-items:center;gap:14px;padding:8px 6px 16px}
   .individual-modal .absence-modal-bar>strong,.report-modal .absence-modal-bar>strong,.absence-modal-heading{font-size:20px;color:#174f4c;text-align:right}
   .individual-modal .absence-modal-bar .absence-actions,.report-modal .absence-modal-bar .absence-actions{display:flex;flex-direction:row;flex-wrap:nowrap;gap:10px;margin:0}
   .individual-modal .absence-paper,.report-modal .absence-paper{background:#fff;border:1px solid #333;padding:28px 24px;min-height:0;box-shadow:0 12px 28px #00000012;max-width:100%;margin:auto}
   .individual-modal .absence-report,.report-modal .absence-report{max-width:none;padding:0!important;font-family:Arial,sans-serif}
   /* Both absence previews share the approved compact official-form design. */
   .individual-modal .absence-report h2,.report-modal .absence-report h2{text-align:center;color:#174f4c;font-size:17px;font-weight:800;margin:13px 0 7px;line-height:1.5}
   .individual-modal .absence-report .individual-meta,.report-modal .absence-report .individual-meta{text-align:center;font-size:10px;color:#555;margin:5px 0 8px;line-height:1.7}
   .individual-modal .absence-report .individual-school,.report-modal .absence-report .individual-school{text-align:center;font-size:9px;color:#444;margin:5px 0 13px;line-height:1.7}
   .individual-modal .absence-report .absence-line,.report-modal .absence-report .absence-line{display:flex;justify-content:center;align-items:center;gap:5px 18px;flex-wrap:wrap;text-align:center;font-size:10px;color:#555;line-height:1.7;margin:5px 0 8px}
   .individual-modal .absence-report table,.report-modal .absence-report table{margin-top:12px;font-size:9px;table-layout:fixed}
   .individual-modal .absence-report th,.individual-modal .absence-report td,.report-modal .absence-report th,.report-modal .absence-report td{padding:6px 4px;line-height:1.5;overflow-wrap:anywhere;vertical-align:middle}
   /* Keep the absence-days column slightly smaller so its value fits neatly. */
   .individual-modal .absence-report th:nth-child(6),.individual-modal .absence-report td:nth-child(6){font-size:8px!important}
   .individual-modal .absence-report th,.report-modal .absence-report th{background:#f3e4bd!important;color:#174f4c;font-weight:800}
   .individual-modal .absence-report .individual-sign,.report-modal .absence-report .individual-sign{margin:25px auto 0 0!important;text-align:left!important;font-size:10px;line-height:1.9;font-weight:500;width:max-content;max-width:100%}
   .individual-modal .absence-report .individual-sign strong,.report-modal .absence-report .individual-sign strong{font-weight:700}
   .report-modal .absence-report p{font-size:10px;line-height:1.8;margin:12px 0;color:#333}
   .report-modal .absence-report .absence-sign{font-size:10px;line-height:1.9;margin:28px 0 0 auto;width:max-content;max-width:100%;font-weight:700}
   .absence-modal-bar{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;padding:8px 6px 16px}
   .absence-paper{background:white;padding:22px;overflow:auto}
   .absence-paper .absence-report{padding:0}
   .absence-muted{color:#667085;font-size:13px}
   @media(max-width:650px){
    .absence-grid{grid-template-columns:1fr}
    /* حافظ على كل بيانات السجل في صف أفقي واحد على الهاتف مع تمرير أفقي عند الحاجة */
    .absence-history{display:table;min-width:760px;width:100%;table-layout:fixed;border-collapse:collapse}
    .absence-history thead{display:table-header-group}
    .absence-history tbody{display:table-row-group}
    .absence-history tr{display:table-row;background:#fff;box-shadow:none;border:0;padding:0}
    .absence-history th,.absence-history td{display:table-cell;padding:9px 7px;font-size:12px;white-space:nowrap;vertical-align:middle}
    .absence-history td:before{content:none}
    .absence-history .row-actions{display:flex;flex-direction:row;align-items:center;gap:8px}
    .absence-history .row-actions button{padding:7px 10px!important;min-height:38px!important;font-size:12px!important}
    .absence-history .row-actions .view-record-btn{padding:9px 15px!important;min-height:44px!important;font-size:14px!important}
    .absence-modal{padding:5px}
    .individual-modal .absence-modal-inner,.report-modal .absence-modal-inner{padding:9px;width:100%;margin:5px auto}
    .individual-modal .absence-modal-bar,.report-modal .absence-modal-bar{align-items:flex-start;flex-direction:column;padding:7px 5px 12px}
    .individual-modal .absence-modal-bar .absence-actions,.report-modal .absence-modal-bar .absence-actions{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));width:100%;gap:7px}
    .individual-modal .absence-modal-bar .absence-actions button,.report-modal .absence-modal-bar .absence-actions button{padding:9px 5px!important;font-size:12px!important;white-space:nowrap}
    .individual-modal .absence-paper,.report-modal .absence-paper{padding:18px 12px;min-height:0}
    .individual-modal .absence-report h2,.report-modal .absence-report h2{font-size:15px;margin:10px 0 5px}
    .individual-modal .absence-report .individual-meta,.report-modal .absence-report .individual-meta{font-size:9px;margin:4px 0 6px}
    .individual-modal .absence-report .individual-school,.report-modal .absence-report .individual-school{font-size:8px;margin:4px 0 10px}
    .individual-modal .absence-report .absence-line,.report-modal .absence-report .absence-line{font-size:9px;gap:3px 12px;margin:4px 0 6px}
    .individual-modal .absence-report table,.report-modal .absence-report table{font-size:8px;margin-top:9px}
    .individual-modal .absence-report th,.individual-modal .absence-report td,.report-modal .absence-report th,.report-modal .absence-report td{padding:5px 2px;line-height:1.45}
    .individual-modal .absence-report .individual-sign,.report-modal .absence-report .individual-sign,.report-modal .absence-report .absence-sign{font-size:9px;margin-top:18px}
    .report-modal .absence-report p{font-size:9px;margin:9px 0}
   }
   @media print{body *{visibility:hidden!important}.absence-modal,.absence-modal *{visibility:visible!important}.absence-modal{position:absolute;inset:0;background:white;padding:0;overflow:visible}.absence-modal-inner{max-width:none;margin:0;padding:0;background:white}.absence-modal-bar{display:none!important}.absence-paper{padding:0;overflow:visible}.absence-report{max-width:none;padding:12mm!important}.absence-report table{break-inside:auto}.absence-report tr{break-inside:avoid}@page{size:A4;margin:10mm}}



   /* تنسيق الأزرار ورأس جدول سجل الغياب */
   .absence-actions .official-report-btn{
     display:inline-flex!important;align-items:center!important;justify-content:center!important;
     gap:8px!important;min-height:52px!important;padding:13px 20px!important;
     border-radius:14px!important;border:1px solid #086b68!important;
     background:#086b68!important;color:#fff!important;
     font-family:inherit!important;font-size:16px!important;font-weight:700!important;
     line-height:1.35!important;box-shadow:0 8px 18px #086b6820!important;
   }
   .absence-actions .official-report-btn svg{color:#fff!important}
   .absence-history{min-width:920px!important}
   .absence-history thead th{
     background:#f3e4bd!important;color:#075e5a!important;
     font-family:inherit!important;font-weight:700!important;
   }
   .absence-history .row-actions{
     display:flex!important;flex-direction:row!important;align-items:center!important;
     justify-content:center!important;gap:8px!important;flex-wrap:nowrap!important;
     white-space:nowrap!important;
   }
   .absence-history .row-actions .edit-record-btn,
   .absence-history .row-actions .view-record-btn{
     display:inline-flex!important;flex:0 0 auto!important;align-items:center!important;
     justify-content:center!important;gap:7px!important;min-height:50px!important;
     padding:12px 16px!important;border-radius:14px!important;
     border:1px solid #086b68!important;background:#086b68!important;color:#fff!important;
     font-family:inherit!important;font-size:16px!important;font-weight:700!important;
     line-height:1.35!important;white-space:nowrap!important;text-align:center!important;
     box-shadow:0 8px 18px #086b6820!important;max-width:none!important;
   }
   .absence-history .row-actions .view-record-btn svg{color:#fff!important;flex:0 0 auto!important}
   .absence-history .row-actions .edit-record-btn:hover,
   .absence-history .row-actions .view-record-btn:hover,
   .absence-actions .official-report-btn:hover{background:#075a57!important;color:#fff!important}
   @media(max-width:700px){
     .absence-actions .official-report-btn{min-height:48px!important;padding:11px 14px!important;font-size:16px!important}
     .absence-history{min-width:920px!important}
     .absence-history .row-actions{gap:7px!important;flex-wrap:nowrap!important}
     .absence-history .row-actions .edit-record-btn,
     .absence-history .row-actions .view-record-btn{min-height:46px!important;padding:10px 12px!important;font-size:16px!important}
   }

   /* تصغير خط أزرار العرض والتعديل لمطابقة الحجم المرئي لزر «جديد» */
   .absence-actions .official-report-btn,
   .absence-history .row-actions .edit-record-btn,
   .absence-history .row-actions .view-record-btn{
     font-size:12px!important;
     font-weight:700!important;
     line-height:1.35!important;
   }
   @media(max-width:700px){
     .absence-actions .official-report-btn,
     .absence-history .row-actions .edit-record-btn,
     .absence-history .row-actions .view-record-btn{
       font-size:12px!important;
     }
   }

   /* تنسيق ترويسة الجدول والتوقيعات في النموذج الرسمي */
   .report-modal .absence-report th{background:#f3e4bd!important;color:#174f4c!important}
   .report-modal .absence-report .absence-sign{
     display:flex!important;flex-direction:row!important;justify-content:space-between!important;
     align-items:flex-start!important;gap:24px!important;width:100%!important;max-width:100%!important;
     margin:28px 0 0!important;direction:rtl!important;text-align:left!important;
     font-size:10px!important;line-height:1.9!important;
   }
   .report-modal .absence-report .absence-sign-block{
     flex:1 1 0!important;min-width:0!important;text-align:left!important;
     direction:rtl!important;font-weight:700!important;
   }
   .report-modal .absence-report .absence-sign-block strong{display:inline-block!important;font-weight:800!important}
   .report-modal .absence-report .absence-sign-block:first-child{order:2!important}
   @media(max-width:650px){
     .report-modal .absence-report .absence-sign{gap:12px!important;font-size:9px!important}
     .report-modal .absence-report .absence-sign-block{flex:1 1 0!important}
   }
  `}</style>
  <Card>
   <div className="section-title"><div><h2>{editing?'تعديل سجل الغياب':'إضافة سجل غياب'}</h2><span>أدخل بيانات الغياب ليتم حفظها في سجل المدرسة.</span></div>{editing&&<Button variant="secondary" onClick={reset}>إلغاء التعديل</Button>}</div>
   <div className="absence-grid">
    <label style={labelStyle}>الطالب<div style={{position:'relative'}}><input value={studentSearch||selectedStudent?.full_name||''} onChange={e=>{setStudentSearch(e.target.value);set('student_id','')}} placeholder="اكتب جزءاً من اسم الطالب..." autoComplete="off" style={fieldStyle}/>{studentSearch.trim()&&!selectedStudent&&<div style={{position:'absolute',top:'calc(100% + 4px)',right:0,left:0,zIndex:50,maxHeight:220,overflowY:'auto',background:'#fff',border:'1px solid #d8dee8',borderRadius:10,boxShadow:'0 8px 24px rgba(0,0,0,.12)'}}>{students.filter(s=>String(s.full_name||'').toLowerCase().includes(studentSearch.trim().toLowerCase())).slice(0,30).map(s=><button type="button" key={s.id} onClick={()=>{set('student_id',s.id);setStudentSearch(s.full_name)}} style={{display:'block',width:'100%',padding:12,border:0,borderBottom:'1px solid #eee',background:'#fff',textAlign:'right',font:'inherit',color:'#172033'}}>{s.full_name}</button>)}{!students.some(s=>String(s.full_name||'').toLowerCase().includes(studentSearch.trim().toLowerCase()))&&<div style={{padding:12,color:'#777'}}>لا توجد أسماء مطابقة</div>}</div>}</div></label>
    <label style={labelStyle}>العام الدراسي<Select value={form.school_year_id} onChange={e=>set('school_year_id',e.target.value)}><option value="">اختر العام الدراسي</option>{academic.years.map(y=><option key={y.id} value={y.id}>{y.name}</option>)}</Select></label>
    <label style={labelStyle}>الفصل الدراسي<Select value={form.semester_id} onChange={e=>set('semester_id',e.target.value)}><option value="">اختر الفصل</option>{academic.semesters.filter(x=>!x.school_year_id||String(x.school_year_id)===String(form.school_year_id)).map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</Select></label>
    <label style={labelStyle}>الشهر<Select value={form.month} onChange={e=>set('month',e.target.value)}>{months.map((m,i)=><option key={i+1} value={i+1}>{m}</option>)}</Select></label>
    <label style={labelStyle}>عدد أيام الغياب<Input type="number" min="1" value={form.absence_count} onChange={e=>set('absence_count',e.target.value)} placeholder="عدد الأيام"/></label>
    <label style={labelStyle}>سبب الغياب<Input value={form.reason} onChange={e=>set('reason',e.target.value)} placeholder="سبب الغياب"/></label>
    <label style={{...labelStyle,gridColumn:'1/-1'}}>الإجراءات والملاحظات الإضافية<Textarea rows="3" value={form.notes} onChange={e=>set('notes',e.target.value)} placeholder="الإجراءات المتخذة أو ملاحظات المتابعة"/></label>
   </div>
   <div className="absence-actions"><Button loading={saving} onClick={save}>{editing?'حفظ التعديلات':'حفظ سجل الغياب'}</Button><Button className="official-report-btn" variant="secondary" onClick={()=>setShowRepeated(true)}><Eye size={19} strokeWidth={2.5}/> عرض النموذج الرسمي للرصد</Button><Button variant="secondary" onClick={reset}>جديد</Button></div>
  </Card>
  {error&&<ErrorNotice>{error}</ErrorNotice>}{notice&&<div className="notice success">{notice}</div>}
  <Card><div className="section-title"><div><h2>سجل الغياب المحفوظ</h2><span>{records.length} سجل</span></div><Button variant="secondary" onClick={load}>تحديث</Button></div>{loading?<div className="loading">جارٍ تحميل السجلات…</div>:records.length===0?<Empty title="لا توجد سجلات غياب"/>:<div style={{overflowX:'auto'}}><table className="absence-history"><thead><tr><th>الطالب</th><th>العام</th><th>الفصل</th><th>الشهر</th><th>أيام الغياب</th><th>السبب</th><th>الإجراءات</th></tr></thead><tbody>{records.map(r=><tr key={r.id}><td data-label="الطالب">{studentName(r.student_id)}</td><td data-label="العام الدراسي">{yearName(r.school_year_id)}</td><td data-label="الفصل">{semesterName(r.semester_id)}</td><td data-label="الشهر">{months[(Number(r.month)||1)-1]||'—'}</td><td data-label="أيام الغياب">{r.absence_count||0}</td><td data-label="سبب الغياب">{r.reason||'—'}</td><td data-label="الإجراءات"><div className="row-actions"><Button className="edit-record-btn" variant="secondary" onClick={()=>edit(r)}>تعديل</Button><Button className="view-record-btn" onClick={()=>setViewRecord(r)} aria-label={`عرض النموذج الرسمي لغياب ${studentName(r.student_id)}`}><Eye size={20} strokeWidth={2.5}/> عرض النموذج الرسمي للغياب</Button></div></td></tr>)}</tbody></table></div>}</Card>
  {viewRecord&&<div className="absence-modal individual-modal"><div className="absence-modal-inner"><div className="absence-modal-bar"><div><strong>نموذج متابعة غياب الطالب</strong><div className="absence-muted">المعاينة الرسمية لسجل الغياب المحدد</div></div><div className="absence-actions" style={{margin:0}}><Button variant="secondary" onClick={()=>setViewRecord(null)}>إغلاق</Button><Button onClick={print}>طباعة / PDF</Button></div></div><div className="absence-paper"><div className="absence-report"><OfficialDocumentHeader profile={profile}/><h2>نموذج متابعة غياب الطالب</h2><div className="individual-meta">العام الدراسي: {yearName(viewRecord.school_year_id)} — الفصل الدراسي: {semesterName(viewRecord.semester_id)}</div><table><thead><tr><th style={{width:'7%'}}>الرقم</th><th style={{width:'17%'}}>اسم الطالب</th><th style={{width:'17%'}}>الصف والشعبة</th><th style={{width:'12%'}}>الشهر</th><th style={{width:'19%'}}>وصف سبب الغياب</th><th style={{width:'11%'}}>ايام الغياب</th><th style={{width:'17%'}}>الإجراءات</th></tr></thead><tbody><tr><td>1</td><td>{studentName(viewRecord.student_id)}</td><td>{students.find(st=>String(st.id)===String(viewRecord.student_id))?.grades?.name||'—'} / {students.find(st=>String(st.id)===String(viewRecord.student_id))?.sections?.name||'—'}</td><td>{months[(Number(viewRecord.month)||1)-1]||'—'}</td><td>{viewRecord.reason||'—'}</td><td>{viewRecord.absence_count||'—'}</td><td>{viewRecord.notes||'—'}</td></tr></tbody></table><div className="individual-sign"><strong>المرشد/ة التربوي/ة</strong><br/>{profile?.full_name||'........................'}</div></div></div></div></div>}
  {showRepeated&&<div className="absence-modal report-modal"><div className="absence-modal-inner"><div className="absence-modal-bar"><div><strong>نموذج رصد غياب الطلاب</strong><div className="absence-muted">يعرض جميع طلاب المدرسة الذين تجاوز مجموع أيام غيابهم 3 أيام في العام والفصل المحددين</div></div><div className="absence-actions" style={{margin:0}}><Button variant="secondary" onClick={()=>setShowRepeated(false)}>إغلاق</Button><Button onClick={()=>setShowRepeated(false)}>حفظ</Button><Button onClick={print}>طباعة / PDF</Button></div></div><div className="absence-paper"><div className="absence-report"><OfficialDocumentHeader profile={profile}/><h2>نموذج رصد غياب الطلاب</h2><div className="individual-meta">العام الدراسي: {yearName(form.school_year_id)} — الفصل الدراسي: {semesterName(form.semester_id)}</div><table><thead><tr><th>الرقم</th><th>الطالب</th><th>الصف</th><th>الشعبة</th><th>أيام الغياب</th><th>سبب الغياب</th><th>الملاحظات</th></tr></thead><tbody>{repeatedStudents.length?repeatedStudents.map(x=><tr key={x.student_id}><td>{x.number}</td><td>{x.name}</td><td>{x.grade}</td><td>{x.section}</td><td>{x.total}</td><td>{x.reasons.join('؛ ')||'—'}</td><td>{x.notes.join('؛ ')||'—'}</td></tr>):<tr><td colSpan="7">لا يوجد طلاب تجاوز مجموع أيام غيابهم ثلاثة أيام في الفصل المحدد.</td></tr>}</tbody></table><p style={{textAlign:'right',marginTop:24}}>ملاحظة: يتضمن النموذج الطلاب الذين يزيد مجموع أيام غيابهم المسجلة عن ثلاثة أيام خلال الفصل المحدد.</p><div className="absence-sign"><div className="absence-sign-block"><strong>توقيع المرشد/ة التربوي/ة</strong><br/><br/>{profile?.full_name||'........................'}</div><div className="absence-sign-block"><strong>توقيع المدير/ة</strong><br/><br/>{profile?.manager_name||'........................'}</div></div></div></div></div></div>}
 </Page>
}
