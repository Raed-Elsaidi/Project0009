import React,{useEffect,useMemo,useState}from'react'
import{Button}from'../UI'
import OfficialDocumentHeader from './OfficialDocumentHeader'
import{Eye,Plus,Trash2,Save,Printer,Maximize2,X,Paperclip,FileText,ExternalLink}from'lucide-react'
import{uploadParliamentAchievementAttachment,openParliamentAchievementAttachment,deleteParliamentAchievementAttachment,getParliamentAchievementAttachmentUrl}from'../../services/data'
import{useRef}from'react'

export const FORM_CONFIGS={
 'meeting-summary':{fields:['الشخص الذي تمت مقابلته','المجموع العام','ملاحظات'],columns:['الشخص الذي تمت مقابلته','المجموع العام','ملاحظات'],rows:['مدير المدرسة','المعلم','ولي الأمر','مؤسسات أخرى']},
 'case-study':{studentPicker:true,fields:['اسم الطالب','الصف والشعبة','تاريخ فتح الحالة','عدد الجلسات','وصف المشكلة','التشخيص الأولي','خطة التدخل','آلية المتابعة','ملاحظات المرشد'],columns:[]},
 'hot-cases-monitor':{hotCasesPreviewHeader:true,hideFieldsInEntry:true,hideFieldsInPreview:true,fields:['الرقم','رمز الطالب','الصف','تاريخ','المشكلة','تصنيف الحالة','جهة تحويل الحالة','الإجراءات/المتابعة'],columns:['الرقم','رمز الطالب','الصف','تاريخ','المشكلة','تصنيف الحالة','جهة التحويل','الإجراءات/المتابعة']},
 'hot-case-notice':{fields:['اسم الطالب','الصف والشعبة','تاريخ الحالة','وصف المشكلة','الإجراءات المتخذة','جهة التحويل','ملاحظات'],columns:[]},
 'student-issues-monitor':{fields:['الرقم','رمز الطالب','الصف','نوع المشكلة','تاريخ الرصد','الإجراءات','المتابعة'],columns:['الرقم','رمز الطالب','الصف','نوع المشكلة','تاريخ الرصد','الإجراءات','المتابعة']},
 'student-consultations':{fields:['الطالب','التاريخ','نوع المقابلة','الموضوع','ملخص المقابلة/الملاحظات','الإجراءات','النتائج'],columns:[]},
 'consultations-monitor':{consultationsMonitor:true,hideFieldsInPreview:true,fields:['التاريخ','الطالب/الشخص','نوع الاستشارة','الموضوع','الإجراء','الملاحظات'],columns:['التاريخ','الطالب/الشخص','نوع الاستشارة','الموضوع','الإجراء','الملاحظات']},
 'repeated-absence':{fields:['الرقم','الطالب','الصف','الشعبة','عدد مرات الغياب','الشهر','الأسباب','الإجراءات','الملاحظات'],columns:['الرقم','الطالب','الصف','الشعبة','عدد مرات الغياب','الشهر','الأسباب','الإجراءات']},
 'absence-followup':{fields:['الطالب','الصف','الشعبة','عدد مرات الغياب','الشهر','الأسباب','الإجراءات','النتائج'],columns:[]},
 'repeated-lateness':{fields:['الرقم','الطالب','الصف','الشعبة','عدد مرات التأخر','الشهر','الأسباب','الملاحظات'],columns:['الرقم','الطالب','الصف','الشعبة','عدد مرات التأخر','الشهر','الأسباب','الملاحظات']},
 'lateness-followup':{fields:['الطالب','الصف','الشعبة','عدد مرات التأخر للشهر','الأسباب','الإجراءات','النتائج'],columns:[]},
 'dropout-monitor':{fields:['الرقم','رمز الطالب','الصف','الشعبة','تاريخ التسرب','الأسباب','الإجراءات/المتابعة'],columns:['الرقم','رمز الطالب','الصف','الشعبة','تاريخ التسرب','الأسباب','الإجراءات/المتابعة']},
 'dropout-followup':{studentPicker:true,fields:['الطالب','الصف','الشعبة','تاريخ التسرب','الأسباب من وجهة نظر الطالب','رأي ولي الأمر','وجهة نظر المرشد','الإجراءات','النتائج'],columns:[]},
 'hot-cases-school':{hotCasesPreviewHeader:true,hideFieldsInEntry:true,hideFieldsInPreview:true,fields:['الرقم','رمز الطالب','الصف','عدد الحالات','نوع المشكلة','الإجراءات'],columns:['الرقم','رمز الطالب','الصف','عدد الحالات','نوع المشكلة','الإجراءات']},
 'hot-cases-directorate':{hotCasesPreviewHeader:true,hideFieldsInEntry:true,hideFieldsInPreview:true,fields:['الرقم','رمز الطالب','الصف','تاريخ','المشكلة','تصنيف الحالة','جهة تحويل الحالة','الإجراءات/المتابعة'],columns:['الرقم','رمز الطالب','الصف','تاريخ','المشكلة','تصنيف الحالة','جهة تحويل الحالة','الإجراءات/المتابعة']},
 'activities-monitor':{fields:['الشهر','الزيارات','النشرات','الإذاعة','الندوات','المحاضرات','ورشات العمل','مجلة حائط','المجموع'],columns:['الشهر','الزيارات','النشرات','الإذاعة','الندوات','المحاضرات','ورشات العمل','مجلة حائط','المجموع'],rows:['أيلول (9)','تشرين أول (10)','تشرين ثاني (11)','كانون أول (12)','كانون ثاني (1)','شباط (2)','آذار (3)','نيسان (4)','أيار (5)','حزيران (6)']},
 'visits':{activityForm:true,fields:['اليوم','التاريخ','الجهة/المكان','الغرض من الزيارة','الإجراءات','الملاحظات'],columns:['اليوم','التاريخ','الجهة/المكان','الغرض من الزيارة','الإجراءات','الملاحظات']},
 'newsletters':{activityForm:true,fields:['اليوم','التاريخ','موضوع النشرة','الفئة المستهدفة','وسيلة النشر','عدد المستفيدين','الملاحظات'],columns:[]},
 'morning-radio':{activityForm:true,fields:['اليوم','التاريخ','موضوع الإذاعة','الفئة المستهدفة','المشاركون','الأهداف','الملاحظات'],columns:[]},
 'seminars-workshops':{activityForm:true,fields:['اليوم','التاريخ','الموضوع','نوع النشاط','الفئة المستهدفة','القائم بالنشاط','الجهة التي يعمل بها','أهداف النشاط','التوصيات'],columns:[]},
 'wall-magazine':{activityForm:true,fields:['اليوم','التاريخ','موضوع المجلة','الفئة المستهدفة','المشاركون في الإعداد','الأهداف','الملاحظات'],columns:[]},
 'posters':{activityForm:true,fields:[],columns:['التاريخ','موضوع الملصق','الفئة المستهدفة','مكان العرض','عدد المستفيدين','ملاحظات']},
 'group-session-summary':{fields:['المجموعة العلاجية رقم','المشكلة','عدد أفراد المجموعة','أهداف الجلسة','موضوع الجلسة','الإجراءات','النتائج','ملاحظات'],columns:[]},
 'group-session-details':{fields:['رقم المجموعة','المشكلة','عدد أفراد المجموعة','عدد الجلسات','وصف المشكلة','خطة التدخل','المتابعة','ملاحظات'],columns:[]},
 'group-sessions-monitor':{fields:['الموضوع','مجموع عدد اللقاءات','الصفوف المستفيدة','عدد الطلبة','ملاحظات'],columns:['الموضوع','مجموع عدد اللقاءات','الصفوف المستفيدة','عدد الطلبة','ملاحظات']},
 'guidance-meetings-followup':{fields:['اسم المرشد/ة التربوي/ة'],columns:['اليوم/التاريخ','الصف','الشعبة','الحصة','الموضوع','الأهداف','الأنشطة','ملاحظات']},
 'guidance-meetings-monitor':{fields:['الموضوع','مجموع عدد اللقاءات','الصفوف','عدد المستفيدين','ملاحظات'],columns:['الموضوع','مجموع عدد اللقاءات','الصفوف','عدد المستفيدين','ملاحظات']},
 'weekly-program-form':{fields:['اليوم','التاريخ','النشاط/الفعالية','الفئة المستهدفة','المكان','الزمن','ملاحظات'],columns:['اليوم','التاريخ','النشاط/الفعالية','الفئة المستهدفة','المكان','الزمن','ملاحظات']},
 'annual-plan':{annualPlan:true,multipleGoals:true,fields:['الهدف العام'],columns:[]},
 'career-guidance-monitor':{fields:['الهدف','الفئة المستهدفة','ملاحظات'],columns:['التاريخ','الموضوع','الصفوف المستفيدة','عدد الطلبة','ملاحظات']},
 'career-guidance-followup':{fields:['اسم المرشد/ة','ملاحظات عامة'],columns:['التاريخ','الحصة','الصف','الموضوع','الأهداف','الإجراءات','التوصيات']},
 'parliament-plan':{parliamentPlan:true,fields:['الهدف العام'],columns:['الهدف الخاص','الإجراءات والأنشطة','الفترة الزمنية','النتائج المتوقعة','ملاحظات','مهمة التنفيذ']},
 'parliament-members':{fields:[],columns:['اسم الطالب','الصف','الشعبة','الصفة في الفريق','ملاحظات'],studentRoster:true},
 'parliament-team-meetings':{fields:[],columns:['اليوم','التاريخ','موضوع الاجتماع','الحضور','القرارات والتوصيات'],parliamentTeamMeeting:true},
 'parliament-achievements':{fields:[],columns:['اليوم','التاريخ','النشاط (نوعه /اسمه)','الهدف منه','الموجز'],parliamentAchievement:true},
 'health-cases':{healthCases:true,fields:[],columns:['التاريخ','اسم الطالب','الصف والشعبة','نوع الحالة الصحية','الإجراء / الإحالة','المتابعة']},
 'meeting-principal':{principalMeeting:true,fields:[],columns:[]},
 'meeting-teacher':{teacherMeeting:true,fields:[],columns:[]},
 'meeting-parents':{parentsMeeting:true,fields:[],columns:[]},
 'plan':{fields:['الهدف','مخرج رقم','النشاط','الشهر','الحالة/وضع الإنجاز','ملاحظات'],columns:['مخرج رقم','الأنشطة','10','11','12','الحالة/وضع الإنجاز','ملاحظات']},
 'semester-report':{fields:['مقدمة وخلفية','أهم الإنجازات','عرض تحليلي للإنجازات','التحديات والصعوبات','الفرص','أهم الأنشطة للفصل القادم','ملاحظات'],columns:[]}
}

