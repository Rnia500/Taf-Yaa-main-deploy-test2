import React, { useState, useEffect } from 'react';
import Modal from '../../layout/containers/Modal';
import Button from '../Button';
import Text from '../Text';
import Card from '../../layout/containers/Card';
import Row from '../../layout/containers/Row';
import Column from '../../layout/containers/Column';
import SelectDropdown from '../SelectDropdown';
import { TextArea } from '../Input';
import { createInviteService } from '../../services/inviteService';
import useToastStore from '../../store/useToastStore';
import { useAuth } from '../../context/AuthContext';
import { Users, Mail, Eye } from 'lucide-react';

const GrantMembershipModal = ({ isOpen, onClose, person, treeId, treeName, onMembershipGranted }) => {
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState({
    role: 'viewer',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const addToast = useToastStore(state => state.addToast);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        role: 'viewer',
        message: ''
      });
      setError(null);
      setShowPreview(false);
    }
  }, [isOpen]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async () => {
    if (!person.email) {
      setError('This person does not have an email address registered. Please add an email to their profile first.');
      return;
    }

    if (!formData.role) {
      setError('Role is required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Create an invite for this person
      // Set expiration to 30 days from now for grant invites
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      const inviteData = {
        treeId,
        createdBy: currentUser.uid,
        type: 'grant', // Special type for membership grants
        role: formData.role,
        notes: formData.message || null,
        expiresAt: expiresAt.toISOString(),
        // For existing people, we might want to link to their personId
        personId: person.id // Custom field to link to existing person
      };

      const invite = await createInviteService(inviteData);

      // Send the email using the Netlify function
      const emailResponse = await fetch('/.netlify/functions/sendInvite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientEmail: person.email,
          recipientName: person.name,
          inviteCode: invite.code,
          treeName: treeName,
          role: formData.role,
          message: formData.message || null,
          senderName: currentUser.displayName || 'The Tree Admin',
          qrDataUrl: invite.qrDataUrl,
          joinUrl: invite.joinUrl
        }),
      });

      let emailData;
      let responseText = '';
      try {
        responseText = await emailResponse.text();
        console.log('Email response text:', responseText); // Debug log
        emailData = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse email response:', parseError, 'Response text:', responseText);
        emailData = { error: 'Failed to parse response', details: responseText };
      }

      if (!emailResponse.ok) {
        throw new Error(emailData.error || 'Failed to send email');
      }

      addToast('Membership invitation sent successfully!', 'success');

      if (onMembershipGranted) {
        onMembershipGranted();
      }

      onClose();
    } catch (err) {
      console.error('Failed to send membership invitation:', err);
      setError(`Failed to send invitation: ${err.message}`);
      addToast('Failed to send membership invitation', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const roleOptions = [
    { value: 'viewer', label: 'Viewer' },
    { value: 'editor', label: 'Editor' },
    { value: 'moderator', label: 'Moderator' },
    { value: 'admin', label: 'Admin' }
  ];

  const emailPreview = `Hi ${person.name},

You've been granted membership to join "${treeName}" family tree as a ${formData.role}.

${formData.message ? `Message: ${formData.message}` : ''}

Click the link below to accept your membership:
[Invite Link]

Best regards,
${currentUser.displayName || 'The Tree Admin'}`;

  return (
    <Modal title="Grant Membership" isOpen={isOpen} onClose={onClose} maxHeight="90vh">
      <Column margin='25px 0px 0px 0px' padding='0px' gap='1rem'>
        <Text variant="caption" color="gray-dark">
          Grant membership to <strong>{person.name}</strong> by sending them an invitation email.
        </Text>

        <Column gap='1rem'>
          {/* Role Selection */}
          <Card backgroundColor='var(--color-transparent)' borderColor='var(--color-gray-light)' padding='1rem'>
            <Row fitContent justifyContent="flex-start" gap="10px" margin="0px 0px 10px 0px">
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

          {/* Email Info */}
          <Card backgroundColor='var(--color-transparent)' borderColor='var(--color-gray-light)' padding='1rem'>
            <Row fitContent justifyContent="flex-start" gap="10px" margin="0px 0px 10px 0px">
              <Mail size={20} color="var(--color-primary)" />
              <Text variant="body1" bold>Email</Text>
            </Row>
            <Text variant="body2">
              Invitation will be sent to: <strong>{person.email || 'No email registered'}</strong>
            </Text>
            {!person.email && (
              <Text variant="body2" color="error">
                Please add an email address to this person's profile before granting membership.
              </Text>
            )}
          </Card>

          {/* Optional Message */}
          <Card backgroundColor='var(--color-transparent)' borderColor='var(--color-gray-light)' padding='1rem'>
            <Row fitContent justifyContent="flex-start" gap="10px" margin="0px 0px 10px 0px">
              <Mail size={20} color="var(--color-primary)" />
              <Text variant="body1" bold>Message (Optional)</Text>
            </Row>
            <TextArea
              value={formData.message}
              onChange={(e) => handleInputChange('message', e.target.value)}
              placeholder="Add a personal message..."
              rows={3}
            />
          </Card>

          {/* Email Preview */}
          <Card backgroundColor='var(--color-transparent)' borderColor='var(--color-gray-light)' padding='1rem'>
            <Row fitContent justifyContent="flex-start" gap="10px" margin="0px 0px 10px 0px">
              <Eye size={20} color="var(--color-primary)" />
              <Text variant="body1" bold>Email Preview</Text>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
              >
                {showPreview ? 'Hide' : 'Show'} Preview
              </Button>
            </Row>
            {showPreview && (
              <Card backgroundColor='var(--color-gray-lightest)' padding='1rem' style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: '0.9rem' }}>
                {emailPreview}
              </Card>
            )}
          </Card>

          {error && (
            <Text variant='body2' color='error' style={{ textAlign: 'center' }}>
              {error}
            </Text>
          )}

          <Row margin='10px 0px 0px 0px' padding='10px 0px 0px 0px'>
            <Button fullWidth variant="secondary" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button fullWidth variant="primary" onClick={handleSubmit} disabled={isSubmitting || !person.email}>
              {isSubmitting ? 'Sending...' : 'Send Invitation'}
            </Button>
          </Row>
        </Column>
      </Column>
    </Modal>
  );
};

export default GrantMembershipModal;
