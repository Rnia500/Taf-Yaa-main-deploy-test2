import React, { useState, useRef } from 'react';
import ReactDOM from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Row from '../../layout/containers/Row';
import ImageCard from '../../layout/containers/ImageCard';
import Text from '../Text';
import Button from '../Button';
import { useTranslation } from "react-i18next";
import Submenu from '../Submenu';
import {
  CircleUser,
  Menu,
  X,
  EarthIcon,
  Settings,
  LogOut,
  BookOpen,
  Compass,
  TreePine
} from 'lucide-react';
import Card from '../../layout/containers/Card';
import '../../styles/Navbar.css';
import { NavLink } from "react-router-dom";
import LanguageMenu from '../LanguageMenu';

export default function MyTreeNavBar() {
  const [submenuOpen, setSubmenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [activeButton, setActiveButton] = useState(null);
  const submenuRef = useRef(null);
  const langMenuRef = useRef(null);
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const toggleSubmenu = () => {
    setSubmenuOpen(prev => !prev);
    setLangMenuOpen(false);
    setActiveButton(prev => prev === 'profile' ? null : 'profile');
  };

  const toggleMobileMenu = () => setMobileMenuOpen(prev => !prev);
  const closeMobileMenu = () => setMobileMenuOpen(false);
  const closeSubmenu = () => {
    setSubmenuOpen(false);
    setActiveButton(null);
  };

  const toggleLanguageMenu = () => {
    setLangMenuOpen(prev => !prev);
    setSubmenuOpen(false);
    setActiveButton(prev => prev === 'language' ? null : 'language');
  };

  const closeLanguageMenu = () => {
    setLangMenuOpen(false);
    setActiveButton(null);
  };

  const handleLanguageButtonClick = () => {
    if (langMenuOpen) {
      closeLanguageMenu();
    } else {
      toggleLanguageMenu();
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Submenu items
  const submenuItems = [
    {
      label: t('navbar.settings'),
      icon: Settings,
      href: '/settings',
      action: () => {
        closeSubmenu();
      }
    },
    {
      label: t('navbar.log_out'),
      icon: LogOut,
      action: () => {
        closeSubmenu();
        handleLogout();
      }
    }
  ];

  const navItems = [
    { label: 'My Trees', href: '/my-trees' },
    { label: 'My Stories', href: '/my-stories' },
    { label: 'Discover', href: '/discover' },
  ];

  const MobileNavItems = [
    { label: 'My Trees', href: '/my-trees' },
    { label: 'My Stories', href: '/my-stories' },
    { label: 'Discover', href: '/discover' },
    { label: t('navbar.language'), href: '#', action: () => { toggleLanguageMenu(); closeMobileMenu(); } },
  ];

  return (
    <nav className="NavBar">
      {/* Logo Section */}
      <Row padding='0px' margin='0px' fitContent justifyContent='space-between'>
        <div className="logo-section">
          <ImageCard image='/Images/Logo.png' size={45} rounded margin='0px' />
          <Text variant='heading2' className="brand-text">{t('navbar.brand_name')}</Text>
        </div>

        {/* Desktop Nav */}
        <div className="desktop-nav">
          <Row width='100%' fitContent={true} gap='0.5rem' padding='0px' margin='0px' className='navbar-row'>
            <div className="nav-items-container">
              {navItems.map((item) => (
                <NavLink
                  key={item.label}
                  to={item.href}
                  className={({ isActive }) => `navItem ${isActive ? 'active' : ''}`}
                >
                  <Text variant='body1' bold>
                    {item.label}
                  </Text>
                </NavLink>
              ))}
            </div>

            <div className="action-buttons">
              <div
                className={`action-btn ${activeButton === 'language' ? 'active' : ''}`}
                onClick={handleLanguageButtonClick}
                ref={langMenuRef}
              >
                <EarthIcon size={20} color="var(--color-primary-text)" />
              </div>

              <LanguageMenu
                isOpen={langMenuOpen}
                onClose={closeLanguageMenu}
                triggerRef={langMenuRef}
              />

              <div
                className={`action-btn ${activeButton === 'profile' ? 'active' : ''}`}
                onClick={toggleSubmenu}
                ref={submenuRef}
              >
                <CircleUser size={20} color="var(--color-primary-text)" />
              </div>
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
        {mobileMenuOpen ? <X size={24} color="var(--color-danger)" /> : <Menu size={24} />}
      </button>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && ReactDOM.createPortal(
        <div className={`mobile-nav ${mobileMenuOpen ? 'open' : ''}`}>
          <div className="mobile-nav-content">
              {MobileNavItems.map((item) => (
                item.action ? (
                  <button
                    key={item.label}
                    onClick={item.action}
                    className="mobile-nav-item"
                    style={{ background: "none", border: "none", cursor: "pointer", width: "100%", textAlign: "left" }}
                  >
                    {item.label}
                  </button>
                ) : (
                  <NavLink
                    key={item.label}
                    to={item.href}
                    className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
                    onClick={closeMobileMenu}
                  >
                    {item.label}
                  </NavLink>
                )
              ))}
              <NavLink
                to="/settings"
                className="mobile-nav-item"
                onClick={closeMobileMenu}
              >
                {t('navbar.settings')}
              </NavLink>
              {/* Action buttons row at the bottom */}
              <div style={{
                display: "flex",
                gap: "0.5rem",
                marginTop: "1rem",
                paddingTop: "1rem",
                borderTop: "1px solid rgba(0, 0, 0, 0.1)"
              }}>
                <Button
                  onClick={() => {
                    closeSubmenu();
                    closeMobileMenu();
                  }}
                  variant="primary"
                  fullWidth
                  style={{ flex: 1 }}
                >
                  <Bell size={20} />
                </Button>
                <Button
                  onClick={() => {
                    handleLogout();
                    closeMobileMenu();
                  }}
                  variant="danger"
                  fullWidth
                  style={{ flex: 1 }}
                >
                  <LogOut size={20} />
                </Button>
              </div>
          </div>
        </div>,
        document.body
      )}

      {/* Profile Submenu */}
      <Submenu
        isOpen={submenuOpen}
        onClose={closeSubmenu}
        className="profile-submenu"
        position={{ top: '60px', right: '40px' }}
      >
        {submenuItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <Card
              key={item.label}
              onClick={item.action}
              className="submenu-item-card"
              padding="0.75rem"
              margin="0"
              backgroundColor="transparent"
              borderColor="transparent"
              borderRadius="8px"
              width="100%"
              height="auto"
            >
              <div className="submenu-item-content">
                <IconComponent size={18} />
                <Text variant="body2" style={{ fontWeight: 500 }}>
                  {item.label}
                </Text>
              </div>
            </Card>
          );
        })}
      </Submenu>
    </nav>
  );
}
