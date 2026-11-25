import React from 'react'
export default function OfficialDocumentHeader({profile}){
 const directorateName=profile?.directorates?.name||profile?.directorate_name||profile?.schools?.directorate?.name||'مديرية التربية والتعليم'
 const schoolName=profile?.schools?.name||profile?.school_name||'اسم المدرسة'
 return <>
  <header className="official-document-header unified-official-header">
   <div className="official-doc-side right">
    <strong>دولة فلسطين</strong>
    <span>وزارة التربية والتعليم</span>
    <span>الإدارة العامة للصحة الشمولية</span>
   </div>
   <img src="/assets/ministry-logo.png" alt="شعار وزارة التربية والتعليم" className="official-ministry-logo"/>
   <div className="official-doc-side left" dir="ltr">
    <strong>State of Palestine</strong>
    <span>Ministry of Education</span>
    <span>Directorate General of Comprehensive Health</span>
   </div>
  </header>
  <div className="official-header-school-info" dir="rtl">
   <div>مديرية التربية والتعليم — {directorateName}</div>
   <div>{schoolName}</div>
  </div>
  <div className="official-doc-rule unified-official-rule"/>
 </>
}
