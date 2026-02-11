// src/pages/BaseLayout.jsx
import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import PageFrame from '../layout/containers/PageFrame';
import ProfileSidebar from '../components/sidebar/ProfileSidebar';
import AdminNavbar from '../components/navbar/AdminNavbar';
import ModeratorNavbar from '../components/navbar/ModeratorNavbar';
import EditorNavbar from '../components/navbar/EditorNavbar';
import ViewerNavbar from '../components/navbar/ViewerNavbar';
import DefaultNavbar from '../components/navbar/DefaultNavbar';
import MyTreeNavBar from '../components/navbar/MyTreeNavBar';
import useSidebarStore from '../store/useSidebarStore';
import InviteDetailsSidebar from '../components/sidebar/InviteDetailsSidebar';
import { useUserRole } from '../hooks/useUserRole';

import Toast from '../components/toasts/Toast';



export default function BaseLayout() {
  const isSidebarOpen = useSidebarStore((state) => state.isSidebarOpen);
  const closeSidebar = useSidebarStore((state) => state.closeSidebar);
  const location = useLocation();

  // Extract treeId from URL for role checking
  const getTreeIdFromUrl = () => {
    const pathMatch = location.pathname.match(/\/family-tree\/([^/]+)/);
    return pathMatch ? pathMatch[1] : null;
  };

  const treeId = getTreeIdFromUrl();
  const { userRole, loading: roleLoading } = useUserRole(treeId);

  // Close sidebar when navigating to a different page
  useEffect(() => {
    closeSidebar();
  }, [location.pathname, closeSidebar]);

  // Dynamically select navbar based on user role
  const getNavbar = () => {
    const isMyStoriesPage = location.pathname === '/my-stories';
    const isMyTreesPage = location.pathname === '/my-trees';
    const isDiscoverPage = location.pathname === '/discover';

    // For pages outside family trees, use appropriate navbar
    if (isMyStoriesPage || isMyTreesPage || isDiscoverPage) {
      return <MyTreeNavBar />;
    }

    // For family tree pages, use role-based navbar
    if (treeId && !roleLoading) {
      switch (userRole) {
        case 'admin':
          return <AdminNavbar />;
        case 'moderator':
          return <ModeratorNavbar />;
        case 'editor':
          return <EditorNavbar />;
        case 'viewer':
          return <ViewerNavbar />;
        default:
          return <DefaultNavbar />;
      }
    }

    // Default fallback
    return <DefaultNavbar />;
  };

  const navbar = getNavbar();

  const getSidebarContentType = () => {

    if (location.pathname.includes('/invites')) {
      return 'invite';
    }
    return 'peopleprofile'; // Default
  };


  const activeInvite = useSidebarStore((state) => state.activeInvite);

  const getSidebarProps = () => {
    return { invite: activeInvite };
  };

  return (
    <PageFrame
      topbar={navbar}

      sidebar={true}
      sidebarContentType={getSidebarContentType()} 
      sidebarProps={getSidebarProps()}
      sidebarOpen={isSidebarOpen}

      onSidebarClose={closeSidebar}
    >
      <>
        <Toast />
        <Outlet />
      </>
    </PageFrame>
  );
}
