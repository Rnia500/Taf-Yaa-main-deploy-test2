import React, { useState, useRef } from 'react';
import ReactDOM from 'react-dom';
import { NavLink, useLocation } from 'react-router-dom';
import Row from '../../layout/containers/Row';
import ImageCard from '../../layout/containers/ImageCard';
import Text from '../Text';
import { Menu, X } from 'lucide-react';
import LanguageMenu from '../LanguageMenu';
import '../../styles/Navbar.css';

export default function DefaultNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [languageMenuOpen, setLanguageMenuOpen] = useState(false);
  const languageMenuTriggerRef = useRef(null);
  const location = useLocation();

  const toggleMobileMenu = () => setMobileMenuOpen(prev => !prev);
  const closeMobileMenu = () => setMobileMenuOpen(false);
  const openLanguageMenu = () => setLanguageMenuOpen(true);
  const closeLanguageMenu = () => setLanguageMenuOpen(false);

  return (
    <nav className="NavBar">
      {/* Logo Section */}
      <Row padding='0px' margin='0px' fitContent justifyContent='space-between'>
        <div className="logo-section">
          <ImageCard image='/Images/Logo.png' size={40} rounded margin='0px' />
          <Text variant='heading2' className="brand-text" style={{ fontWeight: 700, marginLeft: 8 }}>Taf'Yaa</Text>
        </div>

        {/* Desktop Nav */}
        <div className="desktop-nav">
          <Row width='100%' fitContent={true} gap='2rem' padding='0px' margin='0px' className='navbar-row' justifyContent='end'>
            <div className="nav-items-container" style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
              <NavLink to='/about' className={`navItem${location.pathname === '/about' ? ' active' : ''}`}>About Us</NavLink>
              <div ref={languageMenuTriggerRef}>
                <button className='navItem' style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.75rem 1rem' }} onClick={openLanguageMenu}>
                  <span role="img" aria-label="language">🌐</span> Language
                </button>
                {languageMenuOpen && (
                  <LanguageMenu isOpen={languageMenuOpen} onClose={closeLanguageMenu} triggerRef={languageMenuTriggerRef} />
                )}
              </div>

              <NavLink
                to='/login'
                className='navItem no-underline'
                style={{
                  background: '#f5e7df',
                  padding: '0.4rem 0.9rem',
                  color: '#c75c1c',
                  borderRadius: '10px',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  boxShadow: '0 2px 8px rgba(199,92,28,0.07)',
                  transition: 'background 0.2s, color 0.2s, transform 0.2s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = '#ffe7d6';
                  e.currentTarget.style.transform = 'scale(1.02)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = '#f5e7df';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                Log In
              </NavLink>

              <NavLink
                to='/register'
                className='navItem no-underline'
                style={{
                  background: '#c75c1c',
                  padding: '0.4rem 0.9rem',
                  color: 'white',
                  borderRadius: '10px',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  boxShadow: '0 2px 8px rgba(199,92,28,0.09)',
                  transition: 'background 0.2s, color 0.2s, transform 0.2s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = '#a94a13';
                  e.currentTarget.style.transform = 'scale(1.02)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = '#c75c1c';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                Sign Up
              </NavLink>
            </div>
          </Row>
        </div>
      </Row>

      {/* Mobile Menu Button */}
      <button
        className="mobile-menu-button"
        onClick={toggleMobileMenu}
        aria-label="Toggle mobile menu"
        style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-primary-text)" }}
      >
        {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && ReactDOM.createPortal(
        <div className={`mobile-nav ${mobileMenuOpen ? 'open' : ''}`}>
          <div className="mobile-nav-content">
            <NavLink to='/about' className='mobile-nav-item' onClick={closeMobileMenu}>About Us</NavLink>
            <button className='mobile-nav-item' onClick={openLanguageMenu} style={{ background: 'none', border: 'none', textAlign: 'left' }}>
              <span role="img" aria-label="language">🌐</span> Language
            </button>
            <NavLink to='/login' className='mobile-nav-item' style={{ background: '#f5e7df', color: '#c75c1c', borderRadius: '24px', fontWeight: 600 }} onClick={closeMobileMenu}>Log In</NavLink>
            <NavLink to='/register' className='mobile-nav-item' style={{ background: '#c75c1c', color: 'white', borderRadius: '24px', fontWeight: 600 }} onClick={closeMobileMenu}>Sign Up</NavLink>
          </div>
        </div>,
        document.body
      )}
    </nav>
  );
}
