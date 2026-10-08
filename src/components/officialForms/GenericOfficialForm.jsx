import React,{useMemo,useState}from'react'
import{Button}from'../UI'
import OfficialDocumentHeader from './OfficialDocumentHeader'
import{Eye,Plus,Trash2,Save,Printer,Maximize2,X}from'lucide-react'

export const FORM_CONFIGS={
 'meeting-summary':{fields:['الشخص الذي تمت مقابلته','المجموع العام','ملاحظات'],columns:['الشخص الذي تمت مقابلته','المجموع العام','ملاحظات'],rows:['مدير المدرسة','المعلم','ولي الأمر','مؤسسات أخرى']},
 'case-study':{fields:['اسم الطالب','الصف والشعبة','تاريخ فتح الحالة','عدد الجلسات','وصف المشكلة','التشخيص الأولي','خطة التدخل','آلية المتابعة','ملاحظات المرشد'],columns:[]},
 'hot-cases-monitor':{fields:['الرقم','رمز الطالب','الصف','تاريخ','المشكلة','تصنيف الحالة','جهة تحويل الحالة','الإجراءات/المتابعة'],columns:['الرقم','رمز الطالب','الصف','تاريخ','المشكلة','تصنيف الحالة','جهة التحويل','الإجراءات/المتابعة']},
 'hot-case-notice':{fields:['اسم الطالب','الصف والشعبة','تاريخ الحالة','وصف المشكلة','الإجراءات المتخذة','جهة التحويل','ملاحظات'],columns:[]},
 'student-issues-monitor':{fields:['الرقم','رمز الطالب','الصف','نوع المشكلة','تاريخ الرصد','الإجراءات','المتابعة'],columns:['الرقم','رمز الطالب','الصف','نوع المشكلة','تاريخ الرصد','الإجراءات','المتابعة']},
 'student-consultations':{fields:['الطالب','التاريخ','نوع المقابلة','الموضوع','ملخص المقابلة/الملاحظات','الإجراءات','النتائج'],columns:[]},
 'consultations-monitor':{fields:['التاريخ','الطالب/الشخص','نوع الاستشارة','الموضوع','الإجراء','الملاحظات'],columns:['التاريخ','الطالب/الشخص','نوع الاستشارة','الموضوع','الإجراء','الملاحظات']},
 'repeated-absence':{fields:['الرقم','الطالب','الصف','الشعبة','عدد مرات الغياب','الشهر','الأسباب','الإجراءات','الملاحظات'],columns:['الرقم','الطالب','الصف','الشعبة','عدد مرات الغياب','الشهر','الأسباب','الإجراءات']},
 'absence-followup':{fields:['الطالب','الصف','الشعبة','عدد مرات الغياب','الشهر','الأسباب','الإجراءات','النتائج'],columns:[]},
 'repeated-lateness':{fields:['الرقم','الطالب','الصف','الشعبة','عدد مرات التأخر','الشهر','الأسباب','الملاحظات'],columns:['الرقم','الطالب','الصف','الشعبة','عدد مرات التأخر','الشهر','الأسباب','الملاحظات']},
 'lateness-followup':{fields:['الطالب','الصف','الشعبة','عدد مرات التأخر للشهر','الأسباب','الإجراءات','النتائج'],columns:[]},
 'dropout-monitor':{fields:['الرقم','رمز الطالب','الصف','الشعبة','تاريخ التسرب','الأسباب','الإجراءات/المتابعة'],columns:['الرقم','رمز الطالب','الصف','الشعبة','تاريخ التسرب','الأسباب','الإجراءات/المتابعة']},
 'dropout-followup':{fields:['الطالب','الصف','الشعبة','تاريخ التسرب','الأسباب من وجهة نظر الطالب','رأي ولي الأمر','وجهة نظر المرشد','الإجراءات','النتائج'],columns:[]},
 'hot-cases-school':{fields:['الرقم','رمز الطالب','الصف','عدد الحالات','نوع المشكلة','الإجراءات'],columns:['الرقم','رمز الطالب','الصف','عدد الحالات','نوع المشكلة','الإجراءات']},
 'hot-cases-directorate':{fields:['الرقم','رمز الطالب','الصف','تاريخ','المشكلة','تصنيف الحالة','جهة تحويل الحالة','الإجراءات/المتابعة'],columns:['الرقم','رمز الطالب','الصف','تاريخ','المشكلة','تصنيف الحالة','جهة تحويل الحالة','الإجراءات/المتابعة']},
 'activities-monitor':{fields:['الشهر','الزيارات','النشرات','الإذاعة','الندوات','المحاضرات','ورشات العمل','مجلة حائط','المجموع'],columns:['الشهر','الزيارات','النشرات','الإذاعة','الندوات','المحاضرات','ورشات العمل','مجلة حائط','المجموع'],rows:['أيلول (9)','تشرين أول (10)','تشرين ثاني (11)','كانون أول (12)','كانون ثاني (1)','شباط (2)','آذار (3)','نيسان (4)','أيار (5)','حزيران (6)']},
 'visits':{fields:['اليوم','التاريخ','الجهة/المكان','الغرض من الزيارة','الإجراءات','الملاحظات'],columns:['اليوم','التاريخ','الجهة/المكان','الغرض من الزيارة','الإجراءات','الملاحظات']},
 'newsletters':{fields:['اليوم','التاريخ','موضوع النشرة','الفئة المستهدفة','وسيلة النشر','عدد المستفيدين','الملاحظات'],columns:[]},
 'morning-radio':{fields:['اليوم','التاريخ','موضوع الإذاعة','الفئة المستهدفة','المشاركون','الأهداف','الملاحظات'],columns:[]},
 'seminars-workshops':{fields:['اليوم','التاريخ','الموضوع','نوع النشاط','الفئة المستهدفة','القائم بالنشاط','الجهة التي يعمل بها','أهداف النشاط','التوصيات'],columns:[]},
 'wall-magazine':{fields:['اليوم','التاريخ','موضوع المجلة','الفئة المستهدفة','المشاركون في الإعداد','الأهداف','الملاحظات'],columns:[]},
 'group-session-summary':{fields:['المجموعة العلاجية رقم','المشكلة','عدد أفراد المجموعة','أهداف الجلسة','موضوع الجلسة','الإجراءات','النتائج','ملاحظات'],columns:[]},
 'group-session-details':{fields:['رقم المجموعة','المشكلة','عدد أفراد المجموعة','عدد الجلسات','وصف المشكلة','خطة التدخل','المتابعة','ملاحظات'],columns:[]},
 'group-sessions-monitor':{fields:['الموضوع','مجموع عدد اللقاءات','الصفوف المستفيدة','عدد الطلبة','ملاحظات'],columns:['الموضوع','مجموع عدد اللقاءات','الصفوف المستفيدة','عدد الطلبة','ملاحظات']},
 'guidance-meetings-followup':{fields:['اسم المرشد/ة','اليوم/التاريخ','الحصة','الصف','الموضوع','الأهداف','ملاحظات الأنشطة'],columns:['اليوم/التاريخ','الحصة','الصف','الموضوع','الأهداف','ملاحظات الأنشطة']},
 'guidance-meetings-monitor':{fields:['الموضوع','مجموع عدد اللقاءات','الصفوف','عدد المستفيدين','ملاحظات'],columns:['الموضوع','مجموع عدد اللقاءات','الصفوف','عدد المستفيدين','ملاحظات']},
 'weekly-program-form':{fields:['اليوم','التاريخ','النشاط/الفعالية','الفئة المستهدفة','المكان','الزمن','ملاحظات'],columns:['اليوم','التاريخ','النشاط/الفعالية','الفئة المستهدفة','المكان','الزمن','ملاحظات']},
 'annual-plan':{fields:['الهدف','المخرجات','الأنشطة','الفترة الزمنية','الحالة/وضع الإنجاز','الملاحظات'],columns:[]},
 'plan':{fields:['الهدف','مخرج رقم','النشاط','الشهر','الحالة/وضع الإنجاز','ملاحظات'],columns:['مخرج رقم','الأنشطة','10','11','12','الحالة/وضع الإنجاز','ملاحظات']},
 'semester-report':{fields:['مقدمة وخلفية','أهم الإنجازات','عرض تحليلي للإنجازات','التحديات والصعوبات','الفرص','أهم الأنشطة للفصل القادم','ملاحظات'],columns:[]}
}

