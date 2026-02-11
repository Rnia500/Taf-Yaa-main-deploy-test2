import React, { useState } from "react";
import useModalStore from '../../../store/useModalStore';
import AddChildController from "../../../controllers/form/AddChildController";
import '../../../styles/AddRelativeModal.css';
import Card from "../../../layout/containers/Card";
import { X } from "lucide-react";
import LottieLoader from '../../LottieLoader';

export default function AddChildModal({ onSuccess, treeId }) {
  const { modals, modalData, closeModal } = useModalStore();
  const isOpen = modals.addChildModal || false;
  const { targetNodeId } = modalData.addChildModal || {};

  const [saving, setSaving] = useState(false);

  const handleClose = () => {
    if (saving) return;
    closeModal('addChildModal');
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
          <h2 className="modal-title">Add Child</h2>
        </div>
        <div className="modal-body">
          {saving ? (
            <div style={{ padding: 24, minWidth: 360, minHeight: 180, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 220 }}>
                <LottieLoader name="generalDataLoader" aspectRatio={1} loop autoplay />
              </div>
              <div style={{ marginTop: 12, color: 'var(--color-text-muted)', fontSize: 14 }}>
                Saving child data
              </div>
            </div>
          ) : (
            targetNodeId && (
              <AddChildController
                treeId={treeId}
                parentId={targetNodeId}
                onSuccess={(child) => {
                  if (onSuccess) onSuccess(child);
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
