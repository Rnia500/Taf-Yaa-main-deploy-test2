// The complete, corrected file: src/controllers/tree/stories.js

import dataService from "../../services/dataService";
import { createStory } from "../../models/treeModels/StoryModel";

export async function addStory(params) {
  console.log("DBG:stories.addStory ->", params);

 
  const story = createStory(params);

  // Persist the valid story object using the data service.
  const saved = await dataService.addStory(story);

  return saved;
}

export async function updateStory(storyId, updates) {
  console.log("DBG:stories.updateStory ->", storyId, updates);
  return dataService.updateStory(storyId, updates);
}


export async function getStoriesByPerson(personId, treeId) {
  console.log(`DBG:stories.getStoriesByPerson -> for personId: ${personId}, treeId: ${treeId}`);
  // Delegate the filtering to the dataService for performance.
  return dataService.getStoriesByPersonId(personId, treeId);
}


export async function createAudioStory(params) {
  const { treeId, personId, addedBy, storyTitle, audioFile, subtitle, tags, language } = params;

  if (audioFile) {
    try {
      // Upload audio file using the story upload service - this now creates a complete story
      const uploaded = await dataService.uploadStory(audioFile, treeId, personId, addedBy, {
        title: storyTitle || "Oral History",
        location: subtitle || null,
        description: subtitle || null,
        tags: Array.isArray(tags) && tags.length ? tags : [],
        visibility: 'public',
        language: language || null
      });

      // The uploadStory now returns a complete story object
      console.log("DBG: story created with audio", uploaded.id);

      try {
        // Inform listeners that stories changed (so UI can reload)
        window.dispatchEvent(new Event('familyDataChanged'));
      } catch (error) {
        console.error('Failed to dispatch familyDataChanged event:', error);
      }

      return uploaded;
    } catch (err) {
      console.error("Audio story creation failed:", err);
      throw err;
    }
  }

  // If no audio file, create a text-only story
  if (storyTitle) {
    const saved = await addStory({
      treeId,
      personId,
      createdBy: addedBy,
      title: storyTitle,
      location: subtitle || null,
      description: subtitle || null,
      attachments: [],
      tags: Array.isArray(tags) && tags.length ? tags : [],
    });

    try {
      // Inform listeners that stories changed (so UI can reload)
      window.dispatchEvent(new Event('familyDataChanged'));
    } catch (error) {
      console.error('Failed to dispatch familyDataChanged event:', error);
    }

    return saved;
  }

  return null;
}
