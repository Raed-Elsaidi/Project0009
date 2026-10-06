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


