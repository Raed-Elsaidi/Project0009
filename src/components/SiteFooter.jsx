import React from 'react'
import { Mail, Facebook, Linkedin, MessageCircle, Code2 } from 'lucide-react'

export default function SiteFooter({ publicPage = false }) {
  if (publicPage) {
    return <footer className="site-footer public-site-footer reference-footer">
      <div className="reference-footer-brand">
        <img src="/assets/raed-elsaidi-logo.jpg" alt="Raed Elsaidi" />
        <div><strong>ENG. RAED ELSAIDI</strong></div>
      </div>
      <div className="reference-footer-middle">
        <div className="reference-footer-title">تطوير وتنفيذ</div>
        <div className="reference-footer-links">
          <a href="mailto:elsaidiraed@gmail.com" title="البريد الإلكتروني"><Mail size={17}/><span>elsaidiraed@gmail.com</span></a>
          <a href="https://www.facebook.com/raed.elsaidi" target="_blank" rel="noreferrer" title="Facebook"><Facebook size={17}/><span>facebook.com/raed.elsaidi-98b1033a6</span></a>
        </div>
      </div>
      <div className="reference-footer-right">
        <a href="https://www.linkedin.com/in/raed-elsaidi-98b1033a6" target="_blank" rel="noreferrer" title="LinkedIn"><Linkedin size={17}/><span>linkedin.com/in/raed-elsaidi-98b1033a6</span></a>
        <a href="https://wa.me/970599242087" target="_blank" rel="noreferrer" title="WhatsApp"><MessageCircle size={17}/><span>00970599242087</span></a>
      </div>
    </footer>
  }

  return <footer className="site-footer">
    <div className="site-footer-brand">
      <img src="/assets/raed-elsaidi-logo.jpg" alt="Raed Elsaidi" />
      <div><strong>Eng. Raed Elsaidi</strong><span>Full Stack Web Developer</span></div>
    </div>
    <div className="site-footer-links">
      <a className="footer-email" href="mailto:elsaidiraed@gmail.com" title="البريد الإلكتروني"><Mail size={16}/><span>elsaidiraed@gmail.com</span></a>
      <a className="footer-facebook" href="https://www.facebook.com/raed.elsaidi" target="_blank" rel="noreferrer" title="Facebook"><Facebook size={16}/><span>Facebook</span></a>
      <a className="footer-linkedin" href="https://www.linkedin.com/in/raed-elsaidi-98b1033a6" target="_blank" rel="noreferrer" title="LinkedIn"><Linkedin size={16}/><span>LinkedIn</span></a>
      <a className="footer-whatsapp" href="https://wa.me/970599242087" target="_blank" rel="noreferrer" title="WhatsApp"><MessageCircle size={16}/><span>00970 599 242 087</span></a>
    </div>
    <div className="site-footer-copy"><Code2 size={14}/> تطوير وبرمجة: Eng. Raed Elsaidi</div>
  </footer>
}