const idAnnualPlan=config=>config?.annualPlan===true
const annualMonths=['9','10','11','12','1','2','3','4','5']
const annualRowTotal=row=>annualMonths.reduce((sum,month)=>sum+Math.max(0,Number(row?.[month])||0),0)
const annualRowLabel=row=>String(row?.['النشاط الاستراتيجي']||'').replace(/\s*\(\d+\)\s*$/,'')

const PARLIAMENT_ROLES=['رئيس/ة البرلمان','نائب/ة أول/ى','نائب/ة ثاني/ة','سكرتير/ة البرلمان','رئيس/ة اللجنة الإعلامية','عضو اللجنة الإعلامية','عضو اللجنة الإعلامية','رئيس/ة اللجنة الثقافية','عضو اللجنة الثقافية','عضو اللجنة الثقافية','رئيس/ة لجنة الدعم و المناصرة','عضو لجنة الدعم و المناصرة','عضو لجنة الدعم و المناصرة']

const inputFor=(label,value,onChange)=><div className="field"><span>{label}</span>{label==='التاريخ'||label.includes('تاريخ')?<input type="date" value={value||''} onChange={e=>onChange(e.target.value)}/>:label.includes('الأهداف')||label.includes('الهدف')||label.includes('الإجراءات')||label.includes('الأنشطة')||label.includes('النشاط')||label.includes('ملاحظات')||label.includes('وصف')||label.includes('التشخيص')||label.includes('خطة')||label.includes('النتائج')||label.includes('المخرج')||label.includes('الموضوع')||label.includes('الفئة المستهدفة')||label.includes('مهمة التنفيذ')||label.includes('التوصيات')||label.includes('المشكلة')?<textarea value={value||''} onChange={e=>onChange(e.target.value)} rows={2}/>:<input value={value||''} onChange={e=>onChange(e.target.value)}/>}</div>

const GOAL_ORDINALS=['الأول','الثاني','الثالث','الرابع','الخامس','السادس','السابع','الثامن','التاسع','العاشر']
const goalOrdinal=i=>GOAL_ORDINALS[i]||String(i+1)
const annualGoalFields=(values={})=>{
 const count=Math.max(1,Number(values.annual_goal_count)||1)
 return Array.from({length:count},(_,i)=>({
  title:`الهدف الخاص ${goalOrdinal(i)}`,
  goalKey:`الهدف الخاص ${i+1}`,
  outputs:[`المخرج الأول للهدف الخاص ${i+1}`,`المخرج الثاني للهدف الخاص ${i+1}`,`المخرج الثالث للهدف الخاص ${i+1}`]
 }))
}

const ANNUAL_ACTIVITY_OPTIONS=[
 'التوجيه الجمعي',
 'التوجيه المهني',
 'اجتماعات البرلمان الطلابي',
 'رصد ومتابعة المقابلات الفردية المركزة',
 'اجتماعات مدير/ة المدرسة',
 'اجتماعات المعلمين',
 'اجتماعات أولياء الأمور',
 'الزيارات',
 'النشرات الإرشادية',
 'الإذاعة الصباحية',
 'الندوات والمحاضرات وورش العمل',
 'الملصقات الإرشادية',
 'مجلة الحائط',
 'الفعاليات',
 'مقابلة مع مدير المدرسة (نفسية)',
 'مقابلة مع مدير المدرسة (سلوكية)',
 'مقابلة مع مدير المدرسة (تربوية)',
 'مقابلة مع معلم (نفسية)',
 'مقابلة مع معلم (سلوكية)',
 'مقابلة مع معلم (تربوية)',
 'مقابلة مع ولي الأمر (نفسية)',
 'مقابلة مع ولي الأمر (سلوكية)',
 'مقابلة مع ولي الأمر (تربوية)',
 'مقابلة مع مؤسسات أخرى (نفسية)',
 'مقابلة مع مؤسسات أخرى (سلوكية)',
 'مقابلة مع مؤسسات أخرى (تربوية)',
 'مقابلة مع تدريب خريجي الجامعات (نفسية)',
 'مقابلة مع تدريب خريجي الجامعات (سلوكية)',
 'مقابلة مع تدريب خريجي الجامعات (تربوية)'
]
const annualOutputRowsKey=(goalIndex,outputIndex)=>`annual_plan_goal_${goalIndex+1}_output_${outputIndex+1}_rows`
const newAnnualActivityRow=()=>({activity:'','9':'','10':'','11':'','12':'','1':'','2':'','3':'','4':'','5':'',responsible:'',notes:''})

function AnnualOutputActivityTable({rows=[],onChange,readOnly=false}){
 const safeRows=Array.isArray(rows)?rows:[]
 const columns=['النشاط الاستراتيجي','المجموع',...annualMonths,'المسؤول / جهة التنفيذ','ملاحظات']
 const update=(index,key,value)=>onChange(safeRows.map((row,i)=>i===index?{...row,[key]:value}:row))
 return <section className={`annual-output-activity ${readOnly?'is-preview':''}`}>
  <div className="annual-output-table-wrap">
   <table className="annual-output-table">
    <colgroup>
     <col/><col/>
     {annualMonths.map(month=><col key={month}/>)}
     <col/><col/>
    </colgroup>
    <thead>
    <tr>
     <th rowSpan={2}>النشاط الاستراتيجي</th>
     <th rowSpan={2}></th>
     <th colSpan={4}>الفصل الأول</th>
     <th colSpan={5}>الفصل الثاني</th>
     <th rowSpan={2}>المسؤول / جهة التنفيذ</th>
     <th rowSpan={2}>ملاحظات</th>
     {!readOnly&&<th rowSpan={2}>حذف</th>}
    </tr>
    <tr>{annualMonths.map(month=><th key={month}>{month}</th>)}</tr>
   </thead>
    <tbody>{safeRows.length?safeRows.map((row,index)=><tr key={index}>
     <td>{readOnly?(row.activity||'—'):<select aria-label="اسم النشاط" value={row.activity||''} onChange={e=>update(index,'activity',e.target.value)}><option value="">اختر النشاط</option>{ANNUAL_ACTIVITY_OPTIONS.map(option=><option key={option} value={option}>{option}</option>)}</select>}</td>
     <td className="annual-row-total">({annualRowTotal(row)})</td>
     {annualMonths.map(month=><td key={month}>{readOnly?(row[month]||'—'):<input type="number" min="0" step="1" value={row[month]??''} aria-label={`شهر ${month}`} onChange={e=>update(index,month,e.target.value)}/>}</td>)}
     <td>{readOnly?(row.responsible||'—'):<input value={row.responsible||''} aria-label="المسؤول أو جهة التنفيذ" onChange={e=>update(index,'responsible',e.target.value)}/>}</td>
     <td>{readOnly?(row.notes||'—'):<textarea rows={2} value={row.notes||''} aria-label="ملاحظات" onChange={e=>update(index,'notes',e.target.value)}/>}</td>
     {!readOnly&&<td><button type="button" className="official-delete-row" onClick={()=>onChange(safeRows.filter((_,i)=>i!==index))} aria-label="حذف النشاط"><Trash2 size={14}/></button></td>}
    </tr>):<tr><td colSpan={columns.length+(readOnly?0:1)} className="annual-output-empty">لا توجد أنشطة مضافة</td></tr>}</tbody>
   </table>
  </div>
  {!readOnly&&<Button variant="secondary" onClick={()=>onChange([...safeRows,newAnnualActivityRow()])}><Plus size={15}/> إضافة نشاط</Button>}
 </section>
}

