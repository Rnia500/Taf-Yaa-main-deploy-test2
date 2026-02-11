// src/main.jsx
import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider, useNavigate, useLocation } from "react-router-dom";
import "./index.css";
import "./styles/fonts.css";
import "./i18n.js";
import App from "./App.jsx";
import GlobalModals from "./pages/GlobalModals";
import RedirectToTree from "./pages/RedirectToTreePage";
import ExportPage from "./pages/ExportPage.jsx";
import DeletedPersonsPage from "./pages/DeletedPersonsPage.jsx";
import NotificationCenter from "./pages/NotificationCenter.jsx";
import SuggestionsPage from "./pages/SuggestionsPage.jsx";
import FamilyTreePage from "./pages/FamilyTreePage.jsx";
import NotificationOverviewPage from "./pages/NotificationOverviewPage.jsx";
import PendingRequestsPage from "./pages/PendingRequestsPage.jsx";
import FamilyActivityPage from "./pages/FamilyActivityPage.jsx";
import MyTreesPage from "./pages/MyTreesPage.jsx";
import MyStoriesPage from "./pages/MyStoriesPage.jsx";
import MembersPage from "./pages/MembersPage.jsx";
import ViewerMembersPage from "./pages/ViewerMembersPage.jsx";
import InvitesPage from "./pages/InvitesPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import LandingPage from "./pages/LandingPage.jsx";
import JoinPage from "./pages/JoinPage.jsx";
import JoinRequestPage from "./pages/JoinRequestPage.jsx";
import Custom404Page from "./components/Custom404Page.jsx";
import TreeSettingsPage from "./pages/TreeSettingsPage.jsx";
import EmailVerificationPage from "./pages/EmailVerificationPage.jsx";
import SearchTreesPage from "./pages/SearchTreesPage.jsx";
import PublicTreePage from "./pages/PublicTreePage.jsx";
import Loading from "./components/Loading.jsx";
import UserProfile from "./pages/UserProfile.jsx";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";

// Component to handle landing page routing
const LandingRouteWrapper = ({ children }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return <Loading variant="spinner" size="lg" message="Loading your account..." fullScreen />;
  }

  if (currentUser) {
    // Redirect logged in users to their tree context
    return <RedirectToTree />;
  }

  return children;
};

// Component to redirect to proper nested routes
const RedirectToNestedRoute = ({ targetPath }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    // Try to get treeId from URL first
    const pathMatch = location.pathname.match(/\/family-tree\/([^/]+)/);
    let treeId = pathMatch ? pathMatch[1] : null;
    
    // If not in URL, try to get from localStorage
    if (!treeId) {
      treeId = localStorage.getItem('currentTreeId');
    }
    
    // Final fallback to my-trees if no treeId
    if (!treeId) {
      navigate('/my-trees', { replace: true });
      return;
    }
    
    navigate(`/family-tree/${treeId}${targetPath}`, { replace: true });
  }, [navigate, location.pathname, targetPath]);
  
  return <div>Redirecting...</div>;
};

const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <LandingRouteWrapper>
        <LandingPage />
      </LandingRouteWrapper>
    ),
    errorElement: <Custom404Page />,
  },
      {
        path: "/family-tree/:treeId",
        element: <App />,
        errorElement: <Custom404Page />,
        children: [
          {
            index: true,
            element: <FamilyTreePage />,
          },
          {
            path: "deleted-persons",
            element: <DeletedPersonsPage />,
          },
          {
            path: "export",
            element: <ExportPage />,
          },
          {
            path: "members",
            element: <MembersPage />,
          },
          {
            path: "invites",
            element: <InvitesPage />,
          },
          {
            path: "invites/:inviteId",
            element: <InvitesPage />,
          },
          {
            path: "notificationcenter",
            element: <NotificationCenter />,
            children: [
              {
                index: true,
                element: <NotificationOverviewPage />,
              },
              {
                path: "suggestions",
                element: <SuggestionsPage />,
              },
              {
                path: "merge",
                element: <div>Merge Requests Content</div>,
              },
              {
                path: "requests",
                element: <PendingRequestsPage />,
              },
              {
                path: "activity",
                element: <FamilyActivityPage />,
              },
            ],
          },
          {
            path: "settings",
            element: <TreeSettingsPage />,
          },

        ],
      },
  {
    path: "/members",
    element: <App />,
    errorElement: <Custom404Page />,
  },

  {
    path: "/settings",
    element: <App />,
    errorElement: <Custom404Page />,
  },
  {
    path: "/language",
    element: <App />,
    errorElement: <Custom404Page />,
  },
  {
    path: "/notifications",
    element: <RedirectToNestedRoute targetPath="/notificationcenter" />,
    errorElement: <Custom404Page />,
  },
  {
    path: "/suggestions",
    element: <RedirectToNestedRoute targetPath="/suggestions" />,
    errorElement: <Custom404Page />,
  },
  {
    path: "/my-trees",
    element: <MyTreesPage />,
    errorElement: <Custom404Page />,
  },
   {
    path: "/profile",
    element: <UserProfile />, 
    errorElement: <Custom404Page />,
  },
  {
    path: "/my-stories",
    element: <App />,
    errorElement: <Custom404Page />,
    children: [
      {
        index: true,
        element: <MyStoriesPage />,
      },
    ],
  },
  {
    path: "/login",
    element: <LoginPage />,
    errorElement: <Custom404Page />,
  },
  {
    path: "/register",
    element: <RegisterPage />,
    errorElement: <Custom404Page />,
  },
  {
    path: "/verify-email",
    element: <EmailVerificationPage />,
    errorElement: <Custom404Page />,
  },
  {
    path: "/join",
    element: <JoinPage />,
    errorElement: <Custom404Page />,
  },
  {
    path: "/join-request",
    element: <JoinRequestPage />,
    errorElement: <Custom404Page />,
  },
  {
    path: "/search",
    element: <SearchTreesPage />,
    errorElement: <Custom404Page />,
  },
  {
    path: "/public-tree/:treeId",
    element: <PublicTreePage />,
    errorElement: <Custom404Page />,
  },

]);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
      <GlobalModals />
    </AuthProvider>
  </StrictMode>
);
