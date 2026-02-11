import React, { useState, useRef } from 'react';
import ReactDOM from 'react-dom';
import { Link, useParams, useLocation, useNavigate } from 'react-router-dom';
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
  ArrowDownToLine, User, LogOut, TreePine, MessageSquare
} from 'lucide-react';
import Card from '../../layout/containers/Card';
import '../../styles/Navbar.css';
import useModalStore from '../../store/useModalStore';
import { NavLink } from "react-router-dom";
import LanguageMenu from '../LanguageMenu';

export default function ViewerNavbar() {
  const [submenuOpen, setSubmenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [activeButton, setActiveButton] = useState(null);
  const { treeId } = useParams();
  const location = useLocation();
  const submenuRef = useRef(null);
  const langMenuRef = useRef(null);
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  // Extract treeId from URL
  const getTreeId = () => {
    if (treeId) return treeId;

    const pathMatch = location.pathname.match(/\/family-tree\/([^/]+)/);
    if (pathMatch) return pathMatch[1];

    throw new Error('Tree ID is missing from URL');
  };

  const currentTreeId = getTreeId();

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

  // Handle clicking on the language button when menu is open (should close it)
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

  // Submenu items with proper functionality
  const submenuItems = [
    {
      label: t('navbar.profile'),
      icon: User,
      href: '/profile',
      action: () => {
        closeSubmenu();
      }
    },
    {
      label: 'My Trees',
      icon: TreePine,
      href: '/my-trees',
      action: () => {
        closeSubmenu();
        navigate('/my-trees');
      }
    },
    {
      label: t('navbar.settings'),
      icon: Settings,
      href: '/settings',
      action: () => {
        closeSubmenu();
        navigate('/settings');
      }
    },
    {
      label: 'Write to Moderator',
      icon: MessageSquare,
      action: () => {
        closeSubmenu();
        // Assuming a modal for writing to moderator
        // You may need to define this modal in useModalStore
        // For now, placeholder
        alert('Write to Moderator functionality - implement modal here');
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

  const { openModal } = useModalStore();

  const navItems = [
    { label: t('navbar.tree_view'), href: `/family-tree/${currentTreeId}` },
    { label: t('navbar.members'), href: `/family-tree/${currentTreeId}/members` },
  ];

  const MobileNavItems = [
    { label: t('navbar.tree_view'), href: `/family-tree/${currentTreeId}` },
    { label: t('navbar.members'), href: `/family-tree/${currentTreeId}/members` },
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
                  end={item.label === t('navbar.tree_view')}
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

              <div className="action-btn" onClick={() => openModal('pdfExportModal')}>
                <ArrowDownToLine size={20} color="var(--color-primary-text)"  />
              </div>

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
                    end={item.label === t('navbar.tree_view')}
                    className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
                    onClick={closeMobileMenu}
                  >
                    {item.label}
                  </NavLink>
                )
              ))}
              <button
                onClick={() => {
                  closeSubmenu();
                  closeMobileMenu();
                }}
                className="mobile-nav-item"
                style={{ background: "none", border: "none", cursor: "pointer", width: "100%", textAlign: "left" }}
              >
                {t('navbar.profile')}
              </button>
              <button
                onClick={() => {
                  closeSubmenu();
                  closeMobileMenu();
                  navigate('/my-trees');
                }}
                className="mobile-nav-item"
                style={{ background: "none", border: "none", cursor: "pointer", width: "100%", textAlign: "left" }}
              >
                My Trees
              </button>

              {/* Action buttons - First row */}
              <div style={{
                display: "flex",
                gap: "0.5rem",
                marginTop: "1rem",
                paddingTop: "1rem",
                borderTop: "1px solid rgba(0, 0, 0, 0.1)"
              }}>
                <Button
                  onClick={() => {
                    openModal('pdfExportModal');
                    closeMobileMenu();
                  }}
                  variant="info"
                  fullWidth
                  style={{ flex: 1 }}
                >
                  <ArrowDownToLine size={20} />
                </Button>
                <Button
                  onClick={() => {
                    toggleLanguageMenu();
                    closeMobileMenu();
                  }}
                  variant="secondary"
                  fullWidth
                  style={{ flex: 1 }}
                >
                  <EarthIcon size={20} />
                </Button>
              </div>

              {/* Action buttons - Second row */}
              <div style={{
                display: "flex",
                gap: "0.5rem",
                marginTop: "0.5rem"
              }}>
                <Button
                  onClick={() => {
                    // Placeholder for Write to Moderator
                    alert('Write to Moderator functionality - implement modal here');
                    closeMobileMenu();
                  }}
                  variant="primary"
                  fullWidth
                  style={{ flex: 1 }}
                >
                  <MessageSquare size={20} />
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

              {/* Action buttons - Third row */}
              <div style={{
                display: "flex",
                gap: "0.5rem",
                marginTop: "0.5rem"
              }}>
                <Button
                  onClick={() => {
                    navigate('/settings');
                    closeMobileMenu();
                  }}
                  variant="secondary"
                  fullWidth
                  style={{ flex: 1 }}
                >
                  <Settings size={20} />
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
  position={{ top: '48px', right: '0px' }}  // anchor to parent
>
  {submenuItems.map((item) => {
    const IconComponent = item.icon;
    return (
      <button
        key={item.label}
        className="submenu-btn"
        onClick={item.action}
      >
        <IconComponent size={16} />
        <span>{item.label}</span>
      </button>
    );
  })}
</Submenu>

    </nav>
  );
}
