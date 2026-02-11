import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { X } from 'lucide-react'
import Card from '../../../layout/containers/Card'
import Row from '../../../layout/containers/Row'

export default function ProfileExportModal({ isOpen, onClose, profileName }) {
  const { t } = useTranslation()
  const [selectedFormat, setSelectedFormat] = useState('pdf')

  if (!isOpen) return null

  const handleExport = async () => {
    const profileElement = document.querySelector('.profile-sidebar')
    if (!profileElement) return

    try {
      const canvas = await html2canvas(profileElement, {
        backgroundColor: '#ffffff',
        scale: 2, // Higher resolution
      })

      if (selectedFormat === 'pdf') {
        const imgData = canvas.toDataURL('image/png')
        const pdf = new jsPDF({
          orientation: 'landscape', // Always use landscape for better table visibility
          unit: 'px',
          format: [canvas.width, canvas.height]
        })
        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height)
        pdf.save(`${profileName || 'profile'}.pdf`)
      } else if (selectedFormat === 'png') {
        const link = document.createElement('a')
        link.download = `${profileName || 'profile'}.png`
        link.href = canvas.toDataURL('image/png')
        link.click()
      }

      onClose()
    } catch (error) {
      console.error('Error exporting profile:', error)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/10 p-4">
      <div className="w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-2xl">
        {/* Modal Header */}
        <Row justifyContent='space-between' fitContent  className="border-b border-gray-200 p-4">
          <div className="flex items-center gap-4">
            <div className="flex size-10 items-center justify-center rounded-lg bg-gray-100">
              <span className="material-symbols-outlined text-gray-600">description</span>
            </div>
            <p className="text-gray-900 text-base font-semibold leading-normal truncate">
              {t('modals.print_export_profile')}
            </p>
          </div>
          <Card onClick={onClose} backgroundColor='var(--color-danger)' fitContent padding='0.3rem' margin='0px' size={25}>
            <X size={20} strokeWidth={3} color='white' />
          </Card>
        </Row>

        {/* Modal Body */}
        <div className="p-4">
          <p className="text-gray-600 text-sm font-normal leading-normal pb-4 pt-1">
            {t('modals.choose_format_profile')}
          </p>

          {/* Options Grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* PDF Option Card */}
            <div
              className={`relative flex cursor-pointer flex-col gap-2 rounded-lg border-2 p-3 transition-all hover:shadow-sm ${
                selectedFormat === 'pdf'
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-green-300'
              }`}
              onClick={() => setSelectedFormat('pdf')}
            >
              {selectedFormat === 'pdf' && (
                <div className="absolute right-2 top-2 rounded-full bg-green-500/20 px-2 py-0.5">
                  <p className="text-green-600 text-xs font-bold uppercase tracking-wider">
                    {t('modals.recommended')}
                  </p>
                </div>
              )}
              <div className="flex size-10 items-center justify-center rounded-lg bg-gray-100">
                <span className="material-symbols-outlined text-2xl text-green-500">picture_as_pdf</span>
              </div>
              <div>
                <p className="text-gray-900 text-sm font-medium leading-normal">
                  {t('modals.pdf_document')}
                </p>
                <p className="text-gray-600 text-xs font-normal leading-normal">
                  {t('modals.pdf_description')}
                </p>
              </div>
            </div>

            {/* PNG Option Card */}
            <div
              className={`flex cursor-pointer flex-col gap-2 rounded-lg border-2 p-3 transition-all hover:shadow-sm ${
                selectedFormat === 'png'
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-green-300'
              }`}
              onClick={() => setSelectedFormat('png')}
            >
              <div className="flex size-10 items-center justify-center rounded-lg bg-gray-100">
                <span className={`material-symbols-outlined text-2xl transition-colors ${
                  selectedFormat === 'png' ? 'text-green-500' : 'text-gray-500'
                }`}>
                  image
                </span>
              </div>
              <div>
                <p className="text-gray-900 text-sm font-medium leading-normal">
                  {t('modals.png_image')}
                </p>
                <p className="text-gray-600 text-xs font-normal leading-normal">
                  {t('modals.png_description')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end border-t border-gray-200 bg-gray-50">
          <div className="flex flex-col-reverse sm:flex-row flex-1 gap-2 max-w-sm p-3">
            <button
              onClick={onClose}
              className="flex min-w-[80px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-gray-100 text-gray-900 text-sm font-bold leading-normal w-full sm:w-auto hover:bg-gray-200 transition-colors"
            >
              <span className="truncate">{t('buttons.cancel')}</span>
            </button>
            <button
              onClick={handleExport}
              className="flex min-w-[80px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 text-white text-sm font-bold leading-normal w-full sm:w-auto hover:opacity-90 transition-opacity"
              style={{ backgroundColor: 'var(--color-primary1)' }}
            >
              <span className="truncate">{t('buttons.print_export')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
