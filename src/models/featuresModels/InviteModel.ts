// src/models/featuresModels/InviteModel.ts
import { generateId } from "../../utils/personUtils/idGenerator";

export interface Invite {
    InviteId: string;
    code: string;
    treeId: string;
    createdBy: string;
    type: "targeted" | "nontargeted" | "grant";
    role: "admin" | "moderator" | "editor" | "viewer";
    fatherId?: string | null;
    motherId?: string | null;
    personId?: string | null; // For grant invites - links to existing person

    usesAllowed: number;
    usesCount: number;
    status: "active" | "used" | "expired" | "revoked";
    expiresAt?: string;
    createdAt: string;
    updatedAt?: string;
    qrDataUrl?: string;
    joinUrl?: string;
    notes?: string;
}

export function createInvite({
    code,
    treeId,
    createdBy,
    type,
    role,
    fatherId = null,
    motherId = null,
    personId = null,
    usesAllowed = 1,
    expiresAt,
    qrDataUrl,
    joinUrl,
    notes,
}: {
    code: string;
    treeId: string;
    createdBy: string;
    type: "targeted" | "nontargeted" | "grant";
    role: "admin" | "moderator" | "editor" | "viewer";
    fatherId?: string | null;
    motherId?: string | null;
    personId?: string | null;
    usesAllowed?: number;
    expiresAt?: string;
    qrDataUrl?: string;
    joinUrl?: string;
    notes?: string;
}): Invite {
    const now = new Date().toISOString();
    return {
        InviteId: generateId("invite"),
        code,
        treeId,
        createdBy,
        type,
        role,
        fatherId,
        motherId,
        personId,
        usesAllowed,
        usesCount: 0,
        status: "active",
        expiresAt,
        createdAt: now,
        updatedAt: now,
        qrDataUrl,
        joinUrl,
        notes,
    };
}
