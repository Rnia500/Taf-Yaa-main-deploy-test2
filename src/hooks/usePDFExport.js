import useModalStore from '../store/useModalStore';

export default function usePDFExport() {
  const { openModal, closeModal } = useModalStore();

  const openPDFExport = () => {
    openModal('pdfExportModal');
  };

  const closePDFExport = () => {
    closeModal('pdfExportModal');
  };

  return {
    openPDFExport,
    closePDFExport,
    isOpen: useModalStore.getState().modals.pdfExportModal
  };
}
