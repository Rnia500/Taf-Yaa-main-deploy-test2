// src/components/Modals/GlobalModals.jsx
import React, { useEffect } from "react";
import { modalRegistry } from "../components/registry/ModalRegistry";
import useModalStore from "../store/useModalStore";
import { toPng } from 'html-to-image';

export default function GlobalModals() {
  const { modals, modalData, closeModal, updateModalData } = useModalStore();

  useEffect(() => {
    // Capture data when pdfExportModal opens (only if not already captured)
    if (modals.pdfExportModal && modalData.pdfExportModal && !modalData.pdfExportModal?.capturedDataUrl) {
      const captureTree = async () => {
        try {
          console.log("Starting capture in GlobalModals...");
          console.log("scopeOptions:", modalData.pdfExportModal.scopeOptions);
          console.log("containerRef:", modalData.pdfExportModal.containerRef);

          let targetRef = modalData.pdfExportModal.scopeOptions === 'currentView' ? modalData.pdfExportModal.svgRef : modalData.pdfExportModal.containerRef

          // For complete view, temporarily fit the view to capture the entire tree
          if (modalData.pdfExportModal.scopeOptions === 'completeView' && modalData.pdfExportModal.fitView) {
            console.log("Fitting view for complete capture...");
            await new Promise(resolve => {
              modalData.pdfExportModal.fitView({ duration: 0 }); // Instant fit
              setTimeout(resolve, 100); // Wait for fit to complete
            });
          }

          if (targetRef?.current) {
            console.log("Capturing tree...");
            const dataUrl = await toPng(targetRef.current, {
              backgroundColor: '#ffffff',
              width: targetRef.current.offsetWidth,
              height: targetRef.current.offsetHeight,
            });
            console.log("Capture successful in GlobalModals, dataUrl length:", dataUrl.length);
            updateModalData("pdfExportModal", { capturedDataUrl: dataUrl });
          } else {
            console.error("targetRef not available:", targetRef);
          }
        } catch (error) {
          console.error("Error capturing tree for export:", error);
        }
      };
      captureTree();
    }
  }, [modals.pdfExportModal, modalData.pdfExportModal, updateModalData]);

  return (
    <>
      {Object.entries(modalRegistry).map(([key, ModalComponent]) => {
        const isOpen = modals[key];
        const data = modalData[key] || {};

        if (!isOpen) return null;

        return (
          <ModalComponent
            key={key}
            isOpen={isOpen}
            {...data}
            onClose={() => closeModal(key)}
            onConfirm={data.onConfirm}
            onCancel={data.onCancel}
            svgRef={data.svgRef}
            containerRef={data.containerRef}
            capturedDataUrl={data.capturedDataUrl}
            fitView={data.fitView}
            updateModalData={(newData) => updateModalData(key, newData)}
          />
        );
      })}
    </>
  );
}
