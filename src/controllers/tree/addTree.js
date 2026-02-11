// src/services/commands/addTree.js
import dataService from "../../services/dataService";
import { createTree } from "../../models/treeModels/treeModel";
import { createPerson } from "../../models/treeModels/PersonModel";
import { addBirth, addDeath } from "./events";
import { validateTreeData } from "../../utils/validation/treeValidation";
import { validatePersonData } from "../../utils/validation/personValidation";

import { generateId } from "../../utils/personUtils/idGenerator";


export async function addTree(formData, options = {}) {
  const { createdBy, onError } = options;

  try {
    //  1. INITIAL VALIDATION 
    validateTreeData(formData);

    // Validate root person data
    const rootPersonData = {
      fullName: formData.rootPersonName,
      gender: formData.rootPersonGender,
      email: formData.rootPersonEmail || null,
    };
    validatePersonData(rootPersonData);

   
    const treeId = generateId("tree");


    let uploadedFamilyPhotoUrl = null;
    if (formData.familyPhoto) {
      try {
        const uploaded = await dataService.uploadFile(formData.familyPhoto, "image", {
          treeId: treeId,
          personId: null,
          userId: createdBy
        });
        uploadedFamilyPhotoUrl = uploaded.url;
      } catch (err) {
        console.error("Family photo upload failed", err);
      }
    }

    let uploadedPhotoUrl = null;
    if (formData.rootPersonPhoto) {
      try {
        const uploaded = await dataService.uploadFile(formData.rootPersonPhoto, "image", {
          treeId: treeId,
          personId: null, // Root person not created yet
          userId: createdBy
        });
        uploadedPhotoUrl = uploaded.url;
      } catch (err) {
        console.error("Root person photo upload failed", err);
      }
    }

    if (formData.rootPersonAudioFile) {
      try {
        await dataService.uploadStory(formData.rootPersonAudioFile, treeId, null, createdBy, {
          title: formData.rootPersonStoryTitle || "Life Story",
          subTitle: null,
          description: null,
          tags: [],
          visibility: 'public'
        });
      } catch (err) {
        console.error("Root person audio story creation failed", err);
      }
    }
    const tree = createTree({
      id: treeId,
      familyName: formData.familyName,
      createdBy,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      currentRootId: null,
      familyDescription: formData.familyDescription,
      orgineTribe: formData.orgineTribe,
      origineHomeLand: formData.origineHomeLand,
      origineTongue: formData.origineTongue,
      familyPhoto: uploadedFamilyPhotoUrl,
      roles: { [createdBy]: "admin" },
      settings: {
        privacy: {
          isPublic: formData.isPublic ?? false,
          allowMergeRequests: formData.allowMergeRequests ?? true,
          globalMatchOptIn: formData.globalMatchOptIn ?? false,
          allowInvites: formData.allowInvites ?? true,
        },
        relationship: {
          allowPolygamy: formData.allowPolygamy ?? false,
          allowMultipleMarriages: formData.allowMultipleMarriages ?? true,
          allowUnknownParentLinking: formData.allowUnknownParentLinking ?? false,
          maxGenerationsDisplayed: formData.maxGenerationsDisplayed ?? 10,
        },
        display: {
          showRoleBadges: true,
          showGenderIcons: true,
          defaultRootPerson: null,
        },
        language: {
          interfaceLanguage: formData.language || "en",
          allowPerUserLanguageOverride: true,
        },
        lifeEvents: {
          birth: true,
          death: true,
          marriage: true,
          divorce: true,
          migration: false,
        },
        limits: {
          maxStoryLength: 500,
          maxImageFileSize: "2mb",
          maxAudioFileSize: "5mb",
        },
      },
    });

    await dataService.addTree(tree);

    // Add the creator as a member of the tree
    await dataService.addMember(treeId, {
      userId: createdBy,
      role: 'admin',
      // Removed placeholder user name and email
    });

    //  4. CREATE ROOT PERSON 
    const rootPersonId = generateId("person");
    const rootPerson = createPerson({
      id: rootPersonId,
      treeId,
      name: formData.rootPersonName,
      gender: formData.rootPersonGender,
      dob: formData.rootPersonDob || null,
      dod: formData.rootPersonDod || null,
      tribe: formData.rootPersonTribe || null,
      placeOfBirth: formData.rootPersonPlaceOfBirth || null,
      placeOfDeath: formData.rootPersonPlaceOfDeath || null,
      photoUrl: uploadedPhotoUrl,
      bio: formData.rootPersonBiography || "",
      isDeceased: !!formData.rootPersonDod,
      isSpouse: false,
      allowGlobalMatching: true,
      privacyLevel: "membersOnly",
      deletedAt: null,
      deletionMode: null,
      pendingDeletion: false,
      undoExpiresAt: null,
      deletionBatchId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await dataService.addPerson(rootPerson);

    // Update tree root
    await dataService.updateTree(treeId, { currentRootId: rootPersonId });

    //  5. CREATE ASSOCIATED RECORDS 
    if (rootPerson.dob) {
      await addBirth(treeId, rootPersonId, { date: rootPerson.dob, title: "Birth",  skipDuplicateCheck: true });
    }
    if (rootPerson.dod) {
      await addDeath(treeId, rootPersonId, { date: rootPerson.dod, title: "Death", skipDuplicateCheck: true });
    }

    // Audio story is already created above, so we don't need to create another one
    // The uploadedAudioUrl now contains the story ID, not a media URL

    //  6. RETURN SUCCESS 
    return { tree: { ...tree, currentRootId: rootPersonId }, rootPerson };
  } catch (err) {
    console.error("Error in addTree orchestrator:", err);
    onError?.(err.message || "Unexpected error", "error");
    throw err;
  }
}
