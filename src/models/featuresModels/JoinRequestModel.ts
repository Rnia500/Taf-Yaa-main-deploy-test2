import { generateId } from "../../utils/personUtils/idGenerator";

export interface JoinRequest {
    JoinRequestId: string;
    treeId: string;
    inviteCode: string;
    inviteId: string;

    submittedBy?: string | null;
    createdAt: string;
    reviewedAt?: string;
    reviewedBy?: string | null;
    status: "pending" | "approved" | "rejected";

    claimedFatherId?: string | null;
    claimedMotherId?: string | null;

    name: string;
    gender: "male" | "female" | "other";
    birthDate?: string | null;
    notes?: string | null;


    proofFiles: {
        url: string;
        type: "image" | "video" | "audio" | "pdf" | "doc";
        name?: string;
        size?: number;
        duration?: number;
        caption?: string;
    }[];


    approvedPersonId?: string | null;
}

export function createJoinRequest({
    treeId,
    inviteCode,
    inviteId,
    submittedBy = null,
    claimedFatherId = null,
    claimedMotherId = null,
    name,
    gender,
    birthDate = null,
    notes = null,
    proofFiles = [],
}: {
    treeId: string;
    inviteCode: string;
    inviteId: string;
    submittedBy?: string | null;
    claimedFatherId?: string | null;
    claimedMotherId?: string | null;
    name: string;
    gender: "male" | "female" | "other";
    birthDate?: string | null;
    notes?: string | null;
    proofFiles?: {
        url: string;
        type: "image" | "video" | "audio" | "pdf" | "doc";
        name?: string;
        size?: number;
        duration?: number;
        caption?: string;
    }[];
}): JoinRequest {
    const now = new Date().toISOString();
    return {
        JoinRequestId: generateId("joinRequest"),
        treeId,
        inviteCode,
        inviteId,
        submittedBy,
        createdAt: now,
        status: "pending",
        claimedFatherId,
        claimedMotherId,
        name,
        gender,
        birthDate,
        notes,
        proofFiles,
        approvedPersonId: null,
    };
}
