import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import FlexContainer from '../layout/containers/FlexContainer';
import Text from '../components/Text';
import Card from '../layout/containers/Card';
import Row from '../layout/containers/Row';
import Column from '../layout/containers/Column';
import Button from '../components/Button';
import SelectDropdown from '../components/SelectDropdown';
import PersonCardHorizontal from '../components/PersonCardHorizontal';
import DataTable from '../components/DataTable';
import { useFamilyData } from '../hooks/useFamilyData';
import { useAuth } from '../context/AuthContext';
import dataService from '../services/dataService';
import useToastStore from '../store/useToastStore';
import useModalStore from '../store/useModalStore';
import { DeletePersonModal } from '../components/modals/DeletePersonModal';
import LottieLoader from '../components/LottieLoader';
import PeopleTable from '../components/PeopleTable';
import MemeberTable from '../components/MemberTable';

import { UserPen, Trash2, Users, User, Settings, Users2, UserPlus, Ban } from 'lucide-react';
import Pill from '../components/pill';

const MembersPage = () => {
  const { treeId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { people, tree, loading, reload } = useFamilyData(treeId);
  const addToast = useToastStore(state => state.addToast);
  const { openModal, closeModal } = useModalStore();

  const [members, setMembers] = useState([]);
  const [activeTab, setActiveTab] = useState('people');

  // Filter and enrich members (people with linkedUserId)
  useEffect(() => {
    if (people && tree) {
      const treeMembers = people.filter(person => person.linkedUserId).map(person => {
        const treeMember = tree.members?.find(m => m.userId === person.linkedUserId);
        return {
          ...person,
          role: treeMember?.role || 'viewer',
          joinedAt: treeMember?.joinedAt,
          banned: treeMember?.banned || false,
          banPeriod: treeMember?.banPeriod || null,
          lastActive: treeMember?.lastActive,
          status: treeMember?.banned ? (treeMember.banPeriod ? 'Banned (temp)' : 'Banned') : 'Active'
        };
      });

      // Remove duplicates based on linkedUserId
      const uniqueMembers = treeMembers.filter((member, index, self) =>
        index === self.findIndex(m => m.linkedUserId === member.linkedUserId)
      );

      setMembers(uniqueMembers);
    }
  }, [people, tree]);



  const handleEditPerson = (personId) => {
    openModal('editPerson', { personId });
  };

  const handleDeletePerson = (person) => {
    openModal('deletePerson', { person, onDeleteComplete: reload });
  };

  const handleViewRelationships = (personId) => {
    openModal('relationships', { personId });
  };

  const handleGrantMembership = (person) => {
    if (!tree || !currentUser) return;

    // Check if current user is admin
    const currentUserMember = tree.members?.find(m => m.userId === currentUser.uid);
    if (currentUserMember?.role !== 'admin') {
      openModal('errorModal', { message: 'Only admins can grant membership' });
      return;
    }

    openModal('grantMembershipModal', {
      person,
      treeId,
      treeName: tree.familyName,
      onMembershipGranted: reload
    });
  };

  const handleInviteMember = () => {
    openModal('inviteTypeModal', {
      onSelectType: (type) => {
        closeModal('inviteTypeModal');
        openModal('inviteModal', {
          treeId,
          inviteType: type,
          onInviteCreated: (invite) => {
            console.log('Invitation created:', invite);
            reload();
          },
          onNavigate: (path) => navigate(path)
        });
      }
    });
  };

  const handleNavigateToInvitePage = () => {
    navigate(`/family-tree/${treeId}/invites`);
  };

  const handleRevokeMember = async (personId) => {
    if (!tree || !currentUser) return;

    // Check if current user is admin
    const currentUserMember = tree.members?.find(m => m.userId === currentUser.uid);
    if (currentUserMember?.role !== 'admin') {
      openModal('errorModal', { message: 'Only admins can revoke member access' });
      return;
    }

    openModal('warningModal', {
      message: 'Are you sure you want to revoke this member\'s access? They will lose access to the tree but their person data will remain.',
      onConfirm: async () => {
        try {
          const person = people.find(p => p.id === personId);
          await dataService.removeMember(treeId, person.linkedUserId);
          addToast('Member access revoked successfully', 'success');
          reload(); // Refresh data
        } catch (error) {
          openModal('errorModal', { message: `Failed to revoke member access: ${error.message}` });
        }
      },
      onCancel: () => {}
    });
  };

  const handleEditMemberRole = (member) => {
    if (!tree || !currentUser) return;

    // Check if current user is admin
    const currentUserMember = tree.members?.find(m => m.userId === currentUser.uid);
    if (currentUserMember?.role !== 'admin') {
      openModal('errorModal', { message: 'Only admins can change member roles' });
      return;
    }

    openModal('editMemberRole', {
      member,
      treeId,
      onRoleUpdated: reload
    });
  };

  const handleToggleBan = async (member, banPeriod = null) => {
    if (!tree || !currentUser) return;

    // Check if current user is admin
    const currentUserMember = tree.members?.find(m => m.userId === currentUser.uid);
    if (currentUserMember?.role !== 'admin') {
      openModal('errorModal', { message: 'Only admins can ban/unban members' });
      return;
    }

    try {
      if (member.banned) {
        await dataService.unbanMember(treeId, member.linkedUserId);
        addToast('Member unbanned successfully', 'success');
      } else {
        await dataService.banMember(treeId, member.linkedUserId, banPeriod);
        addToast('Member banned successfully', 'success');
      }
      reload(); // Refresh data
    } catch (error) {
      openModal('errorModal', { message: `Failed to ${member.banned ? 'unban' : 'ban'} member: ${error.message}` });
    }
  };

  if (loading) {
    return (
      <FlexContainer justify="center" align="center" padding="20px" style={{ height: '100vh' }}>
        <div style={{ width: 220, maxWidth: '60vw' }}>
          <LottieLoader name="generalDataLoader" aspectRatio={1} loop autoplay />
        </div>
        <div style={{ marginTop: 12, color: 'var(--color-text-muted)', fontSize: 14 }}>
          Loading members data...
        </div>
      </FlexContainer>
    );
  }

  if (!tree) {
    return (
      <FlexContainer justify="center" align="center" padding="20px">
        <Text>Tree not found</Text>
      </FlexContainer>
    );
  }

  const currentUserMember = tree.members?.find(m => m.userId === currentUser.uid);
  const canManageRoles = currentUserMember?.role === 'admin' || currentUserMember?.role === 'moderator';

  const tabs = [
    { id: 'people', label: 'Manage People', icon: User },
    { id: 'members', label: 'Manage Members', icon: Users },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'people':
        return <PeopleTable people={people} onEdit={handleEditPerson} onDelete={handleDeletePerson} onViewRelationships={handleViewRelationships} onGrantMembership={handleGrantMembership} canManageRoles={canManageRoles} />;
      case 'members':
        return <MemeberTable members={members} canManageRoles={canManageRoles} onInviteMember={handleInviteMember} onNavigateToInvitePage={handleNavigateToInvitePage} onRevokeMember={handleRevokeMember} onEditMemberRole={handleEditMemberRole} onToggleBan={handleToggleBan} treeId={treeId} openModal={openModal} />;
      default:
        return null;
    }
  };

  return (
    <FlexContainer direction="vertical" padding="20px" gap="20px">
      <Row justifyContent="space-between" align="center">
        <Text variant="heading1">Manage Members</Text>
        <Text variant="body2" color="gray">Tree: {tree.familyName}</Text>
      </Row>

      {/* Tabs */}
      <Row gap="0" style={{ borderBottom: '1px solid var(--color-gray-light)' }}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? 'primary' : 'ghost'}
              onClick={() => setActiveTab(tab.id)}
              style={{
                borderRadius: '0',
                borderBottom: activeTab === tab.id ? '2px solid var(--color-primary)' : 'none',
                padding: '12px 20px'
              }}
            >
              <Icon size={16} style={{ marginRight: '8px' }} />
              {tab.label}
            </Button>
          );
        })}
      </Row>

      <Text variant="body1">
        {activeTab === 'people' && 'View and manage all people in your family tree.'}
        {activeTab === 'members' && 'Manage roles and details for members of your family tree. Only admins can change roles.'}
        {activeTab === 'settings' && 'Configure tree settings and permissions.'}
      </Text>

      {renderTabContent()}

      {/* Modals */}
    </FlexContainer>
  );
};
export default MembersPage;
