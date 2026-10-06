import React from 'react'
import {createRoot} from 'react-dom/client'
import App from './App'
import './styles.css'
import {normalizeVisibleDigits} from './digits'

const rootElement=document.getElementById('root')
createRoot(rootElement).render(<App/>)

// Keep every visible numeral in English digits, including values coming from the database.
const syncEnglishDigits=()=>normalizeVisibleDigits(rootElement)
syncEnglishDigits()
new MutationObserver(syncEnglishDigits).observe(rootElement,{subtree:true,childList:true,characterData:true})

<style id="mobile-final-adjustments">
@media (max-width: 700px){
  footer, .footer, .site-footer, .app-footer { transform: translateY(-38px) !important; }
  /* Hide only the text label immediately associated with the guidance logo. */
  .guidance-logo + .guidance-label, .guidance-logo-text, .guidance-logo + span, .guidance-logo + p { display:none !important; }
}
</style>
