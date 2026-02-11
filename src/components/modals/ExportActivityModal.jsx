import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import Modal from "../../layout/containers/Modal";
import dataService from "../../services/dataService";
import { getActivityDescription } from "../../models/treeModels/ActivityModel";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const ExportActivityModal = ({
  isOpen,
  onClose,
  activities,
  filteredActivities,
  hasMore,
  treeId,
  _searchTerm,
  _filterType
}) => {
  const { t } = useTranslation();
  const [exportLoading, setExportLoading] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState('pdf');

  const handleExport = async () => {
    try {
      setExportLoading(true);
      const activitiesToExport = filteredActivities.length > 0 ? filteredActivities : activities;

      // Get all activities if needed (not just first page)
      let allActivities = activitiesToExport;
      if (filteredActivities.length === 0 && hasMore) {
        // Load all activities for export
        const result = await dataService.activityService.getActivities(treeId, 1000); // Large limit for export
        allActivities = result.activities;
      }

      if (selectedFormat === 'csv') {
        const csvContent = [
          ['Date', 'Time', 'User', 'Activity Type', 'Description', 'Changed Fields'],
          ...allActivities.map(activity => {
            let changedFieldsStr = '';
            if (activity.activityType === 'person_edited' && activity.details?.changedFields) {
              changedFieldsStr = activity.details.changedFields.map(change =>
                change.field === 'unknown fields'
                  ? change.field
                  : `${change.field}: ${change.oldValue || 'null'} → ${change.newValue || 'null'}`
              ).join('; ');
            }
            return [
              activity.timestamp.toLocaleDateString(),
              activity.timestamp.toLocaleTimeString(),
              activity.userName || 'Unknown',
              activity.activityType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
              getActivityDescription(activity),
              changedFieldsStr
            ];
          })
        ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `family-activity-${treeId}-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
      } else if (selectedFormat === 'html') {
        // Create HTML content
        const htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>Family Activity Report</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                margin: 20px;
                font-size: 14px;
                line-height: 1.4;
                background-color: #f9f9f9;
              }
              .header {
                text-align: center;
                margin-bottom: 30px;
                border-bottom: 2px solid #333;
                padding-bottom: 20px;
                background-color: white;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
              }
              .header h2 {
                color: #333;
                margin: 0;
                font-size: 24px;
              }
              .header p {
                color: #666;
                margin: 5px 0;
                font-size: 12px;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 20px;
                background-color: white;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
              }
              th, td {
                border: 1px solid #ddd;
                padding: 12px 15px;
                text-align: left;
              }
              th {
                background-color: #f5f5f5;
                font-weight: bold;
                font-size: 12px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
              }
              tr:nth-child(even) { background-color: #f9f9f9; }
              .activity-type {
                font-weight: bold;
                text-transform: capitalize;
                color: #007bff;
              }
              .timestamp {
                font-size: 11px;
                color: #666;
              }
              .footer {
                margin-top: 30px;
                text-align: center;
                font-size: 10px;
                color: #666;
                background-color: white;
                padding: 15px;
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
              }
              .description-cell {
                max-width: 300px;
                word-wrap: break-word;
              }
              .changed-fields-cell {
                max-width: 200px;
                word-wrap: break-word;
                font-size: 12px;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h2>Family Activity Report</h2>
              <p>Tree ID: ${treeId}</p>
              <p>Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</p>
              <p>Total Activities: ${allActivities.length}</p>
            </div>

            <table>
              <thead>
                <tr>
                  <th style="width: 15%;">Date & Time</th>
                  <th style="width: 12%;">User</th>
                  <th style="width: 12%;">Activity Type</th>
                  <th style="width: 35%;">Description</th>
                  <th style="width: 26%;">Changed Fields</th>
                </tr>
              </thead>
              <tbody>
                ${allActivities.map(activity => {
                  let changedFieldsStr = '';
                  if (activity.activityType === 'person_edited' && activity.details?.changedFields) {
                    changedFieldsStr = activity.details.changedFields.map(change =>
                      change.field === 'unknown fields'
                        ? change.field
                        : `${change.field}: ${change.oldValue || 'null'} → ${change.newValue || 'null'}`
                    ).join('; ');
                  }
                  return `
                    <tr>
                      <td class="timestamp">${activity.timestamp.toLocaleDateString()} ${activity.timestamp.toLocaleTimeString()}</td>
                      <td>${activity.userName || 'Unknown'}</td>
                      <td class="activity-type">${activity.activityType.replace(/_/g, ' ')}</td>
                      <td class="description-cell">${getActivityDescription(activity)}</td>
                      <td class="changed-fields-cell">${changedFieldsStr}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>

            <div class="footer">
              <p>This report was generated by the Family Tree Management System</p>
            </div>
          </body>
          </html>
        `;

        const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `family-activity-${treeId}-${new Date().toISOString().split('T')[0]}.html`;
        link.click();
      } else if (selectedFormat === 'pdf') {
        // Create HTML content for PDF
        const htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>Family Activity Report</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                margin: 15px;
                font-size: 11px;
                line-height: 1.3;
              }
              .header {
                text-align: center;
                margin-bottom: 20px;
                border-bottom: 1px solid #333;
                padding-bottom: 15px;
              }
              .header h2 {
                color: #333;
                margin: 0;
                font-size: 16px;
              }
              .header p {
                color: #666;
                margin: 3px 0;
                font-size: 10px;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 15px;
                font-size: 9px;
              }
              th, td {
                border: 1px solid #ddd;
                padding: 4px 6px;
                text-align: left;
                word-wrap: break-word;
                overflow-wrap: break-word;
              }
              th {
                background-color: #f5f5f5;
                font-weight: bold;
                font-size: 9px;
                padding: 6px 6px;
              }
              tr:nth-child(even) { background-color: #f9f9f9; }
              tr { page-break-inside: avoid; }
              .activity-type {
                font-weight: bold;
                text-transform: capitalize;
              }
              .timestamp {
                font-size: 8px;
                color: #666;
              }
              .footer {
                margin-top: 20px;
                text-align: center;
                font-size: 8px;
                color: #666;
              }
              .description-cell {
                max-width: 200px;
                word-wrap: break-word;
              }
              .changed-fields-cell {
                max-width: 150px;
                word-wrap: break-word;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h2>Family Activity Report</h2>
              <p>Tree ID: ${treeId}</p>
              <p>Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</p>
              <p>Total Activities: ${allActivities.length}</p>
            </div>

            <table>
              <thead>
                <tr>
                  <th style="width: 15%;">Date & Time</th>
                  <th style="width: 12%;">User</th>
                  <th style="width: 12%;">Activity Type</th>
                  <th style="width: 35%;">Description</th>
                  <th style="width: 26%;">Changed Fields</th>
                </tr>
              </thead>
              <tbody>
                ${allActivities.map(activity => {
                  let changedFieldsStr = '';
                  if (activity.activityType === 'person_edited' && activity.details?.changedFields) {
                    changedFieldsStr = activity.details.changedFields.map(change =>
                      change.field === 'unknown fields'
                        ? change.field
                        : `${change.field}: ${change.oldValue || 'null'} → ${change.newValue || 'null'}`
                    ).join('; ');
                  }
                  return `
                    <tr>
                      <td class="timestamp">${activity.timestamp.toLocaleDateString()} ${activity.timestamp.toLocaleTimeString()}</td>
                      <td>${activity.userName || 'Unknown'}</td>
                      <td class="activity-type">${activity.activityType.replace(/_/g, ' ')}</td>
                      <td class="description-cell">${getActivityDescription(activity)}</td>
                      <td class="changed-fields-cell">${changedFieldsStr}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>

            <div class="footer">
              <p>This report was generated by the Family Tree Management System</p>
            </div>
          </body>
          </html>
        `;

        // Create temporary element to capture
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlContent;
        tempDiv.style.position = 'absolute';
        tempDiv.style.left = '-9999px';
        tempDiv.style.top = '-9999px';
        tempDiv.style.width = '800px'; // Set a fixed width for consistent PDF
        document.body.appendChild(tempDiv);

        // Capture with html2canvas
        const canvas = await html2canvas(tempDiv, {
          scale: 2, // Higher quality
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff'
        });

        // Remove temporary element
        document.body.removeChild(tempDiv);

        // Create PDF
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

        // Add first page
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

        // If content is taller than one page, add multiple pages
        const pageHeight = pdf.internal.pageSize.getHeight();
        let heightLeft = pdfHeight - pageHeight;

        while (heightLeft > 0) {
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, -pageHeight + heightLeft, pdfWidth, pdfHeight);
          heightLeft -= pageHeight;
        }

        pdf.save(`family-activity-${treeId}-${new Date().toISOString().split('T')[0]}.pdf`);
      }

      onClose();
    } catch (error) {
      console.error('Error exporting:', error);
    } finally {
      setExportLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t("modals.export_activity_title") || "Export Activity Report"}
      maxWidth="50"
    >
      <div className="flex flex-col gap-4">
        <p className="text-[#616f89] dark:text-gray-400 text-sm font-normal leading-normal">
          {t("modals.choose_format") || "Choose your export format"}
        </p>

        {/* Radio List / Export Options */}
        <div className="flex flex-col gap-3">
          {/* PDF option */}
          <label className={`flex cursor-pointer items-center gap-4 rounded-lg border border-solid border-[#dbdfe6] dark:border-gray-700 p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 has-[:checked]:border-primary has-[:checked]:bg-primary/10 dark:has-[:checked]:border-primary dark:has-[:checked]:bg-primary/20 transition-colors duration-150`}>
            <span className="material-symbols-outlined text-2xl text-red-600 dark:text-red-500">picture_as_pdf</span>
            <div className="flex grow flex-col">
              <div className="flex items-center gap-2">
                <p className="text-[#111318] dark:text-gray-100 text-sm font-medium leading-normal">PDF</p>
                <span className="text-xs font-semibold text-primary bg-primary/10 dark:bg-primary/20 dark:text-primary px-2 py-0.5 rounded-full">
                  {t("modals.recommended") || "Recommended"}
                </span>
              </div>
              <p className="text-[#616f89] dark:text-gray-400 text-sm font-normal leading-normal">Best for printing and sharing.</p>
            </div>
            <input
              checked={selectedFormat === 'pdf'}
              onChange={() => setSelectedFormat('pdf')}
              className="h-5 w-5 appearance-none rounded-full border-2 border-[#dbdfe6] dark:border-gray-600 bg-transparent checked:border-[5px] checked:border-primary focus:outline-none focus:ring-0 focus:ring-offset-0"
              name="export-format"
              type="radio"
            />
          </label>

          {/* CSV option */}
          <label className={`flex cursor-pointer items-center gap-4 rounded-lg border border-solid border-[#dbdfe6] dark:border-gray-700 p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 has-[:checked]:border-primary has-[:checked]:bg-primary/10 dark:has-[:checked]:border-primary dark:has-[:checked]:bg-primary/20 transition-colors duration-150`}>
            <span className="material-symbols-outlined text-2xl text-green-600 dark:text-green-500">description</span>
            <div className="flex grow flex-col">
              <p className="text-[#111318] dark:text-gray-100 text-sm font-medium leading-normal">CSV</p>
              <p className="text-[#616f89] dark:text-gray-400 text-sm font-normal leading-normal">For spreadsheet apps and data analysis.</p>
            </div>
            <input
              checked={selectedFormat === 'csv'}
              onChange={() => setSelectedFormat('csv')}
              className="h-5 w-5 appearance-none rounded-full border-2 border-[#dbdfe6] dark:border-gray-600 bg-transparent checked:border-[5px] checked:border-primary focus:outline-none focus:ring-0 focus:ring-offset-0"
              name="export-format"
              type="radio"
            />
          </label>

          {/* HTML option */}
          <label className={`flex cursor-pointer items-center gap-4 rounded-lg border border-solid border-[#dbdfe6] dark:border-gray-700 p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 has-[:checked]:border-primary has-[:checked]:bg-primary/10 dark:has-[:checked]:border-primary dark:has-[:checked]:bg-primary/20 transition-colors duration-150`}>
            <span className="material-symbols-outlined text-2xl text-blue-600 dark:text-blue-500">code</span>
            <div className="flex grow flex-col">
              <p className="text-[#111318] dark:text-gray-100 text-sm font-medium leading-normal">HTML</p>
              <p className="text-[#616f89] dark:text-gray-400 text-sm font-normal leading-normal">For viewing the report in a web browser.</p>
            </div>
            <input
              checked={selectedFormat === 'html'}
              onChange={() => setSelectedFormat('html')}
              className="h-5 w-5 appearance-none rounded-full border-2 border-[#dbdfe6] dark:border-gray-600 bg-transparent checked:border-[5px] checked:border-primary focus:outline-none focus:ring-0 focus:ring-offset-0"
              name="export-format"
              type="radio"
            />
          </label>
        </div>

        {/* Single Button / Footer */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-[#f0f2f4] text-[#111318] dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 text-sm font-bold leading-normal tracking-[0.015em] hover:bg-gray-300 transition-colors"
          >
            <span className="truncate">Cancel</span>
          </button>
          <button
            onClick={handleExport}
            disabled={exportLoading}
            className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-primary text-white text-sm font-bold leading-normal tracking-[0.015em] hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="truncate">{exportLoading ? 'Exporting...' : 'Export'}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ExportActivityModal;
