import React,{useCallback,useEffect,useState} from 'react'
import { Check, X, RefreshCw, Bell, School, UserRound, CalendarDays } from 'lucide-react'
import { currentProfile, listIncomingStudentTransferRequests, listSchoolGrades, listSectionsBySchool, decideStudentTransferRequest } from '../services/data'

export default function TransferRequests(){
 const [profile,setProfile]=useState(null),[rows,setRows]=useState([]),[loading,setLoading]=useState(true),[error,setError]=useState(''),[notice,setNotice]=useState('')
 const [selected,setSelected]=useState(null),[grades,setGrades]=useState([]),[sections,setSections]=useState([]),[gradeId,setGradeId]=useState(''),[sectionId,setSectionId]=useState(''),[saving,setSaving]=useState(false),[rejectTarget,setRejectTarget]=useState(null),[resultDialog,setResultDialog]=useState(null)
 const load=useCallback(async()=>{setLoading(true);setError('');try{const p=await currentProfile();setProfile(p);const r=await listIncomingStudentTransferRequests();setRows(r)}catch(e){setError(e.message||'تعذر تحميل طلبات النقل')}finally{setLoading(false)}},[])
 useEffect(()=>{load()},[load])
 useEffect(()=>{if(!selected||!profile?.school_id)return;setGrades([]);setSections([]);setGradeId('');setSectionId('');listSchoolGrades(profile.school_id).then(setGrades).catch(e=>setError(e.message||'تعذر تحميل الصفوف'))},[selected,profile?.school_id])
 useEffect(()=>{if(!gradeId||!profile?.school_id){setSections([]);setSectionId('');return}listSectionsBySchool(profile.school_id).then(xs=>setSections(xs.filter(x=>x.grade_id===gradeId))).catch(e=>setError(e.message||'تعذر تحميل الشعب'));setSectionId('')},[gradeId,profile?.school_id])
 const accept=async()=>{if(!selected||!gradeId||!sectionId)return;setSaving(true);setError('');setNotice('');try{await decideStudentTransferRequest({requestId:selected.id,decision:'accepted',gradeId,sectionId});setNotice('تم قبول طلب النقل وتحديث بيانات الطالب وإنشاء ملف متابعة جديد.');setSelected(null);await load()}catch(e){setError(e.message||'تعذر قبول الطلب')}finally{setSaving(false)}}
 const reject=async()=>{if(!rejectTarget)return;setSaving(true);setError('');setNotice('');try{await decideStudentTransferRequest({requestId:rejectTarget.id,decision:'rejected',note:'تم رفض طلب النقل'});setRejectTarget(null);setResultDialog({title:'تم رفض طلب النقل',message:'بقي الطالب في مدرسته الأصلية دون تغيير بياناته.'});await load()}catch(e){setError(e.message||'تعذر رفض الطلب');setRejectTarget(null)}finally{setSaving(false)}}
 const pending=rows.filter(r=>r.status==='pending')
 return <div className="page-container transfer-requests-page" dir="rtl">
  <div className="page-header"><div><span className="eyebrow"><Bell size={16}/> إشعارات المدرسة</span><h1>طلبات نقل الطلاب الواردة</h1><p>الطلبات المرسلة إلى {profile?.schools?.name||'مدرستك'} لمراجعتها واتخاذ القرار</p></div><button className="btn btn-secondary" onClick={load}><RefreshCw size={17}/> تحديث</button></div>
  <div className="transfer-request-summary"><strong>{pending.length}</strong><span>طلب بانتظار المراجعة</span></div>
  {error&&<div className="alert alert-error">{error}</div>}{notice&&<div className="alert alert-success">{notice}</div>}
  {loading?<div className="empty-state">جارٍ تحميل الطلبات...</div>:pending.length===0?<div className="empty-state"><Bell size={32}/><strong>لا توجد طلبات نقل واردة</strong><span>ستظهر هنا الطلبات الجديدة فور إرسالها إلى مدرستك.</span></div>:
   <div className="transfer-request-list">{pending.map(r=><article className="transfer-request-card" key={r.id}>
    <div className="transfer-request-top"><div><span className="request-number">طلب نقل</span><h3>{r.students?.full_name||'طالب غير معروف'}</h3><p>رقم الطالب: {r.students?.student_code||'—'} · الهوية: {r.students?.national_id||'—'}</p></div><span className={'request-status '+(r.status==='pending'?'pending':r.status==='accepted'?'accepted':'rejected')}>{r.status==='pending'?'بانتظار المراجعة':r.status==='accepted'?'مقبول':'مرفوض'}</span></div>
    <div className="transfer-request-details"><div><School size={16}/><span>المديرية</span><strong>{r.from_school?.directorates?.name||r.from_school?.directorate?.name||'—'}</strong><span>المدرسة المنقول منها</span><strong>{r.from_school?.name||'—'}</strong></div><div><UserRound size={16}/><span>الصف والشعبة الحاليان</span><strong>{r.students?.grades?.name||'—'} / {r.students?.sections?.name||'—'}</strong></div><div><CalendarDays size={16}/><span>تاريخ الطلب</span><strong>{r.created_at?new Date(r.created_at).toLocaleDateString('en-GB'):'—'}</strong></div></div>
    {r.status==='pending'&&<div className="transfer-request-actions"><button className="btn btn-success" disabled={saving} onClick={()=>setSelected(r)}><Check size={17}/> قبول وتحديد الصف والشعبة</button><button className="btn btn-danger" disabled={saving} onClick={()=>setRejectTarget(r)}><X size={17}/> رفض الطلب</button></div>}
   </article>)}</div>}
  {selected&&<div className="transfer-modal-backdrop" role="dialog" aria-modal="true"><div className="transfer-modal"><div className="transfer-modal-head"><h2>قبول طلب نقل الطالب</h2><button className="icon-close" onClick={()=>setSelected(null)}><X/></button></div><p>الطالب: <strong>{selected.students?.full_name}</strong></p><p>المدرسة الأصلية: <strong>{selected.from_school?.name||'—'}</strong></p><label>الصف في المدرسة المستقبِلة<select value={gradeId} onChange={e=>setGradeId(e.target.value)}><option value="">اختر الصف</option>{grades.map(g=><option key={g.id} value={g.id}>{g.name}</option>)}</select></label><label>الشعبة في المدرسة المستقبِلة<select value={sectionId} onChange={e=>setSectionId(e.target.value)} disabled={!gradeId}><option value="">اختر الشعبة</option>{sections.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label><div className="transfer-modal-actions"><button className="btn btn-success" disabled={!gradeId||!sectionId||saving} onClick={accept}>{saving?'جارٍ القبول...':'تأكيد القبول'}</button><button className="btn btn-secondary" onClick={()=>setSelected(null)}>إلغاء</button></div></div></div>}

  {rejectTarget&&<div className="transfer-modal-backdrop transfer-confirm-backdrop" role="dialog" aria-modal="true">
   <div className="transfer-modal transfer-confirm-modal">
    <div className="transfer-modal-head"><h2>تأكيد رفض طلب النقل</h2><button className="icon-close" disabled={saving} onClick={()=>setRejectTarget(null)}><X/></button></div>
    <p>هل تريد رفض طلب نقل الطالب <strong>{rejectTarget.students?.full_name||'—'}</strong>؟</p>
    <p>سيبقى الطالب في مدرسته الحالية دون تغيير بياناته أو ملفه.</p>
    <div className="transfer-modal-actions">
     <button className="btn btn-danger" disabled={saving} onClick={reject}>{saving?'جارٍ حفظ القرار...':'تأكيد الرفض'}</button>
     <button className="btn btn-secondary" disabled={saving} onClick={()=>setRejectTarget(null)}>إلغاء</button>
    </div>
   </div>
  </div>}
  {resultDialog&&<div className="transfer-modal-backdrop transfer-confirm-backdrop" role="dialog" aria-modal="true">
   <div className="transfer-modal transfer-result-modal">
    <h2>{resultDialog.title}</h2><p>{resultDialog.message}</p>
    <button className="btn btn-success" onClick={()=>setResultDialog(null)}>حسنًا</button>
   </div>
  </div>}

 </div>
}