export default function GenericOfficialForm({config,title,profile,academic,form,students=[],grades=[],sections=[],teachers=[],onChange,onShowPreview,onSave}){
 const [goalDialog,setGoalDialog]=React.useState(null)
 const [goalDraft,setGoalDraft]=React.useState({goal:'',outputs:['','','']})
 const [notice,setNotice]=React.useState(null)
 const isMeetingForm=config?.meetingForm===true
 const isPrincipalMeeting=config?.principalMeeting===true
 const isTeacherMeeting=config?.teacherMeeting===true
 const isParentsMeeting=config?.parentsMeeting===true
 const isSpecialMeeting=isPrincipalMeeting||isTeacherMeeting||isParentsMeeting
 const isStudentRoster=config?.studentRoster===true
 const isStudentPicker=config?.studentPicker===true
 const isParliamentMeeting=config?.parliamentTeamMeeting===true
 const isParliamentAchievement=config?.parliamentAchievement===true
 const achievementFileInput=useRef(null)
 const [achievementUploading,setAchievementUploading]=useState(false)
 const [parliamentMembers,setParliamentMembers]=useState([])
 const [rosterGrade,setRosterGrade]=useState('')
 const [rosterSection,setRosterSection]=useState('')
 const [rosterStudent,setRosterStudent]=useState('')
 const [studentSearch,setStudentSearch]=useState('')
 const todayLocal=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
 const dateColumn=isParliamentMeeting?'التاريخ':config?.columns?.[0]
 const dayNameForDate=value=>{if(!value)return '';const d=new Date(`${value}T12:00:00`);return new Intl.DateTimeFormat('ar', {weekday:'long'}).format(d)}
 const isActivityForm=config?.activityForm===true
 const activityHasDay=(config?.fields||config?.columns||[]).includes('اليوم')
 const newRow=()=>config?.healthCases?{'التاريخ':todayLocal()}:isMeetingForm?{[dateColumn]:todayLocal()}:isParliamentMeeting?{'اليوم':dayNameForDate(todayLocal()),'التاريخ':todayLocal(),'الحضور':[]}:isParliamentAchievement?{'اليوم':dayNameForDate(todayLocal()),'التاريخ':todayLocal(),'النشاط (نوعه /اسمه)':'','الهدف منه':'','الموجز':''}:isActivityForm?{...(activityHasDay?{'اليوم':dayNameForDate(todayLocal())}:{}),'التاريخ':todayLocal()}:{}
 const rosterSections=sections.filter(x=>!rosterGrade||String(x.grade_id)===String(rosterGrade))
 const rosterMatches=students.filter(x=>(!rosterGrade||String(x.grade_id)===String(rosterGrade))&&(!rosterSection||String(x.section_id)===String(rosterSection)))
 const addRosterStudent=()=>{const student=students.find(x=>String(x.id)===String(rosterStudent));if(!student)return;if(rows.some(r=>String(r.student_id)===String(student.id))){setNotice('هذا الطالب مضاف بالفعل.');return}const gradeName=student.grades?.name||grades.find(g=>String(g.id)===String(student.grade_id))?.name||'';const sectionName=student.sections?.name||sections.find(x=>String(x.id)===String(student.section_id))?.name||'';onChange({...form,rows:[...rows,{student_id:student.id,name:student.full_name,grade_id:student.grade_id,section_id:student.section_id,grade:gradeName,section:sectionName,role:'',notes:''}]});setRosterStudent('')}
 const rows=isStudentRoster?(form.rows||[]).filter(r=>r?.student_id||r?.name):form.rows?.length?form.rows:[newRow()]
 React.useEffect(()=>{if(!isParliamentMeeting)return;try{const saved=JSON.parse(localStorage.getItem('official-form-parliament-members')||'null');setParliamentMembers((saved?.rows||[]).filter(r=>r?.name||r?.full_name).map(r=>({id:r.student_id||r.id||r.name,name:r.name||r.full_name})).filter((r,i,a)=>a.findIndex(x=>String(x.id)===String(r.id))===i))}catch{setParliamentMembers([])}},[isParliamentMeeting])
 React.useEffect(()=>{if(!isParliamentMeeting)return;const current=form.rows||[];if(!current.length){onChange({...form,rows:[newRow()]});return}let changed=false;const normalized=current.map(r=>{const date=r['التاريخ']||'';const day=r['اليوم']||dayNameForDate(date);if(r['اليوم']!==day){changed=true;return {...r,'اليوم':day}}return r});if(changed)onChange({...form,rows:normalized})},[isParliamentMeeting,form.rows])
 React.useEffect(()=>{if(!notice)return;const timer=window.setTimeout(()=>setNotice(null),2000);return()=>window.clearTimeout(timer)},[notice])
 React.useEffect(()=>{
  if(!isMeetingForm)return
  const current=form.rows||[]
  if(!current.length){onChange({...form,rows:[newRow()]});return}
  if(!current[0]?.[dateColumn])onChange({...form,rows:current.map((row,i)=>i===0?{...row,[dateColumn]:todayLocal()}:row)})
 },[isMeetingForm,form.rows])
 React.useEffect(()=>{
  if(!isActivityForm)return
  if(tableMode){
   const current=form.rows||[]
   const values=form.values||{}
   const needsRows=!current.length||!current[0]?.['التاريخ']
   const needsValues=fields.length>0&&!values['التاريخ']
   if(needsRows||needsValues)onChange({
    ...form,
    ...(needsRows?{rows:current.length?current.map((row,index)=>index===0?{...row,...newRow()}:row):[newRow()]}:{}),
    ...(needsValues?{values:{...values,'التاريخ':todayLocal(),...(activityHasDay?{'اليوم':dayNameForDate(todayLocal())}:{})}}:{})
   })
   return
  }
  const values=form.values||{}
  if(!values['التاريخ'])onChange({...form,values:{...values,'التاريخ':todayLocal(),...(activityHasDay?{'اليوم':dayNameForDate(todayLocal())}:{})}})
 },[isActivityForm,form.rows,form.values])
 const updateRow=(i,k,v)=>onChange({...form,rows:rows.map((r,idx)=>idx===i?{...r,[k]:v}:r)})
 const chooseStudent=(studentId)=>{const st=students.find(x=>String(x.id)===String(studentId));if(!st)return;const grade=st.grades?.name||grades.find(g=>String(g.id)===String(st.grade_id))?.name||'';const section=st.sections?.name||sections.find(x=>String(x.id)===String(st.section_id))?.name||'';const values={...(form.values||{}),student_id:st.id};if((config.fields||[]).includes('اسم الطالب')){values['اسم الطالب']=st.full_name;values['الصف والشعبة']=[grade,section].filter(Boolean).join(' / ')}if((config.fields||[]).includes('الطالب')){values['الطالب']=st.full_name;values['الصف']=grade;values['الشعبة']=section}onChange({...form,values})}
 const updateParliamentDate=(i,value)=>onChange({...form,rows:rows.map((r,idx)=>idx===i?{...r,'التاريخ':value,'اليوم':dayNameForDate(value)}:r)})
 const updateAttendance=(i,memberName,checked)=>{const current=Array.isArray(rows[i]?.['الحضور'])?rows[i]['الحضور']:String(rows[i]?.['الحضور']||'').split('،').map(x=>x.trim()).filter(Boolean);const next=checked?[...current,memberName]:current.filter(x=>x!==memberName);updateRow(i,'الحضور',next)}
 const add=()=>onChange({...form,rows:[...rows,newRow()]})
 const del=i=>onChange({...form,rows:rows.length>1?rows.filter((_,idx)=>idx!==i):isStudentRoster?[]:[newRow()]})
 const updateAnnualOutputRows=(goalIndex,outputIndex,nextRows)=>{
  const key=annualOutputRowsKey(goalIndex,outputIndex)
  onChange({...form,values:{...(form.values||{}),[key]:nextRows}})
 }
 const beginEditGoal=i=>{
  const n=i+1, ord=['الأول','الثاني','الثالث']
  setGoalDraft({goal:form.values?.[`الهدف الخاص ${n}`]||'',outputs:ord.map(o=>form.values?.[`المخرج ${o} للهدف الخاص ${n}`]||'')})
  setGoalDialog({type:'edit',index:i})
 }
 const commitGoalEdit=()=>{
  const n=goalDialog.index+1, ord=['الأول','الثاني','الثالث'], values={...(form.values||{}),[`الهدف الخاص ${n}`]:goalDraft.goal}
  ord.forEach((o,j)=>values[`المخرج ${o} للهدف الخاص ${n}`]=goalDraft.outputs[j])
  onChange({...form,values});setGoalDialog(null);setNotice('تم تعديل الهدف ومخرجاته بنجاح')
 }
 const askDeleteGoal=i=>setGoalDialog({type:'delete',index:i})
 const commitGoalDelete=()=>{
  const count=annualGoalFields(form.values).length, i=goalDialog.index, old=form.values||{}, values={...old}, ord=['الأول','الثاني','الثالث']
  for(let n=i+1;n<count;n++){
   values[`الهدف الخاص ${n}`]=old[`الهدف الخاص ${n+1}`]||''
   ord.forEach(o=>values[`المخرج ${o} للهدف الخاص ${n}`]=old[`المخرج ${o} للهدف الخاص ${n+1}`]||'')
   for(let j=0;j<3;j++)values[annualOutputRowsKey(n-1,j)]=old[annualOutputRowsKey(n,j)]||[]
  }
  delete values[`الهدف الخاص ${count}`];ord.forEach(o=>delete values[`المخرج ${o} للهدف الخاص ${count}`])
  for(let j=0;j<3;j++)delete values[annualOutputRowsKey(count-1,j)]
  values.annual_goal_count=Math.max(1,count-1)
  onChange({...form,values});setGoalDialog(null);setNotice('تم حذف الهدف بنجاح')
 }
 const saveWithNotice=async()=>{try{await onSave?.();setNotice('تم حفظ البيانات بنجاح')}catch(e){setNotice(e?.message||'تعذر حفظ البيانات')}}
 const uploadAchievementFiles=async event=>{const files=Array.from(event.target.files||[]);if(!files.length)return;setAchievementUploading(true);try{const uploaded=[];for(const file of files){uploaded.push(await uploadParliamentAchievementAttachment(file))}onChange({...form,attachments:[...(form.attachments||[]),...uploaded]});setNotice(`تم رفع ${uploaded.length} مرفق بنجاح`)}catch(e){setNotice(e?.message||'تعذر رفع المرفق')}finally{setAchievementUploading(false);event.target.value=''}}
 const removeAchievementFile=async attachment=>{try{await deleteParliamentAchievementAttachment(attachment.storage_path);onChange({...form,attachments:(form.attachments||[]).filter(a=>a.storage_path!==attachment.storage_path)});setNotice('تم حذف المرفق')}catch(e){setNotice(e?.message||'تعذر حذف المرفق')}}
 const openAchievementFile=async attachment=>{try{await openParliamentAchievementAttachment(attachment.storage_path)}catch(e){setNotice(e?.message||'تعذر فتح المرفق')}}
 const fields=config.fields||[];const tableMode=(config.columns||[]).length>0
 return <div className="generic-form-entry">
   <div className="official-workspace-head"><div><h2>{title}</h2><p>نموذج إدخال إلكتروني — البيانات تنعكس تلقائيًا على النموذج الرسمي.</p></div><div className="official-workspace-actions"><Button onClick={onShowPreview}><Eye size={16}/> عرض النموذج الرسمي</Button><Button variant="secondary" onClick={saveWithNotice}><Save size={16}/> حفظ</Button></div></div>
   <div className="official-entry-card">
    <div className="official-entry-section-title"><div><strong>البيانات التلقائية</strong><span>يتم جلبها من ملف المرشد وإعدادات النظام</span></div></div>
    <div className="official-auto-grid"><div className="official-auto-field"><span>السنة الدراسية</span><strong>{academic.yearName||'—'}</strong></div><div className="official-auto-field"><span>الفصل الدراسي</span><strong>{academic.semesterName||'—'}</strong></div><div className="official-auto-field"><span>اسم المرشد التربوي</span><strong>{profile?.full_name||'—'}</strong></div><div className="official-auto-field"><span>اسم المدير</span><strong>{profile?.manager_name||'—'}</strong></div><div className="official-auto-field wide"><span>المدرسة</span><strong>{profile?.schools?.name||'—'}</strong></div><div className="official-auto-field"><span>المديرية</span><strong>{profile?.directorates?.name||'—'}</strong></div></div>
    <div className="official-auto-note">المعلومات الإدارية لا تحتاج إلى إعادة إدخالها في كل نموذج.</div>
    {isSpecialMeeting&&<div className="generic-fields-grid principal-meeting-fields">
      {isTeacherMeeting&&<div className="field wide">
       <span>اختيار المعلمين المشاركين</span>
       {!teachers.length
        ? <p style={{color:'#81766a'}}>لا يوجد معلمون مسجلون في بيانات المدرسة. أضف المعلمين أولًا من شاشة بيانات المدرسة.</p>
        : <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:10,marginTop:8}}>
          {teachers.map(t=>{
           const selected=(form.values?.selected_teachers||[]).some(x=>x.id===t.id)
           return <label key={t.id} style={{display:'flex',alignItems:'center',gap:9,padding:'10px 12px',border:'1px solid #e5d8c5',borderRadius:10,cursor:'pointer'}}>
            <input type="checkbox" checked={selected} onChange={e=>{
             const current=form.values?.selected_teachers||[]
             const next=e.target.checked
              ? [...current.filter(x=>x.id!==t.id),{id:t.id,full_name:t.full_name}]
              : current.filter(x=>x.id!==t.id)
             onChange({...form,values:{
              ...(form.values||{}),
              selected_teachers:next,
              ...(form.values?.attendance_count_manual===true?{}:{'عدد الحضور':String(next.length)})
             }})
            }}/>
            <span>{t.full_name}</span>
           </label>
          })}
         </div>}
      </div>}
      {isParentsMeeting&&<div className="field wide"><span>أولياء الأمور المشاركون (اكتب الأسماء يدويًا)</span><textarea rows={3} value={form.values?.['أولياء الأمور المشاركون']||''} onChange={e=>onChange({...form,values:{...(form.values||{}),['أولياء الأمور المشاركون']:e.target.value}})} placeholder="اكتب أسماء أولياء الأمور المشاركين"/></div>}
      <div className="field"><span>عدد الحضور</span><input type="number" min="0" value={form.values?.['عدد الحضور']??''} onChange={e=>onChange({...form,values:{...(form.values||{}),['عدد الحضور']:e.target.value,attendance_count_manual:true}})}/></div>
      <div className="field"><span>التاريخ</span><input type="date" value={form.values?.['التاريخ']||''} onChange={e=>onChange({...form,values:{...(form.values||{}),['التاريخ']:e.target.value,['اليوم']:dayNameForDate(e.target.value)}})}/></div>
      <div className="field"><span>اليوم</span><input value={form.values?.['اليوم']||dayNameForDate(form.values?.['التاريخ'])} readOnly/></div>
      <div className="field wide"><span>موضوع الاجتماع</span><textarea rows={2} value={form.values?.['موضوع الاجتماع']||''} onChange={e=>onChange({...form,values:{...(form.values||{}),['موضوع الاجتماع']:e.target.value}})}/></div>
      <div className="field wide"><span>الهدف من الاجتماع</span><textarea rows={3} value={form.values?.['الهدف من الاجتماع']||''} onChange={e=>onChange({...form,values:{...(form.values||{}),['الهدف من الاجتماع']:e.target.value}})}/></div>
      <div className="field wide principal-meeting-points"><span>سير الاجتماع (النقاط التي تم نقاشها)</span>
       {(form.values?.['نقاط الاجتماع']||['']).map((point,index)=><div className="principal-meeting-point" key={index}><b>{index+1}.</b><textarea rows={2} value={point} onChange={e=>{const points=[...(form.values?.['نقاط الاجتماع']||[''])];points[index]=e.target.value;onChange({...form,values:{...(form.values||{}),['نقاط الاجتماع']:points}})}}/><button type="button" className="official-delete-row" aria-label="حذف النقطة" onClick={()=>{const points=(form.values?.['نقاط الاجتماع']||['']).filter((_,i)=>i!==index);onChange({...form,values:{...(form.values||{}),['نقاط الاجتماع']:points.length?points:['']}})}}><Trash2 size={14}/></button></div>)}
       <Button variant="secondary" onClick={()=>onChange({...form,values:{...(form.values||{}),['نقاط الاجتماع']:[...(form.values?.['نقاط الاجتماع']||['']), '']}})}><Plus size={15}/> إضافة نقطة</Button>
      </div>
     </div>}
    {config.multipleGoals&&<div className="annual-goals-editor">
      {inputFor('الهدف العام',form.values?.['الهدف العام'],v=>onChange({...form,values:{...(form.values||{}),['الهدف العام']:v}}))}
      {annualGoalFields(form.values).map((goal,i)=><section className="annual-goal-card" key={goal.goalKey}>
       <h3>{goal.title}</h3>
       {inputFor(goal.title,form.values?.[goal.goalKey],v=>onChange({...form,values:{...(form.values||{}),[goal.goalKey]:v}}))}
       <div className="annual-goal-outputs">{goal.outputs.map((label,j)=><div className="annual-output-editor" key={label}>
        {inputFor(`المخرج ${goalOrdinal(j)} للهدف الخاص ${goalOrdinal(i)}`,form.values?.[label],v=>onChange({...form,values:{...(form.values||{}),[label]:v}}))}
        <AnnualOutputActivityTable rows={form.values?.[annualOutputRowsKey(i,j)]||[]} onChange={next=>updateAnnualOutputRows(i,j,next)}/>
       </div>)}</div>
       <div style={{display:'flex',gap:8,justifyContent:'flex-start',marginTop:10}}><Button variant="secondary" onClick={()=>beginEditGoal(i)}>تعديل الهدف</Button><Button color="danger" onClick={()=>askDeleteGoal(i)}>حذف الهدف</Button></div>
      </section>)}
      <Button onClick={()=>onChange({...form,values:{...(form.values||{}),annual_goal_count:annualGoalFields(form.values).length+1}})}><Plus size={15}/> إضافة هدف خاص</Button>
     </div>}
     {fields.length>0&&tableMode&&!config.multipleGoals&&!config.hideFieldsInEntry&&<div className="generic-fields-grid">{fields.map(f=><React.Fragment key={f}>{isActivityForm&&f==='اليوم'?<div className="field"><span>اليوم</span><input value={form.values?.['اليوم']||dayNameForDate(form.values?.['التاريخ'])} readOnly/></div>:isActivityForm&&f==='التاريخ'?<div className="field"><span>التاريخ</span><input type="date" value={form.values?.['التاريخ']||''} onChange={e=>onChange({...form,values:{...(form.values||{}),['التاريخ']:e.target.value,...(activityHasDay?{'اليوم':dayNameForDate(e.target.value)}:{})}})}/></div>:(isStudentPicker&&(f==='اسم الطالب'||f==='الطالب'))?<div className="field"><span>{f}</span><select value={form.values?.student_id||''} onChange={e=>chooseStudent(e.target.value)}><option value="">اختر الطالب</option>{students.map(st=><option key={st.id} value={st.id}>{st.full_name}</option>)}</select></div>:inputFor(f,form.values?.[f],v=>onChange({...form,values:{...(form.values||{}),[f]:v}}))}</React.Fragment>)}</div>}
    {isStudentRoster?<><div className="generic-fields-grid">
      <div className="field"><span>الصف</span><select value={rosterGrade} onChange={e=>{setRosterGrade(e.target.value);setRosterSection('');setRosterStudent('')}}><option value="">جميع الصفوف</option>{grades.map(g=><option key={g.id} value={g.id}>{g.name}</option>)}</select></div>
      <div className="field"><span>الشعبة</span><select value={rosterSection} onChange={e=>{setRosterSection(e.target.value);setRosterStudent('')}}><option value="">جميع الشعب</option>{rosterSections.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></div>
      <div className="field"><span>اسم الطالب</span><select value={rosterStudent} onChange={e=>setRosterStudent(e.target.value)}><option value="">اختر الطالب</option>{rosterMatches.map(x=><option key={x.id} value={x.id}>{x.full_name} — {x.grades?.name||''} / {x.sections?.name||''}</option>)}</select></div>
      <div className="field" style={{alignSelf:'end'}}><Button onClick={addRosterStudent} disabled={!rosterStudent}><Plus size={15}/> إضافة الطالب المختار</Button></div>
     </div><div className="official-rows-head"><strong>أعضاء البرلمان المضافون ({rows.length})</strong></div>
     <div className="official-entry-table-wrap"><table className="official-entry-table parliament-members-table" style={{tableLayout:"fixed",width:"100%"}}><colgroup><col style={{width:"26%"}}/><col style={{width:"13%"}}/><col style={{width:"8%"}}/><col style={{width:"31%"}}/><col style={{width:"17%"}}/><col style={{width:"5%"}}/></colgroup><thead><tr>{config.columns.map(c=><th key={c}>{c}</th>)}<th>حذف</th></tr></thead><tbody>{rows.map((row,i)=><tr key={i}><td>{row.name||row['اسم الطالب']||'—'}</td><td>{row.grade||row['الصف']||'—'}</td><td>{row.section||row['الشعبة']||'—'}</td><td><div className="field"><select value={row.role||''} onChange={e=>updateRow(i,'role',e.target.value)}><option value="">اختر الصفة</option>{PARLIAMENT_ROLES.map((role,index)=><option key={`${index}-${role}`} value={role}>{role}</option>)}</select></div></td><td><div className="field"><input value={row.notes||''} onChange={e=>updateRow(i,'notes',e.target.value)}/></div></td><td><button className="official-delete-row" onClick={()=>del(i)}><Trash2 size={14}/></button></td></tr>)}</tbody></table></div>
    </>:tableMode?<>
      <div className="official-rows-head"><strong>سجل البيانات</strong><Button onClick={add}><Plus size={15}/> إضافة سجل</Button></div>
      <div className="official-entry-table-wrap"><table className={`official-entry-table ${idAnnualPlan(config)? "annual-plan-table":""} ${isParliamentMeeting?'parliament-team-meetings-table':''} ${isParliamentAchievement?'parliament-achievements-table':''} ${config.parliamentPlan?'parliament-plan-table':''}`} style={config.healthCases?{tableLayout:'fixed',width:'100%'}:idAnnualPlan(config)||isParliamentMeeting||isParliamentAchievement||config.parliamentPlan?{tableLayout:"fixed",width:"100%"}:undefined}>{config.parliamentPlan&&<colgroup><col style={{width:'16%'}}/><col style={{width:'22%'}}/><col style={{width:'8%'}}/><col style={{width:'19%'}}/><col style={{width:'15%'}}/><col style={{width:'15%'}}/><col style={{width:'5%'}}/></colgroup>}{idAnnualPlan(config)&&<colgroup><col style={{width:"22%"}}/>{Array.from({length:9},(_,i)=><col key={i} style={{width:"5.5%"}}/>)}<col style={{width:"14.25%"}}/><col style={{width:"14.25%"}}/></colgroup>}{isParliamentMeeting&&<colgroup><col style={{width:'10%'}}/><col style={{width:'12%'}}/><col style={{width:'19%'}}/><col style={{width:'23%'}}/><col style={{width:'31%'}}/><col style={{width:'5%'}}/></colgroup>}{isParliamentAchievement&&<colgroup><col style={{width:'10%'}}/><col style={{width:'13%'}}/><col style={{width:'24%'}}/><col style={{width:'20%'}}/><col style={{width:'28%'}}/><col style={{width:'5%'}}/></colgroup>}<thead>{idAnnualPlan(config)?<><tr><th rowSpan={2}>النشاط الاستراتيجي</th><th colSpan={4}>الفصل الأول</th><th colSpan={5}>الفصل الثاني</th><th rowSpan={2}>المسؤول / جهة التنفيذ</th><th rowSpan={2}>ملاحظات</th></tr><tr>{['9','10','11','12','1','2','3','4','5'].map(m=><th key={m}>{m}</th>)}</tr></>:<tr>{config.columns.map(c=><th key={c}>{c}</th>)}<th>حذف</th></tr>}</thead><tbody>{rows.map((row,i)=><tr key={i}>{config.columns.map(c=><td key={c}>{idAnnualPlan(config)&&c==='النشاط الاستراتيجي'?<div className="annual-plan-row-label"><strong>{annualRowLabel(row)}</strong><b>({annualRowTotal(row)})</b></div>:idAnnualPlan(config)&&annualMonths.includes(c)?<div className="field annual-plan-month-field"><input type="number" min="0" step="1" inputMode="numeric" aria-label={`${annualRowLabel(row)} — شهر ${c}`} value={row[c]??'0'} onChange={e=>updateRow(i,c,e.target.value)}/></div>:(isParliamentMeeting||isParliamentAchievement)&&c==='اليوم'?<div className="field"><input value={row[c]||dayNameForDate(row['التاريخ'])} readOnly aria-label="اليوم"/></div>:(isParliamentMeeting||isParliamentAchievement)&&c==='التاريخ'?<div className="field"><input type="date" value={row[c]||''} onChange={e=>updateParliamentDate(i,e.target.value)}/></div>:isParliamentMeeting&&c==='الحضور'?<div className="parliament-attendance-options">{parliamentMembers.length?parliamentMembers.map(member=><label key={member.id}><input type="checkbox" checked={(Array.isArray(row[c])?row[c]:String(row[c]||'').split('،').map(x=>x.trim())).includes(member.name)} onChange={e=>updateAttendance(i,member.name,e.target.checked)}/><span>{member.name}</span></label>):<span className="parliament-attendance-empty">أضف أعضاء البرلمان أولًا من بند الأسماء</span>}</div>:config.healthCases&&c==='اسم الطالب'?<div className="field" style={{position:'relative'}}><input type="text" value={row.student_id?row[c]||'':row._studentSearch||''} placeholder="اكتب جزءاً من اسم الطالب..." autoComplete="off" onChange={e=>{const value=e.target.value;onChange({...form,rows:rows.map((r,index)=>index===i?{...r,student_id:'',_studentSearch:value,[c]:'','التاريخ':value.trim()?(r['التاريخ']||todayLocal()):(r['التاريخ']||''),'الصف والشعبة':''}:r)})}}/>{!row.student_id&&row._studentSearch?.trim()&&<div className="official-student-search-results" style={{position:'relative',width:'100%',background:'#fff',border:'1px solid #d8c89f',borderRadius:10,marginTop:5,maxHeight:220,overflowY:'auto',boxShadow:'0 5px 16px rgba(0,0,0,.12)'}}>{students.filter(st=>(st.full_name||'').toLowerCase().includes(row._studentSearch.trim().toLowerCase())).slice(0,12).map(st=><button type="button" key={st.id} onClick={()=>{const grade=st.grades?.name||grades.find(g=>String(g.id)===String(st.grade_id))?.name||'';const section=st.sections?.name||sections.find(x=>String(x.id)===String(st.section_id))?.name||'';onChange({...form,rows:rows.map((r,index)=>index===i?{...r,student_id:st.id,_studentSearch:'',[c]:st.full_name,'الصف والشعبة':[grade,section].filter(Boolean).join(' / ')}:r)})}} style={{display:'block',width:'100%',padding:'11px 12px',textAlign:'right',background:'#fff',border:0,borderBottom:'1px solid #eee',fontSize:14,cursor:'pointer',color:'#173f3b'}}>{st.full_name}</button>)}{!students.some(st=>(st.full_name||'').toLowerCase().includes(row._studentSearch.trim().toLowerCase()))&&<div style={{padding:12,textAlign:'center',color:'#888'}}>لا توجد أسماء مطابقة</div>}</div>}</div>:config.consultationsMonitor&&c==='الطالب/الشخص'?<div className="field"><select value={row.student_id||''} onChange={e=>{const st=students.find(x=>String(x.id)===String(e.target.value));if(!st)return;onChange({...form,rows:rows.map((r,index)=>index===i?{...r,student_id:st.id,[c]:st.full_name}:r)})}}><option value="">اختر الطالب</option>{students.map(st=><option key={st.id} value={st.id}>{st.full_name}</option>)}</select></div>:<div className="field">{(isParliamentMeeting||isParliamentAchievement||isActivityForm)&&c==='اليوم'?<input value={row[c]||''} readOnly aria-label="اليوم"/>:(isActivityForm&&c==='التاريخ')?<input type="date" value={row[c]||''} onChange={e=>{const value=e.target.value;onChange({...form,rows:rows.map((r,index)=>index===i?{...r,[c]:value,...(activityHasDay?{'اليوم':dayNameForDate(value)}:{})}:r)})}}/>:(isParliamentMeeting&&c==='التاريخ')||(isParliamentAchievement&&c==='التاريخ')?<input type="date" value={row[c]||''} onChange={e=>updateParliamentDate(i,e.target.value)}/>: (isParliamentMeeting&&c==='القرارات والتوصيات')||(isParliamentAchievement&&['النشاط (نوعه /اسمه)','الهدف منه','الموجز'].includes(c))||(config.parliamentPlan&&['الهدف الخاص','الإجراءات والأنشطة','النتائج المتوقعة','ملاحظات','مهمة التنفيذ'].includes(c))?<textarea rows={config.parliamentPlan?4:3} value={row[c]||''} onChange={e=>updateRow(i,c,e.target.value)}/>:<input type={(isMeetingForm&&c===dateColumn)|| (config.healthCases&&c==='التاريخ')?'date':'text'} value={row[c]||''} onChange={e=>updateRow(i,c,e.target.value)}/>}</div>}</td>)}{!idAnnualPlan(config)&&<td><button className="official-delete-row" onClick={()=>del(i)}><Trash2 size={14}/></button></td>}</tr>)}</tbody></table></div>{isParliamentAchievement&&<div className="parliament-achievement-attachments"><input ref={achievementFileInput} type="file" hidden multiple accept=".png,.jpg,.jpeg,.gif,.webp,.bmp,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.odt,.ods,.odp,image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation" onChange={uploadAchievementFiles}/><Button variant="secondary" onClick={()=>achievementFileInput.current?.click()} disabled={achievementUploading}><Paperclip size={16}/>{achievementUploading?'جارٍ رفع المرفقات...':'إضافة المرفقات'}</Button><span className="parliament-achievement-attachment-hint">صور أو ملفات Office أو PDF (حتى 10 MB لكل ملف)</span>{(form.attachments||[]).length>0&&<div className="parliament-achievement-attachment-list">{form.attachments.map((a,i)=><div className="parliament-achievement-attachment" key={a.storage_path||i}><FileText size={16}/><span>{a.file_name}</span><button type="button" onClick={()=>openAchievementFile(a)} title="فتح المرفق"><ExternalLink size={14}/></button><button type="button" onClick={()=>removeAchievementFile(a)} title="حذف المرفق"><Trash2 size={14}/></button></div>)}</div>}</div>}
    </>:<div className="generic-fields-grid">{fields.map((f,i)=><React.Fragment key={f}>{(isStudentPicker&&(f==='اسم الطالب'||f==='الطالب'))?<div className="field"><span>بحث عن الطالب</span><input value={studentSearch} placeholder="اكتب جزءًا من اسم الطالب..." autoComplete="off" onChange={e=>{const value=e.target.value;setStudentSearch(value);onChange({...form,values:{...(form.values||{}),student_id:'',[f]:'',...(f==='الطالب'?{'الصف':'','الشعبة':''}:{'الصف والشعبة':''})}})}}/>
{studentSearch.trim()&&<div className="official-student-search-results" style={{position:'relative',zIndex:20,background:'#fff',border:'1px solid #d8c89f',borderRadius:10,marginTop:5,maxHeight:220,overflowY:'auto',boxShadow:'0 5px 16px rgba(0,0,0,.12)'}}>
{students.filter(st=>(st.full_name||'').toLowerCase().includes(studentSearch.trim().toLowerCase())).slice(0,12).map(st=><button type="button" key={st.id} onClick={()=>{chooseStudent(st.id);setStudentSearch(st.full_name)}} style={{display:'block',width:'100%',padding:'11px 12px',textAlign:'right',background:'#fff',border:0,borderBottom:'1px solid #eee',fontSize:14,cursor:'pointer',color:'#173f3b'}}>{st.full_name}</button>)}
{!students.some(st=>(st.full_name||'').toLowerCase().includes(studentSearch.trim().toLowerCase()))&&<div style={{padding:12,textAlign:'center',color:'#888'}}>لا توجد أسماء مطابقة</div>}
</div>}</div>:inputFor(f,form.values?.[f],v=>onChange({...form,values:{...(form.values||{}),[f]:v}}))}</React.Fragment>)}</div>}
    <div className="official-signature-row"><div><span>اسم المرشد التربوي</span><strong>{profile?.full_name||'—'}</strong><span>اسم المدير</span><strong>{profile?.manager_name||'—'}</strong></div><div><span>التوقيع</span><div className="official-signature-script">{profile?.signature||profile?.full_name||'التوقيع'}</div></div></div>
    <div className="meeting-entry-actions"><Button onClick={saveWithNotice}><Save size={16}/> حفظ البيانات</Button><Button variant="secondary" onClick={onShowPreview}><Eye size={16}/> عرض النموذج الرسمي</Button></div>
   </div>
   {goalDialog&&<div role="presentation" style={{position:'fixed',inset:0,zIndex:99999,background:'rgba(0,0,0,.55)',display:'flex',alignItems:'center',justifyContent:'center',padding:18}}>
    <div role="dialog" aria-modal="true" style={{background:'#fffaf0',borderRadius:18,padding:22,width:'min(560px,100%)',maxHeight:'85vh',overflowY:'auto',boxShadow:'0 18px 60px rgba(0,0,0,.3)',direction:'rtl'}}>
     {goalDialog.type==='delete'?<><h3>تأكيد حذف الهدف</h3><p>هل أنت متأكد من حذف الهدف الخاص {goalOrdinal(goalDialog.index)} ومخرجاته الثلاثة؟</p><div style={{display:'flex',gap:10,justifyContent:'center'}}><Button onClick={commitGoalDelete}>تأكيد الحذف</Button><Button variant="secondary" onClick={()=>setGoalDialog(null)}>إلغاء</Button></div></>:<><h3>تعديل الهدف الخاص {goalOrdinal(goalDialog.index)}</h3><div className="field"><span>الهدف الخاص</span><textarea rows={2} value={goalDraft.goal} onChange={e=>setGoalDraft(d=>({...d,goal:e.target.value}))}/></div>{goalDraft.outputs.map((v,j)=><div className="field" key={j}><span>المخرج {goalOrdinal(j)}</span><textarea rows={2} value={v} onChange={e=>setGoalDraft(d=>({...d,outputs:d.outputs.map((x,k)=>k===j?e.target.value:x)}))}/></div>)}<div style={{display:'flex',gap:10,justifyContent:'center'}}><Button onClick={commitGoalEdit}>حفظ التعديل</Button><Button variant="secondary" onClick={()=>setGoalDialog(null)}>إلغاء</Button></div></>}
    </div>
   </div>}
   {notice&&<div role="status" className="generic-save-toast">{notice}</div>}
 </div>
}

