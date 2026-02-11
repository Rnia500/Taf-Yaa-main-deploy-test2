import React from 'react'
import DataTable from '../components/DataTable'
import Row from '../layout/containers/Row'
import Button from '../components/Button'
import { UserPen, Users2, UserPlus, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext';
import { useFamilyData } from '../hooks/useFamilyData';
import { useParams } from 'react-router-dom';
import useSidebarStore from '../store/useSidebarStore'


const PeopleTable = ({ people, onEdit, onDelete, onViewRelationships, onGrantMembership, canManageRoles }) => {
    const { treeId } = useParams();
    const {tree, loading, reload } = useFamilyData(treeId);
    const openSidebar = useSidebarStore(state => state.openSidebar);
    const { currentUser } = useAuth();

  
    const calculateAge = (birthDate, deathDate, isDeceased) => {
    if (!birthDate) return 'Unknown';
    const birth = new Date(birthDate);
    const end = isDeceased && deathDate ? new Date(deathDate) : new Date();
    let age = end.getFullYear() - birth.getFullYear();
    const monthDiff = end.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && end.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const currentUserMember = tree && tree.members?.find(m => m.userId === currentUser.uid);
    canManageRoles = currentUserMember?.role === 'admin' || currentUserMember?.role === 'moderator';

  const columns = [
    {
      key: 'profileImage',
      header: 'Photo',
      render: (person) => (
        <img
          src={person.photoUrl || '/Images/default-avatar.png'}
          alt={person.name}
          style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
        />
      ),
      align: 'center'
    },
    { key: 'name', header: 'Name', type: 'string', searchable: true, sortable: true },
    {
      key: 'age',
      header: 'Age',
      render: (person) => calculateAge(person.dob, person.dod, person.isDeceased),
      type: 'number',
      sortable: true,
      align: 'center',
    },
    { key: 'gender', header: 'Gender', type: 'string', filterable: true },
    {
      key: 'actions',
      header: 'Actions',
      align: 'center',
      render: (person) => (
        canManageRoles && !person.linkedUserId ?
          <Row padding='0rem 1rem' gap="5px" alignItems='center' maxWidth={300}>
            <Button variant="secondary" size="small" fullWidth onClick={(e) => { e.preventDefault(); onEdit(person.id); }}>
              <UserPen size={14} />
            </Button>
            <Button variant="info" size="small" fullWidth onClick={(e) => { e.preventDefault(); onViewRelationships(person.id); }}>
              <Users2 size={14} />
            </Button>
            <Button variant="primary" size="small" fullWidth onClick={(e) => { e.preventDefault(); onGrantMembership(person); }}>
              <UserPlus size={14} />
            </Button>
            <Button variant="danger" size="small" fullWidth onClick={(e) => { e.preventDefault(); onDelete(person); }}>
              <Trash2 size={14} />
            </Button>
          </Row>
        :
          <Row padding='0rem 1rem' gap="5px" maxWidth={300}>
            <Button variant="secondary" size="small" fullWidth onClick={(e) => { e.preventDefault(); onEdit(person.id); }}>
              <UserPen size={14} />
            </Button>
            <Button variant="info" size="small" fullWidth onClick={(e) => { e.preventDefault(); onViewRelationships(person.id); }}>
              <Users2 size={14} />
            </Button>
            <Button variant="danger" size="small" fullWidth onClick={(e) => { e.preventDefault(); onDelete(person); }}>
              <Trash2 size={14} />
            </Button>
          </Row>
      )
    }
  ];

  return (
    <DataTable
      onRowClick={(person) => openSidebar(person.id)}
      columns={columns}
      data={people || []}
      enableSearch={true}
      enablePagination={true}
      initialPageSize={10}
    />
  );
};

export default PeopleTable;