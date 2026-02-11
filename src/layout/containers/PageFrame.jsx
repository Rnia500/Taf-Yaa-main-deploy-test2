import React from 'react';
import '../../styles/PageFrame.css';
import ProfileSidebar from '../../components/sidebar/ProfileSidebar';
import InviteDetailsSidebar from '../../components/sidebar/InviteDetailsSidebar';
import NotificationDetailsSidebar from '../../components/sidebar/NotificationDetailsSidebar';

export default function PageFrame({
  topbar,
  sidebar,
  sidebarContentType = 'peopleprofile', // Default to peopleprofile
  sidebarProps = {},
  sidebarOpen = false,
  onSidebarClose,
  footer,
  footerInsideMain = false,
  children,
}) {
  // Determine if mobile (<=768px)
  const [isMobile, setIsMobile] = React.useState(window.innerWidth <= 768);
  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Remove inline styles when sidebar closes
  React.useEffect(() => {
    if (!sidebarOpen) {
      const sidebarEl = document.querySelector('.pf-sidebar');
      if (sidebarEl) {
        sidebarEl.style.transform = '';
        sidebarEl.style.transition = '';
      }
    }
  }, [sidebarOpen]);

  // Prevent body scroll when sidebar overlays (mobile)
  React.useEffect(() => {
    if (isMobile && sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => (document.body.style.overflow = '');
  }, [isMobile, sidebarOpen]);

  // Render sidebar content based on contentType
  const renderSidebarContent = () => {
    if (sidebarContentType === 'peopleprofile') {
      return <ProfileSidebar onClose={onSidebarClose} {...sidebarProps} />;
    } else if (sidebarContentType === 'invite') {
      return (
        <InviteDetailsSidebar
          key={sidebarProps.invite?.id}
          onClose={onSidebarClose}
          {...sidebarProps}
        />
      );
    } else if (sidebarContentType === 'notification') {
      return (
        <NotificationDetailsSidebar
          onClose={onSidebarClose}
          {...sidebarProps}
        />
      );
    }
    // Default fallback
    return <ProfileSidebar onClose={onSidebarClose} {...sidebarProps} />;
  };

  //Swipe-to-close 
  React.useEffect(() => {
    if (!isMobile || !sidebarOpen) return;

    const sidebarEl = document.querySelector('.pf-sidebar');
    if (!sidebarEl) return;

    sidebarEl.style.transform = 'translateX(0)';
    sidebarEl.style.transition = '';

    let startX = 0;
    let startY = 0;
    let currentX = 0;
    let touching = false;
    let translating = false;

    const handleTouchStart = (e) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      touching = true;
      translating = false;

      sidebarEl.style.transition = 'none';
    };

    const handleTouchMove = (e) => {
      if (!touching) return;

      const touch = e.touches[0];
      const dx = touch.clientX - startX;
      const dy = touch.clientY - startY;

      // Ignore vertical or diagonal
      if (Math.abs(dy) > Math.abs(dx) * 0.5) return;

      if (dx < 0) {
        translating = true;
        currentX = dx;

        const sidebarWidth = sidebarEl.offsetWidth;
        const dragX = Math.max(dx, -sidebarWidth - 20);
        sidebarEl.style.transform = `translateX(${dragX}px)`;
      }
    };

    const handleTouchEnd = () => {
      if (!touching) return;

      sidebarEl.style.transition =
        'transform 0.35s cubic-bezier(0.25, 1.25, 0.5, 1)';

      if (currentX < -100) {
        sidebarEl.style.transform = 'translateX(calc(-100% - 20px))';

        setTimeout(() => {
          onSidebarClose?.();
        }, 350);
      } else if (translating) {
        sidebarEl.style.transform = 'translateX(0)';
      }

      touching = false;
      translating = false;
      currentX = 0;
    };

    sidebarEl.addEventListener('touchstart', handleTouchStart);
    sidebarEl.addEventListener('touchmove', handleTouchMove);
    sidebarEl.addEventListener('touchend', handleTouchEnd);

    return () => {
      sidebarEl.removeEventListener('touchstart', handleTouchStart);
      sidebarEl.removeEventListener('touchmove', handleTouchMove);
      sidebarEl.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isMobile, sidebarOpen, onSidebarClose]);



  return (
    <div className="pf-root">
      {/* Topbar */}
      <div className="pf-topbar">{topbar}</div>

      {/* Backdrop for mobile */}
      {isMobile && sidebarOpen && (
        <div
          className="pf-backdrop"
          onClick={onSidebarClose}
        ></div>
      )}

      {/* Body */}
      <div className={'pf-body' + (sidebarOpen && !isMobile ? ' pf-body-sidebar-open' : '')}>
        {/* Sidebar */}
        {sidebar && (
          <aside
            className={[
              'pf-sidebar',
              sidebarOpen ? 'pf-sidebar-open' : '',
              isMobile ? 'pf-sidebar-mobile' : '',
            ].join(' ')}
            style={{ width: !isMobile && sidebarOpen ? 350 : undefined }}
          >
            {renderSidebarContent()}
          </aside>
        )}


        {/* Main content + footer wrapper */}
        <div className="pf-main-footer-wrapper">
          <main className="pf-main">
            {children}
            {footerInsideMain && footer && <footer className="pf-footer">{footer}</footer>}
          </main>
          {!footerInsideMain && footer && (
            <footer className="pf-footer pf-footer-outside">{footer}</footer>
          )}
        </div>
      </div>
    </div>
  );
}
