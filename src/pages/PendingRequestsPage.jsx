import React, { useState, useEffect } from 'react';
import { useParams, useOutletContext } from 'react-router-dom';
import FlexContainer from '../layout/containers/FlexContainer';
import Text from '../components/Text';
import Card from '../layout/containers/Card';
import Column from '../layout/containers/Column';
import Row from '../layout/containers/Row';
import { getJoinRequestsForTree } from '../services/joinRequestService';
import useToastStore from '../store/useToastStore';
import { useAuth } from '../context/AuthContext';
import JoinRequestCard from '../components/PendingRequestCard';
import SelectDropdown from '../components/SelectDropdown';
import { TextInput } from '../components/Input';
import { Clock, Search } from 'lucide-react';
import { formatArrivalTime } from '../utils/featuresUtils/formatArrivalTime';

const PendingRequestsPage = () => {
  const { treeId } = useParams();
  const { currentUser } = useAuth();
  const addToast = useToastStore(state => state.addToast);
  const { onNotificationClick } = useOutletContext();

  const [allRequests, setAllRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [genderFilter, setGenderFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (currentUser && treeId) {
      loadPendingRequests();
    }
  }, [currentUser, treeId]);

  const loadPendingRequests = async () => {
    try {
      setLoading(true);
      const requests = await getJoinRequestsForTree(treeId);
      setAllRequests(requests);
    } catch (error) {
      console.error('Error loading pending requests:', error);
      addToast('Failed to load pending requests', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Filter requests based on status, gender, and search query
  useEffect(() => {
    let filtered = allRequests;

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(request => request.status === statusFilter);
    }

    // Filter by gender
    if (genderFilter !== 'all') {
      filtered = filtered.filter(request => request.gender === genderFilter);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(request =>
        request.name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredRequests(filtered);
  }, [allRequests, statusFilter, genderFilter, searchQuery]);



  const handleView = (request) => {
    // Open the notification details in the sidebar
    onNotificationClick({
      id: request.JoinRequestId,
      type: "joinRequest",
      title: `Join Request: ${request.name}`,
      description: `New join request from ${request.name} (${request.gender}). ${request.notes ? `Notes: ${request.notes}` : ''}`,
      createdAt: request.createdAt,
      icon: <Clock size={16} />,
      timeLabel: formatArrivalTime({ createdAt: request.createdAt }),
      details: `Join request details: ${request.name}, ${request.gender}, ${request.birthDate || 'No birth date'}, ${request.notes || 'No notes'}. Proof files: ${request.proofFiles.length}`,
      requestData: request // Pass full request data for sidebar
    });
  };

  if (loading) {
    return (
      <FlexContainer direction="vertical" padding="20px" gap="20px" align="center">
        <Text variant="heading2">Loading pending requests...</Text>
      </FlexContainer>
    );
  }

  const statusOptions = [
    { value: 'all', label: 'All Requests' },
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
  ];


  const getEmptyStateMessage = () => {
    if (statusFilter === 'pending') {
      return {
        title: 'No Pending Requests',
        description: 'There are currently no pending requests to review.'
      };
    } else if (statusFilter === 'approved') {
      return {
        title: 'No Approved Requests',
        description: 'There are currently no approved requests.'
      };
    } else if (statusFilter === 'rejected') {
      return {
        title: 'No Rejected Requests',
        description: 'There are currently no rejected requests.'
      };
    } else {
      return {
        title: 'No Requests Found',
        description: 'No requests match your current filters.'
      };
    }
  };

  const emptyState = getEmptyStateMessage();

  return (
    <FlexContainer direction="Column" gap="20px">
      <Column padding='0px' margin='0px' gap="20px">

        <Text variant="heading2" >
          Review and manage requests for your family tree
        </Text>

        {/* Filters Row */}
        <Row gap="16px" alignItems="center">
          <Column flex="1" padding="0" margin="0">
            <SelectDropdown
              label="Filter by Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={statusOptions}
              placeholder="Select status"
            />
          </Column>
          <Column flex="1" padding="0" margin="0">
            <TextInput
              label="Search by Name"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Enter requester name..."
              leadingIcon={<Search size={16} />}
            />
          </Column>
        </Row>

        {filteredRequests.length === 0 ? (
          <Card padding="40px" textAlign="center">
            <Clock size={48} color="var(--color-gray)" />
            <Text variant="heading3" margin="20px 0 10px 0">{emptyState.title}</Text>
            <Text variant="body2" color="gray" margin="0 0 20px 0">
              {emptyState.description}
            </Text>
          </Card>
        ) : (
          <div className="notification-grid">
            {filteredRequests.map((request) => (
              <JoinRequestCard
                key={request.id}
                request={request}
                onClick={handleView}
              />
            ))}
          </div>
        )}
      </Column>
    </FlexContainer>
  );
};

export default PendingRequestsPage;
