import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import dataService from '../services/dataService';

export const useUserRole = (treeId) => {
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const { currentUser } = useAuth();

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!currentUser || !treeId) {
        setUserRole(null);
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        // Get tree data to check user role
        const treeData = await dataService.getTree(treeId);

        if (!treeData) {
          setUserRole(null);
          setIsAdmin(false);
          setLoading(false);
          return;
        }

        // Check if user is a member and get their role
        let role = null;

        // If user is the creator, they are admin
        if (treeData.creatorId && treeData.creatorId === currentUser.uid) {
          role = 'admin';
        } else {
          // First check the members array (new structure)
          if (treeData.members && Array.isArray(treeData.members)) {
            const member = treeData.members.find(m => m.userId === currentUser.uid);
            if (member) {
              role = member.role;
            }
          }

          // Fallback to roles object (old structure)
          if (!role && treeData.roles) {
            role = treeData.roles[currentUser.uid];
          }
        }


        setUserRole(role);
        setIsAdmin(role === 'admin' || role === 'moderator');
      } catch (error) {
        console.error('Error fetching user role:', error);
        setUserRole(null);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, [currentUser, treeId]);

  return { userRole, loading, isAdmin };
};

// Helper function to get role-based component
export const getNavbarForRole = (role) => {
  const navbarMap = {
    'admin': 'AdminNavbar',
    'moderator': 'ModeratorNavbar',
    'editor': 'EditorNavbar',
    'viewer': 'ViewerNavbar',
    'default': 'DefaultNavbar'
  };
  
  return navbarMap[role] || 'DefaultNavbar';
};
