// src/models/people.ts
import { generateId } from "../../utils/personUtils/idGenerator"; 
export interface Person {
  id: string;  
  treeId: string; 
  name: string;
  gender: "male" | "female";
  dob?: string | null;          
  dod?: string | null;
  nationality?: string | null; 
  countryOfResidence?: string | null;
  placeOfBirth?: string | null;
  placeOfDeath?: string | null;          
  photoUrl?: string | null;
  phoneNumber?:string | null;
  email?:string | null;
  bio?: string;
  tribe?: string;
  language?: string;
  linkedUserId?: string | null; 
  isDeceased: boolean;
  isSpouse: boolean;
  allowGlobalMatching?: boolean;
  privacyLevel: "public" | "membersOnly" | "authenticated" | "private";
  isPlaceholder?: boolean;      
  // Deletion metadata for soft/cascade delete with undo
  isDeleted?: boolean;
  deletedAt?: string | null;
  deletionMode?: "soft" | "cascade" | null;
  pendingDeletion?: boolean;
  undoExpiresAt?: string | null;
  deletionBatchId?: string | null;
  createdAt: string;            
  updatedAt: string;            
}


//  Helpers 

/** Returns the calculated age or null if dob is missing */
export const getAge = (person: Person): number | null => {
  if (!person.dob) return null;
  const dob = new Date(person.dob);
  const dod = person.dod ? new Date(person.dod) : new Date();
  let age = dod.getFullYear() - dob.getFullYear();

  const hasHadBirthday =
    dod.getMonth() > dob.getMonth() ||
    (dod.getMonth() === dob.getMonth() && dod.getDate() >= dob.getDate());

  if (!hasHadBirthday) age--;

  return age >= 0 ? age : null;
};

/** Quick check if person is alive */
export const isAlive = (person: Person): boolean =>
  !person.isDeceased && !person.dod;

/** Get the human-readable label for a privacy level */
export const getPrivacyLabel = (privacyLevel: string): string => {
  const privacyOptions = [
    { value: 'private', label: 'Only Me' },
    { value: 'membersOnly', label: 'Family Members Only' },
    { value: 'authenticated', label: 'Registered Users' },
    { value: 'public', label: 'Public' }
  ];

  const option = privacyOptions.find(opt => opt.value === privacyLevel);
  return option ? option.label : 'Unknown';
};

/** Get the human-readable label for a country code */
import countryList from 'react-select-country-list';

export const getCountryLabel = (countryCode?: string | null): string => {
  if (!countryCode) return 'Unknown';

  try {
  const countries = countryList()?.getData() || [];
    const code = String(countryCode).trim();
    const country = countries.find(c => c.value === code || c.value.toLowerCase() === code.toLowerCase());
    return country ? country.label : code;
  } catch (error) {
    // If the package is not available or something else goes wrong, return the code as a fallback.
    return String(countryCode);
  }
};


export function createPerson(input: Partial<Person>): Person {
  const id = input.id || generateId("person");
  return {
    id,
    treeId: input.treeId!,
    name: input.name || "Unknown",
    gender: input.gender || "male", // default
    dob: input.dob || null,
    dod: input.dod || null,
    nationality: input.nationality || null,
    countryOfResidence: input.countryOfResidence || null,
    placeOfBirth: input.placeOfBirth || null,
    placeOfDeath: input.placeOfDeath || null,
    photoUrl: input.photoUrl || null,
    phoneNumber: input.phoneNumber || null,
    email: input.email || null,
    bio: input.bio || "",
    tribe: input.tribe || "",
    language: input.language || "",
    linkedUserId: input.linkedUserId || null,
    isDeceased: input.isDeceased || false,
    isSpouse: input.isSpouse || false,
    allowGlobalMatching: input.allowGlobalMatching ?? true,
    privacyLevel: input.privacyLevel || "membersOnly",
    isPlaceholder: input.isPlaceholder || false,
    // Deletion metadata defaults
    isDeleted: input.isDeleted || false,
    deletedAt: input.deletedAt || null,
    deletionMode: input.deletionMode || null,
    pendingDeletion: input.pendingDeletion || false,
    undoExpiresAt: input.undoExpiresAt || null,
    deletionBatchId: input.deletionBatchId || null,
    createdAt: input.createdAt || new Date().toISOString(),
    updatedAt: input.updatedAt || new Date().toISOString(),
  };
}
