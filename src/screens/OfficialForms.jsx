import React,{useEffect,useMemo,useState}from'react'
import{useParams}from'react-router-dom'
import{Page,Card,Button,ErrorNotice}from'../components/UI'
import{Maximize2,Printer,Save,X}from'lucide-react'
import{currentProfile,listActiveAcademicData}from'../services/data'
import MeetingFollowupEntry,{createMeetingRow}from'../components/officialForms/MeetingFollowupEntry'
import MeetingFollowupPreview from'../components/officialForms/MeetingFollowupPreview'
import GenericOfficialForm,{GenericOfficialPreview,FORM_CONFIGS}from'../components/officialForms/GenericOfficialForm'

const forms=[
 ['meeting-followup','نموذج متابعة المقابلات',[1],'ملف المقابلات'],['meeting-summary','نموذج رصد المقابلات',[1],'ملف المقابلات'],['case-study','نموذج دراسة حالة',[2],'ملف شؤون الطلبة'],['hot-cases-monitor','نموذج رصد الحالات الساخنة',[3],'ملف شؤون الطلبة'],['hot-case-notice','نموذج إعلام عن ملف ساخن',[4],'ملف شؤون الطلبة'],['student-issues-monitor','نموذج رصد المشكلات وقضايا الطلبة داخل وخارج المدرسة',[5,6],'ملف شؤون الطلبة'],['student-consultations','نموذج المقابلات والاستشارات الطلابية',[6],'ملف الاستشارات'],['consultations-monitor','نموذج رصد الاستشارات والمقابلات الطلابية',[7],'ملف الاستشارات'],['repeated-absence','نموذج رصد حالات الغياب المتكرر',[8],'ملف الغياب'],['absence-followup','نموذج متابعة غياب الطالب',[9],'ملف الغياب'],['repeated-lateness','نموذج رصد التأخر الصباحي المتكرر',[9,10],'ملف التأخر الصباحي'],['lateness-followup','نموذج متابعة التأخر الصباحي المتكرر',[10],'ملف التأخر الصباحي'],['dropout-monitor','نموذج رصد حالات التسرب',[11,12],'ملف التسرب'],['dropout-followup','نموذج متابعة التسرب',[12],'ملف التسرب'],['hot-cases-school','نموذج رصد الحالات الساخنة الفصلي – المدرسة',[13],'الحالات الساخنة'],['hot-cases-directorate','نموذج رصد الحالات الساخنة الفصلي – المديرية',[14],'الحالات الساخنة'],['activities-monitor','نموذج رصد الأنشطة',[15],'ملف الأنشطة'],['visits','نموذج الزيارات',[15],'ملف الأنشطة'],['newsletters','نموذج النشرات الإرشادية',[16],'ملف الأنشطة'],['morning-radio','نموذج الإذاعة الصباحية',[17],'ملف الأنشطة'],['seminars-workshops','نموذج الندوات والمحاضرات وورش العمل',[18],'ملف الأنشطة'],['wall-magazine','نموذج مجلة الحائط',[19],'ملف الأنشطة'],['group-session-summary','نموذج تلخيص الجلسات الجماعية',[19],'ملف الإرشاد الجماعي'],['group-session-details','نموذج ملخص جلسات الإرشاد الجماعي للمجموعة',[20],'ملف الإرشاد الجماعي'],['group-sessions-monitor','نموذج رصد عدد جلسات الإرشاد الجماعي',[21],'ملف الإرشاد الجماعي'],['guidance-meetings-followup','نموذج متابعة لقاءات التوجيه الجمعي',[22],'ملف التوجيه الجمعي'],['guidance-meetings-monitor','نموذج رصد لقاءات التوجيه الجمعي',[22],'ملف التوجيه الجمعي'],['weekly-program-form','نموذج البرنامج اليومي/الأسبوعي لعمل المرشد/ة التربوي/ة',[23],'الملف الإداري'],['annual-plan','نموذج الخطة السنوية المعتمدة',[24],'الملف الإداري'],['plan','نموذج الخطة',[25],'الملف الإداري'],['semester-report','التقرير الفصلي حول إنجازات العمل في الخطة',[26,27,28],'الملف الإداري']
]
const dayName=d=>{const x=new Date(`${d}T00:00:00`);return Number.isNaN(x.getTime())?'':['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'][x.getDay()]}
const today=new Date().toISOString().slice(0,10)

