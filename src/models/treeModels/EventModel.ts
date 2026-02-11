// src/models/eventModel.ts
import { generateId } from "../../utils/personUtils/idGenerator";
export interface Event {
  id: string;
  treeId: string;
  personIds: string[]; // multiple people can share one event (e.g. marriage)
  type: EventType;
  customType?: string | null;
  title?: string | null;
  description?: string | null;
  date?: string | null; // ISO 8601
  location?: string | null;
  createdAt: string;
  updatedAt: string;
  // Deletion metadata for soft/cascade delete with undo
  isDeleted?: boolean;
  deletedAt?: string | null;
  deletionMode?: "soft" | "cascade" | null;
  pendingDeletion?: boolean;
  undoExpiresAt?: string | null;
  deletionBatchId?: string | null;
}

export type EventType =
  | "birth"
  | "death"
  | "marriage"
  | "divorce"
  | "graduation"
  | "custom";

//  Factory 
export const createEvent = (data: {
  treeId: string;
  personIds: string[];
  type: EventType;
  customType?: string;
  title?: string;
  description?: string;
  date?: string;
  location?: string;
}): Event => {
  const now = new Date().toISOString();
  return {
    id: generateId("event"),
    treeId: data.treeId,
    personIds: data.personIds,
    type: data.type,
    customType: data.customType || null,
    title: data.title || null,
    description: data.description || null,
    date: data.date || null,
    location: data.location || null,
    createdAt: now,
    updatedAt: now,
    // Deletion metadata defaults
    isDeleted: false,
    deletedAt: null,
    deletionMode: null,
    pendingDeletion: false,
    undoExpiresAt: null,
    deletionBatchId: null,
  };
};

//  Helpers 
/** Returns the displayable label for an event */
export const getEventLabel = (event: Event): string => {
  if (event.type === "custom" && event.customType) {
    return event.customType;
  }
  return EVENT_TYPE_LABELS[event.type] ?? event.type;
};

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  birth: "Birth",
  death: "Death",
  marriage: "Marriage",
  divorce: "Divorce",
  graduation: "Graduation",
  custom: "Custom Event",
};

export const involvesPerson = (event: Event, personId: string): boolean =>
  event.personIds.includes(personId);

export const sortEventsByDate = (events: Event[]): Event[] =>
  [...events].sort((a, b) => {
    if (!a.date) return 1;
    if (!b.date) return -1;
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });

export const filterEventsByType = (
  events: Event[],
  type: Event["type"]
): Event[] => events.filter((e) => e.type === type);

export const getCustomEvents = (events: Event[]): Event[] =>
  events.filter((e) => e.type === "custom" && !!e.customType);

export const countCustomEvents = (events: Event[]): Record<string, number> => {
  return events.reduce<Record<string, number>>((acc, e) => {
    if (e.type === "custom" && e.customType) {
      acc[e.customType] = (acc[e.customType] || 0) + 1;
    }
    return acc;
  }, {});
};

export const suggestPromotableCustomEvents = (
  events: Event[],
  minCount = 5
): string[] => {
  const counts = countCustomEvents(events);
  return Object.entries(counts)
    .filter(([_, count]) => count >= minCount)
    .map(([customType]) => customType);
};

export const formatEventText = (
  event: Event,
  peopleMap: Record<string, string>
): string => {
  const names = event.personIds.map((id) => peopleMap[id] || "Unknown").join(" and ");
  const date = event.date ? `on ${event.date}` : "";
  const location = event.location ? `at ${event.location}` : "";

  let header = "";

  switch (event.type) {
    case "birth":
      header = `${names} was born ${date} ${location}`;
      break;

    case "death":
      header = `${names} passed away ${date} ${location}`;
      break;

    case "marriage":
      header = `${names} were married ${date} ${location}`;
      break;

    case "divorce":
      header = `${names} were divorced ${date} ${location}`;
      break;

    case "graduation":
      header = `${names} graduated ${date} ${location}`;
      break;

    case "custom":
      header = `${names} ${event.customType || "had an event"} ${date} ${location}`;
      break;

    default:
      header = `${names} had an event ${date} ${location}`;
      break;
  }

  // Description block (optional, multiline friendly)
  const description = event.description ? `\n\n${event.description}` : "";

  return `${header.trim()}.\n${description}`;
};
