import React, { useState, useRef } from "react";
import ExportFamilyTree from "../components/PdfExport";
import Button from "../components/Button";

export default function ExportPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const svgRef = useRef(null);
  const containerRef = useRef(null);

  return (
    <div style={{ padding: "20px" }}>
      <h2>Export Family Tree</h2>

      {/* Example tree to test */}
      <div
        ref={containerRef}
        style={{
          border: "1px solid #ccc",
          padding: "20px",
          display: "inline-block",
          marginBottom: "20px",
          backgroundColor: "#fff"
        }}
      >
        <svg ref={svgRef} width="300" height="200">
          <rect x="50" y="50" width="200" height="100" fill="#8E56FF" />
          <text x="150" y="120" textAnchor="middle" fill="#fff" fontSize="20">
            Family Tree
          </text>
        </svg>
      </div>

      {/* Button to open export modal */}
      <Button onClick={() => setIsModalOpen(true)}>Export Family Tree</Button>

      {/* Export Modal */}
      <ExportFamilyTree
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        treeRef={containerRef}
      />
    </div>
  );
}