export default function OfficialForms(){
 const{formId='meeting-followup'}=useParams();const selected=useMemo(()=>forms.find(f=>f[0]===formId)||forms[0],[formId]);const[id,title]=selected
 const[showPreview,setShowPreview]=useState(false),[profile,setProfile]=useState(null),[academic,setAcademic]=useState({years:[],semesters:[]}),[loading,setLoading]=useState(true),[error,setError]=useState('')
 const initial=useMemo(()=>({school_year_id:'',semester_id:'',rows:[createMeetingRow(today,dayName(today))],values:{}}),[]);const[form,setForm]=useState(initial)
 useEffect(()=>{let alive=true;(async()=>{try{const[p,a]=await Promise.all([currentProfile(),listActiveAcademicData()]);if(!alive)return;setProfile(p);setAcademic(a||{years:[],semesters:[]});const y=(a?.years||[]).find(x=>x.is_active)||(a?.years||[])[0];const sem=(a?.semesters||[]).find(s=>s.school_year_id===y?.id&&new Date()>=new Date(s.start_date||'1900-01-01')&&new Date()<=new Date(s.end_date||'2999-12-31'))||(a?.semesters||[]).find(s=>s.school_year_id===y?.id);setForm(v=>({...v,school_year_id:y?.id||'',semester_id:sem?.id||''}))}catch(e){if(alive)setError(e.message||'تعذر تحميل بيانات النظام.')}finally{if(alive)setLoading(false)}})();return()=>{alive=false}},[])
 useEffect(()=>{try{const saved=localStorage.getItem(`official-form-${id}`);if(saved)setForm(JSON.parse(saved))}catch{}},[id])
 const yearName=(academic.years||[]).find(x=>x.id===form.school_year_id)?.name||'—';const semesterName=(academic.semesters||[]).find(x=>x.id===form.semester_id)?.name||'—';const academicView={...academic,yearName,semesterName}
 const save=()=>{try{localStorage.setItem(`official-form-${id}`,JSON.stringify(form));alert('تم حفظ بيانات النموذج.')}catch{}}
 const print=()=>window.print()
 if(loading)return <Page title="النماذج الرسمية" sub="جارٍ تحميل البيانات تلقائيًا..."><Card><div className="loading">جارٍ تحميل بيانات المرشد والسنة الدراسية...</div></Card></Page>
 const isMeeting=id==='meeting-followup', config=FORM_CONFIGS[id]||{fields:['البيانات','الملاحظات'],columns:[]}
 return <Page title={title} sub="أدخل البيانات مرة واحدة، واعرض النموذج الرسمي عند الحاجة.">
  {error&&<ErrorNotice>{error}</ErrorNotice>}
  <div className="official-workspace official-workspace-entry-only"><section className="official-entry-panel">
   {isMeeting?<MeetingFollowupEntry profile={profile} academic={academicView} form={form} onChange={setForm} today={today} onShowPreview={()=>setShowPreview(true)} onSave={save}/>:<GenericOfficialForm config={config} title={title} profile={profile} academic={academicView} form={form} onChange={setForm} onShowPreview={()=>setShowPreview(true)} onSave={save}/>} 
  </section></div>
  <div className="meeting-bottom-note">النموذج الرسمي مخفي افتراضيًا. اضغط «عرض النموذج الرسمي» لمعاينته أو طباعته أو حفظه PDF.</div>
  {showPreview&&<div className="meeting-preview-overlay" role="dialog" aria-modal="true"><div className="meeting-preview-modal"><div className="meeting-preview-toolbar"><div><strong>النموذج الرسمي</strong><span>المعاينة الحية — البيانات محدثة مباشرة من نموذج الإدخال</span></div><div className="meeting-preview-actions"><Button variant="secondary" onClick={()=>document.querySelector('.meeting-preview-modal .official-document')?.requestFullscreen?.()}><Maximize2 size={15}/> عرض كامل</Button><Button variant="secondary" onClick={print}><Printer size={15}/> طباعة / PDF</Button><Button onClick={save}><Save size={15}/> حفظ</Button><Button variant="secondary" onClick={()=>setShowPreview(false)}><X size={15}/> إغلاق</Button></div></div><div className="meeting-paper-wrap">{isMeeting?<MeetingFollowupPreview profile={profile} form={form} academic={academicView}/>:<GenericOfficialPreview title={title} config={config} profile={profile} academic={academicView} form={form}/>}</div></div></div>}
 </Page>
}
