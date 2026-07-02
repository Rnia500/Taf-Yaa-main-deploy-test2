import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import FlexContainer from '../layout/containers/FlexContainer';
import Column from '../layout/containers/Column';
import Row from '../layout/containers/Row';
import Card from '../layout/containers/Card';
import Text from '../components/Text';
import Button from '../components/Button';
import SelectDropdown from '../components/SelectDropdown';
import { TextInput } from '../components/Input';
import { GitMerge, Search, Users, Check, X, Send } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import useToastStore from '../store/useToastStore';
import dataService from '../services/dataService';
import {
  subscribeToMergeRequests,
  respondToMergeRequest,
  createMergeRequest,
} from '../services/mergeRequestService';

function MergeRequestCard({ request, isAdmin, onApprove, onReject }) {
  const isIncoming = request.direction === 'incoming';
  return (
    <Card padding="16px" backgroundColor="var(--color-white)" borderColor="var(--color-gray)">
      <Row justifyContent="space-between" alignItems="flex-start" fitContent>
        <Row gap="10px" fitContent alignItems="center">
          <div style={{
            width: 40, height: 40, borderRadius: 10, background: '#f0fdf4',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <GitMerge size={18} color="#1F724A" />
          </div>
          <Column padding="0px" margin="0px" gap="2px">
            <Text variant="body1" bold>
              {isIncoming
                ? `${request.sourceTreeName || 'A family'} wants to merge into your tree`
                : `Merge request sent to ${request.targetTreeName || 'another tree'}`}
            </Text>
            <Text variant="caption" color="secondary-text">
              Requested by {request.requestedByName || 'Unknown'}
              {request.commonAncestorName && ` · Common ancestor: ${request.commonAncestorName}`}
            </Text>
          </Column>
        </Row>
        <span style={{
          fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
          background: request.status === 'pending' ? '#fff7ed' : request.status === 'approved' ? '#f0fdf4' : '#fef2f2',
          color: request.status === 'pending' ? '#C9731E' : request.status === 'approved' ? '#1F724A' : '#dc2626',
        }}>
          {request.status}
        </span>
      </Row>

      {request.message && (
        <Text variant="body2" color="secondary-text" style={{ marginTop: 10 }}>
          "{request.message}"
        </Text>
      )}

      {isIncoming && isAdmin && request.status === 'pending' && (
        <Row gap="10px" fitContent style={{ marginTop: 14 }}>
          <Button variant="primary" onClick={() => onApprove(request)} icon={<Check size={15} />}>
            Approve Merge
          </Button>
          <Button variant="secondary" onClick={() => onReject(request)} icon={<X size={15} />}>
            Reject
          </Button>
        </Row>
      )}
    </Card>
  );
}

function NewMergeRequestModal({ treeId, treeName, currentUser, onClose, onSent }) {
  const [targetId, setTargetId] = useState('');
  const [targetTree, setTargetTree] = useState(null);
  const [ancestor, setAncestor] = useState('');
  const [message, setMessage] = useState('');
  const [searching, setSearching] = useState(false);
  const [sending, setSending] = useState(false);
  const addToast = useToastStore(state => state.addToast);

  const handleSearch = async () => {
    if (!targetId.trim()) return;
    setSearching(true);
    try {
      const tree = await dataService.getTree(targetId.trim());
      if (!tree) {
        addToast('No tree found with that ID', 'error');
        setTargetTree(null);
      } else if (tree.id === treeId) {
        addToast("You can't merge a tree with itself", 'error');
        setTargetTree(null);
      } else {
        setTargetTree(tree);
      }
    } catch {
      addToast('Could not find that tree', 'error');
    } finally {
      setSearching(false);
    }
  };

  const handleSend = async () => {
    if (!targetTree) return;
    setSending(true);
    try {
      await createMergeRequest({
        sourceTreeId: treeId,
        sourceTreeName: treeName,
        targetTreeId: targetTree.id,
        targetTreeName: targetTree.familyName,
        requestedBy: currentUser.uid,
        requestedByName: currentUser.displayName || currentUser.email,
        commonAncestorName: ancestor,
        message,
      });
      addToast('Merge request sent', 'success');
      onSent();
      onClose();
    } catch (err) {
      addToast('Failed to send request', 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <Card padding="24px" backgroundColor="var(--color-white)" style={{ maxWidth: 440, width: '100%' }}>
        <Column padding="0px" margin="0px" gap="16px">
          <Row justifyContent="space-between" alignItems="center" fitContent>
            <Text variant="heading3">Request a Tree Merge</Text>
            <Button variant="secondary" onClick={onClose} icon={<X size={16} />} />
          </Row>

          <Text variant="body2" color="secondary-text">
            Enter the ID of the family tree you believe shares a common ancestor with yours. Their admin will need to approve before the trees are linked.
          </Text>

          <Row gap="8px" fitContent alignItems="flex-end">
            <Column flex="1" padding="0px" margin="0px">
              <TextInput
                label="Target Tree ID"
                value={targetId}
                onChange={e => setTargetId(e.target.value)}
                placeholder="tree_xxxxxxxx-xxxx-..."
                leadingIcon={<Search size={16} />}
              />
            </Column>
            <Button variant="secondary" onClick={handleSearch} disabled={searching}>
              {searching ? '...' : 'Find'}
            </Button>
          </Row>

          {targetTree && (
            <Card padding="12px" backgroundColor="var(--color-background)" borderColor="var(--color-gray)">
              <Row gap="8px" fitContent alignItems="center">
                <Users size={16} color="#1F724A" />
                <Text variant="body2" bold>{targetTree.familyName}</Text>
              </Row>
            </Card>
          )}

          <TextInput
            label="Common Ancestor (optional)"
            value={ancestor}
            onChange={e => setAncestor(e.target.value)}
            placeholder="e.g. Papa Nguetsop"
          />

          <TextInput
            label="Message to the other admin (optional)"
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Why do you think these trees are related?"
          />

          <Button variant="primary" onClick={handleSend} disabled={!targetTree || sending} icon={<Send size={15} />}>
            {sending ? 'Sending...' : 'Send Merge Request'}
          </Button>
        </Column>
      </Card>
    </div>
  );
}

export default function MergeRequestsPage() {
  const { treeId } = useParams();
  const { currentUser } = useAuth();
  const addToast = useToastStore(state => state.addToast);

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [treeName, setTreeName] = useState('');
  const [directionFilter, setDirectionFilter] = useState('all');
  const [showNewModal, setShowNewModal] = useState(false);

  useEffect(() => {
    if (!treeId || !currentUser) return;

    dataService.getTree(treeId).then(tree => {
      if (tree) {
        setTreeName(tree.familyName);
        const role = tree.roles?.[currentUser.uid];
        setIsAdmin(role === 'admin' || role === 'moderator');
      }
    });

    const unsub = subscribeToMergeRequests(treeId, list => {
      setRequests(list);
      setLoading(false);
    });
    return unsub;
  }, [treeId, currentUser]);

  const handleApprove = async (request) => {
    try {
      await respondToMergeRequest(request.id, 'approved', currentUser.uid);
      addToast('Merge request approved', 'success');
    } catch {
      addToast('Failed to approve request', 'error');
    }
  };

  const handleReject = async (request) => {
    try {
      await respondToMergeRequest(request.id, 'rejected', currentUser.uid);
      addToast('Merge request rejected', 'info');
    } catch {
      addToast('Failed to reject request', 'error');
    }
  };

  const filtered = requests.filter(r => directionFilter === 'all' || r.direction === directionFilter);

  const directionOptions = [
    { value: 'all', label: 'All Requests' },
    { value: 'incoming', label: 'Incoming (need your approval)' },
    { value: 'outgoing', label: 'Sent by you' },
  ];

  if (loading) {
    return (
      <FlexContainer direction="vertical" padding="20px" gap="20px" align="center">
        <Text variant="heading2">Loading merge requests...</Text>
      </FlexContainer>
    );
  }

  return (
    <FlexContainer direction="Column" gap="20px">
      <Column padding="0px" margin="0px" gap="20px">
        <Row justifyContent="space-between" alignItems="center" fitContent>
          <Text variant="heading2">Requests to merge family trees</Text>
          <Button variant="primary" onClick={() => setShowNewModal(true)} icon={<GitMerge size={16} />}>
            New Merge Request
          </Button>
        </Row>

        <Row gap="16px" alignItems="center" fitContent>
          <Column flex="1" padding="0" margin="0">
            <SelectDropdown
              label="Filter"
              value={directionFilter}
              onChange={e => setDirectionFilter(e.target.value)}
              options={directionOptions}
            />
          </Column>
        </Row>

        {filtered.length === 0 ? (
          <Card padding="40px" textAlign="center">
            <GitMerge size={48} color="var(--color-gray)" />
            <Text variant="heading3" margin="20px 0 10px 0">No Merge Requests</Text>
            <Text variant="body2" color="gray" margin="0 0 20px 0">
              When a related family finds your tree and requests to merge, or when you send a request to another tree, it will appear here.
            </Text>
          </Card>
        ) : (
          <Column padding="0px" margin="0px" gap="12px">
            {filtered.map(request => (
              <MergeRequestCard
                key={request.id}
                request={request}
                isAdmin={isAdmin}
                onApprove={handleApprove}
                onReject={handleReject}
              />
            ))}
          </Column>
        )}
      </Column>

      {showNewModal && (
        <NewMergeRequestModal
          treeId={treeId}
          treeName={treeName}
          currentUser={currentUser}
          onClose={() => setShowNewModal(false)}
          onSent={() => {}}
        />
      )}
    </FlexContainer>
  );
}