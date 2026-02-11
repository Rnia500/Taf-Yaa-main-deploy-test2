import React, { useEffect, useState } from "react";
import useModalStore from '../../store/useModalStore';
import TreeCreationController from "../../controllers/form/TreeCreationController";
import '../../styles/AddRelativeModal.css';
import { X } from 'lucide-react';
import Card from '../../layout/containers/Card';
import { preloadLottie } from '../../assets/lotties/lottieMappings';
import LottieLoader from '../LottieLoader';


export default function AddTreeModal({ createdBy, onSuccess, isEdit = false, treeToEdit = null, onCancel }) {
  console.log('AddTreeModal rendered with:', { createdBy, onSuccess, isEdit, treeToEdit, onCancel });
  const { closeModal } = useModalStore();
  const title = isEdit ? 'Edit Family Tree' : 'Create New Family Tree';

  const [readyToShow, setReadyToShow] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // Block until animation cached so modal shows Lottie instantly
        await preloadLottie('treeCreationLoader');
      } catch (err) {
        console.warn('AddTreeModal preload failed', err);
      } finally {
        if (mounted) setReadyToShow(true);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const handleSuccess = (result) => {
    if (onSuccess) onSuccess(result);
    if (onCancel) onCancel(); else closeModal('treeModal');
  };

  const handleClose = () => {
    if (onCancel) onCancel(); else closeModal('treeModal');
  };



  if (onCancel) {
    return (
      <Card
        fitContent
        borderRadius='15px'
        backgroundColor="var(--color-background)"
        margin='20px 0px'
        padding='20px'
      >
        <div className="modal-header">
          <h2 className="modal-title">
            {title}
          </h2>
        </div>
        <div className="modal-body">
          {!readyToShow ? (
            <div style={{ padding: 24, minWidth: 360, minHeight: 180, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 240 }}>
                <LottieLoader name="treeCreationLoader" aspectRatio={1.6} loop autoplay />
              </div>
              <div style={{ marginTop: 12, color: 'var(--color-secondary-text)', fontSize: 14 }}>
                Preparing...
              </div>
            </div>
          ) : (
            <TreeCreationController
              createdBy={createdBy}
              onSuccess={handleSuccess}
              onCancel={handleClose}
              isEdit={isEdit}
              treeToEdit={treeToEdit}
            />
          )}
        </div>
      </Card>
    );
  }

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
            {title}
          </h2>
        </div>

        <div className="modal-body">
          {!readyToShow ? (
            <div style={{ padding: 24, minWidth: 360, minHeight: 180, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 260, margin: '0 auto' }}>
                <LottieLoader name="treeCreationLoader" aspectRatio={1.6} loop autoplay />
              </div>
              <div style={{ marginTop: 12, textAlign: 'center', color: 'var(--color-secondary-text)' }}>
                Preparing...
              </div>
            </div>
          ) : (
            <TreeCreationController
              createdBy={createdBy}
              onSuccess={handleSuccess}
              onCancel={handleClose}
              isEdit={isEdit}
              treeToEdit={treeToEdit}
            />
          )}
        </div>
      </div>
    </div>
  );
}
