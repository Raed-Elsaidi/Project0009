import React,{useEffect,useMemo,useState}from'react'
import{Link}from'react-router-dom'
import{FileText,ChevronLeft}from'lucide-react'
import{Page,Card,ErrorNotice}from'../components/UI'
import{currentProfile,listActiveAcademicData,listSchoolsByDirectorate,listCounselorRegistry}from'../services/data'

// The central list mirrors the official-form routes already defined in OfficialForms.jsx.
const formGroups=[
 {title:'ملف المقابلات',items:[['meeting-followup','نموذج متابعة المقابلات'],['meeting-summary','نموذج رصد المقابلات']]},
 {title:'ملف شؤون الطلبة',items:[['case-study','نموذج دراسة حالة'],['hot-cases-monitor','نموذج رصد الحالات الساخنة'],['hot-case-notice','نموذج إعلام عن ملف ساخن'],['student-issues-monitor','نموذج رصد المشكلات وقضايا الطلبة داخل وخارج المدرسة']]},
 {title:'ملف الاستشارات',items:[['student-consultations','نموذج المقابلات والاستشارات الطلابية'],['consultations-monitor','نموذج رصد الاستشارات والمقابلات الطلابية'],['health-cases','نموذج رصد الحالات الصحية']]},
 {title:'ملف الغياب والتأخر والتسرب',items:[['repeated-absence','نموذج رصد حالات الغياب المتكرر'],['absence-followup','نموذج متابعة غياب الطالب'],['repeated-lateness','نموذج رصد التأخر الصباحي المتكرر'],['lateness-followup','نموذج متابعة التأخر الصباحي المتكرر'],['dropout-monitor','نموذج رصد حالات التسرب'],['dropout-followup','نموذج متابعة التسرب']]},
 {title:'الحالات الساخنة',items:[['hot-cases-school','نموذج رصد الحالات الساخنة الفصلي – المدرسة'],['hot-cases-directorate','نموذج رصد الحالات الساخنة الفصلي – المديرية']]},
 {title:'ملف الأنشطة',items:[['activities-monitor','نموذج رصد الأنشطة'],['visits','نموذج الزيارات'],['newsletters','نموذج النشرات الإرشادية'],['morning-radio','نموذج الإذاعة الصباحية'],['seminars-workshops','نموذج الندوات والمحاضرات وورش العمل'],['wall-magazine','نموذج مجلة الحائط'],['posters','نموذج الملصقات الإرشادية']]},
 {title:'ملف الإرشاد الجماعي',items:[['group-session-summary','نموذج تلخيص الجلسات الجماعية'],['group-session-details','نموذج ملخص جلسات الإرشاد الجماعي للمجموعة'],['group-counseling-plan','نموذج الإرشاد الجماعي'],['group-sessions-monitor','نموذج رصد عدد جلسات الإرشاد الجماعي']]},
 {title:'ملف التوجيه الجمعي',items:[['guidance-meetings-followup','نموذج متابعة لقاءات التوجيه الجمعي'],['guidance-meetings-monitor','نموذج رصد لقاءات التوجيه الجمعي']]},
 {title:'ملف التوجيه المهني',items:[['career-guidance-followup','نموذج متابعة لقاءات التوجيه المهني'],['career-guidance-monitor','نموذج رصد لقاءات التوجيه المهني']]},
 {title:'الملف الإداري',items:[['weekly-program-form','نموذج البرنامج اليومي/الأسبوعي لعمل المرشد التربوي'],['annual-plan','نموذج الخطة السنوية المعتمدة'],['plan','نموذج الخطة'],['semester-report','التقرير الفصلي حول إنجازات العمل في الخطة']]},
 {title:'ملف البرلمان',items:[['parliament-plan','خطة البرلمان'],['parliament-members','أسماء أعضاء البرلمان'],['parliament-team-meetings','اجتماعات فريق البرلمان'],['parliament-achievements','إنجازات البرلمان']]},
 {title:'ملف الاجتماعات',items:[['meeting-principal','نموذج اجتماعات مدير/ة المدرسة'],['meeting-teacher','نموذج اجتماعات المعلمين'],['meeting-parents','نموذج اجتماعات أولياء الأمور']]}
]

