import React from 'react';
import Text from '../components/Text';
import Card from '../layout/containers/Card';
import Row from '../layout/containers/Row';
import Button from '../components/Button';
import DataTable from '../components/DataTable';
import Column from '../layout/containers/Column';
import { UserPlus } from 'lucide-react';
import { Link } from 'react-router-dom';
import Pill from '../components/pill';


const MemeberTable = ({ members, canManageRoles, onInviteMember, onNavigateToInvitePage, onRevokeMember, onEditMemberRole, onToggleBan, treeId, openModal }) => {
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString();
  };

  const columns = [
    {
      key: 'profileImage',
      header: 'Photo',
      render: (member) => (
        <img
          src={member.photoUrl || '/Images/default-avatar.png'}
          alt={member.name}
          style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
        />
      ),
      align: 'center'
    },
    { key: 'name', header: 'Person Name', type: 'string', searchable: true, sortable: true },
    {
      key: 'role',
      header: 'Role',
      type: 'string',
      filterable: true,
      render: (member) => (
        <Text variant="body2" style={{ textTransform: 'capitalize' }}>
          {member.role || 'No role'}
        </Text>
      )
    },
    {
      key: 'joinedAt',
      header: 'Join Date',
      render: (member) => formatDate(member.joinedAt),
      type: 'date',
      sortable: true,
      align: 'center'
    },
    {
      key: 'status',
      header: 'Status',
      type: 'string',
      filterable: true,
      filterOptions: [
        { value: 'Active', label: 'Active' },
        { value: 'Banned', label: 'Banned' },
        { value: 'Banned (temp)', label: 'Banned (temp)' }
      ],
      render: (member) => {
        let status = member.status;
        let backgroundColor = 'var(--color-primary1)'; // for active
        let color = 'white';
        let countdown = null;
        

        if (member.banned) {
          if (member.banPeriod) {
            backgroundColor = 'var(--color-warning2)'; // for banned temp
          } else {
            backgroundColor = 'var(--color-danger)'; // for banned
          }

          // Show countdown if there's a ban period
          if (member.banPeriod) {
            const banEndDate = new Date(member.banPeriod);
            const now = new Date();
            const diffTime = banEndDate - now;

            if (diffTime > 0) {
              const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
              const diffHours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
              const diffMinutes = Math.floor((diffTime % (1000 * 60 * 60)) / (1000 * 60));

              if (diffDays > 0) {
                countdown = `${diffDays}d`;
              } else if (diffHours > 0) {
                countdown = `${diffHours}h`;
              } else {
                countdown = `${diffMinutes}m`;
              }
            }
          }
        } else if (!member.lastActive) {
          backgroundColor = 'var(--color-primary1)'; 
          color = 'white';
        } else {
          
          const lastActiveDate = new Date(member.lastActive);
          const now = new Date();
          const diffTime = Math.abs(now - lastActiveDate);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays > 30) {
            backgroundColor = 'var(--color-warning)'; 
            color = '#333';
          }
        }

        return (
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <Pill backgroundColor={backgroundColor} color={color}>
              {status}
            </Pill>
            {countdown && (
              <Card
                fitContent
                padding="1px 4px"
                backgroundColor="#ff6b6b"
                borderRadius="4px"
                style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  fontSize: '10px',
                  color: 'white',
                  fontWeight: 'bold',
                  zIndex: 1
                }}
              >
                {countdown}
              </Card>
            )}
          </div>
        );
      },
      align: 'center'
    },
    {
      key: 'lastActive',
      header: 'Last Active',
      render: (member) => formatDate(member.lastActive),
      type: 'date',
      sortable: true,
      align: 'center'
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'center',
      render: (member) => (
        <Row padding='0rem 1rem' gap='1rem'>
          {canManageRoles && (
            <>
              <Button margin='0px 5px 0px 5px' variant="secondary" size="sm" fullWidth onClick={(e) => { e.preventDefault(); onEditMemberRole(member); }}>
                Role
              </Button>
              <Button margin='0px 5px 0px 5px' variant="warning" size="sm" fullWidth onClick={(e) => {
                e.preventDefault();
                if (member.banned) {
                  onToggleBan(member); 
                } else {
                  openModal('banMemberModal', { member, treeId, onBanConfirmed: onToggleBan });
                }
              }}>
                {member.banned ? 'Unban' : 'Ban'}
              </Button>
              <Button margin='0px 5px 0px 5px' variant="danger" size="sm" fullWidth onClick={(e) => { e.preventDefault(); onRevokeMember(member.id); }}>
                Revoke
              </Button>
            </>
          )}
        </Row>
      )
    }
  ];

  if (members.length === 0) {
    return (
      <Column gap="20px">
        <Row justifyContent="center">
          <Button variant="primary" onClick={onInviteMember}>
            <UserPlus size={16} style={{ marginRight: '8px' }} />
            Invite Member
          </Button>
          <Button variant='primary' onClick={onNavigateToInvitePage}>
            Go to invite page
          </Button>
        </Row>
        <Card padding="20px" textAlign="center">
          <Users size={48} color="var(--color-gray)" />
          <Text variant="heading3" margin="10px 0">No Members Found</Text>
          <Text variant="body2" color="gray">
            Members are people linked to user accounts in your tree.
          </Text>
        </Card>
      </Column>
    );
  }

  return (
    <Column gap="15px">
      <Row justifyContent="flex-end">
        <Button variant="primary" onClick={onInviteMember}>
          <UserPlus size={16} style={{ marginRight: '8px' }} />
          Invite Member
        </Button>
      </Row>
      <DataTable
        columns={columns}
        data={members || []}
        enableSearch={true}
        enablePagination={true}
        initialPageSize={10}
      />
    </Column>
  );
};

export default MemeberTable;