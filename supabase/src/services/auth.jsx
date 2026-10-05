import React,{createContext,useContext,useEffect,useState} from 'react'
import {supabase} from './supabase'
const C=createContext(null)
export function AuthProvider({children}){const [session,setSession]=useState(null);const [loading,setLoading]=useState(true)
 useEffect(()=>{if(!supabase){setLoading(false);return} supabase.auth.getSession().then(({data})=>{setSession(data.session);setLoading(false)});const {data:{subscription}}=supabase.auth.onAuthStateChange((_e,s)=>setSession(s));return()=>subscription.unsubscribe()},[])
 return <C.Provider value={{session,loading}}>{children}</C.Provider>}
export const useAuth=()=>useContext(C)