const inputFor=(label,value,onChange)=><div className="field"><span>{label}</span>{label.includes('الأهداف')||label.includes('الإجراءات')||label.includes('ملاحظات')||label.includes('وصف')||label.includes('التشخيص')||label.includes('خطة')||label.includes('النتائج')||label.includes('الموضوع')||label.includes('التوصيات')||label.includes('المشكلة')?<textarea value={value||''} onChange={e=>onChange(e.target.value)} rows={2}/>:<input value={value||''} onChange={e=>onChange(e.target.value)}/>}</div>

export default function GenericOfficialForm({config,title,profile,academic,form,onChange,onShowPreview,onSave}){
 const rows=form.rows||[{}];
 const updateRow=(i,k,v)=>onChange({...form,rows:rows.map((r,idx)=>idx===i?{...r,[k]:v}:r)})
 const add=()=>onChange({...form,rows:[...rows,{}]})
 const del=i=>onChange({...form,rows:rows.filter((_,idx)=>idx!==i)})
 const fields=config.fields||[];const tableMode=(config.columns||[]).length>0
 return <div className="generic-form-entry">
   <div className="official-workspace-head"><div><h2>{title}</h2><p>نموذج إدخال إلكتروني — البيانات تنعكس تلقائيًا على النموذج الرسمي.</p></div><div className="official-workspace-actions"><Button onClick={onShowPreview}><Eye size={16}/> عرض النموذج الرسمي</Button><Button variant="secondary" onClick={onSave}><Save size={16}/> حفظ</Button></div></div>
   <div className="official-entry-card">
    <div className="official-entry-section-title"><div><strong>البيانات التلقائية</strong><span>يتم جلبها من ملف المرشد وإعدادات النظام</span></div></div>
    <div className="official-auto-grid"><div className="official-auto-field"><span>السنة الدراسية</span><strong>{academic.yearName||'—'}</strong></div><div className="official-auto-field"><span>الفصل الدراسي</span><strong>{academic.semesterName||'—'}</strong></div><div className="official-auto-field"><span>اسم المرشد التربوي</span><strong>{profile?.full_name||'—'}</strong></div><div className="official-auto-field"><span>اسم المدير</span><strong>{profile?.manager_name||'—'}</strong></div><div className="official-auto-field wide"><span>المدرسة</span><strong>{profile?.schools?.name||'—'}</strong></div><div className="official-auto-field"><span>المديرية</span><strong>{profile?.directorates?.name||'—'}</strong></div></div>
    <div className="official-auto-note">المعلومات الإدارية لا تحتاج إلى إعادة إدخالها في كل نموذج.</div>
    {tableMode?<>
      <div className="official-rows-head"><strong>سجل البيانات</strong><Button onClick={add}><Plus size={15}/> إضافة سجل</Button></div>
      <div className="official-entry-table-wrap"><table className="official-entry-table"><thead><tr>{config.columns.map(c=><th key={c}>{c}</th>)}<th>حذف</th></tr></thead><tbody>{rows.map((row,i)=><tr key={i}>{config.columns.map(c=><td key={c}><div className="field"><input value={row[c]||''} onChange={e=>updateRow(i,c,e.target.value)}/></div></td>)}<td><button className="official-delete-row" onClick={()=>del(i)}><Trash2 size={14}/></button></td></tr>)}</tbody></table></div>
    </>:<div className="generic-fields-grid">{fields.map((f,i)=><React.Fragment key={f}>{inputFor(f,form.values?.[f],v=>onChange({...form,values:{...(form.values||{}),[f]:v}}))}</React.Fragment>)}</div>}
    <div className="official-signature-row"><div><span>اسم المرشد التربوي</span><strong>{profile?.full_name||'—'}</strong><span>اسم المدير</span><strong>{profile?.manager_name||'—'}</strong></div><div><span>التوقيع</span><div className="official-signature-script">{profile?.signature||profile?.full_name||'التوقيع'}</div></div></div>
    <div className="meeting-entry-actions"><Button onClick={onSave}><Save size={16}/> حفظ البيانات</Button><Button variant="secondary" onClick={onShowPreview}><Eye size={16}/> عرض النموذج الرسمي</Button></div>
   </div>
 </div>
}

