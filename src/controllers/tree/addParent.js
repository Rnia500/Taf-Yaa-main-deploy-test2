// src/controllers/tree/addParent.js
import { createPerson } from "../../models/treeModels/PersonModel";
import dataService from "../../services/dataService";
import { addBirth, addDeath, addCustom } from "./events";
import { createMarriage } from "./marriages";
import { addStory } from "./stories";
import { validateEventsArray } from "../../utils/treeUtils/eventValidation";
import { validatePersonData } from "../../utils/validation/personValidation";


export async function addParentToChild(treeId, childId, parentData, options = {}) {
  const { createdBy } = options;

  try {
    //  STEP 1: Find or create new parent person
    let newParent = await dataService.findPersonByFields?.({
      treeId,
      name: parentData.fullName,
      gender: parentData.gender,
      dob: parentData.dateOfBirth || null,
    });

    if (!newParent) {
      // Validate person data
      validatePersonData(parentData, 'parent');

      // Validate events before proceeding
      if (Array.isArray(parentData.events)) {
        validateEventsArray(parentData.events);
      }

      let uploadedPhotoUrl = null;
      if (parentData.profilePhoto) {
        try {
          const uploaded = await dataService.uploadMedia(parentData.profilePhoto, treeId, null, createdBy, "profile");
          uploadedPhotoUrl = uploaded.url;
        } catch (err) {
          console.error("Photo upload failed", err);
        }
      }

      newParent = createPerson({
        treeId,
        name: parentData.fullName,
        gender: parentData.gender,
        dob: parentData.dateOfBirth,
        dod: parentData.dateOfDeath,
        placeOfBirth: parentData.placeOfBirth,
        placeOfDeath: parentData.placeOfDeath,
        email: parentData.email,
        phoneNumber: parentData.phoneNumber,
        nationality: parentData.nationality,
        countryOfResidence: parentData.countryOfResidence,
        photoUrl: uploadedPhotoUrl,
        bio: parentData.biography,
        tribe: parentData.tribe,
        language: parentData.language,
        isDeceased: parentData.isDeceased,
        privacyLevel: parentData.privacyLevel,
        allowGlobalMatching: parentData.allowGlobalMatching,
        isSpouse: false,
      });
      await dataService.addPerson(newParent);

      if (newParent.dob) {
        await addBirth(treeId, newParent.id, { date: newParent.dob, title: "Birth", location: newParent.placeOfBirth });
      }
      
      if (newParent.dod) {
        await addDeath(treeId, newParent.id, { date: newParent.dod, title: "Death", location: newParent.placeOfDeath });
      }

      if (Array.isArray(parentData.events)) {
        for (const ev of parentData.events) {
          await addCustom(treeId, [newParent.id], ev.customType, ev);
        }
      }

      // Create story if story data is provided
      if (parentData.title || parentData.description || parentData.attachments?.length > 0) {
        const storyData = {
          treeId,
          personId: newParent.id,
          createdBy,
          title: parentData.title || "Life Story",
          description: parentData.description || null,
          location: parentData.location || null,
          time: parentData.time || null,
          tags: parentData.tags ? parentData.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
          attachments: parentData.attachments || []
        };
        await addStory(storyData);
      }
    }

    // STEP 2: inspect child's marriages
    const marriages = await dataService.getMarriagesByChildId(childId);

    // === Scenario 1: No parents yet ===
    if (!marriages || marriages.length === 0) {
      const placeholderSpouse = createPerson({
        treeId,
        name: "Partner",
        gender: newParent.gender === "male" ? "female" : "male",
        isPlaceholder: true,
        isSpouse: true,
        allowGlobalMatching: false,
      });
      await dataService.addPerson(placeholderSpouse);

      const newMarriage = await createMarriage(treeId, "monogamous", createdBy, {
        spouses: [newParent.id, placeholderSpouse.id],
      });

      await dataService.addChildToMarriage(newMarriage.id, childId);

      return { parent: newParent, placeholder: placeholderSpouse, marriage: newMarriage, action: "created_family_unit" };
    }

// Scenario 2: One parent is a placeholder 
    let placeholderMarriage = null;
    let placeholderId = null;
    let isPolygamousWifeReplacement = false;
    let isPolygamousHusbandReplacement = false; 

    for (const marriage of marriages) {
      // Check for a placeholder in a MONOGAMOUS marriage
      if (marriage.marriageType === "monogamous" && Array.isArray(marriage.spouses)) {
        const spouseObjects = await Promise.all(marriage.spouses.map(sid => dataService.getPerson(sid)));
        const foundPlaceholder = spouseObjects.find(sp => sp?.isPlaceholder);
        if (foundPlaceholder) {
          placeholderMarriage = marriage;
          placeholderId = foundPlaceholder.id;
          break;
        }
      } 
      // Check for a placeholder in a POLYGAMOUS marriage
      else if (marriage.marriageType === "polygamous") {
        //  First, check if the HUSBAND is the placeholder 
        const husbandPerson = await dataService.getPerson(marriage.husbandId);
        if (husbandPerson?.isPlaceholder) {
            placeholderMarriage = marriage;
            placeholderId = husbandPerson.id;
            isPolygamousHusbandReplacement = true;
            break; 
        }

        // Then, check if the specific WIFE is the placeholder 
        if (Array.isArray(marriage.wives)) {
          for (const wife of marriage.wives) {
            if (wife.childrenIds?.includes(childId)) {
              const wifePerson = await dataService.getPerson(wife.wifeId);
              if (wifePerson?.isPlaceholder) {
                placeholderMarriage = marriage;
                placeholderId = wife.wifeId;
                isPolygamousWifeReplacement = true;
                break;
              }
            }
          }
        }
        if (placeholderId) break;
      }
    }

    if (placeholderMarriage && placeholderId) {
      //  Replacing a placeholder HUSBAND
      if (isPolygamousHusbandReplacement) {
        console.log("Executing Add Parent: Replacing a placeholder husband.");
        if (newParent.gender !== "male") {
          throw new Error("Only a male can be added as the husband in this marriage.");
        }
        
        const updatedMarriage = await dataService.updateMarriage(placeholderMarriage.id, { husbandId: newParent.id });
        await dataService.deletePerson(placeholderId);
        return { parent: newParent, marriage: updatedMarriage, action: "replaced_placeholder_husband" };
      }

      // Replacing a placeholder WIFE 
      else if (isPolygamousWifeReplacement) {
        console.log("Executing Add Parent: Replacing a placeholder wife.");
        if (newParent.gender !== "female") {
          throw new Error("Only a female can be added as a mother in this marriage.");
        }
        const updatedWives = placeholderMarriage.wives.map(w => w.wifeId === placeholderId ? { ...w, wifeId: newParent.id } : w);
        const updatedMarriage = await dataService.updateMarriage(placeholderMarriage.id, { wives: updatedWives });
        await dataService.deletePerson(placeholderId);
        return { parent: newParent, marriage: updatedMarriage, action: "replaced_placeholder_wife" };
      } 
      // Replacing a MONOGAMOUS placeholder 
      else {
        console.log("Executing Add Parent: Completing a monogamous family unit.");
        const newSpouses = placeholderMarriage.spouses.map(id => (id === placeholderId ? newParent.id : id));
        const updatedMarriage = await dataService.updateMarriage(placeholderMarriage.id, { spouses: newSpouses });
        await dataService.deletePerson(placeholderId);
        return { parent: newParent, marriage: updatedMarriage, action: "completed_family_unit" };
      }
    }
    

    if (marriages.length > 0) {
      throw new Error("Cannot add a new parent. This child already has a complete set of parents in the tree.");
    }

    // Fallback error
    throw new Error("Invalid state: cannot add parent.");

  } catch (err) {
    console.error("Error in addParentToChild:", err);
    throw err;
  }
}