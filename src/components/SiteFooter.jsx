import React from 'react'
import { Mail, Facebook, Linkedin, MessageCircle, Code2 } from 'lucide-react'

export default function SiteFooter({ publicPage = false }) {
  return <footer className={publicPage ? 'site-footer public-site-footer' : 'site-footer'}>
    <div className="site-footer-brand">
      <img src="/assets/raed-elsaidi-logo.jpg" alt="Raed Elsaidi" />
      <div>
        <strong>Eng. Raed Elsaidi</strong>
        <span>Full Stack Web Developer</span>
      </div>
    </div>
    <div className="site-footer-links">
      <a href="mailto:elsaidiraed@gmail.com" title="البريد الإلكتروني"><Mail size={16}/><span>elsaidiraed@gmail.com</span></a>
      <a href="https://www.facebook.com/raed.elsaidi" target="_blank" rel="noreferrer" title="Facebook"><Facebook size={16}/><span>Facebook</span></a>
      <a href="https://www.linkedin.com/in/raed-elsaidi-98b1033a6" target="_blank" rel="noreferrer" title="LinkedIn"><Linkedin size={16}/><span>LinkedIn</span></a>
      <a href="https://wa.me/970599242087" target="_blank" rel="noreferrer" title="WhatsApp"><MessageCircle size={16}/><span>00970 599 242 087</span></a>
    </div>
    <div className="site-footer-copy"><Code2 size={14}/> تطوير وبرمجة: Eng. Raed Elsaidi</div>
  </footer>
}
