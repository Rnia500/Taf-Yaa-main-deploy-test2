// pages/DeletedPersonsPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Card from '../layout/containers/Card';
import Text from '../components/Text';
import Button from '../components/Button';
import DeletionCountdown from '../components/DeletionCountdown';
import Spacer from '../components/Spacer';
import Row from '../layout/containers/Row';
import Column from '../layout/containers/Column';
import dataService from '../services/dataService';
import useToastStore from '../store/useToastStore';
import useModalStore from '../store/useModalStore';
import DataTable from '../components/DataTable';

const DeletedPersonsPage = () => {
  const { treeId } = useParams();
  const [deletedPersons, setDeletedPersons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const addToast = useToastStore(state => state.addToast);
  const { openModal, closeModal } = useModalStore();

  useEffect(() => {
    loadDeletedPersons();
  }, [treeId]);

  const loadDeletedPersons = async () => {
    try {
      setLoading(true);
      const persons = treeId
        ? await dataService.getDeletedPersonsByTreeId(treeId)
        : await dataService.getDeletedPersons();

      // Group cascade deletions into batches
      const cascadeBatches = new Map();
      const filtered = [];
      for (const p of persons) {
        if (p.deletionMode === 'cascade') {
          if (!cascadeBatches.has(p.deletionBatchId)) {
            cascadeBatches.set(p.deletionBatchId, []);
          }
          cascadeBatches.get(p.deletionBatchId).push(p);
        } else {
          filtered.push(p); // soft deletions always included
        }
      }

      for (const [, people] of cascadeBatches.entries()) {
        let root = people.find(x => x.isCascadeRoot);
        if (!root) {
          root = people
            .slice()
            .sort((a, b) => new Date(a.deletedAt) - new Date(b.deletedAt))[0];
        }
        if (root) filtered.push(root);
      }

      // Enrich with details
      const personsWithDetails = await Promise.all(
        filtered.map(async person => {
          let affectedCount = 0;
          let marriageCount = 0;

          if (person.deletionMode === 'cascade' && person.deletionBatchId) {
            const allDeleted = treeId
              ? await dataService.getDeletedPersonsByTreeId(treeId)
              : await dataService.getDeletedPersons();

            const batchPersons = allDeleted.filter(
              p => p.deletionBatchId === person.deletionBatchId
            );
            affectedCount = batchPersons.length - 1;

            const marriages = await dataService.getAllMarriages(treeId);
            const batchMarriages = marriages.filter(
              m => m.deletionBatchId === person.deletionBatchId && m.pendingDeletion
            );
            marriageCount = batchMarriages.length;
          }

          const deletedAt = new Date(person.deletedAt);
          const now = new Date();
          const purgeWindowMs = 30 * 24 * 60 * 60 * 1000;
          const timeRemaining = purgeWindowMs - (now - deletedAt);
          const daysRemaining = Math.ceil(
            timeRemaining / (24 * 60 * 60 * 1000)
          );
          const isExpired = timeRemaining <= 0;

          return {
            ...person,
            affectedCount,
            marriageCount,
            timeRemaining,
            daysRemaining,
            isExpired
          };
        })
      );

      setDeletedPersons(personsWithDetails);
    } catch (error) {
      console.error('Failed to load deleted persons:', error);
      addToast('Failed to load deleted persons', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async person => {
    try {
      setActionLoading(prev => ({ ...prev, [person.id]: true }));
      const result = await dataService.undoDelete(person.id);
      addToast(
        `Successfully restored ${person.name}${
          result.restoredIds?.length > 1
            ? ` and ${result.restoredIds.length - 1} others`
            : ''
        }`,
        'success'
      );
      await loadDeletedPersons();
    } catch (error) {
      console.error('Failed to restore person:', error);
      addToast(`Failed to restore person: ${error.message}`, 'error');
    } finally {
      setActionLoading(prev => ({ ...prev, [person.id]: false }));
    }
  };

  const handlePurge = person => {
    const warningMessage =
      person.deletionMode === 'cascade'
        ? `This will permanently delete ${person.name} and ${person.affectedCount} other people, plus ${person.marriageCount} marriages. This action is irreversible and will break family relationships. Are you absolutely sure?`
        : `This will permanently delete ${person.name}. This action is irreversible. Are you absolutely sure?`;

    openModal('warningModal', {
      title: '⚠️ Permanent Deletion Warning',
      message: warningMessage,
      confirmText: 'Yes, Delete Permanently',
      cancelText: 'Cancel',
      confirmVariant: 'danger',
      onConfirm: () => {
        closeModal('warningModal');
        confirmPurge(person);
      },
      onCancel: () => closeModal('warningModal')
    });
  };

  const confirmPurge = async person => {
    try {
      setActionLoading(prev => ({ ...prev, [person.id]: true }));
      await dataService.purgePerson(person.id);
      addToast(`Permanently deleted ${person.name}`, 'success');
      await loadDeletedPersons();
    } catch (error) {
      console.error('Failed to purge person:', error);
      addToast(`Failed to purge person: ${error.message}`, 'error');
    } finally {
      setActionLoading(prev => ({ ...prev, [person.id]: false }));
    }
  };

  const handleViewDetails = async person => {
    try {
      if (person.deletionMode !== 'cascade' || !person.deletionBatchId) {
        openModal('infoModal', {
          title: 'Details',
          message: `${person.name} was soft-deleted. No cascade details available.`,
          confirmText: 'Close'
        });
        return;
      }

      const allDeleted = treeId
        ? await dataService.getDeletedPersonsByTreeId(treeId)
        : await dataService.getDeletedPersons();
      const batchPersonsRaw = allDeleted.filter(
        p => p.deletionBatchId === person.deletionBatchId
      );

      const people = batchPersonsRaw.map(p => ({
        id: p.id,
        name: p.name || 'Unknown',
        gender: p.gender,
        dob: p.dob || null,
        dod: p.dod || null
      }));

      const personNameById = new Map(people.map(p => [p.id, p.name]));

      const marriages = await dataService.getAllMarriages();
      const batchMarriagesRaw = marriages.filter(
        m => m.deletionBatchId === person.deletionBatchId && m.pendingDeletion
      );

      const marriagesPrepared = batchMarriagesRaw.map(m => {
        let spouse1 = 'Unknown';
        let spouse2 = 'Unknown';
        if (m.marriageType === 'monogamous') {
          const [s1, s2] = Array.isArray(m.spouses) ? m.spouses : [];
          spouse1 = s1 ? personNameById.get(s1) || 'Unknown' : 'Unknown';
          spouse2 = s2 ? personNameById.get(s2) || 'Unknown' : 'Unknown';
        } else if (m.marriageType === 'polygamous') {
          const husbandName = m.husbandId
            ? personNameById.get(m.husbandId) || 'Unknown'
            : 'Unknown';
          const wifeNames = Array.isArray(m.wives)
            ? m.wives.map(w => personNameById.get(w.wifeId) || 'Unknown')
            : [];
          spouse1 = husbandName;
          spouse2 = wifeNames.length > 0 ? wifeNames.join(', ') : 'Unknown';
        }
        return {
          id: m.id,
          marriageType: m.marriageType,
          spouse1,
          spouse2
        };
      });

      openModal('cascadeDetailsModal', {
        title: `Cascade Details — ${person.name}`,
        people,
        marriages: marriagesPrepared
      });
    } catch (error) {
      console.error('Failed to load details:', error);
      addToast('Failed to load details', 'error');
    }
  };

  const getDeletionModeBadge = mode => {
    const styles = {
      soft: {
        backgroundColor: 'var(--color-warning-light)',
        color: 'var(--color-warning)',
        border: '1px solid var(--color-warning)',
        padding: '2px 8px',
        borderRadius: '12px',
        fontSize: '0.75rem',
        fontWeight: '600'
      },
      cascade: {
        backgroundColor: 'var(--color-danger-light)',
        color: 'var(--color-danger)',
        border: '1px solid var(--color-danger)',
        padding: '2px 8px',
        borderRadius: '12px',
        fontSize: '0.75rem',
        fontWeight: '600'
      }
    };
    return (
      <span style={styles[mode] || styles.soft}>
        {mode === 'soft' ? 'Soft Delete' : 'Cascade Delete'}
      </span>
    );
  };

  const sortOptions = [
    { value: 'name-asc', label: 'Name A-Z', key: 'name', dir: 'asc', type: 'string' },
    { value: 'name-desc', label: 'Name Z-A', key: 'name', dir: 'desc', type: 'string' },
    { value: 'deletedAt-asc', label: 'Oldest Deleted First', key: 'deletedAt', dir: 'asc', type: 'date' },
    { value: 'deletedAt-desc', label: 'Newest Deleted First', key: 'deletedAt', dir: 'desc', type: 'date' },
    { value: 'affectedCount-desc', label: 'Most Affected First', key: 'affectedCount', dir: 'desc', type: 'number' },
    { value: 'affectedCount-asc', label: 'Least Affected First', key: 'affectedCount', dir: 'asc', type: 'number' },
    { value: 'daysRemaining-asc', label: 'Expiring Soonest', key: 'daysRemaining', dir: 'asc', type: 'number' },
    { value: 'daysRemaining-desc', label: 'Most Time Remaining', key: 'daysRemaining', dir: 'desc', type: 'number' },
  ];

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <Text variant="h4">Loading deleted persons...</Text>
      </div>
    );
  }

  if (deletedPersons.length === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <Text variant="h4">No Deleted Persons</Text>
        <Spacer size="md" />
        <Text color="gray-dark">
          There are no deleted persons to restore or purge.
        </Text>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <Column gap="1rem">
        <Row fitContent justifyContent="space-between" alignItems="center">
          <Column gap="4px">
            <Text variant="heading1" as="h1" bold>
              Deleted Persons
            </Text>
            <Text color="gray-dark">
              Manage soft and cascade deletions. Restore or permanently purge.
            </Text>
          </Column>
          <Button variant="primary" onClick={loadDeletedPersons}>
            Refresh
          </Button>
        </Row>

       <DataTable
  sortOptions={sortOptions}
  columns={[
    {
      key: 'name',
      header: 'Person',
      type: 'string',
      sortable: true,
      align: 'center',
      searchable: true,
      render: row => (
        <Column padding="0px" margin="0px" gap="0.25rem">
          <Text as="p" bold variant="body1">
            {row.name || 'Unknown'}
          </Text>
          <Text as="p" variant="body1" color="var(--color-gray)">
            Deleted: {new Date(row.deletedAt).toLocaleDateString()}
          </Text>
        </Column>
      )
    },
    {
      key: 'deletionMode',
      header: 'Deletion Mode',
      type: 'string',
      align: 'center',
      render: row => getDeletionModeBadge(row.deletionMode)
    },
    {
      key: 'affectedCount',
      header: 'Affected',
      type: 'number',
      align: 'center',
      sortable: true,
      render: row => (
        <Column justifyContent="center" alignItems="center"  padding="0px" margin="0px" gap="0.25rem">
          <Text as="p" align='center' variant="body1">
            {row.affectedCount} people
          </Text>
          <Text as="p" align='center' variant="body1">
            {row.marriageCount} marriages
          </Text>
        </Column>
      )
    },
    {
      key: 'daysRemaining',
      header: 'Time Remaining',
      type: 'number',
      align: 'center',
      sortable: true,
      render: row => (
        <DeletionCountdown
          timeRemaining={row.timeRemaining}
          isExpired={row.isExpired}
          variant="badge"
          showDetails={true}
        />
      )
    },
    {
      key: 'actions',
      searchable: true,
      header: 'Actions',
      align: 'center',
      render: row => (
        <Row gap="0.5rem" padding="0px" margin="0px" justifyContent="center">
          <Button
            variant="primary"
            size="sm"
            onClick={() => handleRestore(row)}
            loading={actionLoading[row.id]}
            disabled={row.isExpired}
          >
            Restore
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => handlePurge(row)}
            loading={actionLoading[row.id]}
          >
            Purge
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleViewDetails(row)}
          >
            Details
          </Button>
        </Row>
      )
    }
  ]}
  data={deletedPersons}
  enablePagination
  initialPageSize={10}
  enableSearch={true}
  enableSort={true}
  enableFilters={true}
  showHeader={true}
  showControlsToggle={true}
  controlsInitiallyOpen={true}
  
 
  customFilterOptions={[
  {
    key: 'deletionMode',
    label: 'Deletion Mode',
    options: [
      
      { value: 'soft', label: 'Soft' },
      { value: 'cascade', label: 'Cascade' }
    ],
    fn: (row, value) => row.deletionMode === value
  },
  {
    key: 'daysRemaining',
    label: 'Remaining Days',
    options: Array.from({ length: 30 }, (_, i) => ({
      value: i + 1,
      label: `${i + 1} days or less`
    })),
    fn: (row, value) => row.daysRemaining <= Number(value)
  }
]}

/>


        <Card backgroundColor="var(--color-info-light)" borderColor="var(--color-info)">
          <div style={{ padding: '12px' }}>
            <Text bold variant="h6" color="info">
              ℹ️ Information
            </Text>
            <Spacer size="sm" />
            <Text variant="body" color="info">
              • <strong>Soft Delete:</strong> Person is replaced with a placeholder but relationships are preserved
            </Text>
            <Text variant="body" color="info">
              • <strong>Cascade Delete:</strong> Person and all descendants are marked for deletion
            </Text>
            <Text variant="body" color="info">
              • <strong>Restore:</strong> Brings back the person and their relationships
            </Text>
            <Text variant="body" color="info">
              • <strong>Purge:</strong> Permanently removes the person (irreversible)
            </Text>
          </div>
        </Card>
      </Column>
    </div>
  );
};

export default DeletedPersonsPage;