export function GenericOfficialPreview({title,config,profile,academic,form,students=[],records=[]}){
 const rows=config.healthCases?records.flatMap(record=>(record.form_data?.rows||[]).map(row=>({...row,'اسم الطالب':row['اسم الطالب']||students.find(st=>String(st.id)===String(row.student_id))?.full_name||''}))):config.studentRoster?(form.rows||[]).filter(r=>r?.student_id||r?.name):(form.rows||[]); const vals=form.values||{}; const cols=config.columns||[];
 const [achievementAttachmentUrls,setAchievementAttachmentUrls]=useState({});
 const [achievementAttachmentStatus,setAchievementAttachmentStatus]=useState({});
 useEffect(()=>{
  let active=true;
  const attachments=config.parliamentAchievement?(form.attachments||[]):[];
  setAchievementAttachmentUrls({});
  setAchievementAttachmentStatus(Object.fromEntries(attachments.map(a=>[a.storage_path,'loading'])));
  (async()=>{
   const entries=await Promise.all(attachments.map(async(a)=>{
    try{
     if(!a.storage_path)throw new Error('مسار المرفق غير متوفر');
     const url=await getParliamentAchievementAttachmentUrl(a.storage_path);
     return [a.storage_path,url,'ready'];
    }catch(error){return [a.storage_path,'','error'];}
   }));
   if(!active)return;
   setAchievementAttachmentUrls(Object.fromEntries(entries.map(([path,url])=>[path,url])));
   setAchievementAttachmentStatus(Object.fromEntries(entries.map(([path,,status])=>[path,status])));
  })();
  return()=>{active=false};
 },[config.parliamentAchievement,form.attachments]);
 return <div className={`official-document generic-official-document ${config.parliamentPlan?'parliament-plan-document':''} ${config.annualPlan?'annual-plan-document':''}`}>
  <OfficialDocumentHeader profile={profile}/>
  <div className="official-doc-heading">
   <h1>{config.teacherMeeting?'نموذج اجتماعات معلمي/ات المدرسة':config.principalMeeting?'نموذج اجتماعات مدير/ة المدرسة':(config.parliamentPlan?'خطة البرلمان الطلابي':title)}</h1>
   <p>للعام الدراسي {academic.yearName||'................'} — الفصل الدراسي {academic.semesterName||'................'}</p>
</div>
  {(config.principalMeeting||config.teacherMeeting||config.parentsMeeting)?<section className="principal-meeting-preview" style={{textAlign:'right',direction:'rtl'}}>
   <h2 style={{textAlign:'center',fontSize:'20px',margin:'0 0 16px'}}>محضر اجتماع</h2>
   <h3 style={{textAlign:'right',fontSize:'15px',fontWeight:600,margin:'0 0 16px'}}>الفئة المستهدفة: {config.parentsMeeting?'أولياء أمور الطلبة':config.teacherMeeting?'معلموا/ات المدرسة':'مدير/ة المدرسة'}</h3>{config.parentsMeeting&&<div style={{textAlign:'right',fontSize:'14px',margin:'0 0 14px'}}><strong>أولياء الأمور المشاركون:</strong><p style={{whiteSpace:'pre-wrap',margin:'8px 0'}}>{vals['أولياء الأمور المشاركون']||'........................'}</p></div>}{config.teacherMeeting&&<div style={{textAlign:'right',fontSize:'14px',margin:'0 0 14px'}}>
    <strong>المعلمون المشاركون:</strong>
    {Array.isArray(vals.selected_teachers)&&vals.selected_teachers.length
     ? <ul style={{margin:'8px 0',paddingRight:24}}>
       {vals.selected_teachers.map((t,i)=><li key={t.id||`${t.full_name}-${i}`} style={{marginBottom:4}}>{t.full_name}</li>)}
      </ul>
     : ' ........................'}
   </div>}
   {<>
   <div className="principal-meeting-meta" style={{display:'flex',flexWrap:'wrap',alignItems:'center',fontSize:'13px',lineHeight:1.7,textAlign:'right',justifyContent:'flex-start',columnGap:'36px',rowGap:'10px'}}><span><b>عدد الحضور:</b> {vals['عدد الحضور']||'........'}</span><span><b>اليوم:</b> {vals['اليوم']|| (vals['التاريخ']?new Intl.DateTimeFormat('ar',{weekday:'long'}).format(new Date(`${vals['التاريخ']}T12:00:00`)):'........')}　 <b>التاريخ:</b> {vals['التاريخ']?new Date(`${vals['التاريخ']}T12:00:00`).toLocaleDateString('en-GB')+' م':'........'}</span></div>
   <div className="principal-meeting-section" style={{textAlign:'center',marginTop:'18px'}}><h3 style={{fontSize:'14px',margin:'0 0 5px',textAlign:'center'}}>موضوع الاجتماع:</h3><p style={{fontSize:'13px',lineHeight:1.6,margin:0,textAlign:'center'}}>{vals['موضوع الاجتماع']||'........................................................'}</p></div>
   <div className="principal-meeting-section" style={{textAlign:'center',marginTop:'16px'}}><h3 style={{fontSize:'14px',margin:'0 0 5px',textAlign:'center'}}>الهدف من الاجتماع:</h3><p style={{fontSize:'13px',lineHeight:1.6,margin:0,textAlign:'center'}}>{vals['الهدف من الاجتماع']||'........................................................'}</p></div>
   <div className="principal-meeting-section" style={{textAlign:'right',direction:'rtl',marginTop:'16px'}}><h3 style={{fontSize:'14px',margin:'0 0 5px',textAlign:'right'}}>سير الاجتماع (النقاط التي تم نقاشها):</h3><ol style={{fontSize:'13px',lineHeight:1.6,margin:'5px 0 0',paddingRight:'24px',textAlign:'right',listStylePosition:'outside'}}>{(vals['نقاط الاجتماع']||[]).filter(x=>String(x||'').trim()).map((point,i)=><li key={i}>{point}</li>)}</ol></div>
  </>}
  </section>:config.multipleGoals?<div className="generic-paper-fields annual-goals-preview">
   <div className="generic-paper-field"><strong>الهدف العام</strong><span>{vals['الهدف العام']||'.................................................................'}</span></div>
   {annualGoalFields(vals).map((goal,i)=><section className="annual-goal-preview" key={goal.goalKey}><h3>{goal.title}</h3><div className="generic-paper-field"><strong>{goal.title}</strong><span>{vals[goal.goalKey]||'.................................................................'}</span></div>{goal.outputs.map((label,j)=><section className="annual-output-preview" key={label}>
    <div className="generic-paper-field">
     <strong>المخرج {goalOrdinal(j)} للهدف الخاص {goalOrdinal(i)}</strong>
     <span>{vals[label]||'.................................................................'}</span>
    </div>
    <AnnualOutputActivityTable
     rows={vals[annualOutputRowsKey(i,j)]||[]}
     readOnly
    />
   </section>)}</section>)}
  </div>:!config.hideFieldsInPreview&&config.fields?.length>0&&<div className={`generic-paper-fields ${config.parliamentPlan?'parliament-plan-goal':''}`}>{config.fields.map(f=><div className="generic-paper-field" key={f}><strong>{f}</strong><span>{vals[f]||'.................................................................'}</span></div>)}</div>}{cols.length>0&&<table className={`official-doc-table ${config.annualPlan?'annual-plan-table':''} ${config.parliamentTeamMeeting?'parliament-team-meetings-preview':''} ${config.parliamentAchievement?'parliament-achievements-preview':''} ${config.parliamentPlan?'parliament-plan-preview-table':''} ${config.healthCases?'health-cases-preview-table':''} ${config.consultationsMonitor?'consultations-monitor-preview-table':''} ${config.hotCasesPreviewHeader?'hot-cases-preview-header':''}`}>{config.healthCases&&<colgroup><col style={{width:'12%'}}/><col style={{width:'25%'}}/><col style={{width:'15%'}}/><col style={{width:'18%'}}/><col style={{width:'15%'}}/><col style={{width:'15%'}}/></colgroup>}{config.studentRoster&&<colgroup><col style={{width:"26%"}}/><col style={{width:"13%"}}/><col style={{width:"8%"}}/><col style={{width:"31%"}}/><col style={{width:"17%"}}/></colgroup>}{config.parliamentPlan&&<colgroup><col style={{width:'17%'}}/><col style={{width:'23%'}}/><col style={{width:'9%'}}/><col style={{width:'20%'}}/><col style={{width:'16%'}}/><col style={{width:'15%'}}/></colgroup>}{config.parliamentTeamMeeting&&<colgroup><col style={{width:'10%'}}/><col style={{width:'12%'}}/><col style={{width:'19%'}}/><col style={{width:'23%'}}/><col style={{width:'36%'}}/></colgroup>}{config.parliamentAchievement&&<colgroup><col style={{width:'10%'}}/><col style={{width:'13%'}}/><col style={{width:'24%'}}/><col style={{width:'20%'}}/><col style={{width:'33%'}}/></colgroup>}{config.annualPlan&&<colgroup><col style={{width:"22%"}}/>{Array.from({length:9},(_,i)=><col key={i} style={{width:"5.5%"}}/>)}<col style={{width:"14.25%"}}/><col style={{width:"14.25%"}}/></colgroup>}<thead>{config.annualPlan?<><tr><th rowSpan={2}>النشاط الاستراتيجي</th><th colSpan={4}>الفصل الأول</th><th colSpan={5}>الفصل الثاني</th><th rowSpan={2}>المسؤول / جهة التنفيذ</th><th rowSpan={2}>ملاحظات</th></tr><tr>{['9','10','11','12','1','2','3','4','5'].map(m=><th key={m}>{m}</th>)}</tr></>:<tr>{cols.map(c=><th key={c}>{c}</th>)}</tr>}</thead><tbody>{(rows.length?rows:[{}]).map((r,i)=><tr key={i}>{config.studentRoster?<><td>{r.name||r['اسم الطالب']||' '}</td><td>{r.grade||r['الصف']||' '}</td><td>{r.section||r['الشعبة']||' '}</td><td>{r.role||' '}</td><td>{r.notes||' '}</td></>:cols.map(c=><td key={c}>{config.annualPlan&&c==='النشاط الاستراتيجي'?`${annualRowLabel(r)} (${annualRowTotal(r)})`:c==='الحضور'?(Array.isArray(r[c])?r[c].join('، '):r[c]||' '):config.parliamentAchievement&&c==='اليوم'?(r[c]||(r['التاريخ']?new Intl.DateTimeFormat('ar',{weekday:'long'}).format(new Date(`${r['التاريخ']}T12:00:00`)):' ')):r[c]||' '}</td>)}</tr>)}</tbody></table>}{config.parliamentAchievement&&(form.attachments||[]).length>0&&<section className="parliament-achievement-print-attachments"><h3>المرفقات</h3>{form.attachments.map((a,i)=>{const url=achievementAttachmentUrls[a.storage_path]||'';const name=a.file_name||`مرفق ${i+1}`;const type=(a.mime_type||'').toLowerCase();const isImage=type.startsWith('image/')||/\.(png|jpe?g|gif|webp|bmp)$/i.test(name);const isPdf=type==='application/pdf'||/\.pdf$/i.test(name);const status=achievementAttachmentStatus[a.storage_path]||'loading';return <div className="parliament-achievement-print-attachment" key={a.storage_path||i}><strong>{name}</strong>{isImage&&url?<a className="parliament-achievement-image-link" href={url} target="_blank" rel="noreferrer"><img src={url} alt={name} loading="eager" decoding="sync" onError={e=>{e.currentTarget.style.display='none';setAchievementAttachmentStatus(prev=>({...prev,[a.storage_path]:'image-error'}))}}/></a>:isImage&&status==='loading'?<span>جارٍ تحميل معاينة الصورة…</span>:isImage?<span>تعذّر تحميل الصورة. استخدم رابط فتح / تنزيل المرفق.</span>:isPdf&&url?<iframe title={name} src={url} loading="eager"/>:null}{url&&<a href={url} target="_blank" rel="noreferrer">فتح / تنزيل المرفق: {name}</a>}{!url&&status==='loading'&&<span>جارٍ تجهيز المرفق للمعاينة…</span>}{!url&&status==='error'&&<span>تعذّر إنشاء رابط معاينة لهذا المرفق. تحقق من صلاحيات مخزن الملفات.</span>}</div>})}</section>}
  <div className="official-signature-block" style={(config.principalMeeting||config.teacherMeeting||config.parentsMeeting)?{direction:'rtl',textAlign:'left',justifyContent:'flex-start'}:undefined}>{(config.principalMeeting||config.teacherMeeting||config.parentsMeeting)?<div style={{textAlign:'left'}}><strong>توقيع المرشد/ة التربوي/ة</strong><span>{profile?.full_name||'........................'}</span></div>:<><div><strong>اسم وتوقيع المرشد/ة التربوي/ة</strong><span>{profile?.full_name||'........................'}</span></div><div><strong>اسم وتوقيع مدير/ة المدرسة</strong><span>{profile?.manager_name||'........................'}</span></div></>}</div>
 </div>
}
