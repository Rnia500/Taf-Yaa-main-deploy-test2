import React, { useState, useEffect } from "react";
import useModalStore from '../../../store/useModalStore';
import AddSpouseController from "../../../controllers/form/AddSpouseController";
import '../../../styles/AddRelativeModal.css';
import { X } from 'lucide-react';
import Card from '../../../layout/containers/Card';
import LottieLoader from '../../LottieLoader';
import { preloadLottie } from '../../../assets/lotties/lottieMappings';

export default function AddSpouseModal({ targetNodeId, partnerName, onSuccess, treeId }) {
  const { modals, closeModal } = useModalStore();
  const isOpen = modals.addSpouseModal || false;
  const [saving, setSaving] = useState(false);
  const [readyToShow, setReadyToShow] = useState(false);

  useEffect(() => {
    let mounted = true;
    if (!isOpen) {
      setReadyToShow(false);
      return;
    }

    (async () => {
      try {
        await preloadLottie('addPerson');
        if (!mounted) return;
        setReadyToShow(true);
      } catch (err) {
        console.error('AddSpouseModal preload error', err);
        if (mounted) setReadyToShow(true);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [isOpen]);

  const handleSuccess = (result) => {
    if (onSuccess) onSuccess(result);
    closeModal('addSpouseModal');
  };

  const handleClose = () => {
    if (saving) return;
    closeModal('addSpouseModal');
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <Card
          fitContent
          positionType='absolute'
          borderRadius='15px'
          backgroundColor="var(--color-danger)"
          margin='15px 15px 0px 0px'
          position='top-right'
          style={{ zIndex: 10 }}
          onClick={handleClose}
        >
          <X size={24} color="white" />
        </Card>

        <div className="modal-header">
          <h2 className="modal-title">
            {partnerName
              ? `Add New Spouse for ${partnerName}`
              : "Add New Spouse"}
          </h2>
        </div>

        <div className="modal-body">
          {!readyToShow ? (
            <div style={{ padding: 24, minWidth: 360, minHeight: 180 }}>
              <LottieLoader name="addPerson" aspectRatio={2} loop autoplay />
            </div>
          ) : (
            targetNodeId && (
              <AddSpouseController
                treeId={treeId}
                existingSpouseId={targetNodeId}
                onSuccess={handleSuccess}
                onCancel={handleClose}
                onSaving={(isSaving) => setSaving(!!isSaving)}
              />
            )
          )}
        </div>
      </div>
    </div>
  );
}