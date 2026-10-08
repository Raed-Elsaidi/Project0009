import React from 'react'

/**
 * Unified official header used by every official-form preview.
 * The form body is intentionally kept separate so each official form
 * preserves its original structure and design.
 */
export default function OfficialDocumentHeader(){
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
    <div className="official-doc-rule unified-official-rule"/>
  </>
}
