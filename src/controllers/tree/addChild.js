// src/controllers/tree/addChild.js

import { createPerson } from "../../models/treeModels/PersonModel";
import dataService from "../../services/dataService";
import { addBirth, addDeath, addCustom } from "./events";
import { createMarriage, addChildToMarriage } from "./marriages";
import { validateEventsArray } from "../../utils/treeUtils/eventValidation";
import { validatePersonData } from "../../utils/validation/personValidation";
import { addStory } from "./stories";

export async function addChild(treeId, options) {
  const { marriageId, parentId, childData, motherId, createdBy} = options;

  try {
    if (!marriageId && !parentId) {
      throw new Error("addChild requires either a marriageId or a parentId to proceed.");
    }

    // Validate person data
    validatePersonData(childData, 'child');

    // Validate events before proceeding
    if (Array.isArray(childData.events)) {
      validateEventsArray(childData.events);
    }

    let uploadedPhotoUrl = null;
    if (childData.profilePhoto) {
      try {
        const uploaded = await dataService.uploadMedia(childData.profilePhoto, treeId, null, createdBy, "profile");
        uploadedPhotoUrl = uploaded.url;
      } catch (err) {
        console.error("Photo upload failed", err);
      }
    }

    // 1. Create child record
    const newChild = createPerson({
      treeId,
      name: childData.fullName,
      gender: childData.gender,
      dob: childData.dateOfBirth,
      dod: childData.dateOfDeath,
      placeOfBirth: childData.placeOfBirth,
      placeOfDeath: childData.placeOfDeath,
      email: childData.email,
      phoneNumber: childData.phoneNumber,
      nationality: childData.nationality,
      countryOfResidence: childData.countryOfResidence,
      photoUrl: uploadedPhotoUrl,
      bio: childData.biography,
      tribe: childData.tribe,
      language: childData.language,
      isDeceased: childData.isDeceased,
      privacyLevel: childData.privacyLevel,
      allowGlobalMatching: childData.allowGlobalMatching,
      isSpouse: false,
      linkedUserId: childData.linkedUserId ?? null, 
    });

    await dataService.addPerson(newChild);

    // 2. Events
    if (newChild.dob) await addBirth(treeId, newChild.id, { date: newChild.dob, title: "Birth", location: childData.placeOfBirth });
    if (newChild.dod) await addDeath(treeId, newChild.id, { date: newChild.dod, title: "Death", location: childData.placeOfDeath });

    if (Array.isArray(childData.events)) {
      for (const ev of childData.events) {
        await addCustom(treeId, [newChild.id], ev.customType, ev);
      }
    }

    // Create story if story data is provided
    if (childData.title || childData.description || childData.attachments?.length > 0) {
      const storyData = {
        treeId,
        personId: newChild.id,
        createdBy,
        title: childData.title || "Life Story",
        location: childData.location || null,
        description: childData.description || null,
        tags: childData.tags ? childData.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        attachments: childData.attachments || []
      };
      await addStory(storyData);
    }

    // 3. Add to existing marriage
    if (marriageId) {
      const marriage = await dataService.getMarriage(marriageId);
      if (!marriage) throw new Error("Marriage not found.");

      let parentPerson = null;
      if (parentId) {
        parentPerson = await dataService.getPerson(parentId);
        if (!parentPerson) throw new Error("Parent not found.");
      }

      let effectiveMotherId = motherId;

      if (marriage.marriageType === "polygamous") {
        if (!motherId) {
          const placeholderSpouse = createPerson({
            treeId,
            name: "Partner",
            gender: "female",
            isPlaceholder: true,
            isSpouse: true,
            allowGlobalMatching: false,
          });
          await dataService.addPerson(placeholderSpouse);

          marriage.wives.push({
            wifeId: placeholderSpouse.id,
            order: marriage.wives.length + 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            childrenIds: [],
          });
          await dataService.updateMarriage(marriageId, { wives: marriage.wives });

          effectiveMotherId = placeholderSpouse.id;
        }

        // Correct call 
        await addChildToMarriage(marriageId, newChild.id, effectiveMotherId);

      } else {
        // monogamous
        if (!motherId && parentPerson) {
          const placeholderSpouse = createPerson({
            treeId,
            name: "Partner",
            gender: parentPerson.gender === "male" ? "female" : "male",
            isPlaceholder: true,
            isSpouse: true,
            allowGlobalMatching: false,
          });
          await dataService.addPerson(placeholderSpouse);

          if (!marriage.spouses.includes(placeholderSpouse.id)) {
            marriage.spouses.push(placeholderSpouse.id);
            await dataService.updateMarriage(marriageId, { spouses: marriage.spouses });
          }

          effectiveMotherId = placeholderSpouse.id;
        }

        // Correct call (no object wrapper)
        await addChildToMarriage(marriageId, newChild.id);
      }

      return { child: newChild, marriageId };
    }

    // 4. Single parent case → create placeholder marriage
    if (parentId) {
      const parentPerson = await dataService.getPerson(parentId);
      if (!parentPerson) throw new Error("Parent not found.");

      const placeholderSpouse = createPerson({
        treeId,
        name: "Partner",
        gender: parentPerson.gender === "male" ? "female" : "male",
        isPlaceholder: true,
        isSpouse: true,
        allowGlobalMatching: false,
      });
      await dataService.addPerson(placeholderSpouse);

      const newMarriage = await createMarriage(treeId, "monogamous", createdBy, {
        spouses: [parentId, placeholderSpouse.id],
      });

      // Correct call
      await addChildToMarriage(newMarriage.id, newChild.id);

      return {
        child: newChild,
        placeholder: placeholderSpouse,
        marriage: newMarriage,
      };
    }
  } catch (err) {
    console.error("DBG:addChild -> Error:", err);
    throw err;
  }
}
