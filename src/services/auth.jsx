import React,{createContext,useContext,useEffect,useState}from'react'
import{getCustomSession,validateCustomSession,logoutEmployee}from'./customAuth'

const C=createContext(null)

export function AuthProvider({children}){
 const[session,setSession]=useState(null)
 const[loading,setLoading]=useState(true)

 useEffect(()=>{
   let mounted=true
   validateCustomSession().then(ok=>{
     if(!mounted)return
     setSession(ok?getCustomSession():null)
     setLoading(false)
   })
   const onStorage=()=>setSession(getCustomSession())
   window.addEventListener('storage',onStorage)
   return()=>{mounted=false;window.removeEventListener('storage',onStorage)}
 },[])

 const logout=async()=>{await logoutEmployee();setSession(null)}
 return <C.Provider value={{session,loading,logout}}>{children}</C.Provider>
}
export const useAuth=()=>useContext(C)
