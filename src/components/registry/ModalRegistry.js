// src/components/Modals/modalRegistry.js
import AddSpouseModal from "../Add Relatives/Spouse/AddSpouseModal";
import AddChildModal from "../Add Relatives/Child/AddChildModal";
import AddParentModal from "../Add Relatives/Parent/AddParentModal";
import AddTreeModal from "../AddTree/AddTreeModal";
import ConfirmationModal from "../modals/ConfirmationModal";
import EditPersonModal from "../Edit Person/EditPersonModal";
import {DeletePersonModal} from "../modals/DeletePersonModal";
import WarningModal from "../modals/WarningModal";
import PDFExport from "../PdfExport";
import InfoModal from "../modals/InfoModal";
import CascadeDetailsModal from "../modals/CascadeDetailsModal";
import RelationshipsModal from "../modals/RelationshipsModal";
import InviteTypeModal from "../modals/InviteTypeModal";
import InviteModal from "../modals/InviteModal";
import JoinModal from "../modals/JoinModal";
import PendingRequestDetailsModal from "../modals/PendingRequestDetailsModal";
import EditMemberRoleModal from "../modals/EditMemberRoleModal";
import BanMemberModal from "../modals/BanMemberModal";
import GrantMembershipModal from "../modals/GrantMembershipModal";

export const modalRegistry = {
  addSpouseModal: AddSpouseModal,
  addChildModal: AddChildModal,
  addParentModal: AddParentModal,
  treeModal: AddTreeModal,
  confirmationModal: ConfirmationModal,
  editPerson: EditPersonModal,
  deletePerson: DeletePersonModal,
  warningModal: WarningModal,
  pdfExportModal: PDFExport,
  infoModal: InfoModal,
  cascadeDetailsModal: CascadeDetailsModal,
  relationships: RelationshipsModal,
  inviteTypeModal: InviteTypeModal,
  inviteModal: InviteModal,
  joinModal: JoinModal,
  pendingRequestDetailsModal: PendingRequestDetailsModal,
  editMemberRole: EditMemberRoleModal,
  banMemberModal: BanMemberModal,
  grantMembershipModal: GrantMembershipModal,
};
