import React, { useState, useEffect } from "react";
import { useLocation, Outlet, useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Bell,
  Lightbulb,
  GitMerge,
  Clock,
  History,
  TreePine,
  ChevronRight,
  Settings,
  User,
  Users,
  X
} from "lucide-react";
import PageFrame from "../layout/containers/PageFrame";
import HorizontalNotificationTabbar from "../components/NavigationSideBar/HorizontalNotificationTabbar";
import NotificationDetailsSidebar from "../components/sidebar/NotificationDetailsSidebar";
import { getJoinRequestsForTree } from "../services/joinRequestService";
import { getPendingMergeRequestCount } from "../services/mergeRequestService";
import dataService from "../services/dataService";

const NotificationCenter = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { treeId } = useParams();
  const [activeSection, setActiveSection] = useState("overview");
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [isDetailsSidebarOpen, setIsDetailsSidebarOpen] = useState(false);
  const { t } = useTranslation();

  // ── REAL counts, replacing the hardcoded 5/3/2/8/12 ──
  // "suggestions" stays at 0 until the AI-matching backend exists (Phase 2) —
  // showing a fake number there would be misleading, so it's intentionally
  // left at 0 rather than faked.
  const [counts, setCounts] = useState({
    overview: 0,
    suggestions: 0,
    merge: 0,
    requests: 0,
    activity: 0,
  });

  useEffect(() => {
    if (!treeId) return;
    let cancelled = false;

    const loadCounts = async () => {
      try {
        const [joinRequests, mergeCount, activityResult] = await Promise.all([
          getJoinRequestsForTree(treeId),
          getPendingMergeRequestCount(treeId),
          dataService.activityService.getActivities(treeId, 100, null),
        ]);
        if (cancelled) return;

        const pendingJoin = joinRequests.filter(r => r.status === 'pending').length;

        setCounts({
          overview: pendingJoin + mergeCount, // overview badge = anything needing attention
          suggestions: 0,
          merge: mergeCount,
          requests: pendingJoin,
          activity: activityResult?.activities?.length || 0,
        });
      } catch (err) {
        console.error('NotificationCenter: failed to load counts', err);
      }
    };

    loadCounts();
    return () => { cancelled = true; };
  }, [treeId]);

  // Navigation items configuration for the notification center sidebar
  const navigationItems = [
    {
      id: 'overview',
      label: t('navbar.overview'),
      icon: <Bell size={18} />,
      count: counts.overview,
      path: `/family-tree/${treeId}/notificationcenter`,
      active: activeSection === 'overview'
    },
    {
      id: 'suggestions',
      label: t('navbar.ai_suggestions'),
      icon: <Lightbulb size={18} />,
      count: counts.suggestions,
      path: `/family-tree/${treeId}/notificationcenter/suggestions`,
      active: activeSection === 'suggestions'
    },
    {
      id: 'merge',
      label: t('navbar.merge_requests'),
      icon: <GitMerge size={18} />,
      count: counts.merge,
      path: `/family-tree/${treeId}/notificationcenter/merge`,
      active: activeSection === 'merge'
    },
    {
      id: 'requests',
      label: t('navbar.pending_requests'),
      icon: <Clock size={18} />,
      count: counts.requests,
      path: `/family-tree/${treeId}/notificationcenter/requests`,
      active: activeSection === 'requests'
    },
    {
      id: 'activity',
      label: t('navbar.family_activity'),
      icon: <History size={18} />,
      count: counts.activity,
      path: `/family-tree/${treeId}/notificationcenter/activity`,
      active: activeSection === 'activity'
    },
  ];

  // Update active section based on current location
  React.useEffect(() => {
    const currentPath = location.pathname;
    if (currentPath === `/family-tree/${treeId}/notificationcenter/suggestions`) {
      setActiveSection('suggestions');
    } else if (currentPath === `/family-tree/${treeId}/notificationcenter/merge`) {
      setActiveSection('merge');
    } else if (currentPath === `/family-tree/${treeId}/notificationcenter/requests`) {
      setActiveSection('requests');
    } else if (currentPath === `/family-tree/${treeId}/notificationcenter/activity`) {
      setActiveSection('activity');
    } else if (currentPath === `/family-tree/${treeId}/notificationcenter` || currentPath === `/family-tree/${treeId}/notificationcenter/`) {
      setActiveSection('overview');
    }
  }, [location.pathname, treeId]);

  return (
    <div className="notification-center-container">
      <PageFrame
        topbar={
        <HorizontalNotificationTabbar
          navItems={navigationItems}
          onSectionChange={(sectionId) => {
            setActiveSection(sectionId);
            const section = navigationItems.find(item => item.id === sectionId);
            if (section && section.path) {
              navigate(section.path);
            }
          }}
        />
        }
        sidebar={true}
        sidebarContentType="notification"
        sidebarProps={{
          notification: selectedNotification,
          isOpen: isDetailsSidebarOpen,
          onClose: () => setIsDetailsSidebarOpen(false),
        }}
        sidebarOpen={isDetailsSidebarOpen}
        onSidebarClose={() => setIsDetailsSidebarOpen(false)}
      >
        <Outlet context={{ onNotificationClick: (notification) => {
          setSelectedNotification(notification);
          setIsDetailsSidebarOpen(true);
        }}} />
      </PageFrame>
    </div>
  );
};

export default NotificationCenter;