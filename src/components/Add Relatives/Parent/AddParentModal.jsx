// src/components/Modals/AddParentModal.jsx
import React, { useState } from "react";
import useModalStore from '../../../store/useModalStore';
import AddParentController from "../../../controllers/form/AddParentController";
import '../../../styles/AddRelativeModal.css';
import Card from "../../../layout/containers/Card";
import { X } from "lucide-react";
import LottieLoader from '../../LottieLoader';


export default function AddParentModal({ onSuccess, treeId }) {
  const { modals, modalData, closeModal } = useModalStore();
  const isOpen = modals.addParentModal || false;
  const { targetNodeId } = modalData.addParentModal || {};

  const [saving, setSaving] = useState(false);

  const handleClose = () => {
    if (saving) return;
    closeModal('addParentModal');
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
          <h2 className="modal-title">Add Parent</h2>
        </div>

        <div className="modal-body">
          {saving ? (
            <div style={{ padding: 24, minWidth: 360, minHeight: 180, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 220 }}>
                <LottieLoader name="generalDataLoader" aspectRatio={1} loop autoplay />
              </div>
              <div style={{ marginTop: 12, color: 'var(--color-text-muted)', fontSize: 14 }}>
                Saving Parent's data
              </div>
            </div>
          ) : (
            targetNodeId && (
              <AddParentController
                treeId={treeId}
                childId={targetNodeId}
                onSuccess={(result) => {
                  if (onSuccess) onSuccess(result);
                  handleClose();
                }}
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