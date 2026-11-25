import React,{useEffect,useMemo,useState}from'react';
import{Eye,Printer,Maximize2,X,Save,Edit,Trash2,Search,Plus}from'lucide-react';
import{Page,Card,Button,Input,Textarea,Select,ErrorNotice}from'../components/UI';
import{currentProfile,listStudents,listActiveAcademicData,listConsultations,createConsultationRecord,updateConsultationRecord,deleteConsultationRecord}from'../services/data';
import GenericOfficialPreview,{FORM_CONFIGS}from'../components/officialForms/GenericOfficialForm';

const TYPES=[
 {value:'EDUCATIONAL',label:'تعليمية'},
 {value:'VOCATIONAL',label:'مهنية'},
 {value:'PSYCHOLOGICAL',label:'نفسية'},
 {value:'OTHER',label:'أخرى'}
];
const emptyForm={student_id:'',school_year_id:'',semester_id:'',consultation_date:new Date().toISOString().slice(0,10),grade_id:'',section_id:'',type:'EDUCATIONAL',topic:'',notes:'',result:''};

export default function Consultations(){
 const[profile,setProfile]=useState(null);
 const[students,setStudents]=useState([]);
 const[academic,setAcademic]=useState({years:[],semesters:[],grades:[]});
 const[records,setRecords]=useState([]);
 const[form,setForm]=useState(emptyForm);
 const[studentSearch,setStudentSearch]=useState('');
 const[editing,setEditing]=useState(null);
 const[loading,setLoading]=useState(true);
 const[saving,setSaving]=useState(false);
 const[error,setError]=useState('');
 const[preview,setPreview]=useState(null);

 const load=async()=>{
  setLoading(true);setError('');
  try{
   const p=await currentProfile();
   if(!p)throw new Error('تعذر تحميل بيانات الحساب.');
   const[a,s,r]=await Promise.all([
    listActiveAcademicData(p.school_id),
    listStudents(p.school_id),
    listConsultations()
   ]);
   setProfile(p);setAcademic(a||{years:[],semesters:[],grades:[]});
   setStudents(s||[]);setRecords(r||[]);
   setForm(v=>({...v,school_year_id:v.school_year_id||a?.years?.find(x=>x.is_active)?.id||a?.years?.[0]?.id||'',semester_id:v.semester_id||a?.semesters?.find(x=>x.is_active)?.id||a?.semesters?.[0]?.id||''}));
  }catch(e){setError(e.message||'تعذر تحميل الاستشارات.');}
  finally{setLoading(false);}
 };
 useEffect(()=>{load();},[]);

 const selectedStudent=students.find(x=>String(x.id)===String(form.student_id));
 const filteredStudents=useMemo(()=>{
  const q=studentSearch.trim().toLocaleLowerCase();
  if(!q)return [];
  return students.filter(x=>String(x.full_name||'').toLocaleLowerCase().includes(q)).slice(0,15);
 },[students,studentSearch]);

 const yearName=(academic.years||[]).find(x=>String(x.id)===String((preview?.record||form).school_year_id))?.name||'—';
 const semesterName=(academic.semesters||[]).find(x=>String(x.id)===String((preview?.record||form).semester_id))?.name||'—';
 const academicView={...academic,yearName,semesterName};

 const makePreview=(record=null)=>{
  const data=record||form;
  const student=students.find(x=>String(x.id)===String(data.student_id));
  const typeLabel=TYPES.find(x=>x.value===data.type)?.label||data.type||'';
  setPreview({record:data,student,form:{values:{
   'الطالب':student?.full_name||'',
   'التاريخ':data.consultation_date||'',
   'نوع المقابلة':typeLabel,
   'الموضوع':data.topic||'',
   'ملخص المقابلة/الملاحظات':data.notes||'',
   'الإجراءات':'',
   'النتائج':data.result||''
  }}});
 };

 const reset=()=>{
  setEditing(null);
  setForm({...emptyForm,school_year_id:form.school_year_id,semester_id:form.semester_id});
  setStudentSearch('');
  setError('');
 };

 const save=async()=>{
  if(!form.student_id)return setError('يرجى البحث عن الطالب واختياره.');
  if(!form.school_year_id||!form.semester_id)return setError('يرجى اختيار السنة الدراسية والفصل.');
  if(!form.consultation_date||!form.topic.trim())return setError('يرجى إدخال التاريخ وموضوع الاستشارة.');
  setSaving(true);setError('');
  try{
   const payload={
    student_id:form.student_id,
    school_year_id:form.school_year_id,
    semester_id:form.semester_id,
    consultation_date:form.consultation_date,
    grade_id:selectedStudent?.grade_id||form.grade_id||null,
    section_id:selectedStudent?.section_id||form.section_id||null,
    type:form.type,
    topic:form.topic.trim(),
    notes:form.notes||'',
    result:form.result||''
   };
   if(editing)await updateConsultationRecord(editing,payload);
   else await createConsultationRecord(payload);
   await load();reset();
  }catch(e){setError(e.message||'تعذر حفظ الاستشارة.');}
  finally{setSaving(false);}
 };

 const editRecord=record=>{
  setEditing(record.id);
  setForm({...emptyForm,...record});
  const student=students.find(x=>String(x.id)===String(record.student_id));
  setStudentSearch(student?.full_name||'');
  setError('');
  window.scrollTo({top:0,behavior:'smooth'});
 };

 const removeRecord=async id=>{
  if(!window.confirm('هل تريد حذف سجل الاستشارة؟'))return;
  setError('');
  try{await deleteConsultationRecord(id);await load();if(editing===id)reset();}
  catch(e){setError(e.message||'تعذر حذف السجل.');}
 };

 const print=()=>window.print();

 return <Page title="الاستشارات الطلابية" sub="توثيق الاستشارات التعليمية والمهنية والنفسية">
  {error&&<ErrorNotice>{error}</ErrorNotice>}
  <Card>
   <div className="section-title">
    <div><h2>{editing?'تعديل الاستشارة':'إضافة استشارة جديدة'}</h2><span>تُحفظ البيانات مباشرة في سجل الاستشارات.</span></div>
    {editing&&<Button variant="secondary" onClick={reset}>إلغاء التعديل</Button>}
   </div>
   <div className="form-grid two">
    <div className="field" style={{position:'relative'}}>
     <label>البحث عن الطالب</label>
     <div className="input-with-action">
      <input value={studentSearch} placeholder="اكتب جزءًا من اسم الطالب..." onChange={e=>{setStudentSearch(e.target.value);setForm(v=>({...v,student_id:'',grade_id:'',section_id:''}));}}/>
      <Search size={17}/>
     </div>
     {studentSearch.trim()&&!form.student_id&&<div style={{position:'absolute',zIndex:30,top:'100%',right:0,left:0,maxHeight:230,overflowY:'auto',background:'#fff',border:'1px solid #ddd',borderRadius:10,boxShadow:'0 8px 24px #0002'}}>
      {filteredStudents.length?filteredStudents.map(st=><button type="button" key={st.id} onClick={()=>{setForm(v=>({...v,student_id:st.id,grade_id:st.grade_id||'',section_id:st.section_id||''}));setStudentSearch(st.full_name);}} style={{display:'block',width:'100%',padding:11,textAlign:'right',background:'#fff',border:0,borderBottom:'1px solid #eee',cursor:'pointer'}}>{st.full_name}</button>):<div style={{padding:12,color:'#777'}}>لا توجد أسماء مطابقة.</div>}
     </div>}
     {selectedStudent&&<small style={{color:'#087568'}}>تم اختيار: {selectedStudent.full_name}</small>}
    </div>
    <Input label="تاريخ الاستشارة" type="date" value={form.consultation_date||''} onChange={e=>setForm(v=>({...v,consultation_date:e.target.value}))}/>
    <Select label="السنة الدراسية" value={form.school_year_id||''} onChange={e=>setForm(v=>({...v,school_year_id:e.target.value}))}>
     <option value="">اختر السنة الدراسية</option>
     {academic.years.map(y=><option key={y.id} value={y.id}>{y.name}</option>)}
    </Select>
    <Select label="الفصل الدراسي" value={form.semester_id||''} onChange={e=>setForm(v=>({...v,semester_id:e.target.value}))}>
     <option value="">اختر الفصل</option>
     {academic.semesters.filter(s=>!form.school_year_id||String(s.school_year_id)===String(form.school_year_id)).map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
    </Select>
    <Select label="نوع الاستشارة" value={form.type||'EDUCATIONAL'} onChange={e=>setForm(v=>({...v,type:e.target.value}))}>
     {TYPES.map(t=><option key={t.value} value={t.value}>{t.label}</option>)}
    </Select>
    <Input label="الموضوع" value={form.topic||''} onChange={e=>setForm(v=>({...v,topic:e.target.value}))} placeholder="موضوع الاستشارة"/>
   </div>
   <div className="form-grid two" style={{marginTop:14}}>
    <Textarea label="ملخص المقابلة / الملاحظات" rows={4} value={form.notes||''} onChange={e=>setForm(v=>({...v,notes:e.target.value}))}/>
    <Textarea label="النتيجة / التوصيات" rows={4} value={form.result||''} onChange={e=>setForm(v=>({...v,result:e.target.value}))}/>
   </div>
   <div className="meeting-entry-actions">
    <Button loading={saving} onClick={save}><Save size={16}/> {editing?'حفظ التعديلات':'حفظ الاستشارة'}</Button>
    <Button variant="secondary" onClick={()=>makePreview()}><Eye size={16}/> عرض النموذج الرسمي</Button>
    {!editing&&<Button variant="secondary" onClick={reset}><Plus size={16}/> تفريغ الحقول</Button>}
   </div>
  </Card>

  <Card>
   <div className="section-title">
    <div><h2>الاستشارات المحفوظة</h2><span>{records.length} سجل</span></div>
    <Button variant="secondary" onClick={load}>تحديث السجلات</Button>
   </div>
   {loading?<div className="loading">جارٍ تحميل الاستشارات...</div>:records.length===0?<div className="empty-state">لا توجد استشارات محفوظة حتى الآن.</div>:<div className="table-wrap">
    <table className="table">
     <thead><tr><th>التاريخ</th><th>الطالب</th><th>النوع</th><th>الموضوع</th><th>إجراءات</th></tr></thead>
     <tbody>{records.map(r=>{
      const st=students.find(x=>String(x.id)===String(r.student_id));
      return <tr key={r.id}>
       <td>{r.consultation_date||'—'}</td>
       <td>{st?.full_name||'—'}</td>
       <td>{TYPES.find(t=>t.value===r.type)?.label||r.type||'—'}</td>
       <td>{r.topic||'—'}</td>
       <td><div className="item-actions">
        <button type="button" onClick={()=>makePreview(r)}><Eye size={14}/> النموذج الرسمي</button>
        <button type="button" onClick={()=>editRecord(r)}><Edit size={14}/> تعديل</button>
        <button type="button" onClick={()=>removeRecord(r.id)}><Trash2 size={14}/> حذف</button>
       </div></td>
      </tr>;
     })}</tbody>
    </table>
   </div>}
  </Card>

  {preview&&<div className="meeting-preview-overlay" role="dialog" aria-modal="true">
   <div className="meeting-preview-modal">
    <div className="meeting-preview-toolbar">
     <div><strong>نموذج المقابلات والاستشارات الطلابية</strong><span>معاينة النموذج الرسمي</span></div>
     <div className="meeting-preview-actions">
      <Button variant="secondary" onClick={()=>document.querySelector('.meeting-preview-modal .official-document')?.requestFullscreen?.()}><Maximize2 size={15}/> عرض كامل</Button>
      <Button variant="secondary" onClick={print}><Printer size={15}/> طباعة / PDF</Button>
      <Button variant="secondary" onClick={()=>setPreview(null)}><X size={15}/> إغلاق</Button>
     </div>
    </div>
    <div className="meeting-paper-wrap">
     <GenericOfficialPreview title="نموذج المقابلات والاستشارات الطلابية" config={FORM_CONFIGS['student-consultations']} profile={profile} academic={academicView} form={preview.form}/>
    </div>
   </div>
  </div>}
 </Page>;
}
