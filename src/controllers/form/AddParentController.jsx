// src/controllers/form/AddParentController.jsx
import React, { useState, useEffect } from "react";
import AddParentForm from "../../components/Add Relatives/Parent/AddParentForm.jsx";
import { addParentToChild } from "../tree/addParent";
import dataService from "../../services/dataService.js";
import useToastStore from "../../store/useToastStore.js";
import useModalStore from "../../store/useModalStore.js";
import LottieLoader from "../../components/LottieLoader.jsx";
import { auth } from "../../config/firebase.js";
import { checkPermission, getPermissionErrorMessage, ACTIONS } from "../../utils/permissions.js";
import { useUserRole } from "../../hooks/useUserRole.js";

const AddParentController = ({ treeId, childId, onSuccess, onCancel }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [isLoadingForm, setIsLoadingForm] = useState(true);
  const [formProps, setFormProps] = useState({
    childName: "",
    existingParents: [],
  });

  const addToast = useToastStore((state) => state.addToast);
  const { openModal, closeModal } = useModalStore();
  const { userRole } = useUserRole(treeId);

  useEffect(() => {
    async function prepareForm() {
      try {
        const child = await dataService.getPerson(childId);
        if (!child) throw new Error("Child not found");

        const marriages = await dataService.getMarriagesByChildId(childId);
        let parents = [];

        if (marriages && marriages.length > 0) {
          const parentIds = new Set();
          for (const marriage of marriages) {
            if (marriage.spouses) marriage.spouses.forEach(id => parentIds.add(id));
            else if (marriage.husbandId) {
              parentIds.add(marriage.husbandId);
              marriage.wives.forEach(w => parentIds.add(w.wifeId));
            }
          }
          const parentObjects = await Promise.all(
            Array.from(parentIds).map(id => dataService.getPerson(id))
          );
          parents = parentObjects.filter(p => p && !p.isPlaceholder);
        }

        setFormProps({
          childName: child.name,
          existingParents: parents,
        });
      } catch (err) {
        setError("Failed to load data for the form.");
        console.error("Error preparing AddParentForm:", err);
      } finally {
        setIsLoadingForm(false);
      }
    }
    prepareForm();
  }, [childId]);


  const confirmConvertMarriage = () => {
    return new Promise((resolve) => {
      openModal("confirmationModal", {
        title: "Convert to Polygamous Marriage?",
        message:
          "The selected parent is currently in a monogamous marriage. To add this new parent as their spouse, the marriage must be converted to a polygamous one. Do you want to proceed?",
        confirmText: "Yes, Convert",
        cancelText: "No, Cancel",
        onConfirm: () => {
          closeModal("confirmationModal");
          resolve(true);
        },
        onCancel: () => {
          closeModal("confirmationModal");
          resolve(false);
        },
      });
    });
  };

  const handleSubmit = async (parentData) => {
    setIsSubmitting(true);
    setError(null);
    try {
      // Check permission before proceeding
      const permissionResult = await checkPermission(
        auth.currentUser?.uid || "anonymous",
        userRole,
        ACTIONS.CREATE_PERSON,
        childId,
        treeId
      );

      if (!permissionResult.allowed) {
        const errorMessage = getPermissionErrorMessage(permissionResult);
        setError(errorMessage);
        addToast(errorMessage, "error");
        return;
      }

      const options = {
        parentToMarryId: parentData.parentToMarryId || null,
        createdBy: auth.currentUser?.uid || "anonymous",

        confirmConvert: confirmConvertMarriage,
        onError: (msg, type) => addToast(msg, type || "error"),
      };

      const result = await addParentToChild(treeId, childId, parentData, options);

      addToast("Parent added successfully!", "success");
      if (onSuccess) onSuccess(result);

    } catch (err) {
      console.error("Error in AddParentController:", err);
      const errorMessage = err.message || "Failed to add parent.";
      if (errorMessage !== "User cancelled conversion.") {
        setError(errorMessage);
        addToast(errorMessage, "error");
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // show initial loading loader (unchanged)
  if (isLoadingForm)
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
          <LottieLoader name="generalDataLoader" aspectRatio={2} loop autoplay />
        </div>
        <div style={{ marginTop: 12, color: 'var(--color-text-muted)', fontSize: 14 }}>
          Loading Parent's related data...
        </div>
      </div>
    );

  return (
    <>
      {error && <div style={{ color: "red", marginBottom: '1rem' }}>{error}</div>}
       {isSubmitting ? (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(255, 255, 255, 0.9)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10
        }}>
          <div style={{ width: 220, maxWidth: '60vw' }}>
            <LottieLoader name="addPerson" aspectRatio={3} loop autoplay />
          </div>
          <div style={{ marginTop: 12, color: 'var(--color-text-muted)', fontSize: 14 }}>
            Adding Parent's data...
          </div>
        </div>
      ) : null}
      <AddParentForm
        onSubmit={handleSubmit}
        onCancel={onCancel}
        isSubmitting={isSubmitting}
        {...formProps}
      />
    </>
  );
};

export default AddParentController;