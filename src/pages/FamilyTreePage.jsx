// src/pages/FamilyTreePage.jsx
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

export default function FamilyTreePage() {
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
        setTree(t);
        setLoading(false);
      }
    }).catch(err => {

      console.error("Failed to fetch tree:", err);
      if (mounted) {
        setTree(null); 
        setLoading(false);
      }
    });
    return () => { mounted = false; };
  }, [treeId]);

 

 
  useEffect(() => {
    
    if (!loading && !tree) {
      
      setNotFound(true);
      
      const timer = setTimeout(() => {
        navigate("/");
      }, 3000); 

      return () => clearTimeout(timer);
    }
  }, [loading, tree, navigate]); 
if (loading) {
  return (
    <FlexContainer justify="center" align="center" padding="20px" style={{ height: 'calc(100vh - var(--topbar-height))' }}>
      <div style={{ width: 220, maxWidth: '60vw' }}>
        <LottieLoader name="generalDataLoader" aspectRatio={1} loop autoplay />
      </div>
      <div style={{ marginTop: 12, color: 'var(--color-text-muted)', fontSize: 14 }}>
        Loading your family tree...
      </div>
    </FlexContainer>
  );
}

if (notFound || !tree) {
  return <div>Tree not found. Redirecting you to the homepage...</div>;
}

return (
  <TreeProvider treeId={treeId}>
    <div style={{ height: "calc(100vh - var(--topbar-height))", width: "100%" }}>
      <TreeCanvasWrapper treeId={tree.id} lottieData={lottieData} />
    </div>
  </TreeProvider>
);

}