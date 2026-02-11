// src/components/tree/TreeCanvas.jsx
import React, { useMemo, useState, useEffect, useCallback, useRef } from "react";
import ReactFlow, {
  Background,
  MiniMap,
  ReactFlowProvider,
  useReactFlow,
} from "reactflow";
import "reactflow/dist/style.css";
import "../../styles/TreeCanvas.css";

import { useFamilyData } from "../../hooks/useFamilyData";
import Loading from "../Loading.jsx";
import LottieLoader from "../LottieLoader";
import {
  calculateLayout,
  traceLineage,
  filterFamilyByRoot,
  findHighestAncestor,
} from "../../utils/treeUtils/treeLayout";

import MarriageNode from "./nodes/MarriageNode";
import FlowPersonNode from "./nodes/FlowPersonNode";
import FlowPersonNodeHorizontal from "./nodes/FlowPersonNodeHorizontal";
import MonogamousEdge from "./edges/MonogamousEdge";
import PolygamousEdge from "./edges/PolygamousEdge";
import ParentChildEdge from "./edges/ParentChildEdge";

import PersonMenu from "../PersonMenu";
import CustomControls from "./CustomControls";
import Legend from "./Legend";
import AddSpouseModal from "../Add Relatives/Spouse/AddSpouseModal";
import AddChildModal from "../Add Relatives/Child/AddChildModal";
import AddParentModal from "../Add Relatives/Parent/AddParentModal";
import EditPersonModal from "../Edit Person/EditPersonModal";
import UndoCountdown from "../UndoCountdown";

import usePersonMenuStore from "../../store/usePersonMenuStore";
import useSidebarStore from "../../store/useSidebarStore";
import useModalStore from "../../store/useModalStore";
import dataService from "../../services/dataService";
import { toPng } from 'html-to-image';
import { usePermissions } from "../../hooks/usePermissions";

// -- React Flow `config --
const nodeTypes = {
  person: FlowPersonNode,
  marriage: MarriageNode,
  personHorizontal: FlowPersonNodeHorizontal,
};
const edgeTypes = {
  monogamousEdge: MonogamousEdge,
  polygamousEdge: PolygamousEdge,
  parentChild: ParentChildEdge,
};

// -- SVG markers for edges --
const CustomMarkers = () => (
  <svg>
    <defs>
      <marker
        id="arrow"
        viewBox="0 -5 10 10"
        refX={10}
        refY={0}
        markerWidth={6}
        markerHeight={6}
        orient="auto-start-reverse"
      >
        <path d="M0,-5L10,0L0,5" fill="var(--color-gray)" />
      </marker>
      <marker
        id="circle"
        viewBox="0 0 10 10"
        refX={5}
        refY={5}
        markerWidth={8}
        markerHeight={8}
      >
        <circle
          cx="5"
          cy="5"
          r="3"
          stroke="var(--color-gray)"
          strokeWidth="1.5"
          fill="white"
        />
      </marker>
    </defs>
  </svg>
);


