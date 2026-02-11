import React, { useState, useRef, useEffect } from 'react';
import {
  Copy,
  QrCode,
  Calendar,
  Users,
  FileText,
  X,
  ArrowDownToLine,
  Shield,
  Key,
  Link as LinkIcon,
  UserCircle,
  Clock,
  Lock,
  Mars,
  Venus,
  Image as ImageIcon,
  File,
  Edit,
  Trash2,
} from 'lucide-react';
import { revokeInvite } from '../../services/inviteService';
import useModalStore from '../../store/useModalStore';
import { useAuth } from '../../context/AuthContext';

import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import FlexContainer from '../../layout/containers/FlexContainer';
import Spacer from '../Spacer';
import useToastStore from '../../store/useToastStore';
import dataService from '../../services/dataService';
import Card from '../../layout/containers/Card';
import Row from '../../layout/containers/Row';
import Modal from '../../layout/containers/Modal';
import ToggleSwitch from '../../components/ToggleSwitch';
import Button from '../../components/Button';


const InviteDetailsSidebar = ({ invite, onClose, onInviteUpdated }) => {
  const [fatherName, setFatherName] = useState('');
  const [motherName, setMotherName] = useState('');
  const [treeName, setTreeName] = useState('');
  const [grantedPersonName, setGrantedPersonName] = useState('');
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [includeOnlyQR, setIncludeOnlyQR] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const addToast = useToastStore((state) => state.addToast);
  const { openModal } = useModalStore();
  const { currentUser } = useAuth();
  const publicInfoRef = useRef(null);
  const qrRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (invite?.fatherId) {
          const father = await dataService.getPerson(invite.fatherId);
          setFatherName(father?.name || 'Unknown');
        }
        if (invite?.motherId) {
          const mother = await dataService.getPerson(invite.motherId);
          setMotherName(mother?.name || 'Unknown');
        }
        if (invite?.personId) {
          const person = await dataService.getPerson(invite.personId);
          setGrantedPersonName(person?.name || 'Unknown');
        }
        if (invite?.treeId) {
          const tree = await dataService.getTree(invite.treeId);
          setTreeName(tree?.familyName || 'Unknown');
        }
      } catch {
        setFatherName('Error');
        setMotherName('Error');
        setGrantedPersonName('Error');
        setTreeName('Error');
      }
    };
    if (invite?.type === 'targeted' || invite?.type === 'grant' || invite?.treeId) fetchData();
  }, [invite]);

  if (!invite) return null;

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    addToast('Join link copied to clipboard', 'success');
  };

  const openDownloadModal = () => {
    setShowDownloadModal(true);
  };

  const handleCancelInvite = async () => {
    openModal('confirmationModal', {
      title: 'Cancel Invitation',
      message: 'Are you sure you want to cancel this invitation? This action cannot be undone. All unconfirmed join requests by this invitation will become invalid.',
      confirmText: 'Cancel Invitation',
      cancelText: 'Keep Invitation',
      onConfirm: async () => {
        setIsDeleting(true);
        try {
          await revokeInvite(invite.id, invite.treeId, currentUser.uid, currentUser.displayName || currentUser.email);
          addToast('Invitation cancelled successfully', 'success');
          if (onInviteUpdated) onInviteUpdated();
          onClose();
        } catch (error) {
          console.error('Failed to cancel invite:', error);
          addToast('Failed to cancel invitation', 'error');
        } finally {
          setIsDeleting(false);
        }
      }
    });
  };

  const handleEditInvite = () => {
    openModal('inviteModal', {
      invite,
      treeId: invite.treeId,
      inviteType: invite.type,
      onInviteCreated: (_updatedInvite) => {
        addToast('Invitation updated successfully', 'success');
        if (onInviteUpdated) onInviteUpdated();
        onClose();
      }
    });
  };



  const captureElement = async (element, filename) => {
    try {
      const canvas = await html2canvas(element, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
      });
      const link = document.createElement('a');
      link.download = filename;
      link.href = canvas.toDataURL('image/png');
      link.click();
      addToast('Image downloaded successfully', 'success');
    } catch (error) {
      console.error('Error capturing element:', error);
      addToast('Failed to download image', 'error');
    }
  };

  const downloadAsPDF = async (element, filename) => {
    try {
      const canvas = await html2canvas(element, {
        backgroundColor: '#ffffff',
        scale: 3,
        useCORS: true,
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF();
      const imgWidth = 200; 
      const pageHeight = 300; 
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(filename);
      addToast('PDF downloaded successfully', 'success');
    } catch (error) {
      console.error('Error creating PDF:', error);
      addToast('Failed to download PDF', 'error');
    }
  };

  const handleDownload = async (format) => {
    const element = includeOnlyQR ? qrRef.current : publicInfoRef.current;
    if (!element) return;

    const filename = includeOnlyQR
      ? `invite-qr-${invite.id}.${format === 'pdf' ? 'pdf' : 'png'}`
      : `invite-details-${invite.id}.${format === 'pdf' ? 'pdf' : 'png'}`;

    if (format === 'pdf') {
      await downloadAsPDF(element, filename);
    } else {
      await captureElement(element, filename);
    }

    setShowDownloadModal(false);
  };



  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return '#4CAF50';
      case 'used':
        return '#FFA500';
      case 'expired':
        return '#F44336';
      default:
        return '#9E9E9E';
    }
  };

  return (
    <FlexContainer
      margin='0px'
      width='340px'
      className=" top-0 h-full w-full  bg-[#f6f8f6] shadow-xl border-gray-200 flex flex-col items-center"
    >
      
        <div className="flex items-center justify-between w-full py-2 border-b border-gray-200 sticky top-0 bg-[#f6f8f6] z-10">
        <Card
          onClick={onClose}
          backgroundColor='var(--color-transparent)'
          rounded
          size={30}
          className="p-1.5 rounded-full hover:bg-gray-200 transition"
        >
          <X size={20} color='red'/>
        </Card>
        <h2 className="text-[13px] font-semibold text-gray-900 truncate max-w-[160px] text-center">
          Invitation #{invite.code}
        </h2>
        <div className="flex items-center gap-1">
          <Card
            onClick={handleEditInvite}
            backgroundColor='var(--color-transparent)'
            rounded
            size={30}
            className="p-1.5 rounded-full hover:bg-gray-200 transition"
            title="Edit invitation"
          >
            <Edit size={16} color='green' />
          </Card>
          <Card
            onClick={handleCancelInvite}
            backgroundColor='var(--color-transparent)'
            rounded
            size={30}
            className="p-1.5 rounded-full hover:bg-gray-200 transition"
            title="Cancel invitation"
            disabled={isDeleting}
          >
            <Trash2 size={16} color='red' />
          </Card>
          <Card
            onClick={openDownloadModal}
            backgroundColor='var(--color-transparent)'
            rounded
            size={30}
            className="p-1.5 rounded-full hover:bg-gray-200 transition"
          >
            <ArrowDownToLine size={20} color='blue' />
          </Card>
        </div>
      </div>

      
      <div className="w-full  space-y-3">
       
        <div>
          <h3 className="text-gray-900 font-semibold text-[12px] mb-2">
            Public Information
          </h3>

          <div ref={publicInfoRef} className="bg-white rounded-md p-2 shadow-sm space-y-3">
            {/* CODE */}
            <div className="text-center">
              <p className="text-gray-500 text-[11px]">Invite Code</p>
              <p className="text-xl font-bold tracking-wide text-gray-900 mt-1">
                {invite.code}
              </p>
            </div>

            {/* QR */}
            {invite.qrDataUrl && (
              <div ref={qrRef}>
                <Card fitContent>
                  <img
                    src={invite.qrDataUrl}
                    alt="QR Code"
                    className="object-contain w-[220px] h-[220px]"
                  />
                </Card>
              </div>
            )}

            {/* LINK */}
           

            {/* ROLE + TYPE */}
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-gray-500" />
                <span className="text-gray-600">Role:</span>
                <span className="font-semibold text-gray-900">
                  {invite.role}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-gray-500" />
                <span className="text-gray-600">Type:</span>
                <span className="font-semibold text-gray-900 capitalize">
                  {invite.type}
                </span>
              </div>
            </div>

            {/* FAMILY TREE */}
            <div className="flex items-center gap-1.5 text-[11px]">
              <FileText className="w-3.5 h-3.5 text-gray-500" />
              <span className="text-gray-600">Family Name:</span>
              <span className="font-semibold text-gray-900">
                {treeName || 'N/A'}
              </span>
            </div>

            {/* TARGET DETAILS */}
            {invite.type === 'targeted' && (
              <div className="pt-1 border-t border-gray-200 text-[11px] space-y-1">
                <p className="text-gray-600 font-medium">Target Details</p>
                <Row padding='1rem 0rem 0rem 0rem' justifyContent='flex-start'>
                  <div className="flex items-center gap-1.5">
                    <Mars className="w-3.5 h-3.5 text-gray-500" />
                    <span className="text-gray-600 text-ellipsis">Father:</span>
                    <span className="font-semibold text-gray-900">
                      {fatherName || 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Venus className="w-3.5 h-3.5 text-gray-500" />
                    <span className="text-gray-600 text-ellipsis">Mother:</span>
                    <span className="font-semibold text-gray-900">
                      {motherName || 'N/A'}
                    </span>
                  </div>
                </Row>
              </div>
            )}

            {/* GRANT DETAILS */}
            {invite.type === 'grant' && (
              <div className="pt-1 border-t border-gray-200 text-[11px] space-y-1">
                <p className="text-gray-600 font-medium">Grant Details</p>
                <div className="flex items-center gap-1.5">
                  <UserCircle className="w-3.5 h-3.5 text-gray-500" />
                  <span className="text-gray-600">Granted to:</span>
                  <span className="font-semibold text-gray-900">
                    {grantedPersonName || 'N/A'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        <Spacer size="md" />

        {/* ADMIN INFO */}
        <div>
          <h3 className="text-gray-900 font-semibold text-[12px] mb-2 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-gray-600" /> Admin Panel
          </h3>

          

          <div className="bg-white rounded-md p-2 shadow-sm space-y-2 text-[11px]">
            
             <div className="flex items-center gap-2 bg-gray-100 px-2 py-2 rounded-md">
              <LinkIcon className="w-3.5 h-3.5 text-gray-600" />
              <p className="text-gray-800 text-[11px] truncate flex-1">
                {invite.joinUrl}
              </p>
              <Card
                onClick={() => copyToClipboard(invite.joinUrl)}
                backgroundColor='var(--color-info-light)'
                rounded
                fitContent
                size={22}
              >
                <Copy className="w-3.5 h-3.5 text-gray-600" />
              </Card>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-gray-500" />
                <span className="text-gray-600">Uses:</span>
                <span className="font-semibold text-gray-900">
                  {invite.usesCount || 0}/
                  {invite.usesAllowed === -1 ? '∞' : invite.usesAllowed}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-gray-500" />
                <span className="text-gray-600">Status:</span>
                <span
                  className="font-semibold rounded-full px-1.5 py-0.5"
                  style={{
                    backgroundColor: `${getStatusColor(invite.status)}20`,
                    color: getStatusColor(invite.status),
                  }}
                >
                  {invite.status}
                </span>
              </div>
            </div>

            {invite.expiresAt && (
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-gray-500" />
                <span className="text-gray-600">Expires:</span>
                <span className="font-semibold text-gray-900">
                  {new Date(invite.expiresAt).toLocaleDateString()}
                </span>
              </div>
            )}

            <div className="flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-gray-500" />
              <span className="text-gray-600">Invite ID:</span>
              <span className="font-semibold text-gray-900 truncate">
                {invite.InviteId || invite.id}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-gray-500" />
              <span className="text-gray-600">Updated:</span>
              <span className="font-semibold text-gray-900">
                {new Date(invite.updatedAt || invite.createdAt).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Download Modal */}
      <Modal isOpen={showDownloadModal} onClose={() => setShowDownloadModal(false)} maxWidth="400px">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
            Download Options
          </h3>

          {/* Toggle for QR only */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-gray-700">Include only QR code</span>
            <ToggleSwitch checked={includeOnlyQR} onChange={setIncludeOnlyQR} />
          </div>

          {/* Download Options */}
          <Row gap="1rem" justifyContent="center">
            <Card
              onClick={() => handleDownload('image')}
              backgroundColor='var(--color-primary-light)'

              className="p-3 cursor-pointer hover:bg-blue-100 transition"
            >
              <div className="flex flex-col items-center gap-2">
                <ImageIcon className="w-6 h-6 text-blue-600" />
                <span className="text-sm font-medium text-gray-900">Image</span>
              </div>
            </Card>

            <Card
              onClick={() => handleDownload('pdf')}
              backgroundColor='var(--color-secondary-light)'
              
              className="p-3 cursor-pointer hover:bg-green-100 transition"
            >
              <div className="flex flex-col items-center gap-2">
                <File className="w-6 h-6 text-green-600" />
                <span className="text-sm font-medium text-gray-900">PDF</span>
              </div>
            </Card>
          </Row>

          {/* Close Button */}
          <Button
            onClick={() => setShowDownloadModal(false)}
            fullWidth
            className="mt-4"
            variant="secondary"
          >
            Cancel
          </Button>
        </div>
      </Modal>
    </FlexContainer>
  );
};

export default InviteDetailsSidebar;
