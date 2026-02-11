import React, { useState } from 'react'
import Checkbox from './Checkbox'
import jsPDF from 'jspdf'

export default function PDFExport({ isOpen, onClose, svgRef, containerRef, capturedDataUrl, updateModalData, treeData }) {
  const [scopeOptions, setScopeOptions] = useState('currentView')
  const [exportOptions, setExportOptions] = useState({ format: 'pdf' })

  const handleExport = async () => {
    try {
      console.log("Starting export...");
      console.log("svgRef:", svgRef);
      console.log("containerRef:", containerRef);
      console.log("capturedDataUrl:", capturedDataUrl);
      console.log("scopeOptions:", scopeOptions);

      let dataUrl = capturedDataUrl

      if (!dataUrl) {
        console.error("No captured data available for export!");
        return
      }

      console.log("Using captured dataUrl for export");

      if (exportOptions.format === "png") {
        // Get family name from tree data or use default
        const familyName = treeData?.familyName || 'family_tree';
        const link = document.createElement("a")
        link.href = dataUrl
        link.download = `${familyName}.png`
        link.click()
      } else if (exportOptions.format === "pdf") {
        const img = new window.Image()
        img.src = dataUrl
        img.onload = () => {
          const pdf = new jsPDF({
            orientation: img.width > img.height ? 'landscape' : 'portrait',
            unit: 'px',
            format: [img.width, img.height]
          })
          pdf.addImage(dataUrl, "PNG", 0, 0, img.width, img.height)
          // Get family name from tree data or use default
          const familyName = treeData?.familyName || 'family_tree';
          pdf.save(`${familyName}.pdf`)
        }
      }

      console.log(
        'Exported family tree with options:',
        exportOptions,
        'and scope:',
        scopeOptions
      )

    } catch (error) {
      console.error("Error exporting family tree:", error)
    }
  }

  const handleOptionChange = (option, value) => {
    setExportOptions(prev => ({ ...prev, [option]: value }))
  }

  const handleScopeChange = (value) => {
    setScopeOptions(value)
    // Clear captured data when scope changes to force re-capture
    if (updateModalData) {
      updateModalData({ capturedDataUrl: null, scopeOptions: value })
    }
  }

  return (
    <>
      {/* Semi-transparent backdrop */}
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-gray-900/30" onClick={onClose}></div>
      )}

      {/* Modal Container */}
      <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${isOpen ? 'block' : 'hidden'}`}>
        <div className="w-full max-w-md rounded-lg bg-white shadow-lg">
          {/* HeadlineText */}
          <div className="flex justify-between items-center px-4 pt-4">
            <h1 className="text-gray-800 text-lg font-bold leading-tight tracking-tight">
              Export Your Family Tree
            </h1>
            <div
              className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center cursor-pointer hover:bg-gray-300"
              onClick={onClose}
            >
              <span className="text-gray-600 text-lg">×</span>
            </div>
          </div>

          <div className="p-4">
            {/* SectionHeader for Tree Scope */}
            <h3 className="text-gray-800 text-sm font-bold leading-tight tracking-tight pb-1 pt-1">
              Tree Scope
            </h3>

            {/* Checkbox for Tree Scope */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3 rounded-md border border-gray-300 p-3 hover:bg-gray-50">
                <Checkbox
                  checked={scopeOptions === 'currentView'}
                  onChange={() => handleScopeChange('currentView')}
                  value="currentView"
                />
                <div className="flex grow flex-col">
                  <p className="text-gray-800 text-xs font-medium leading-tight">Current Tree View</p>
                  <p className="text-gray-600 text-xs font-normal leading-tight">Exports only the visible portion of your tree.</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-md border border-gray-300 p-3 hover:bg-gray-50">
                <Checkbox
                  checked={scopeOptions === 'completeView'}
                  onChange={() => handleScopeChange('completeView')}
                  value="completeView"
                />
                <div className="flex grow flex-col">
                  <p className="text-gray-800 text-xs font-medium leading-tight">Complete Tree View</p>
                  <p className="text-gray-600 text-xs font-normal leading-tight">Exports the entire family tree, including all branches.</p>
                </div>
              </div>
            </div>

            {/* SectionHeader for File Format */}
            <h3 className="text-gray-800 text-sm font-bold leading-tight tracking-tight pb-1 pt-4">
              File Format
            </h3>

            {/* Card Selection for File Format */}
            <div className="flex flex-col gap-2">
              <div
                className={`cursor-pointer rounded-md border border-gray-300 p-3 hover:bg-green-200 ${exportOptions.format === 'pdf' ? 'bg-green-300 border-green-300' : ''}`}
                onClick={() => handleOptionChange('format', 'pdf')}
              >
                <div className="flex grow flex-col">
                  <p className="text-gray-800 text-xs font-medium leading-tight">PDF</p>
                  <p className="text-gray-600 text-xs font-normal leading-tight">Best for printing and sharing documents.</p>
                </div>
              </div>

              <div
                className={`cursor-pointer rounded-md border border-gray-300 p-3 hover:bg-green-200 ${exportOptions.format === 'png' ? 'bg-green-300 border-green-300' : ''}`}
                onClick={() => handleOptionChange('format', 'png')}
              >
                <div className="flex grow flex-col">
                  <p className="text-gray-800 text-xs font-medium leading-tight">Image (.png)</p>
                  <p className="text-gray-600 text-xs font-normal leading-tight">High-quality image for easy viewing and embedding.</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                className="flex items-center justify-center whitespace-nowrap rounded-md px-3 py-2 text-xs font-medium text-white transition-colors hover:opacity-90"
                style={{ backgroundColor: 'var(--color-secondary1)' }}
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                className="flex items-center justify-center whitespace-nowrap rounded-md px-3 py-2 text-xs font-medium text-white transition-colors hover:opacity-90"
                style={{ backgroundColor: 'var(--color-primary1)' }}
                onClick={handleExport}
              >
                Export
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