export function GenericOfficialPreview({title,config,profile,academic,form}){
 const rows=form.rows||[]; const vals=form.values||{}; const cols=config.columns||[];
 return <div className="official-document generic-official-document">
  <OfficialDocumentHeader/><div className="official-doc-heading"><h1>{title}</h1><p>للعام الدراسي {academic.yearName||'................'} — الفصل الدراسي {academic.semesterName||'................'}</p><p>{profile?.schools?.name||''} {profile?.directorates?.name?` — ${profile.directorates.name}`:''}</p></div>
  {cols.length?<table className="official-doc-table"><thead><tr>{cols.map(c=><th key={c}>{c}</th>)}</tr></thead><tbody>{(rows.length?rows:[{}]).map((r,i)=><tr key={i}>{cols.map(c=><td key={c}>{r[c]||' '}</td>)}</tr>)}</tbody></table>:<div className="generic-paper-fields">{config.fields.map(f=><div className="generic-paper-field" key={f}><strong>{f}</strong><span>{vals[f]||'.................................................................'}</span></div>)}</div>}
  <div className="official-signature-block"><div><strong>اسم وتوقيع المرشد التربوي</strong><span>{profile?.full_name||'........................'}</span></div><div><strong>اسم وتوقيع مدير المدرسة</strong><span>{profile?.manager_name||'........................'}</span></div></div>
 </div>
}
