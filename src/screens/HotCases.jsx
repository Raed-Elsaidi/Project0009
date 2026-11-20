import React,{useCallback,useEffect,useMemo,useState} from 'react'
import {useNavigate} from 'react-router-dom'
import {Page,Card,Button,ErrorNotice} from '../components/UI'
import {Plus,ClipboardList,BellRing,School,Building2,Eye,Save,FilePlus2} from 'lucide-react'
import {currentProfile,listActiveAcademicData,listStudents} from '../services/data'
import {listOfficialFormRecords,saveOfficialFormRecord} from '../services/officialFormsApi'

const HOT_CASE_FORMS=[
 {id:'hot-cases-monitor',title:'نموذج رصد الحالات الساخنة',description:'سجل الحالات الساخنة وتصنيفها والإجراءات المتخذة.',icon:ClipboardList},
 {id:'hot-case-notice',title:'نموذج إعلام عن ملف ساخن',description:'إشعار رسمي ببيانات الحالة المحفوظة.',icon:BellRing},
 {id:'hot-cases-school',title:'نموذج رصد الحالات الساخنة الفصلي – المدرسة',description:'عرض بيانات الحالة في النموذج الفصلي للمدرسة.',icon:School},
 {id:'hot-cases-directorate',title:'نموذج رصد الحالات الساخنة الفصلي – المديرية',description:'عرض بيانات الحالة في النموذج الفصلي للمديرية.',icon:Building2}
]
const EMPTY_VALUES={
 'الرقم':'','student_id':'','اسم الطالب':'','رمز الطالب':'','الصف':'','الشعبة':'','تاريخ':'',
 'المشكلة':'','تصنيف الحالة':'','جهة تحويل الحالة':'','الإجراءات/المتابعة':'','ملاحظات':''
}
const fieldList=[
 ['الرقم','text'],['رمز الطالب','text'],['تاريخ','date'],
 ['المشكلة','textarea'],['تصنيف الحالة','text'],['جهة تحويل الحالة','text'],['الإجراءات/المتابعة','textarea'],['ملاحظات','textarea']
]
const dateToday=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
const recordValues=record=>record?.form_data?.values||EMPTY_VALUES

