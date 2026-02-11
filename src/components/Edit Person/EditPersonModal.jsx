import React, { useEffect, useState } from 'react';
import useModalStore from '../../store/useModalStore';
import EditPersonController from '../../controllers/form/EditPersonController';
import '../../styles/AddRelativeModal.css';
import { X } from 'lucide-react';
import Card from '../../layout/containers/Card';
import {useFamilyData} from '../../hooks/useFamilyData';
import { useParams } from 'react-router-dom';
import { preloadLottie } from '../../assets/lotties/lottieMappings';
import LottieLoader from '../LottieLoader';

const EditPersonModal = ({ personId, onClose }) => {
  const { modals, closeModal } = useModalStore();
  const isOpen = modals.editPerson || false;
  const { treeId } = useParams();

  const { reload } = useFamilyData(treeId);

  const [readyToShow, setReadyToShow] = useState(false);

  useEffect(() => {
    let mounted = true;
    if (!isOpen) {
      setReadyToShow(false);
      return;
    }

    (async () => {
      try {
        // Block until animation cached so modal shows Lottie instantly
        await preloadLottie('generalDataLoader');
        if (!mounted) return;
        setReadyToShow(true);
      } catch (err) {
        console.error('EditPersonModal preload error', err);
        if (mounted) setReadyToShow(true); // fallback to show UI even if preload failed
      }
    })();

    return () => {
      mounted = false;
    };
  }, [isOpen]);

  const handleSuccess = (result) => {
    if (onClose) onClose(result);
    closeModal('editPerson');
    reload();
  };

  const handleClose = () => {
    closeModal('editPerson');
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
          <h2 className="modal-title">Edit Person</h2>
        </div>

        <div className="modal-body">
          {personId && !readyToShow && (
            // show blocking loader until lottie preloaded (guaranteed first paint)
            <div style={{ padding: 24, minWidth: 360, minHeight: 180 }}>
              <LottieLoader name="generalDataLoader" aspectRatio={2} loop autoplay />
            </div>
          )}

          {personId && readyToShow && (
            <EditPersonController
              personId={personId}
              onSuccess={handleSuccess}
              onCancel={handleClose}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default EditPersonModal;
