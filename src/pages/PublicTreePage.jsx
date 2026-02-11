import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import TreeCanvasWrapper from "../components/tree/TreeCanvas";
import dataService from "../services/dataService";
import { TreeProvider } from "../context/TreeContext.jsx";
import useModalStore from "../store/useModalStore";
import Loading from "../components/Loading.jsx";
import { getLottieData } from "../assets/lotties/lottieMappings.js";
import FlexContainer from "../layout/containers/FlexContainer";
import LottieLoader from "../components/LottieLoader";
import Button from "../components/Button";
import { ArrowLeft } from "lucide-react";

export default function PublicTreePage() {
  const { treeId } = useParams();
  const [tree, setTree] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [notFound, setNotFound] = useState(false);
  const { closeAllModals } = useModalStore();
  const [lottieData, setLottieData] = useState(null);

  // Preload Lottie data for instant loading
  useEffect(() => {
    getLottieData('treeDataLoader1').then(data => {
      if (data) setLottieData(data);
    });
  }, []);

  // Close all modals when entering the tree canvas
  useEffect(() => {
    closeAllModals();
  }, [closeAllModals]);

  // Fetch tree data on mount or when treeId changes
  useEffect(() => {
    let mounted = true;

    dataService.getTree(treeId).then((t) => {
      if (mounted) {
        // Check if tree is public
        if (t && t.isPublic === true) {
          setTree(t);
        } else {
          setNotFound(true);
        }
        setLoading(false);
      }
    }).catch(err => {
      console.error("Failed to fetch tree:", err);
      if (mounted) {
        setTree(null);
        setLoading(false);
        setNotFound(true);
      }
    });
    return () => { mounted = false; };
  }, [treeId]);

  const handleBackToSearch = () => {
    navigate('/search');
  };

  if (loading) {
    return (
      <FlexContainer justify="center" align="center" padding="20px" style={{ height: 'calc(100vh - var(--topbar-height))' }}>
        <div style={{ width: 220, maxWidth: '60vw' }}>
          <LottieLoader name="generalDataLoader" aspectRatio={1} loop autoplay />
        </div>
        <div style={{ marginTop: 12, color: 'var(--color-text-muted)', fontSize: 14 }}>
          Loading public family tree...
        </div>
      </FlexContainer>
    );
  }

  if (notFound || !tree) {
    return (
      <FlexContainer justify="center" align="center" padding="20px" style={{ height: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <h2>Tree Not Found</h2>
          <p>This public tree may not exist or is no longer available.</p>
          <Button variant="primary" onClick={handleBackToSearch} style={{ marginTop: '20px' }}>
            Back to Search
          </Button>
        </div>
      </FlexContainer>
    );
  }

  return (
    <TreeProvider treeId={treeId}>
      <div style={{ height: "calc(100vh - var(--topbar-height))", width: "100%", position: 'relative' }}>
        {/* Return Button - Absolutely positioned */}
        <div style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          zIndex: 1000
        }}>
          <Button
            variant="secondary"
            onClick={handleBackToSearch}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(0, 0, 0, 0.1)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
            }}
          >
            <ArrowLeft size={16} style={{ marginRight: '8px' }} />
            Return to Search
          </Button>
        </div>
        <TreeCanvasWrapper treeId={tree.id} lottieData={lottieData} isPublicView={true} />
      </div>
    </TreeProvider>
  );
}