export default function CounselorWorkFollowup(){
 const[profile,setProfile]=useState(null),[academic,setAcademic]=useState({years:[]}),[schools,setSchools]=useState([]),[counselors,setCounselors]=useState([]),[schoolId,setSchoolId]=useState(''),[yearId,setYearId]=useState(''),[loading,setLoading]=useState(true),[error,setError]=useState('')
 useEffect(()=>{let alive=true;(async()=>{try{const[p,a,c]=await Promise.all([currentProfile(),listActiveAcademicData(),listCounselorRegistry()]);if(!alive)return;setProfile(p);setAcademic(a||{years:[]});setCounselors(c||[]);const rows=p?.directorate_id?await listSchoolsByDirectorate(p.directorate_id):[];if(!alive)return;setSchools(rows);const initial=p?.school_id&&rows.some(x=>String(x.id)===String(p.school_id))?String(p.school_id):'';setSchoolId(initial);const active=(a?.years||[]).find(y=>y.is_active)||(a?.years||[])[0];setYearId(active?.id||'')}catch(e){if(alive)setError(e.message||'تعذر تحميل بيانات المرشد التربوي.')}finally{if(alive)setLoading(false)}})();return()=>{alive=false}},[])
 const selectedYear=useMemo(()=> (academic.years||[]).find(y=>String(y.id)===String(yearId)),[academic.years,yearId]);
 const yearName=selectedYear?.name||'—';
 const selectedSchool=useMemo(()=>schools.find(x=>String(x.id)===String(schoolId)),[schools,schoolId]);
 const selectedCounselor=useMemo(()=>counselors.find(c=>String(c.school_id)===String(schoolId))||null,[counselors,schoolId]);
 const counselorName=selectedCounselor?.full_name||'غير محدد';
 return <Page title="متابعة عمل المرشد التربوي" sub="نموذج رئيس القسم">
  {error&&<ErrorNotice>{error}</ErrorNotice>}
  <Card>
   <div className="cwf-heading"><h2>متابعة عمل المرشد التربوي</h2><h3>نموذج رئيس القسم</h3></div>
   <div className="cwf-meta">
    <div><span>المديرية</span><strong>{loading?'جارٍ التحميل…':profile?.directorates?.name||'—'}</strong></div>
    <div className="cwf-school-choice"><span>المدرسة</span><select aria-label="اختيار المدرسة" value={schoolId} disabled={loading||!schools.length} onChange={e=>setSchoolId(e.target.value)}><option value="">اختر المدرسة</option>{schools.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
    <div className="cwf-year-choice"><span>السنة الدراسية</span><select aria-label="اختيار السنة الدراسية" value={yearId} disabled={loading||!(academic.years||[]).length} onChange={e=>setYearId(e.target.value)}><option value="">اختر السنة الدراسية</option>{(academic.years||[]).map(y=><option key={y.id} value={y.id}>{y.name}{y.is_active?' (الحالية)':''}</option>)}</select></div>
    <div className="cwf-counselor-card">
     <span>بيانات المرشد التربوي</span>
     <strong>{loading?'جارٍ التحميل…':selectedCounselor?.full_name||'لا يوجد مرشد مسجل لهذه المدرسة'}</strong>
     <small>المسمى الوظيفي: {selectedCounselor?.job_title||'مرشد تربوي'}</small>
     <small>رقم الهاتف: {selectedCounselor?.phone||'—'}</small>
     <small>البريد الإلكتروني: {selectedCounselor?.email||'—'}</small>
    </div>
   </div>
  </Card>
  {formGroups.map(group=><Card key={group.title} className="cwf-group">
   <h3>{group.title}</h3>
   <div className="cwf-buttons">{group.items.map(([id,label])=><Link className="cwf-button" key={id} to={`/official-forms/${id}/official?school_id=${encodeURIComponent(schoolId)}&school_year_id=${encodeURIComponent(yearId)}&counselor_name=${encodeURIComponent(counselorName)}`} aria-disabled={!schoolId} onClick={e=>{if(!schoolId)e.preventDefault()}}><FileText size={17}/><span>{label}</span><ChevronLeft size={16}/></Link>)}</div>
  </Card>)}
  <style>{`
   .cwf-heading{text-align:center;padding:8px 0 18px}.cwf-heading h2{font-size:25px;margin:0 0 8px;color:var(--text,#18324b)}.cwf-heading h3{font-size:19px;margin:0;color:var(--muted,#64748b);font-weight:700}
   .cwf-meta{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.cwf-meta>div{background:var(--surface-soft,#f5f7fa);border:1px solid var(--border,#e2e8f0);border-radius:12px;padding:13px 15px;display:flex;flex-direction:column;gap:6px}.cwf-meta span{font-size:13px;color:var(--muted,#64748b)}.cwf-school-choice select,.cwf-year-choice select{width:100%;min-height:38px;border:1px solid var(--border,#dbe3ec);border-radius:9px;background:var(--surface,#fff);color:var(--text,#18324b);padding:8px 10px;font:inherit}.cwf-meta strong{font-size:15px;color:var(--text,#18324b)}
   .cwf-counselor-card{grid-column:1/-1}.cwf-counselor-card small{font-size:12px;color:var(--muted,#64748b)}.cwf-group h3{font-size:17px;margin:0 0 14px}.cwf-buttons{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.cwf-button{display:flex;align-items:center;gap:10px;min-height:52px;padding:11px 13px;border:1px solid var(--border,#dbe3ec);border-radius:11px;background:var(--surface,#fff);color:var(--text,#18324b);text-decoration:none;font-weight:650;transition:.15s}.cwf-button span{flex:1}.cwf-button[aria-disabled="true"]{opacity:.5;cursor:not-allowed}.cwf-button:hover{border-color:var(--primary,#2875a8);background:var(--surface-soft,#f5f9fc);transform:translateY(-1px)}
   @media(max-width:640px){.cwf-meta,.cwf-buttons{grid-template-columns:1fr}.cwf-heading h2{font-size:21px}}
  `}</style>
 </Page>
}
