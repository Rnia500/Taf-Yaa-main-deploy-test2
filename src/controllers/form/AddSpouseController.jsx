// src/controllers/AddSpouseController.jsx
import React, { useState, useEffect, useRef } from "react";
import AddSpouseForm from "../../components/Add Relatives/Spouse/AddSpouseForm.jsx";
import {addSpouse} from "../tree/addSpouse";
import dataService from "../../services/dataService.js";
import { MarriageModel } from "../../models/treeModels/MarriageModel.js";
import useToastStore from "../../store/useToastStore.js";
import useModalStore from "../../store/useModalStore.js";
import LottieLoader from "../../components/LottieLoader";
import { auth } from "../../config/firebase.js";
import { checkPermission, getPermissionErrorMessage, ACTIONS } from "../../utils/permissions.js";
import { useUserRole } from "../../hooks/useUserRole.js";

const AddSpouseController = ({ treeId, existingSpouseId, onSuccess, onCancel, onSaving }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formProps, setFormProps] = useState(null);

  const addToast = useToastStore((state) => state.addToast);
  const { openModal, closeModal } = useModalStore();
  const hasSubmitted = useRef(false);
  const { userRole } = useUserRole(treeId);

  useEffect(() => {
    const loadData = async () => {
      try {
        const targetPerson = await dataService.getPerson(existingSpouseId);
        if (!targetPerson) throw new Error("Target person not found");

        const existingMarriages = await dataService.getMarriagesByPersonId(existingSpouseId);
        const isFirstSpouse = existingMarriages.length === 0;

        let suggestedOrder = 1;
        const polygamousMarriage = existingMarriages.find(m => m.marriageType === "polygamous");
        if (polygamousMarriage) {
          suggestedOrder = new MarriageModel(polygamousMarriage).getNextWifeOrder();
        }

        setFormProps({
          husbandName: targetPerson.name,
          isFirstSpouse,
          suggestedWifeOrder: suggestedOrder,
        });
      } catch (err) {
        addToast("Failed to load data for the form.", "error");
        console.error("AddSpouseController.prepareForm:", err);
      }
      setIsLoading(false);
    };

    loadData();
  }, [existingSpouseId]);


  const confirmConvertMarriage = () => {
    return new Promise((resolve) => {
      openModal("confirmationModal", {
        title: "Convert to Polygamous Marriage?",
        message: "This is currently in a monogamous marriage. Do you want to convert it to a polygamous one to add this new spouse?",
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
        onClose: () => {
          closeModal("confirmationModal");
          resolve(false);
        },
      });
    });
  };


  const handleSubmit = async (formData) => {
    if (isSubmitting || hasSubmitted.current) return;

    setIsSubmitting(true);


    try {
      // Check permission before proceeding
      const permissionResult = await checkPermission(
        auth.currentUser?.uid || "anonymous",
        userRole,
        ACTIONS.CREATE_PERSON,
        existingSpouseId,
        treeId
      );

      if (!permissionResult.allowed) {
        const errorMessage = getPermissionErrorMessage(permissionResult);
        addToast(errorMessage, "error");
        return;
      }

      // notify parent modal that saving is starting
      if (typeof onSaving === 'function') onSaving(true);

      const result = await addSpouse(treeId, existingSpouseId, formData, {
        createdBy: auth.currentUser?.uid || "anonymous",

        onError: (msg, type) => {
          addToast(msg, type || "error");
        },
        confirmConvert: confirmConvertMarriage,
      });


      if (result && !hasSubmitted.current) {
        hasSubmitted.current = true;
        addToast("Spouse added successfully!", "success");
        if (typeof onSuccess === 'function') onSuccess(result);
        closeModal("addSpouseModal");
      } else if (!result && !hasSubmitted.current) {
        setIsSubmitting(false);
        addToast("Operation could not be completed. Please check the rules.", "error");
        closeModal("addSpouseModal");
      }
    } catch (err) {
      if (!hasSubmitted.current) {
        addToast(err.message || "Unexpected error", "error");
      }
      console.error("AddSpouseController.handleSubmit:", err);
    } finally {
      if (!hasSubmitted.current) {
        setIsSubmitting(false);
      }
      // always notify parent that saving finished
      if (typeof onSaving === 'function') onSaving(false);
    }
  };

  
  if (isLoading)
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
          Loading form data...
        </div>
      </div>
    );

  return (
    <div>
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
            Adding Spouse...
          </div>
        </div>
      ) : null}
      <AddSpouseForm
        onSubmit={handleSubmit}
        onCancel={onCancel}
        {...formProps}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

export default AddSpouseController;
