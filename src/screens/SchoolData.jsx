import React,{useEffect,useMemo,useState} from 'react'
import {Page,Card,Button,Input,Select,Empty,ErrorNotice} from '../components/UI'
import {currentProfile,listOrganization,listSchoolGrades,listSectionsBySchool,createSchoolGrade,updateSchoolGrade,deleteSchoolGrade,createSchoolSection,updateSchoolSection,deleteSchoolSection,updateSchool} from '../services/data'
import {RefreshCw,Plus,Save,Edit3,Trash2,School,Layers,Users} from 'lucide-react'

export default function SchoolData(){
 const [profile,setProfile]=useState(null),[org,setOrg]=useState({directorates:[],schools:[],profiles:[]}),[schoolId,setSchoolId]=useState(''),[grades,setGrades]=useState([]),[sections,setSections]=useState([]),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('')
 const [schoolForm,setSchoolForm]=useState({name:'',code:''}),[gradeForm,setGradeForm]=useState({name:'',sort_order:0}),[sectionForm,setSectionForm]=useState({name:'',grade_id:''}),[editGrade,setEditGrade]=useState(null),[editSection,setEditSection]=useState(null)
 const admin=profile&&['PROGRAMMER','MINISTRY','DIRECTORATE','COUNSELOR'].includes(profile.role)
 const schools=useMemo(()=>profile?.role==='MINISTRY'||profile?.role==='PROGRAMMER'?org.schools:profile?.role==='DIRECTORATE'?org.schools.filter(x=>x.directorate_id===profile.directorate_id):org.schools.filter(x=>x.id===profile?.school_id),[org,profile])
 const school=schools.find(x=>x.id===schoolId)||null
 const directorate=org.directorates.find(x=>x.id===school?.directorate_id)
 const staff=org.profiles.filter(x=>x.school_id===schoolId)
 const principal=staff.find(x=>x.role==='PRINCIPAL'||String(x.job_title||'').includes('مدير'))
 const counselor=staff.find(x=>x.role==='COUNSELOR'||String(x.job_title||'').includes('مرشد'))
 const load=async()=>{
  setLoading(true);setError('')
  try{
   const [p,o]=await Promise.all([currentProfile(),listOrganization()])
   setProfile(p);setOrg(o)
   const allowed=p?.role==='MINISTRY'||p?.role==='PROGRAMMER'?o.schools:p?.role==='DIRECTORATE'?o.schools.filter(x=>x.directorate_id===p.directorate_id):o.schools.filter(x=>x.id===p?.school_id)
   const chosen=allowed.find(x=>x.id===schoolId)||allowed[0]
   setSchoolId(chosen?.id||'')
   if(chosen){setSchoolForm({name:chosen.name||'',code:chosen.code||''});const [g,ss]=await Promise.all([listSchoolGrades(chosen.id),listSectionsBySchool(chosen.id)]);setGrades(g);setSections(ss)}
   else {setGrades([]);setSections([])}
  }catch(e){setError(e.message||'تعذر تحميل بيانات المدرسة.')}finally{setLoading(false)}
 }
 useEffect(()=>{load()},[])
 const changeSchool=async id=>{
  setSchoolId(id);const x=org.schools.find(s=>s.id===id);setSchoolForm({name:x?.name||'',code:x?.code||''});setError('')
  try{const [g,ss]=await Promise.all([listSchoolGrades(id),listSectionsBySchool(id)]);setGrades(g);setSections(ss)}catch(e){setError(e.message)}
 }
 const refresh=async()=>{if(!schoolId)return;try{const [g,ss]=await Promise.all([listSchoolGrades(schoolId),listSectionsBySchool(schoolId)]);setGrades(g);setSections(ss)}catch(e){setError(e.message)}}
 const saveSchool=async()=>{
  if(!school||!schoolForm.name.trim()){setError('اسم المدرسة مطلوب.');return}
  setBusy(true);setError('');try{await updateSchool(school.id,{name:schoolForm.name,code:schoolForm.code,directorate_id:school.directorate_id});setNotice('تم حفظ بيانات المدرسة.');await load()}catch(e){setError(e.message||'تعذر حفظ بيانات المدرسة.')}finally{setBusy(false)}
 }
 const saveGrade=async()=>{
  if(!gradeForm.name.trim()||!school){setError('أدخل اسم الصف.');return}
  setBusy(true);setError('');try{
   if(editGrade)await updateSchoolGrade(editGrade,{name:gradeForm.name,sort_order:Number(gradeForm.sort_order)||0})
   else await createSchoolGrade({name:gradeForm.name,school_id:school.id,directorate_id:school.directorate_id,sort_order:Number(gradeForm.sort_order)||0})
   setGradeForm({name:'',sort_order:grades.length+1});setEditGrade(null);await refresh();setNotice('تم حفظ الصف.')
  }catch(e){setError(e.message||'تعذر حفظ الصف.')}finally{setBusy(false)}
 }
 const saveSection=async()=>{
  if(!sectionForm.name.trim()||!sectionForm.grade_id){setError('اختر الصف وأدخل اسم الشعبة.');return}
  setBusy(true);setError('');try{
   if(editSection)await updateSchoolSection(editSection,{name:sectionForm.name})
   else await createSchoolSection({name:sectionForm.name,school_id:school.id,grade_id:sectionForm.grade_id})
   setSectionForm({name:'',grade_id:''});setEditSection(null);await refresh();setNotice('تم حفظ الشعبة.')
  }catch(e){setError(e.message||'تعذر حفظ الشعبة.')}finally{setBusy(false)}
 }
 const removeGrade=async g=>{if(!confirm(`حذف الصف «${g.name}»؟ لا يمكن حذفه إذا كان مرتبطًا بشعب أو طلاب.`))return;try{await deleteSchoolGrade(g.id);await refresh()}catch(e){setError(e.message||'تعذر حذف الصف. قد يكون مرتبطًا ببيانات.')}} 
 const removeSection=async x=>{if(!confirm(`حذف الشعبة «${x.name}»؟`))return;try{await deleteSchoolSection(x.id);await refresh()}catch(e){setError(e.message||'تعذر حذف الشعبة.')}} 
 const editG=g=>{setEditGrade(g.id);setGradeForm({name:g.name,sort_order:g.sort_order||0})}
 const editS=x=>{setEditSection(x.id);setSectionForm({name:x.name,grade_id:x.grade_id})}
 const totalSections=sections.length
 return <Page title="بيانات المدرسة" sub="البيانات الإدارية والأكاديمية وإدارة الصفوف والشُعب." actions={<Button variant="secondary" onClick={load}><RefreshCw size={16}/> تحديث</Button>}>
  {error&&<ErrorNotice>{error}</ErrorNotice>}{notice&&<div className="notice">{notice}</div>}
  {admin&&<Card><Select label="اختيار المدرسة" value={schoolId} onChange={e=>changeSchool(e.target.value)}><option value="">اختر المدرسة</option>{schools.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</Select></Card>}
  {!school?<Card><Empty title="لا توجد مدرسة مرتبطة" text="يجب ربط حسابك بمدرسة أو اختيار مدرسة من القائمة."/></Card>:<>
   <Card><div className="section-title"><div><h2><School size={18}/> البيانات الأساسية والإدارية</h2><span>بيانات المدرسة والمديرية والموظفين المرتبطين بها.</span></div></div>
    <div className="form-grid two"><Input label="اسم المديرية" value={directorate?.name||'—'} readOnly/><Input label="اسم المدرسة" value={schoolForm.name} onChange={e=>setSchoolForm({...schoolForm,name:e.target.value})} readOnly={!admin}/><Input label="رمز المدرسة" value={schoolForm.code||''} onChange={e=>setSchoolForm({...schoolForm,code:e.target.value})} readOnly={!admin}/><Input label="مدير المدرسة" value={principal?.full_name||'غير محدد في حسابات المدرسة'} readOnly/><Input label="المرشد التربوي" value={counselor?.full_name||'غير محدد في حسابات المدرسة'} readOnly/></div>
    {admin&&<Button loading={busy} onClick={saveSchool}><Save size={16}/> حفظ بيانات المدرسة</Button>}
   </Card>
   <div className="form-grid two">
    <Card><div className="section-title"><div><h2><Layers size={18}/> الصفوف</h2><span>{grades.length} صف</span></div></div>
     {admin&&<><div className="form-grid two"><Input label="اسم الصف" value={gradeForm.name} onChange={e=>setGradeForm({...gradeForm,name:e.target.value})} placeholder="مثال: الصف الأول"/><Input label="ترتيب الصف" type="number" value={gradeForm.sort_order} onChange={e=>setGradeForm({...gradeForm,sort_order:e.target.value})}/></div><div className="row-actions"><Button loading={busy} onClick={saveGrade}><Plus size={16}/>{editGrade?'حفظ تعديل الصف':'إضافة صف'}</Button>{editGrade&&<Button variant="secondary" onClick={()=>{setEditGrade(null);setGradeForm({name:'',sort_order:grades.length+1})}}>إلغاء</Button>}</div></>}
     {!grades.length?<Empty title="لا توجد صفوف" text="أضف الصفوف الخاصة بهذه المدرسة."/ >:<div className="table-wrap"><table className="table"><thead><tr><th>الصف</th><th>الشعب</th>{admin&&<th>إجراءات</th>}</tr></thead><tbody>{grades.map(g=><tr key={g.id}><td>{g.name}</td><td>{sections.filter(s=>s.grade_id===g.id).length}</td>{admin&&<td className="row-actions"><button className="icon-btn" onClick={()=>editG(g)}><Edit3 size={15}/></button><button className="icon-btn danger" onClick={()=>removeGrade(g)}><Trash2 size={15}/></button></td>}</tr>)}</tbody></table></div>}
    </Card>
    <Card><div className="section-title"><div><h2><Users size={18}/> الشعب</h2><span>{totalSections} شعبة</span></div></div>
     {admin&&<><div className="form-grid two"><Select label="الصف" value={sectionForm.grade_id} onChange={e=>setSectionForm({...sectionForm,grade_id:e.target.value})}><option value="">اختر الصف</option>{grades.map(g=><option key={g.id} value={g.id}>{g.name}</option>)}</Select><Input label="اسم الشعبة" value={sectionForm.name} onChange={e=>setSectionForm({...sectionForm,name:e.target.value})} placeholder="أ"/></div><div className="row-actions"><Button loading={busy} onClick={saveSection}><Plus size={16}/>{editSection?'حفظ تعديل الشعبة':'إضافة شعبة'}</Button>{editSection&&<Button variant="secondary" onClick={()=>{setEditSection(null);setSectionForm({name:'',grade_id:''})}}>إلغاء</Button>}</div></>}
     {!sections.length?<Empty title="لا توجد شعب" text="ستظهر الشعب بعد إضافتها إلى الصفوف."/>:<div className="table-wrap"><table className="table"><thead><tr><th>الصف</th><th>الشعبة</th>{admin&&<th>إجراءات</th>}</tr></thead><tbody>{sections.map(x=><tr key={x.id}><td>{grades.find(g=>g.id===x.grade_id)?.name||'—'}</td><td>{x.name}</td>{admin&&<td className="row-actions"><button className="icon-btn" onClick={()=>editS(x)}><Edit3 size={15}/></button><button className="icon-btn danger" onClick={()=>removeSection(x)}><Trash2 size={15}/></button></td>}</tr>)}</tbody></table></div>}
    </Card>
   </div>
   <Card><div className="section-title"><div><h2>ملخص المدرسة</h2><span>إحصائيات محسوبة من الجداول الحالية.</span></div></div><div className="form-grid two"><div className="program-meta"><span>عدد الصفوف</span><strong>{grades.length}</strong></div><div className="program-meta"><span>عدد الشعب</span><strong>{totalSections}</strong></div></div></Card>
  </>}
 </Page>
}
