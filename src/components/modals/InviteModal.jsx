import React, { useState, useEffect } from 'react';
import Modal from '../../layout/containers/Modal';
import Button from '../Button';
import Text from '../Text';
import Card from '../../layout/containers/Card';
import Row from '../../layout/containers/Row';
import Column from '../../layout/containers/Column';
import Spacer from '../Spacer';
import SelectDropdown from '../SelectDropdown';
import DateInput from '../DateInput';
import { TextInput, TextArea } from '../Input';
import { createInviteService, updateInviteService } from '../../services/inviteService';
import dataService from '../../services/dataService';
import useToastStore from '../../store/useToastStore';
import { useAuth } from '../../context/AuthContext';
import { getDirectLinePeople, getSpouseOptions } from '../../utils/treeUtils/treeLayout';

import { Calendar, Users, FileText } from 'lucide-react';

const InviteModal = ({ isOpen, onClose, treeId, inviteType, onInviteCreated, onNavigate, person, invite }) => {
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState({
    role: 'viewer',
    selectedParentId: null,
    selectedSpouseId: null,
    fatherId: null,
    motherId: null,
    usesAllowed: 1,
    expiresAt: '',
    notes: ''
  });
  const [people, setPeople] = useState([]);
  const [marriages, setMarriages] = useState([]);
  const [directLinePeople, setDirectLinePeople] = useState([]);
  const [spouseOptions, setSpouseOptions] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addToast = useToastStore(state => state.addToast);

  // Load people and marriages for parent selection
  useEffect(() => {
    if (isOpen && inviteType === 'targeted') {
      const loadData = async () => {
        try {
          const peopleData = await dataService.getPeopleByTreeId(treeId);
          const allMarriages = await dataService.getAllMarriages(treeId);
          // Filter marriages to only those involving people from this tree
          const marriagesData = allMarriages.filter(m => {
            if (m.marriageType === 'monogamous') {
              return m.spouses?.some(spouseId => peopleData.some(p => p.id === spouseId));
            } else if (m.marriageType === 'polygamous') {
              return (m.husbandId && peopleData.some(p => p.id === m.husbandId)) ||
                     m.wives?.some(w => peopleData.some(p => p.id === w.wifeId));
            }
            return false;
          });
          setPeople(peopleData || []);
          setMarriages(marriagesData || []);
          const directLine = getDirectLinePeople(peopleData || [], marriagesData || []);
          console.log('InviteModal: Loaded data:', { peopleData, marriagesData, directLine });
          setDirectLinePeople(directLine);
        } catch (err) {
          console.error('Failed to load data:', err);
        }
      };
      loadData();
    }
  }, [isOpen, inviteType, treeId]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      if (invite) {
        // Pre-fill form with invite data for editing
        setFormData({
          role: invite.role || 'viewer',
          selectedParentId: invite.fatherId || invite.motherId || null,
          selectedSpouseId: invite.fatherId && invite.motherId ? (invite.fatherId === invite.fatherId ? invite.motherId : invite.fatherId) : null,
          fatherId: invite.fatherId || null,
          motherId: invite.motherId || null,
          usesAllowed: invite.usesAllowed || 1,
          expiresAt: invite.expiresAt ? (invite.expiresAt.seconds ? new Date(invite.expiresAt.seconds * 1000).toISOString().split('T')[0] : new Date(invite.expiresAt).toISOString().split('T')[0]) : '',
          notes: invite.notes || ''
        });
      } else {
        setFormData({
          role: 'viewer',
          selectedParentId: null,
          selectedSpouseId: null,
          fatherId: null,
          motherId: null,
          usesAllowed: 1,
          expiresAt: '',
          notes: ''
        });
      }

    }
  }, [isOpen, invite]);

  // Handle parent selection change
  useEffect(() => {
    if (formData.selectedParentId && people.length > 0 && marriages.length > 0) {
      const { spouse, wives } = getSpouseOptions(formData.selectedParentId, people, marriages);
      const spouseOptionsList = spouse ? [spouse] : wives;
      setSpouseOptions(spouseOptionsList);

      // Auto-select spouse if only one option
      if (spouseOptionsList.length === 1) {
        setFormData(prev => ({
          ...prev,
          selectedSpouseId: spouseOptionsList[0].id
        }));
      } else if (spouseOptionsList.length === 0) {
        setFormData(prev => ({
          ...prev,
          selectedSpouseId: null
        }));
      }

      // Set father/mother based on selected parent
      const selectedPerson = people.find(p => p.id === formData.selectedParentId);
      if (selectedPerson) {
        if (selectedPerson.gender === 'male') {
          setFormData(prev => ({
            ...prev,
            fatherId: formData.selectedParentId,
            motherId: spouse ? spouse.id : null
          }));
        } else {
          setFormData(prev => ({
            ...prev,
            motherId: formData.selectedParentId,
            fatherId: spouse ? spouse.id : null
          }));
        }
      }
    }
  }, [formData.selectedParentId, people, marriages]);

  // Handle spouse selection change
  useEffect(() => {
    if (formData.selectedSpouseId && formData.selectedParentId) {
      const selectedPerson = people.find(p => p.id === formData.selectedParentId);
      const selectedSpouse = people.find(p => p.id === formData.selectedSpouseId);
      if (selectedPerson && selectedSpouse) {
        if (selectedPerson.gender === 'male') {
          setFormData(prev => ({
            ...prev,
            fatherId: formData.selectedParentId,
            motherId: formData.selectedSpouseId
          }));
        } else {
          setFormData(prev => ({
            ...prev,
            motherId: formData.selectedParentId,
            fatherId: formData.selectedSpouseId
          }));
        }
      }
    }
  }, [formData.selectedSpouseId, formData.selectedParentId, people]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async () => {
    if (!formData.role) {
      addToast('Role is required', 'error');
      return;
    }

    if (inviteType === 'targeted') {
      if (!formData.selectedParentId) {
        addToast('Please select a parent from the direct line', 'error');
        return;
      }
      // Allow single parent if no spouse available
      if (!formData.fatherId && !formData.motherId) {
        addToast('At least one parent must be selected', 'error');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const inviteData = {
        treeId,
        createdBy: currentUser.uid,
        type: inviteType,
        role: formData.role,
        fatherId: formData.fatherId,
        motherId: formData.motherId,
        personId: inviteType === 'grant' ? person?.id : null,
        usesAllowed: formData.usesAllowed,
        expiresAt: formData.expiresAt && formData.expiresAt.trim() !== '' ? formData.expiresAt : null,
        notes: formData.notes || null,
        ...(invite && { id: invite.id }) // Include ID for updates
      };

      const resultInvite = invite ? await updateInviteService(inviteData) : await createInviteService(inviteData);
      addToast(invite ? 'Invitation updated successfully!' : 'Invitation created successfully!', 'success');

      if (onInviteCreated) {
        onInviteCreated(resultInvite);
      }

      // Navigate to invites page with the new invite ID to auto-open details
      if (onNavigate) {
        onNavigate(`/family-tree/${treeId}/invites/${resultInvite.id}`);
      }

      onClose();
    } catch (err) {
      console.error('Failed to create invite:', err);
      setError(`Failed to create invitation: ${err.message}`);
      addToast('Failed to create invitation', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const roleOptions = [
    { value: 'admin', label: 'Admin' },
    { value: 'moderator', label: 'Moderator' },
    { value: 'editor', label: 'Editor' },
    { value: 'viewer', label: 'Viewer' }
  ];

  const usesAllowedOptions = [
    { value: 1, label: '1' },
    { value: 2, label: '2' },
    { value: 3, label: '3' },
    { value: 4, label: '4' },
    { value: 5, label: '5' },
    { value: 6, label: '6' },
    { value: 7, label: '7' },
    { value: 8, label: '8' },
    { value: 9, label: '9' },
    { value: 10, label: '10' },
    { value: -1, label: 'Infinite' }
  ];



  return (
    <Modal isOpen={isOpen} onClose={onClose} maxHeight="90vh">
      <Column margin='25px 0px 0px 0px' padding='0px' gap='1rem'>
        <Text as="h2" variant="h3" bold>{invite ? 'Edit Invitation' : 'Create Invitation'}</Text>
        <Text variant="caption" color="gray-dark">
          {inviteType === 'targeted'
            ? 'Pre-select parents for the invitee. The form will have pre-filled father and mother fields.'
            : inviteType === 'grant'
            ? `Grant membership to ${person?.name || 'this person'}. They will be automatically linked to their existing profile.`
            : 'Invitee selects parents from dropdowns of direct-line relatives. Requires proof submission for approval.'
          }
        </Text>

        <Column gap='1rem'>
          {/* Role Selection */}
          <Card backgroundColor='var(--color-transparent)' borderColor='var(--color-gray-light)' padding='1rem'>
            <Row align="center" gap="10px" margin="0px 0px 10px 0px">
              <Users size={20} color="var(--color-primary)" />
              <Text variant="body1" bold>Role</Text>
            </Row>
            <SelectDropdown
              options={roleOptions}
              value={formData.role}
              onChange={(e) => handleInputChange('role', e.target.value)}
              placeholder="Select role"
            />
          </Card>

          {/* Parent Selection for Targeted Invites */}
          {inviteType === 'targeted' && (
            <Card backgroundColor='var(--color-transparent)' borderColor='var(--color-gray-light)' padding='1rem'>
              <Row align="center" gap="10px" margin="0px 0px 10px 0px">
                <Users size={20} color="var(--color-primary)" />
                <Text variant="body1" bold>Parent Selection</Text>
              </Row>
              <Column gap='1rem'>
                <SelectDropdown
                  label="Select Direct Line Parent"
                  options={directLinePeople.map(person => ({
                    value: person.id,
                    label: person.name
                  }))}
                  value={formData.selectedParentId}
                  onChange={(e) => handleInputChange('selectedParentId', e.target.value)}
                  placeholder="Select a parent from the direct line"
                />
                {spouseOptions.length > 1 && (
                  <SelectDropdown
                    label="Select Spouse (for polygamous relationships)"
                    options={spouseOptions.map(person => ({
                      value: person.id,
                      label: person.name
                    }))}
                    value={formData.selectedSpouseId}
                    onChange={(e) => handleInputChange('selectedSpouseId', e.target.value)}
                    placeholder="Select spouse"
                  />
                )}
                <Text variant="caption" color="gray-dark">
                  Selected Parents: {formData.fatherId ? `Father: ${people.find(p => p.id === formData.fatherId)?.name}` : ''} {formData.motherId ? `Mother: ${people.find(p => p.id === formData.motherId)?.name}` : ''}
                </Text>
              </Column>
            </Card>
          )}

          {/* Additional Settings */}
          <Card backgroundColor='var(--color-transparent)' borderColor='var(--color-gray-light)' padding='1rem'>
            <Row align="center" gap="10px" margin="0px 0px 10px 0px">
              <Calendar size={20} color="var(--color-primary)" />
              <Text variant="body1" bold>Settings</Text>
            </Row>
            <Column gap='1rem'>
              <Row gap='1rem' padding='0px' margin='0px'>
                <SelectDropdown
                  label="Uses Allowed"
                  options={usesAllowedOptions}
                  value={formData.usesAllowed}
                  onChange={(e) => handleInputChange('usesAllowed', parseInt(e.target.value) || 1)}
                  placeholder="Select uses allowed"
                />
                <DateInput
                  label="Expiration Date (Optional)"
                  value={formData.expiresAt}
                  onChange={(e) => handleInputChange('expiresAt', e.target.value)}
                />
              </Row>
            </Column>
          </Card>

          {/* Notes */}
          <Card backgroundColor='var(--color-transparent)' borderColor='var(--color-gray-light)' padding='1rem'>
            <Row align="center" gap="10px" margin="0px 0px 10px 0px">
              <FileText size={20} color="var(--color-primary)" />
              <Text variant="body1" bold>Notes (Optional)</Text>
            </Row>
            <TextArea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Add any additional notes for this invitation..."
              rows={3}
            />
          </Card>



          <Row margin='10px 0px 0px 0px' padding='10px 0px 0px 0px'>
            <Button fullWidth variant="secondary" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button fullWidth variant="primary" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (invite ? 'Updating...' : 'Creating...') : (invite ? 'Update Invitation' : 'Create Invitation')}
            </Button>
          </Row>
        </Column>
      </Column>
    </Modal>
  );
};

export default InviteModal;
