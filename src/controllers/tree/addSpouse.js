import dataService from "../../services/dataService";
import { createPerson } from "../../models/treeModels/PersonModel";
import { handleSpouseAddition } from "./marriages";
import { addBirth, addDeath, addCustom } from "./events";
import { addStory } from "./stories";
import { validateEventsArray } from "../../utils/treeUtils/eventValidation";
import { validatePersonData } from "../../utils/validation/personValidation";
import { validateMarriageData, validateMarriageDateVsBirth } from "../../utils/validation/marriageValidation";

export async function addSpouse(treeId, existingSpouseId, newSpouseData, options = {}) {
    const { onError, confirmConvert, createdBy = "system" } = options;
    try {
        //  1. INITIAL VALIDATION - ALL VALIDATIONS MUST PASS BEFORE ANY DATA CREATION
        const existingSpouse = await dataService.getPerson(existingSpouseId);
        if (!existingSpouse) throw new Error("Existing spouse not found");
        if (existingSpouse.isPlaceholder) {
            onError?.("Cannot add a spouse to a placeholder partner.", "error");
            return null;
        }

        // Validate person data first
        validatePersonData(newSpouseData, 'spouse');

        // Validate events before proceeding
        if (Array.isArray(newSpouseData.events)) {
            validateEventsArray(newSpouseData.events);
        }

        // Same-sex marriage check
        if (existingSpouse.gender === newSpouseData.gender) {
            throw new Error("Same-sex marriages are not allowed.");
        }

        // Validate marriage date vs birth dates BEFORE any data creation
        if (newSpouseData.marriageDate) {
            validateMarriageDateVsBirth(newSpouseData.marriageDate, existingSpouse, { name: newSpouseData.fullName, dob: newSpouseData.dateOfBirth });
        }

        // Check if spouse already exists and validate marriage data if they do
        let existingNewSpouse = await dataService.findPersonByFields?.({
            treeId,
            name: newSpouseData.fullName,
            gender: newSpouseData.gender,
            dob: newSpouseData.dateOfBirth || null,
        });

        if (existingNewSpouse) {
            // Validate marriage data with existing spouse
            await validateMarriageData(null, existingSpouse, existingNewSpouse);
        }

        // 2. PHOTO UPLOAD (only after all validations pass)
        let uploadedPhotoUrl = null;
        if (newSpouseData.profilePhoto) {
            try {
                const uploaded = await dataService.uploadMedia(newSpouseData.profilePhoto, treeId, null, createdBy, "profile");
                uploadedPhotoUrl = uploaded.url;
            } catch (err) {
                console.error("Photo upload failed", err);
            }
        }

        // 3. CREATE/SAVE PERSON (only after all validations pass)
        let newSpouse;
        if (!existingNewSpouse) {
            newSpouse = createPerson({
                treeId: treeId,
                name: newSpouseData.fullName,
                gender: newSpouseData.gender,
                dob: newSpouseData.dateOfBirth,
                dod: newSpouseData.dateOfDeath,
                placeOfBirth: newSpouseData.placeOfBirth,
                placeOfDeath: newSpouseData.placeOfDeath,
                nationality: newSpouseData.nationality,
                countryOfResidence: newSpouseData.countryOfResidence,
                email: newSpouseData.email,
                phoneNumber: newSpouseData.phoneNumber,
                photoUrl: uploadedPhotoUrl,
                bio: newSpouseData.biography,
                tribe: newSpouseData.tribe,
                language: newSpouseData.language,
                linkedUserId: newSpouseData.linkedUserId ?? null,
                isDeceased: newSpouseData.isDeceased,
                privacyLevel: newSpouseData.privacyLevel,
                allowGlobalMatching: newSpouseData.allowGlobalMatching,
                isSpouse: true,
            });

            await dataService.addPerson(newSpouse);

            // Add birth/death events
            if (newSpouse.dob) await addBirth(treeId, newSpouse.id, { date: newSpouse.dob, title: "Birth", location:newSpouse.placeOfBirth });
            if (newSpouse.dod) await addDeath(treeId, newSpouse.id, { date: newSpouse.dod, title: "Death", location: newSpouse.placeOfDeath});

            // Add custom events
            if (Array.isArray(newSpouseData.events)) {
                for (const ev of newSpouseData.events) {
                    await addCustom(treeId, [newSpouse.id], ev.customType, ev);
                }
            }

            // Create story if story data is provided
            if (newSpouseData.title || newSpouseData.description || newSpouseData.attachments?.length > 0) {
                const storyData = {
                    treeId,
                    personId: newSpouse.id,
                    createdBy,
                    title: newSpouseData.title || "Life Story",
                    description: newSpouseData.description || null,
                    location: newSpouseData.location || null,
                    time: newSpouseData.time || null,
                    tags: newSpouseData.tags ? newSpouseData.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
                    attachments: newSpouseData.attachments || []
                };
                await addStory(storyData);
            }
        } else {
            newSpouse = existingNewSpouse;
        }

        // 4. VALIDATE MARRIAGE DATA (already done for existing spouse, but double-check)
        if (!existingNewSpouse) {
            await validateMarriageData(null, existingSpouse, newSpouse);
        }

        // 5. CREATE MARRIAGE
        const { marriage, marriageAction } = await handleSpouseAddition(
            existingSpouse,
            newSpouse,
            newSpouseData, // Pass the original form data for marriage-specific fields
            confirmConvert,
            createdBy
        );

        //  6. RETURN SUCCESS
        return {
            spouse: newSpouse,
            marriage: marriage,
            marriageAction: marriageAction,
        };

    } catch (err) {
        if (err.message === "User cancelled conversion.") {
            onError?.("User cancelled spouse addition.", "warning");
            return null;
        }
        console.error("Error in addSpouse orchestrator:", err);
        onError?.(err.message || "Unexpected error.", "error");
        throw err;
    }
}
