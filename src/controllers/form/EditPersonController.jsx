import React, { useState, useEffect } from 'react';
import LottieLoader from '../../components/LottieLoader';
import EditPersonForm from '../../components/Edit Person/EditPersonForm.jsx';
import dataService from '../../services/dataService.js';
import useToastStore from '../../store/useToastStore.js';
import useModalStore from '../../store/useModalStore.js';
import { checkPermission, getPermissionErrorMessage, ACTIONS } from '../../utils/permissions.js';
import { useUserRole } from '../../hooks/useUserRole.js';
import { auth } from '../../config/firebase.js';

const EditPersonController = ({ personId, onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false); // <-- added
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState(null);

  const addToast = useToastStore((state) => state.addToast);
  const { closeModal } = useModalStore();
  const { userRole } = useUserRole(formData?.person?.treeId);

  useEffect(() => {
    const fetchPersonData = async () => {
      try {
        const person = await dataService.getPerson(personId);
        if (!person) throw new Error('Person not found');

        // Ensure we pass treeId to services that require it
        const treeId = person.treeId;

        // fetch marriages/events/stories with treeId to satisfy rules/services
        const marriages = await dataService.getMarriagesByPersonId(personId, treeId).catch((e) => {
          console.warn('getMarriagesByPersonId failed:', e);
          return [];
        });
        const events = await dataService.getEventsByPersonId(personId, treeId).catch((e) => {
          console.warn('getEventsByPersonId failed:', e);
          return [];
        });
        const stories = await dataService.getStoriesByPersonId(personId, treeId).catch((e) => {
          console.warn('getStoriesByPersonId failed:', e);
          return [];
        });
        const photos = person.photos || [];

        setFormData({
          person,
          marriages,
          events,
          stories,
          photos,
        });
      } catch (err) {
        setError('Failed to load person data.');
        console.error('EditPersonController:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPersonData();
  }, [personId]);

  const handleSubmit = async (updatedData) => {
    setLoading(true);
    setSaving(true); // <-- start saving state
    setError(null);
    try {
      // Check permission before proceeding
      const permissionResult = await checkPermission(
        auth.currentUser?.uid || "anonymous",
        userRole,
        ACTIONS.EDIT_PERSON,
        personId,
        formData.person.treeId
      );

      if (!permissionResult.allowed) {
        const errorMessage = getPermissionErrorMessage(permissionResult);
        setError(errorMessage);
        addToast(errorMessage, "error");
        return;
      }
      const {
        fullName,
        gender,
        dateOfBirth,
        isDeceased,
        phoneNumber,
        email,
        dateOfDeath,
        placeOfBirth,
        placeOfDeath,
        nationality,
        countryOfResidence,
        profilePhoto,
        biography,
        tribe,
        language,
        privacyLevel,
        allowGlobalMatching,
        photos,
        stories,
      } = updatedData;

      const original = formData.person;

      // Helper function to normalize values for comparison
      const normalizeValue = (value) => {
        if (value === undefined || value === null || value === '') return null;
        return value;
      };

      const updates = {};

      // Only include fields that have actually changed
      if (normalizeValue(fullName) !== normalizeValue(original.name)) {
        updates.name = fullName || '';
      }
      if (normalizeValue(gender) !== normalizeValue(original.gender)) {
        updates.gender = gender || null;
      }
      if (normalizeValue(dateOfBirth) !== normalizeValue(original.dob)) {
        updates.dob = dateOfBirth || null;
      }
      if (!!isDeceased !== !!original.isDeceased) {
        updates.isDeceased = !!isDeceased;
      }
      if (normalizeValue(phoneNumber) !== normalizeValue(original.phoneNumber)) {
        updates.phoneNumber = phoneNumber || null;
      }
      if (normalizeValue(email) !== normalizeValue(original.email)) {
        updates.email = email || null;
      }
      if (normalizeValue(dateOfDeath) !== normalizeValue(original.dod)) {
        updates.dod = dateOfDeath || null;
      }
      if (normalizeValue(placeOfBirth) !== normalizeValue(original.placeOfBirth)) {
        updates.placeOfBirth = placeOfBirth || null;
      }
      if (normalizeValue(placeOfDeath) !== normalizeValue(original.placeOfDeath)) {
        updates.placeOfDeath = placeOfDeath || null;
      }
      if (normalizeValue(nationality) !== normalizeValue(original.nationality)) {
        updates.nationality = nationality || null;
      }
      if (normalizeValue(countryOfResidence) !== normalizeValue(original.countryOfResidence)) {
        updates.countryOfResidence = countryOfResidence || null;
      }
      if (normalizeValue(biography) !== normalizeValue(original.bio)) {
        updates.bio = biography || '';
      }
      if (normalizeValue(tribe) !== normalizeValue(original.tribe)) {
        updates.tribe = tribe || null;
      }
      if (normalizeValue(language) !== normalizeValue(original.language)) {
        updates.language = language || null;
      }
      if (normalizeValue(privacyLevel) !== normalizeValue(original.privacyLevel)) {
        updates.privacyLevel = privacyLevel || 'membersOnly';
      }
      if (!!allowGlobalMatching !== !!original.allowGlobalMatching) {
        updates.allowGlobalMatching = !!allowGlobalMatching;
      }
      updates.isPlaceholder = false; // Always set this

      // Upload profile photo if a File was provided
      if (profilePhoto instanceof File) {
        try {
          const uploaded = await dataService.uploadMedia(profilePhoto, formData.person.treeId, personId, 'current-user', 'profile');
          updates.photoUrl = uploaded.url;
        } catch (e) {
          console.warn('Profile photo upload failed, keeping existing photoUrl', e);
        }
      }

      // Normalize photos: upload any new files and keep existing urls
      if (Array.isArray(photos)) {
        const normalized = [];
        for (const p of photos) {
          if (p?.file instanceof File) {
            try {
              const uploaded = await dataService.uploadMedia(p.file, formData.person.treeId, personId, 'current-user', 'profile');
              normalized.push({ url: uploaded.url, alt: p.alt || updatedData.fullName || 'Photo' });
            } catch (e) {
              console.warn('Photo upload failed for one item', e);
            }
          } else if (p?.url) {
            normalized.push({ url: p.url, alt: p.alt || updatedData.fullName || 'Photo' });
          }
        }
        updates.photos = normalized;
      }

      // Persist story deletions (compare initial stories vs submitted stories)
      try {
        const originalStories = Array.isArray(formData?.stories) ? formData.stories : [];
        const submittedStories = Array.isArray(stories) ? stories : [];
        const originalIds = new Set(originalStories.map((s) => s?.id).filter(Boolean));
        const submittedIds = new Set(submittedStories.map((s) => s?.id).filter(Boolean));
        const toDelete = [...originalIds].filter((id) => !submittedIds.has(id));

        for (const storyId of toDelete) {
          try {
            await dataService.deleteStory(storyId);
          } catch (e) {
            console.warn('Failed to delete story', storyId, e);
          }
        }
      } catch (e) {
        console.warn('Story deletion diff failed', e);
      }

      await dataService.updatePerson(personId, updates);

      addToast('Person updated successfully!', 'success');
      onSuccess && onSuccess(updates);
      closeModal('editPerson');

      if (typeof window !== 'undefined' && window.dispatchEvent) {
        window.dispatchEvent(
          new CustomEvent('familyDataChanged', {
            detail: { updatedPersonId: personId },
          })
        );
      }
    } catch (err) {
      setError('Failed to update person.');
      addToast('Failed to update person.', 'error');
      console.error('EditPersonController.handleSubmit:', err);
    } finally {
      setSaving(false); // <-- stop saving state
      setLoading(false);
    }
  };

  // show initial loading loader (unchanged)
  if (loading)
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
        }}
      >
        <div style={{ width: 220, maxWidth: '60vw' }}>
          <LottieLoader name="generalDataLoader" aspectRatio={1} loop autoplay />
        </div>
        <div style={{ marginTop: 12, color: 'var(--color-text-muted)', fontSize: 14 }}>
          Loading person data...
        </div>
      </div>
    );

  // NEW: show blocking saving loader while submit is in progress
  if (saving) return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24
    }}>
      <div style={{ width: 220, maxWidth: '60vw' }}>
        <LottieLoader name="generalDataLoader" aspectRatio={1} loop autoplay />
      </div>
      <div style={{ marginTop: 12, color: 'var(--color-text-muted)', fontSize: 14 }}>
        Saving person data
      </div>
    </div>
  );

  return (
    <>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      {formData && (
        <EditPersonForm
          initialData={formData}
          onSubmit={handleSubmit}
          onCancel={onCancel}
        />
      )}
    </>
  );
};

export default EditPersonController;
