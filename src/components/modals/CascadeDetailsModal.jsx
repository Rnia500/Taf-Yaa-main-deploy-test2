import React from 'react';
import Modal from '../../layout/containers/Modal';
import Row from '../../layout/containers/Row';
import Column from '../../layout/containers/Column';
import Text from '../Text';
import Button from '../Button';
import Divider from '../Divider';
import Spacer from '../Spacer';
import DataTable from '../DataTable';

const CascadeDetailsModal = ({
  isOpen,
  onClose,
  title = 'Cascade Details',
  batchId,
  people = [],
  marriages = [],
}) => {
  const personColumns = [
    { key: 'name', header: 'Name', searchable: true },
    { key: 'gender', header: 'Gender', searchable: true, align: 'center' },
    { key: 'dob', header: 'DOB', align: 'center' },
    { 
      key: 'dod', 
      header: 'DOD',
      align: 'center',
      render: (row) => row.dod ? row.dod : <Text color="gray">N/A</Text>
    },
  ];

  const marriageColumns = [
    { key: 'spouse1', header: 'Spouse 1', searchable: true },
    { key: 'spouse2', header: 'Spouse 2', searchable: true },
    { key: 'marriageType', header: 'Type', searchable: true, align: 'center' },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="900px">
      
        <Text variant="heading3" color="primary">{title}</Text>
        <Spacer size='sm' />
        <Divider />
        <Column padding="0px" margin="0px" gap="12px">
        
        {batchId && (
          <Text variant="caption" color="gray-dark">Batch: {batchId}</Text>
        )}

        <Text variant="heading3">People ({people.length})</Text>
        <DataTable
          columns={personColumns}
          data={people}
          enablePagination
          initialPageSize={10}
          enableSearch={true}
          enableSort={false}
          enableFilters={false}
          showHeader={true}
          showControlsToggle={false}
          controlsInitiallyOpen={true}
        />

        <Text variant="heading3">Marriages ({marriages.length})</Text>
        <DataTable
          columns={marriageColumns}
          data={marriages}
          enablePagination
          initialPageSize={10}
          enableSearch={true}
          enableSort={false}
          enableFilters={false}
          showHeader={true}
          showControlsToggle={false}
          controlsInitiallyOpen={true}
        />

        <Row padding='0px' justifyContent="flex-end" gap="10px" margin="8px 0 0 0">
          <Button variant="primary" onClick={onClose}>Close</Button>
        </Row>
      </Column>
    </Modal>
  );
};

export default CascadeDetailsModal; 