function TreeCanvasComponent({ treeId, _lottieData }) {
  // - Hooks -
  const { people: allPeople, marriages: allMarriages, _loading, reload } =
    useFamilyData(treeId);

  const [treeData, setTreeData] = useState(null);
  const { permissions, loading: permissionsLoading } = usePermissions(treeId);

  const { fitView } = useReactFlow();
  const { closeMenu } = usePersonMenuStore((state) => state.actions);
  const openProfileSidebar = useSidebarStore((state) => state.openSidebar);
  const { openModal } = useModalStore();

  // Ref to the ReactFlow container for export
  const treeContainerRef = useRef(null);

  // - State -
  const [peopleWithCollapseState, setPeopleWithCollapseState] =
    useState(allPeople);

  // Listen for family data change events to reload data
  useEffect(() => {
    const handleDataUpdate = () => {
      reload();
    };
    window.addEventListener('familyTreeDataUpdated', handleDataUpdate);
    window.addEventListener('familyDataChanged', handleDataUpdate);
    return () => {
      window.removeEventListener('familyTreeDataUpdated', handleDataUpdate);
      window.removeEventListener('familyDataChanged', handleDataUpdate);
    };
  }, [reload]);

  // Fetch tree data once for faster menu loading
  useEffect(() => {
    if (treeId) {
      dataService.getTree(treeId).then(setTreeData).catch(console.error);
    }
  }, [treeId]);
  const [viewRootId, setViewRootId] = useState(null);
  const [isManualRoot, setIsManualRoot] = useState(false);

  const [hoveredNodeId, setHoveredNodeId] = useState(null);
  const [highlightedPath, setHighlightedPath] = useState({ nodes: [], edges: [] });
  const [lineageEdges, setLineageEdges] = useState([]);

  const [orientation, setOrientation] = useState("vertical");

  // For spouse/child modals
  const [partnerName, setPartnerName] = useState("");
  const [targetNodeId, setTargetNodeId] = useState(null);

  // - Handlers -
  const handleToggleCollapse = useCallback((personId) => {
    setPeopleWithCollapseState((current) =>
      current.map((p) =>
        p.id === personId ? { ...p, isCollapsed: !p.isCollapsed } : p
      )
    );
  }, []);

  const handleOpenProfile = useCallback(
    (personId) => {
      if (openProfileSidebar) openProfileSidebar(personId);
    },
    [openProfileSidebar]
  );

  // - Layout -
  const { nodes, edges: baseEdges } = useMemo(() => {
    if (!viewRootId) return { nodes: [], edges: [] };

    // Only use findHighestAncestor when in "reset view" mode
    const layoutRootId = viewRootId;

    const { people: visiblePeople, marriages: visibleMarriages } =
      filterFamilyByRoot(layoutRootId, peopleWithCollapseState, allMarriages);

    const directLineageIds = new Set([layoutRootId]);
    visibleMarriages.forEach((marriage) => {
      if (marriage.spouses?.includes(layoutRootId)) {
        marriage.spouses.forEach((id) => directLineageIds.add(id));
      }
    });

    return calculateLayout(
      layoutRootId,
      visiblePeople,
      visibleMarriages,
      handleToggleCollapse,
      handleOpenProfile,
      orientation,
      directLineageIds
    );
  }, [viewRootId, peopleWithCollapseState, allMarriages, handleToggleCollapse, handleOpenProfile, orientation]);

  const handleTraceLineage = useCallback(
    (personId) => {
      const path = traceLineage(personId, allPeople, allMarriages);
      const highlightedEdges = baseEdges.filter((e) =>
        path.edges.includes(e.id)
      );
      const overlay = highlightedEdges.map((e) => ({
        ...e,
        id: `lineage-${e.id}`,
        style: { stroke: "var(--color-primary1)", strokeWidth: 8 },
        className: "lineage-edge",
      }));
      setLineageEdges(overlay);
    },
    [allPeople, allMarriages, baseEdges]
  );

  const handleSetAsRoot = useCallback((personId) => {
    setViewRootId(personId);
    setIsManualRoot(true)
    setHighlightedPath({ nodes: [], edges: [] });
    // Also reset people collapse state to expanded on root change
    setPeopleWithCollapseState((current) =>
      current.map((p) => ({ ...p, isCollapsed: false }))
    );
  }, []);

const handleResetView = useCallback(() => {
  if (allPeople.length > 0) {
    const ultimateRoot = findHighestAncestor(allPeople[0].id, allPeople, allMarriages);
    setViewRootId(ultimateRoot);
    setIsManualRoot(false); 
    setTimeout(() => fitView({ duration: 800 }), 100);
  }

  setPeopleWithCollapseState((current) =>
    current.map((p) => ({ ...p, isCollapsed: false }))
  );
  setHighlightedPath({ nodes: [], edges: [] });
  closeMenu();
}, [allPeople, allMarriages, fitView, closeMenu]);


  const clearHighlight = useCallback(() => {
    if (highlightedPath.nodes.length || highlightedPath.edges.length) {
      setHighlightedPath({ nodes: [], edges: [] });
    }
    closeMenu();
  }, [highlightedPath, closeMenu]);

  const handleToggleOrientation = useCallback(() => {
    setOrientation((current) =>
      current === "vertical" ? "horizontal" : "vertical"
    );
    setTimeout(() => fitView({ duration: 500 }), 100);
  }, [fitView]);



  // - Edge highlighting on hover -
  const finalBaseEdges = useMemo(() => {
    if (!hoveredNodeId) return baseEdges;
    return baseEdges.map((e) =>
      e.source === hoveredNodeId || e.target === hoveredNodeId
        ? {
          ...e,
          style: { stroke: "var(--color-primary1)", strokeWidth: 4 },
          animated: true,
        }
        : e
    );
  }, [hoveredNodeId, baseEdges]);

  // - Effects -
  useEffect(() => {
    setPeopleWithCollapseState(
      allPeople.map((p) => ({ ...p, isCollapsed: p.isCollapsed ?? false }))
    );
  }, [allPeople]);


useEffect(() => {
  if (allPeople.length === 0) return;

  const newTrueRoot = findHighestAncestor(allPeople[0].id, allPeople, allMarriages);

  if (!viewRootId) {
    // First initialization
    setViewRootId(newTrueRoot);
    setIsManualRoot(false); // auto mode
    setTimeout(() => fitView({ duration: 800 }), 100);
    return;
  }

  // If user never set a manual root → always follow the ultimate root
  if (!isManualRoot && newTrueRoot !== viewRootId) {
    setViewRootId(newTrueRoot);
    setTimeout(() => fitView({ duration: 800 }), 100);
    return;
  }

  // If the current root was deleted → fallback to ultimate root
  const currentRootStillExists = allPeople.some(p => p.id === viewRootId);
  if (!currentRootStillExists && newTrueRoot) {
    setViewRootId(newTrueRoot);
    setIsManualRoot(false);
    setTimeout(() => fitView({ duration: 800 }), 100);
  }
}, [allPeople, allMarriages, viewRootId, isManualRoot, fitView]);




  if (!viewRootId) {
    return (
      <div style={{ height: "100%", width: "100%", display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 220, maxWidth: '60vw' }}>
          <LottieLoader name="treeDataLoader1" aspectRatio={1} loop autoplay />
        </div>
        <div style={{ marginTop: 12, color: 'var(--color-text-muted)', fontSize: 14 }}>
          Loading family tree...
        </div>
      </div>
    );
  }




  return (
    <div
      ref={treeContainerRef}
      style={{ height: "100%", width: "100%" }}
      onMouseDown={clearHighlight}
    >
      {/* Context menu for nodes */}
      <PersonMenu
        treeId={treeId}
        treeData={treeData}
        handleToggleCollapse={handleToggleCollapse}
        handleOpenProfile={handleOpenProfile}
        handleTraceLineage={handleTraceLineage}
        handleSetAsRoot={handleSetAsRoot}
        onAddSpouse={(personId) => {
          if (permissions.canCreatePerson?.allowed) {
            setTargetNodeId(personId);
            const person = allPeople.find((p) => p.id === personId);
            if (person) setPartnerName(person.name);
            openModal("addSpouseModal", { targetNodeId: personId, treeId, partnerName: person?.name, onSuccess: () => { reload(); setTargetNodeId(null); } });
          }
        }}
        onAddChild={(personId) => {
          if (permissions.canCreatePerson?.allowed) {
            setTargetNodeId(personId);
            openModal("addChildModal", { targetNodeId: personId, treeId, onSuccess: () => { reload(); setTargetNodeId(null); } });
          }
        }}
        onAddParent={(personId) => {
          if (permissions.canCreatePerson?.allowed) {
            setTargetNodeId(personId);
            openModal("addParentModal", { targetNodeId: personId, treeId, onSuccess: () => { reload(); setTargetNodeId(null); } });
          }
        }}
        onEditPerson={(personId) => {
          if (permissions.canEditPerson?.allowed) {
            setTargetNodeId(personId);
            openModal("editPerson", { personId });
          }
        }}
        onDeleteComplete={() => reload()}
      />

      {/* Modals */}
      <AddSpouseModal
        targetNodeId={targetNodeId}
        partnerName={partnerName}
        treeId={treeId}
        onSuccess={() => {
          reload();
          setTargetNodeId(null);
        }}
      />

      <AddParentModal treeId={treeId} onSuccess={() => {
        reload();
        setTargetNodeId(null);
      }} />

      <AddChildModal treeId={treeId} onSuccess={() => {
        reload();
        setTargetNodeId(null);
      }} />


      {/* React Flow canvas */}
      <ReactFlow
        edges={[...finalBaseEdges, ...lineageEdges]}
        nodes={nodes}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodeMouseEnter={(e, node) => setHoveredNodeId(node.id)}
        onNodeMouseLeave={() => setHoveredNodeId(null)}
        fitView
        nodesDraggable={false}
        nodesConnectable={false}
        proOptions={{ hideAttribution: true }}
      >
        <CustomControls
          handleResetView={handleResetView}
          handleToggleOrientation={handleToggleOrientation}
          handleCaptureView={async () => {
            // Capture the current view and open the export modal
            const { openModal } = useModalStore.getState();

            try {
              console.log("Starting capture in TreeCanvas...");
              console.log("treeContainerRef.current:", treeContainerRef.current);

              if (!treeContainerRef.current) {
                console.error("Tree container ref not available!");
                return;
              }

              // Capture current view
              const dataUrl = await toPng(treeContainerRef.current, {
                backgroundColor: '#ffffff',
                width: treeContainerRef.current.offsetWidth,
                height: treeContainerRef.current.offsetHeight,
              });

              console.log("Capture successful, dataUrl length:", dataUrl.length);

              openModal("pdfExportModal", {
                svgRef: null, // No direct SVG ref for ReactFlow
                containerRef: treeContainerRef, // The container div
                capturedDataUrl: dataUrl,
                scopeOptions: 'currentView',
                fitView: fitView, // Pass fitView function for complete view
                treeData: treeData // Pass tree data for family name
              });
            } catch (error) {
              console.error("Error capturing tree:", error);
              // Open modal anyway with null dataUrl
              openModal("pdfExportModal", {
                svgRef: null,
                containerRef: treeContainerRef,
                capturedDataUrl: null,
                scopeOptions: 'currentView',
                fitView: fitView,
                treeData: treeData // Pass tree data for family name
              });
            }
          }}
          handleQuickCapture={async () => {
            // Quick capture: directly capture current view and download as PNG
            try {
              console.log("Starting quick capture...");

              if (!treeContainerRef.current) {
                console.error("Tree container ref not available!");
                return;
              }

              // Capture current view
              const dataUrl = await toPng(treeContainerRef.current, {
                backgroundColor: '#ffffff',
                width: treeContainerRef.current.offsetWidth,
                height: treeContainerRef.current.offsetHeight,
              });

              console.log("Quick capture successful, downloading PNG...");

              // Create download link for PNG with family name
              const familyName = treeData?.familyName || 'family_tree';
              const link = document.createElement('a');
              link.download = `${familyName}.png`;
              link.href = dataUrl;
              link.click();

            } catch (error) {
              console.error("Error in quick capture:", error);
            }
          }}
        />
        <Legend />
        <CustomMarkers />
        <MiniMap
          position="bottom-left"
          nodeStrokeWidth={3}
          zoomable
          pannable
        />
        <Background variant="dots" gap={12} size={1} />
      </ReactFlow>
      
      {/* Global Undo Countdown - could be enhanced to track multiple deletions */}
    </div>
  );
}

// -- Wrapper --
export default function TreeCanvasWrapper(props) {
  return (
    <ReactFlowProvider>
      <TreeCanvasComponent {...props} />
    </ReactFlowProvider>
  );
}