export default function HotCases(){
 const navigate=useNavigate()
 const [profile,setProfile]=useState(null),[academic,setAcademic]=useState({years:[],semesters:[]}),[students,setStudents]=useState([]),[studentSearch,setStudentSearch]=useState(''),[studentMatches,setStudentMatches]=useState([])
 const [records,setRecords]=useState([]),[selectedId,setSelectedId]=useState('')
 const [values,setValues]=useState({...EMPTY_VALUES,'تاريخ':dateToday()})
 const [loading,setLoading]=useState(true),[saving,setSaving]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('')

 const selectedRecord=useMemo(()=>records.find(r=>String(r.id)===String(selectedId))||null,[records,selectedId])
 const selectedYear=useMemo(()=>academic.years?.find(y=>y.is_active)||academic.years?.[0]||null,[academic.years])
 const selectedSemester=useMemo(()=>academic.semesters?.find(x=>x.school_year_id===selectedYear?.id)||academic.semesters?.[0]||null,[academic.semesters,selectedYear])

 const load=useCallback(async(preferredId='')=>{
  setLoading(true);setError('')
  try{
   const [p,a]=await Promise.all([currentProfile(),listActiveAcademicData()])
   const studentRows=await listStudents(p?.school_id||null)
   setProfile(p);setAcademic(a||{years:[],semesters:[]});setStudents(studentRows||[])
   const year=(a?.years||[]).find(y=>y.is_active)||(a?.years||[])[0]
   const list=await listOfficialFormRecords(['hot-case-record'],year?.id||'')
   setRecords(list)
   const wanted=preferredId||selectedId
   const current=list.find(r=>String(r.id)===String(wanted))||list[0]||null
   setSelectedId(current?.id||'')
   const nextValues=current?{...EMPTY_VALUES,...recordValues(current)}:{...EMPTY_VALUES,'تاريخ':dateToday()}
   setValues(nextValues);setStudentSearch(nextValues['اسم الطالب']||'');setStudentMatches([])
  }catch(e){setError(e.message||'تعذر تحميل سجلات الملف الساخن.')}
  finally{setLoading(false)}
 },[selectedId])

 useEffect(()=>{load('')},[])

 const startNew=()=>{
  setSelectedId('')
  setValues({...EMPTY_VALUES,'تاريخ':dateToday()})
  setStudentSearch('');setStudentMatches([])
  setNotice('تم فتح سجل جديد. أدخل بيانات الحالة ثم احفظها.')
  setError('')
  window.scrollTo({top:0,behavior:'smooth'})
 }
 const selectRecord=id=>{
  const item=records.find(r=>String(r.id)===String(id))
  setSelectedId(id)
  const nextValues=item?{...EMPTY_VALUES,...recordValues(item)}:{...EMPTY_VALUES,'تاريخ':dateToday()}
  setValues(nextValues);setStudentSearch(nextValues['اسم الطالب']||'');setStudentMatches([])
  setNotice('')
 }
 const set=(name,value)=>setValues(prev=>({...prev,[name]:value}))
 const searchStudent=value=>{setStudentSearch(value);setValues(prev=>({...prev,student_id:'','اسم الطالب':value,'رمز الطالب':'','الصف':'','الشعبة':''}));const q=value.trim().toLocaleLowerCase('ar');setStudentMatches(q.length<2?[]:students.filter(st=>String(st.full_name||'').toLocaleLowerCase('ar').includes(q)).slice(0,8))}
 const chooseStudent=student=>{setValues(prev=>({...prev,student_id:student.id,'اسم الطالب':student.full_name||'','رمز الطالب':student.student_code||'','الصف':student.grades?.name||'','الشعبة':student.sections?.name||''}));setStudentSearch(student.full_name||'');setStudentMatches([])}
 const save=async()=>{
  if(!profile){setError('تعذر تحديد حساب المرشد. أعد تسجيل الدخول.');return}
  if(!values.student_id){setError('ابحث عن اسم الطالب واختره من قائمة الطلاب حتى يتم ربط الصف والشعبة تلقائياً.');return}
  setSaving(true);setError('');setNotice('')
  try{
   const form={school_year_id:selectedYear?.id||'',semester_id:selectedSemester?.id||'',values:{...values}}
   const saved=await saveOfficialFormRecord({formId:'hot-case-record',profile,form,recordId:selectedId||null})
   await load(saved?.id||'')
   setNotice(selectedId?'تم تحديث ملف الحالة بنجاح.':'تم حفظ ملف الحالة بنجاح.')
  }catch(e){setError(e.message||'تعذر حفظ ملف الحالة.')}
  finally{setSaving(false)}
 }
 const showForm=formId=>{
  if(!selectedRecord){setError('اختر ملفاً محفوظاً أو أضف ملفاً جديداً ثم احفظه قبل عرض النموذج.');return}
  navigate(`/official-forms/${formId}`,{state:{hotCaseRecord:selectedRecord}})
 }

 return <Page title="الحالات الساخنة" sub="إدارة الحالات ذات الأولوية ومسار المتابعة">
  <Card className="hot-case-entry-card">
   <div className="section-heading"><div><h3>إدخال بيانات الملف الساخن</h3><p>أدخل بيانات الحالة مرة واحدة، ثم اعرضها في أي نموذج رسمي.</p></div></div>
   <div className="hot-case-entry-toolbar">
    <Button type="button" variant="secondary" onClick={startNew}><FilePlus2 size={17}/> إضافة ملف جديد</Button>
   </div>
   <div className="hot-case-entry-grid">
    <label className="field hot-case-student-search hot-case-wide"><span>اسم الطالب — ابحث واختر من القائمة</span><input type="search" value={studentSearch} onChange={e=>searchStudent(e.target.value)} placeholder="اكتب اسم الطالب للبحث..." autoComplete="off"/>{studentMatches.length>0&&<div className="hot-case-student-results">{studentMatches.map(st=><button type="button" key={st.id} onClick={()=>chooseStudent(st)}><strong>{st.full_name}</strong><small>{st.grades?.name||'—'} / {st.sections?.name||'—'} — {st.student_code||'بدون رمز'}</small></button>)}</div>}</label>
    <label className="field"><span>الصف (تلقائي)</span><input value={values['الصف']||''} readOnly placeholder="يظهر بعد اختيار الطالب"/></label>
    <label className="field"><span>الشعبة (تلقائي)</span><input value={values['الشعبة']||''} readOnly placeholder="تظهر بعد اختيار الطالب"/></label>
    {fieldList.map(([label,type])=><label className={`field ${type==='textarea'?'hot-case-wide':''}`} key={label}><span>{label}</span>{type==='textarea'?<textarea rows={2} value={values[label]||''} onChange={e=>set(label,e.target.value)}/>:<input type={type} value={values[label]||''} onChange={e=>set(label,e.target.value)}/>}</label>)}
   </div>
   <div className="hot-case-entry-actions"><Button type="button" loading={saving} onClick={save}><Save size={16}/>{selectedId?'حفظ التعديلات':'حفظ الملف'}</Button></div>
   <div className="hot-case-records-list"><div className="section-heading"><div><h3>سجل الطلاب المسجلين</h3><p>اختر ملفاً من السجل لتعديله أو لعرض بياناته في النماذج الرسمية.</p></div></div>{loading?<div className="loading">جارٍ تحميل السجل...</div>:records.length===0?<p className="empty">لا توجد ملفات ساخنة مسجلة حتى الآن.</p>:<div className="table-wrap"><table className="table"><thead><tr><th>اسم الطالب</th><th>رمز الطالب</th><th>الصف</th><th>الشعبة</th><th>التاريخ</th><th>اختيار</th></tr></thead><tbody>{records.map(r=>{const v=recordValues(r);return <tr key={r.id} className={String(r.id)===String(selectedId)?'is-selected':''}><td>{v['اسم الطالب']||'—'}</td><td>{v['رمز الطالب']||'—'}</td><td>{v['الصف']||'—'}</td><td>{v['الشعبة']||'—'}</td><td>{v['تاريخ']||'—'}</td><td><Button type="button" variant={String(r.id)===String(selectedId)?'primary':'secondary'} onClick={()=>selectRecord(String(r.id))}>اختيار</Button></td></tr>})}</tbody></table></div>}</div>
   {notice&&<div className="hot-case-notice" role="status">{notice}</div>}
   {error&&<ErrorNotice>{error}</ErrorNotice>}
  </Card>

  <Card className="hot-cases-forms-card">
   <div className="section-heading"><div><h3>نماذج الملف الساخن</h3><p>اختر النموذج لعرض بيانات الملف المحدد في الترويسة والنموذج الرسمي.</p></div></div>
   {loading?<div className="loading">جارٍ تحميل الملفات...</div>:<div className="hot-cases-form-buttons">
    {HOT_CASE_FORMS.map(({id,title,description,icon:Icon})=><div className="hot-cases-form-item" key={id}>
     <div className="hot-cases-form-info"><span className="hot-cases-form-icon"><Icon size={20}/></span><div><strong>{title}</strong><small>{description}</small></div></div>
     <Button type="button" onClick={()=>showForm(id)}><Eye size={16}/> عرض النموذج</Button>
    </div>)}
   </div>}
  </Card>
 </Page>
}
